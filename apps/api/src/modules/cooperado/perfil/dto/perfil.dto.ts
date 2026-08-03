import { Expose } from 'class-transformer';

export class PerfilDto {
/**
   * O decorator @Expose() diz para o NestJS: 
   * "Quando for transformar o objeto do banco em JSON para o cliente, 
   * inclua esta propriedade". O que não tiver @Expose() será ignorado.
   */
    @Expose()
    nome!: string;

    @Expose()
    matricula!: string;

    @Expose()
    cpf!: string;

  // Aqui podemos retornar apenas o nome da cooperativa para facilitar para o front
    @Expose()
    cooperativa!: string;

    @Expose()
    dataAdmissao!: Date;

  // Exemplo: se a entidade Pessoa tivesse uma propriedade 'senhaHash', 
  // nós simplesmente NÃO colocaríamos ela aqui no DTO. Assim, ela nunca vaza.
}