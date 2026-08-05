import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RecuperarSenhaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  usuario!: string;
}

export class RecuperarSenhaEmailParamsDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

export class RedefinirSenhaTokenParamsDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class RedefinirSenhaDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  senha!: string;
}
