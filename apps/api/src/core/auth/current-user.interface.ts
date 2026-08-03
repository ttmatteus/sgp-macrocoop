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
  // eslint-disable-next-line @typescript-eslint/no-namespace -- é assim mesmo que o express deixa vc estender o Request, n tem jeito com import/export
  namespace Express {
    interface Request {
      user?: CurrentUserPayload;
    }
  }
}
