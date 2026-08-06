import { Expose, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class RegistrarPontoDto {
  @IsUUID()
  idCliente!: string;

  @Type(() => Number)
  @IsInt()
  contratoId!: number;

  @IsIn(['entrada', 'saida'])
  tipo!: string;

  @IsDateString()
  registradoEm!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @Type(() => Number)
  @IsNumber()
  precisaoM!: number;
}

export class LocalPontoDto {
  @Expose()
  id!: number;

  @Expose()
  nome!: string;

  @Expose()
  latitude!: string;

  @Expose()
  longitude!: string;

  @Expose()
  raioM!: number;
}

export class ContratoDisponivelDto {
  @Expose()
  id!: number;

  @Expose()
  nome!: string;

  @Expose()
  codigo!: string;

  @Expose()
  locais!: LocalPontoDto[];
}

export class RegistroPontoDto {
  @Expose()
  id!: number;

  @Expose()
  tipo!: string;

  @Expose()
  registradoEm!: Date;

  @Expose()
  statusLocalizacao!: string | null;

  @Expose()
  distanciaContratoM!: string | null;

  @Expose()
  turnoId!: number | null;
}
