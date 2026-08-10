import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PerfilDto } from './dto/perfil.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PerfilService {
    constructor(private readonly prisma: PrismaService) {}

async buscarPerfilDoCooperado(vinculoId: number, login: string): Promise<PerfilDto> {

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
    // vem daqui e nao de um decode de jwt sem verificar assinatura no front:
    // o web so pode confiar nesse flag pq passou pelo JwtAuthGuard aqui
    const modoDev = !!process.env.DEV_PREVIEW_LOGIN && login === process.env.DEV_PREVIEW_LOGIN;
    const perfilMapeado = {
        nome: vinculo.pessoa.nome,
        cpf: vinculo.pessoa.cpf,
        matricula: vinculo.matricula,
        cooperativa: vinculo.cooperativa?.nome || 'Não informada',
        dataAdmissao: vinculo.data_admissao || null,
        modoDev,
        };
        
        return plainToInstance(PerfilDto, perfilMapeado, {
        excludeExtraneousValues: true,
    });
    }
}