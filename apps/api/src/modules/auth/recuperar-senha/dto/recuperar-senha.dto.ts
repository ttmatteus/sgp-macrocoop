import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RecuperarSenhaDto {
  @ValidateIf((dto: RecuperarSenhaDto) => !dto.email)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  usuario?: string;

  @ValidateIf((dto: RecuperarSenhaDto) => !dto.usuario)
  @IsEmail()
  @MaxLength(255)
  email?: string;
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
