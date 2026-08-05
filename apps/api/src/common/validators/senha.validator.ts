import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const SENHA_MIN = 8;
export const SENHA_MAX = 72;

// regra unica de senha, usada no alterar-senha e no recuperar-senha. tem que ser
// a mesma nos dois: se uma tela for mais rigorosa, quem for barrado nela e so
// usar "esqueci minha senha" pra definir uma senha fraca pelo outro caminho
export function IsSenhaValida() {
  return applyDecorators(
    IsString(),
    MinLength(SENHA_MIN, {
      message: `A senha deve possuir no mínimo ${SENHA_MIN} caracteres.`,
    }),
    MaxLength(SENHA_MAX, {
      message: `A senha deve possuir no máximo ${SENHA_MAX} caracteres.`,
    }),
    Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
      message: 'A senha deve conter pelo menos uma letra e um número.',
    }),
  );
}
