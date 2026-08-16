import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class RevogarSessaoDto {
  @IsString()
  @IsNotEmpty()
  senha!: string;
}

export class SessaoDto {
  @Expose()
  jti!: string;

  @Expose()
  ip!: string;

  @Expose()
  userAgent!: string;

  @Expose()
  criadoEm!: string;

  @Expose()
  atual!: boolean;
}
