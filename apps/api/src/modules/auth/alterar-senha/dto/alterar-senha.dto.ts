import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AlterarSenhaDto {
    @IsString()
    @IsNotEmpty()
    senhaAtual!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, {
        message: 'A senha deve possuir no mínimo 8 caracteres.',
    })
    senhaNova!: string;

}