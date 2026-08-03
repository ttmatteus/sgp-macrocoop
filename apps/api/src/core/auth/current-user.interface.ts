export interface CooperativaClaims {
  id: number;
  nome: string;
  codigo: string;
}

export interface CurrentUserPayload {
  jti: string;
  vinculoId: number;
  pessoaId: number;
  login: string;
  nome: string;
  nivel: 'coordenador' | 'cooperado';
  permissoes: string[];
  cooperativa: CooperativaClaims;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- augmentação do namespace global do Express, não tem alternativa em ES module
  namespace Express {
    interface Request {
      user?: CurrentUserPayload;
    }
  }
}
