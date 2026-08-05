import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsSenhaValida } from '../../../../common/validators/senha.validator';

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

  @IsSenhaValida()
  senha!: string;
}
