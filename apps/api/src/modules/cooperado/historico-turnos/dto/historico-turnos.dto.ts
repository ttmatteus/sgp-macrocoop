import { Type } from 'class-transformer';
import { Expose } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class HistoricoTurnosQueryDto {
  @IsOptional()
  @IsDateString()
  inicio?: string;

  @IsOptional()
  @IsDateString()
  fim?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contratoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}

export class TurnoDto {
  @Expose()
  id!: number;

  @Expose()
  contratoId!: number;

  @Expose()
  contratoNome!: string;

  @Expose()
  iniciadoEm!: Date;

  @Expose()
  encerradoEm!: Date;

  @Expose()
  status!: string;
}

export class HistoricoTurnosDto {
  @Expose()
  itens!: TurnoDto[];

  @Expose()
  total!: number;

  @Expose()
  pagina!: number;

  @Expose()
  limite!: number;
}
