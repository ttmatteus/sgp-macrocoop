import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
import { AlterarSenhaService } from './alterar-senha.service';
import { CurrentUser } from '../../../core/auth/current-user.decorator';
import type { CurrentUserPayload } from '../../../core/auth/current-user.interface';
import { JwtAuthGuard } from '../../../core/auth/jwt-auth.guard';

@Controller('alterar-senha')
@UseGuards(JwtAuthGuard)
export class AlterarSenhaController {
    constructor(
        private readonly alterarSenhaService: AlterarSenhaService,
    ){}
    @HttpCode(HttpStatus.OK)
    @Post()
    alterarSenha(
        @CurrentUser() usuario: CurrentUserPayload,
        @Body() dto: AlterarSenhaDto,
    ){
        return this.alterarSenhaService.alterarSenha(
            usuario,
            dto,
        );
    
    }
}
