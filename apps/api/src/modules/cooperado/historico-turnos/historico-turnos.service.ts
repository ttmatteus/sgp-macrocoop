import { Injectable } from '@nestjs/common';
import {
  HistoricoTurnosDto,
  HistoricoTurnosQueryDto,
} from './dto/historico-turnos.dto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import {
  inicioDoDiaEmSaoPaulo,
  inicioDoProximoDiaEmSaoPaulo,
} from '../../../common/data';

@Injectable()
export class HistoricoTurnosService {

  constructor(
    private readonly prisma: PrismaService,
  ) {}
  async listar(
    vinculoId: number,
    filtros: HistoricoTurnosQueryDto,
  ): Promise<HistoricoTurnosDto> {
    
    /* Define os valores padrãos da páginação caso não sejam informados
    e calcula quantos registros devem ser ignorados. */
    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 10;

    const skip = (pagina - 1) * limite;

    /* Monta filtros básicos da consulta
    Busca apenas turnos do vínculo autenticado e apenas turnos encerrados fazem parte do histórico. */
    const where: Prisma.turnoWhereInput = {
      vinculo_cooperativa_id: vinculoId,

      encerrado_em: {
        not: null,
      },
    };

    // Aplica filtro por contrato, caso informado.
    if (filtros.contratoId !== undefined) {
      where.contrato_id = filtros.contratoId;
    }
    
    // Filtro de datas.

    if (filtros.inicio || filtros.fim) {
      where.iniciado_em = {};

      if (filtros.inicio) {
        where.iniciado_em.gte = inicioDoDiaEmSaoPaulo(filtros.inicio);

      }

      if (filtros.fim) {
        where.iniciado_em.lt = inicioDoProximoDiaEmSaoPaulo(filtros.fim);
      }
    }

    // Obtém o total de registros para paginação.
    const total = await this.prisma.turno.count({
      where,
    });

    // Busca os turnos aplicando filtros, ordenação e paginação.
    const turnos = await this.prisma.turno.findMany({
      where,

      include: {
        contrato: true,
      },
      orderBy: {
        iniciado_em: 'desc',
      },
      
      skip,

      take: limite,

    });

    return {
      itens: turnos.map(turno =>({
        id: turno.id,
        contratoId: turno.contrato_id,
        contratoNome: turno.contrato.nome,
        iniciadoEm: turno.iniciado_em,
        encerradoEm: turno.encerrado_em!,
        status: turno.status,
      })),

      total,
      pagina,
      limite,
    };
  }
}
