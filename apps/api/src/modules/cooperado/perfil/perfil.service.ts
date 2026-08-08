import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PerfilDto } from './dto/perfil.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PerfilService {
    constructor(private readonly prisma: PrismaService) {}

async buscarPerfilDoCooperado(vinculoId: number): Promise<PerfilDto> {

    const vinculo = await this.prisma.vinculo_cooperativa.findUnique({
    where: { id: vinculoId },
        include: {
        pessoa: true,
        cooperativa: true,
    },
    });

    if (!vinculo) {
        throw new NotFoundException('Perfil do cooperado não encontrado.');
    }
    const perfilMapeado = {
        nome: vinculo.pessoa.nome,
        cpf: vinculo.pessoa.cpf,
        matricula: vinculo.matricula,
        cooperativa: vinculo.cooperativa?.nome || 'Não informada',
        dataAdmissao: vinculo.data_admissao || null,
        };
        
        return plainToInstance(PerfilDto, perfilMapeado, {
        excludeExtraneousValues: true,
    });
    }
}