import { validate } from 'class-validator';
import { AlterarSenhaDto } from './alterar-senha.dto';

const montar = (senhaNova: string) => {
  const dto = new AlterarSenhaDto();
  dto.senhaAtual = 'SenhaAtual1';
  dto.senhaNova = senhaNova;
  return dto;
};

describe('AlterarSenhaDto', () => {
  it('should be defined', () => {
    expect(new AlterarSenhaDto()).toBeDefined();
  });

  it('aceita senha com letra e número', async () => {
    await expect(validate(montar('SenhaBoa123'))).resolves.toHaveLength(0);
  });

  it('rejeita senha só com letras', async () => {
    expect(await validate(montar('somenteletras'))).not.toHaveLength(0);
  });

  it('rejeita senha só com números', async () => {
    expect(await validate(montar('12345678'))).not.toHaveLength(0);
  });

  it('rejeita senha curta demais', async () => {
    expect(await validate(montar('Ab1'))).not.toHaveLength(0);
  });
});
