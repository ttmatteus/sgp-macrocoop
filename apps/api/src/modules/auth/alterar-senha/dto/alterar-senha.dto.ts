import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AlterarSenhaDto {
    @IsString()
    @IsNotEmpty()
    senhaAtual!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, {
        message: 'A senha deve possuir no mínimo 8 caracteres.',
    })
    @MaxLength(72, {
        message: 'A senha deve possuir no máximo 72 caracteres.',
    })
    senhaNova!: string;

}