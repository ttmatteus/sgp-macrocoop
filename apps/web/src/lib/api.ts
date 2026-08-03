// em prod o NEXT_PUBLIC_API_URL vem configurado no vercel (aponta pro cloud run).
// em dev, se n tiver essa env setada, descobre sozinho pelo host que abriu a pagina
// (localhost, ip da rede local etc) pra n precisar editar .env toda hora testando de outro aparelho
export function getApiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  if (typeof window !== 'undefined') return `http://${window.location.hostname}:3000/api`
  return 'http://localhost:3000/api'
}
