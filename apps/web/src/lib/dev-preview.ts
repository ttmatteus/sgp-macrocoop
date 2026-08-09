// libera paineis de preview/reset pra um unico login marcado via env, em
// qualquer ambiente (inclusive producao) - nao usa NODE_ENV de proposito,
// pra um usuario de teste poder ver os estados sem precisar rodar local.
// e temporario: sai quando ninguem mais precisar demonstrar o app assim
export function ehUsuarioDevPreview(login: string | undefined): boolean {
  const permitido = process.env.DEV_PREVIEW_LOGIN
  return !!permitido && login === permitido
}
