import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import * as argon2 from 'argon2';
import { CurrentUserPayload } from '../../../core/auth/current-user.interface';
import { RedisService } from '../../../core/redis/redis.service';

@Injectable()
export class AlterarSenhaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ){}
    async alterarSenha(
        usuario: CurrentUserPayload,
        dto: AlterarSenhaDto) {

            //Busca o vinculo do Cooperado.

            const vinculo = await this.prisma.vinculo_cooperativa.findUnique({
                where: {
                    id: usuario.vinculoId,
                },
            });
            
            //Verifica se o vinculo existe e caso não exista lançar NotFoundException.
            if (!vinculo) {
                throw new NotFoundException('Vinculo não encontrado');
            }

            // Validar se a senha atual informada está valida.
            const senhaCorreta = await argon2.verify(
                vinculo.senha_hash,
                dto.senhaAtual,
            );

            // Se senha estiver incorreta lançar UnauthorizedException
            if (!senhaCorreta){
                throw new UnauthorizedException('A senha está incorreta.');
            }
            
            // Gera novo hash para a a nova senha
            const novaSenhaHash = await argon2.hash(dto.senhaNova);
            
            // Atualiza a senha_hash no banco
            await this.prisma.vinculo_cooperativa.update({
                where: {
                    id: usuario.vinculoId,
                },
                data: {
                    senha_hash: novaSenhaHash,
                },
            });
            
            // Invalidar tokens no Redis
            const segundosTTL = usuario.exp - Math.floor(Date.now() / 1000);

            if (segundosTTL > 0) {
                await this.redis.set(
                    `denylist:jti:${usuario.jti}`,
                'revogado', 
                {
                    ex: segundosTTL,
                },

                );
            }

            return{
                message: 'A senha foi alterada com sucesso!',
            };
    }
}
