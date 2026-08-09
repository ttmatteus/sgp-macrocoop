import {
  ConflictException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RabbitmqPublisherService } from '../../../core/rabbitmq/rabbitmq-publisher.service';
import { distanciaMetros } from '../../../common/geo';
import {
  JANELA_ONLINE_MS,
  JANELA_RETROATIVA_MS,
  PRECISAO_MAXIMA_AVALIAVEL_M,
  TOLERANCIA_RELOGIO_MS,
} from './registro-turno.constants';
import {
  ContratoDisponivelDto,
  LocalPontoDto,
  RegistrarPontoDto,
  RegistroPontoDto,
  TurnoAbertoDto,
} from './dto/registro-turno.dto';

interface ResultadoValidacaoRaio {
  localPontoId: number | null;
  distanciaM: number | null;
  status: 'dentro' | 'fora' | 'indeterminado';
}

function hojeEmSaoPaulo(): Date {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return new Date(`${partes}T00:00:00.000Z`);
}

@Injectable()
export class RegistroTurnoService {
  private readonly logger = new Logger(RegistroTurnoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitmqPublisher: RabbitmqPublisherService,
  ) {}

  async listarContratosDisponiveis(
    vinculoId: number,
  ): Promise<ContratoDisponivelDto[]> {
    const hoje = hojeEmSaoPaulo();

    const alocacoes = await this.prisma.alocacao.findMany({
      where: {
        vinculo_cooperativa_id: vinculoId,
        data_inicio: { lte: hoje },
        OR: [{ data_fim: null }, { data_fim: { gte: hoje } }],
        contrato: { ativo: true },
      },
      include: {
        contrato: { include: { local_ponto: { where: { ativo: true } } } },
      },
    });

    return alocacoes.map((alocacao) =>
      plainToInstance(
        ContratoDisponivelDto,
        {
          id: alocacao.contrato.id,
          nome: alocacao.contrato.nome,
          codigo: alocacao.contrato.codigo,
          locais: alocacao.contrato.local_ponto.map((local) =>
            plainToInstance(
              LocalPontoDto,
              {
                id: local.id,
                nome: local.nome,
                latitude: local.latitude.toString(),
                longitude: local.longitude.toString(),
                raioM: local.raio_m,
              },
              { excludeExtraneousValues: true },
            ),
          ),
        },
        { excludeExtraneousValues: true },
      ),
    );
  }

  async buscarTurnoAberto(vinculoId: number): Promise<TurnoAbertoDto | null> {
    const turno = await this.prisma.turno.findFirst({
      where: { vinculo_cooperativa_id: vinculoId, registro_ponto_saida_id: null },
      include: { contrato: true },
    });
    if (!turno) return null;

    return plainToInstance(
      TurnoAbertoDto,
      {
        id: turno.id,
        contratoId: turno.contrato_id,
        contratoNome: turno.contrato.nome,
        iniciadoEm: turno.iniciado_em,
      },
      { excludeExtraneousValues: true },
    );
  }

  async registrar(
    vinculoId: number,
    dados: RegistrarPontoDto,
  ): Promise<{ dto: RegistroPontoDto; criado: boolean }> {
    const registradoEm = new Date(dados.registradoEm);
    // valida o timestamp antes de gastar round-trip de banco
    this.validarJanelaDeRegistro(registradoEm);

    // leituras independentes em paralelo; ordem das exceções segue abaixo
    const [existente, turnoAberto, geo] = await Promise.all([
      this.prisma.registro_ponto.findUnique({
        where: {
          vinculo_cooperativa_id_id_cliente: {
            vinculo_cooperativa_id: vinculoId,
            id_cliente: dados.idCliente,
          },
        },
      }),
      this.prisma.turno.findFirst({
        where: { vinculo_cooperativa_id: vinculoId, registro_ponto_saida_id: null },
      }),
      this.validarRaioDeTolerancia(dados.contratoId, dados.latitude, dados.longitude),
    ]);

    if (existente) {
      const turno = await this.buscarTurnoDoRegistro(existente.id);
      return { dto: this.paraDto(existente, turno?.id ?? null), criado: false };
    }

    if (dados.tipo === 'entrada' && turnoAberto) {
      throw new ConflictException('Já existe um turno aberto pra esse vínculo.');
    }
    if (dados.tipo === 'saida' && !turnoAberto) {
      throw new ConflictException('Não há turno aberto pra encerrar.');
    }
    if (dados.tipo === 'saida' && turnoAberto && turnoAberto.contrato_id !== dados.contratoId) {
      throw new ConflictException('O turno aberto pertence a outro contrato.');
    }
    // sem isso o turno_periodo_valido do banco solta um 500 cru em vez de um 422 decente
    if (dados.tipo === 'saida' && turnoAberto && registradoEm < turnoAberto.iniciado_em) {
      throw new UnprocessableEntityException(
        'A saída não pode ser anterior à entrada do turno.',
      );
    }

    // alocação ativa só na entrada: saída fecha um turno já aberto legitimamente
    if (dados.tipo === 'entrada') {
      await this.validarAlocacaoAtiva(vinculoId, dados.contratoId, registradoEm);
    }
    // turnoAbertoId fora do closure deixa o TS saber que não mudou
    const turnoAbertoId = turnoAberto?.id;
    // precisão ruim só rebaixa "dentro" pra "indeterminado", nunca apaga "fora"
    const statusLocalizacao =
      geo.status !== 'fora' && dados.precisaoM > PRECISAO_MAXIMA_AVALIAVEL_M
        ? 'indeterminado'
        : geo.status;

    const origem =
      Date.now() - registradoEm.getTime() > JANELA_ONLINE_MS ? 'offline_sync' : 'online';

    try {
      const { registro, turnoId } = await this.prisma.$transaction(async (tx) => {
        const registro = await tx.registro_ponto.create({
          data: {
            vinculo_cooperativa_id: vinculoId,
            contrato_id: dados.contratoId,
            local_ponto_id: geo.localPontoId,
            id_cliente: dados.idCliente,
            tipo: dados.tipo,
            registrado_em: registradoEm,
            latitude: dados.latitude,
            longitude: dados.longitude,
            precisao_m: dados.precisaoM,
            distancia_contrato_m: geo.distanciaM,
            status_localizacao: statusLocalizacao,
            origem,
          },
        });

        if (dados.tipo === 'entrada') {
          const turno = await tx.turno.create({
            data: {
              vinculo_cooperativa_id: vinculoId,
              contrato_id: dados.contratoId,
              registro_ponto_entrada_id: registro.id,
              iniciado_em: registro.registrado_em,
              status: 'aberto',
            },
          });
          return { registro, turnoId: turno.id };
        }

        if (turnoAbertoId === undefined) {
          throw new ConflictException('Não há turno aberto pra encerrar.');
        }
        // guard: o where com registro_ponto_saida_id: null segura a corrida
        // de duas saidas concorrentes fechando o mesmo turno
        const fechado = await tx.turno.updateMany({
          where: { id: turnoAbertoId, registro_ponto_saida_id: null },
          data: {
            registro_ponto_saida_id: registro.id,
            encerrado_em: registro.registrado_em,
            status: 'no_horario',
          },
        });
        if (fechado.count === 0) {
          throw new ConflictException('Esse turno já foi encerrado por outra requisição.');
        }
        return { registro, turnoId: turnoAbertoId };
      });

      // fire-and-forget: nao barra o hot path pro broker, o cron recobre
      void this.rabbitmqPublisher
        .publicarPontoRegistrado(registro.id)
        .catch((erro: unknown) =>
          this.logger.error(`Falha inesperada ao publicar evento pro registro ${registro.id}`, erro),
        );

      return { dto: this.paraDto(registro, turnoId), criado: true };
    } catch (erro) {
      // corrida: constraint pegou o que a checagem pré-transação não viu
      if (!(erro instanceof Prisma.PrismaClientKnownRequestError) || erro.code !== 'P2002') {
        throw erro;
      }

      const jaExistente = await this.prisma.registro_ponto.findUnique({
        where: {
          vinculo_cooperativa_id_id_cliente: {
            vinculo_cooperativa_id: vinculoId,
            id_cliente: dados.idCliente,
          },
        },
      });
      if (jaExistente) {
        const turno = await this.buscarTurnoDoRegistro(jaExistente.id);
        return { dto: this.paraDto(jaExistente, turno?.id ?? null), criado: false };
      }

      throw new ConflictException('Já existe um turno aberto pra esse vínculo.');
    }
  }

  private validarJanelaDeRegistro(registradoEm: Date): void {
    const agora = Date.now();
    const alegado = registradoEm.getTime();

    if (alegado > agora + TOLERANCIA_RELOGIO_MS) {
      throw new UnprocessableEntityException('Data do registro não pode estar no futuro.');
    }
    if (alegado < agora - JANELA_RETROATIVA_MS) {
      throw new UnprocessableEntityException(
        'Data do registro é antiga demais para ser sincronizada.',
      );
    }
  }

  private async validarAlocacaoAtiva(
    vinculoId: number,
    contratoId: number,
    data: Date,
  ): Promise<void> {
    const alocacao = await this.prisma.alocacao.findFirst({
      where: {
        vinculo_cooperativa_id: vinculoId,
        contrato_id: contratoId,
        data_inicio: { lte: data },
        OR: [{ data_fim: null }, { data_fim: { gte: data } }],
      },
    });
    if (!alocacao) {
      throw new UnprocessableEntityException(
        'Cooperado não possui alocação ativa nesse contrato.',
      );
    }
  }

  private async validarRaioDeTolerancia(
    contratoId: number,
    latitude: number,
    longitude: number,
  ): Promise<ResultadoValidacaoRaio> {
    const locais = await this.prisma.local_ponto.findMany({
      where: { contrato_id: contratoId, ativo: true },
    });

    if (locais.length === 0) {
      return { localPontoId: null, distanciaM: null, status: 'indeterminado' };
    }

    let maisProximo = locais[0];
    let menorDistancia = distanciaMetros(
      latitude,
      longitude,
      Number(locais[0].latitude),
      Number(locais[0].longitude),
    );

    for (const local of locais.slice(1)) {
      const distancia = distanciaMetros(
        latitude,
        longitude,
        Number(local.latitude),
        Number(local.longitude),
      );
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        maisProximo = local;
      }
    }

    return {
      localPontoId: maisProximo.id,
      distanciaM: menorDistancia,
      status: menorDistancia <= maisProximo.raio_m ? 'dentro' : 'fora',
    };
  }

  // dev only: apaga turno + registro_ponto do vinculo pra poder retestar o
  // fluxo do zero sem precisar mexer no banco na mao. controller ja barra em producao
  async resetParaTestes(vinculoId: number): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.turno.deleteMany({ where: { vinculo_cooperativa_id: vinculoId } }),
      this.prisma.registro_ponto.deleteMany({ where: { vinculo_cooperativa_id: vinculoId } }),
    ]);
  }

  private async buscarTurnoDoRegistro(registroPontoId: number) {
    return this.prisma.turno.findFirst({
      where: {
        OR: [
          { registro_ponto_entrada_id: registroPontoId },
          { registro_ponto_saida_id: registroPontoId },
        ],
      },
    });
  }

  private paraDto(
    registro: {
      id: number;
      tipo: string;
      registrado_em: Date;
      status_localizacao: string | null;
      distancia_contrato_m: unknown;
    },
    turnoId: number | null,
  ): RegistroPontoDto {
    return plainToInstance(
      RegistroPontoDto,
      {
        id: registro.id,
        tipo: registro.tipo,
        registradoEm: registro.registrado_em,
        statusLocalizacao: registro.status_localizacao,
        distanciaContratoM: registro.distancia_contrato_m?.toString() ?? null,
        turnoId,
      },
      { excludeExtraneousValues: true },
    );
  }
}