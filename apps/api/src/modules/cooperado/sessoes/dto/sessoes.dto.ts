import { Expose } from 'class-transformer';

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
