import { validate } from 'class-validator';
import {
  RecuperarSenhaDto,
  RecuperarSenhaEmailParamsDto,
  RedefinirSenhaDto,
  RedefinirSenhaTokenParamsDto,
} from './recuperar-senha.dto';

describe('RecuperarSenhaDto', () => {
  it('aceita usuário válido', async () => {
    const dto = new RecuperarSenhaDto();
    dto.usuario = 'cooperado';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejeita usuário vazio', async () => {
    const dto = new RecuperarSenhaDto();
    dto.usuario = '';

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('valida o parâmetro de e-mail', async () => {
    const dto = new RecuperarSenhaEmailParamsDto();
    dto.email = 'valor-invalido';

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('exige senha com letras e números', async () => {
    const dto = new RedefinirSenhaDto();
    dto.token = 'token';
    dto.senha = 'somenteletras';

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('aceita token e senha válidos', async () => {
    const dto = new RedefinirSenhaDto();
    dto.token = 'token';
    dto.senha = 'Senha123';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('valida o token informado pela rota', async () => {
    const dto = new RedefinirSenhaTokenParamsDto();
    dto.token = '';

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
