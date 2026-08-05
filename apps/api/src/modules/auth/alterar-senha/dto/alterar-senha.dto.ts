import { IsNotEmpty, IsString } from 'class-validator';
import { IsSenhaValida } from '../../../../common/validators/senha.validator';

export class AlterarSenhaDto {
    @IsString()
    @IsNotEmpty()
    senhaAtual!: string;

    @IsSenhaValida()
    senhaNova!: string;
}
