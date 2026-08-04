import { Expose } from 'class-transformer';

export class PerfilDto {

    @Expose()
    nome!: string;

    @Expose()
    matricula!: string;

    @Expose()
    cpf!: string;

    @Expose()
    cooperativa!: string;

    @Expose()
    dataAdmissao!: Date | null;
}