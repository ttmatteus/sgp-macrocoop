import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PerfilDto } from './dto/perfil.dto';
import { plainToInstance } from 'class-transformer';

@Injectable() // O decorator que avisa o NestJS: "esta classe pode ser injetada em outros lugares"
export class PerfilService {
  // Injeção de dependência clássica da POO. 
  // Instanciamos o PrismaService para termos acesso ao banco de dados.
    constructor(private readonly prisma: PrismaService) {}

// Mude de string para number
async buscarPerfilDoCooperado(usuarioId: number): Promise<PerfilDto> {
    /**
     * 1. BUSCA NO BANCO DE DADOS (O 'Select' do Prisma)
     * Vamos buscar a entidade Pessoa e fazer um "join" com VinculoCooperativa.
     */
    const pessoa = await this.prisma.pessoa.findUnique({
        where: { id: usuarioId },
        include: {
        // Incluímos os vínculos do cooperado para termos acesso à matrícula e data de admissão
        vinculo_cooperativa: {
    include: {
            // Incluímos a tabela cooperativa para pegar o nome dela (ex: MacroCoop)
            cooperativa: true, 
        },
        },
    },
    });

    /**
     * 2. TRATAMENTO DE EXCEÇÕES (A boa prática do Fail-Fast)
     * Se o ID mockado (ou futuramente do token) não existir no banco, 
     * lançamos um erro HTTP 404. O NestJS captura isso automaticamente.
     */
    if (!pessoa) {
        throw new NotFoundException('Perfil do cooperado não encontrado.');
    }

    /**
     * 3. REGRA DE NEGÓCIO E MAPEAMENTO
     * O aplicativo é mobile-first, precisamos mandar um payload leve.
     * Como um cooperado pode ter histórico de vários vínculos, pegamos o vínculo atual 
     * (aqui simplificado como o primeiro da lista) para exibir na tela.
     */
    const vinculoAtivo = pessoa.vinculo_cooperativa[0];

    const perfilMapeado = {
        nome: pessoa.nome,
        cpf: pessoa.cpf,
      // Usamos Optional Chaining (?.) caso, por algum erro de base, ele não tenha vínculo
        matricula: vinculoAtivo?.matricula || 'Não informada',
        cooperativa: vinculoAtivo?.cooperativa?.nome || 'Não informada',
        dataAdmissao: vinculoAtivo?.data_admissao || null,
    };

    /**
     * 4. RETORNO SEGURO
     * Usamos o plainToInstance para garantir que o objeto JavaScript (perfilMapeado)
     * seja convertido rigorosamente para a classe PerfilDto, ativando os 
     * decorators @Expose() que criamos no passo anterior.
     */
    return plainToInstance(PerfilDto, perfilMapeado, { 
        excludeExtraneousValues: true 
    });
    }
}