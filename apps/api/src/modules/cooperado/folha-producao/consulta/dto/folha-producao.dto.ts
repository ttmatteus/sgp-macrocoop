import { Expose } from 'class-transformer';

export class FolhaProducaoDto {
  @Expose()
  ano!: number;

  @Expose()
  mes!: number;

  @Expose()
  producaoBase!: string;

  @Expose()
  rsr!: string;

  @Expose()
  adicionais!: string;

  @Expose()
  inssDesconto!: string;

  @Expose()
  irrfDesconto!: string;

  @Expose()
  total!: string;

  @Expose()
  fechadaEm!: Date;
}

export class FolhaMensagensDto {
  @Expose()
  ano!: number;

  @Expose()
  mes!: number;

  @Expose()
  mensagens!: unknown;
}

export class ProducaoParcialDto {
  @Expose()
  ano!: number;

  @Expose()
  mes!: number;

  @Expose()
  producaoBase!: string;

  @Expose()
  turnosComputados!: number;

  @Expose()
  parcial!: boolean;
}
