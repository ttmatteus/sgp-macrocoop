// mesUmIndexado: 1 = janeiro, 12 = dezembro (bate com o que o usuario ve na tela)

export function mesAtualEmSaoPaulo(): { ano: number; mes: number } {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())
  const ano = Number(partes.find((p) => p.type === 'year')?.value)
  const mes = Number(partes.find((p) => p.type === 'month')?.value)
  return { ano, mes }
}

export function limitesDoMes(ano: number, mesUmIndexado: number): { inicio: string; fim: string } {
  const pad = (n: number) => String(n).padStart(2, '0')
  const inicio = `${ano}-${pad(mesUmIndexado)}-01`
  // dia 0 do mes seguinte = ultimo dia do mes atual
  const ultimoDia = new Date(ano, mesUmIndexado, 0).getDate()
  const fim = `${ano}-${pad(mesUmIndexado)}-${pad(ultimoDia)}`
  return { inicio, fim }
}

export function mesAnterior(ano: number, mes: number): { ano: number; mes: number } {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 }
}

export function mesSeguinte(ano: number, mes: number): { ano: number; mes: number } {
  return mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 }
}

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function nomeDoMes(mesUmIndexado: number): string {
  return MESES[mesUmIndexado - 1]
}

// chave de agrupamento por dia, em America/Sao_Paulo (nao UTC: um turno
// que comecou 21h no Brasil pode ter iniciadoEm em UTC ja no dia seguinte)
export function diaEmSaoPaulo(isoUtc: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoUtc))
}

export function horaEmSaoPaulo(isoUtc: string): string {
  return new Date(isoUtc).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export function tituloDoDia(chaveDia: string): string {
  const [ano, mes, dia] = chaveDia.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia, 12))
  const texto = data.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1).replace('.', '')
}

export function dataCurta(chaveDia: string): string {
  const [, mes, dia] = chaveDia.split('-')
  return `${dia}/${mes}`
}

export function diasNoMes(ano: number, mesUmIndexado: number): number {
  return new Date(ano, mesUmIndexado, 0).getDate()
}

// 0 = domingo, 6 = sabado - offset das celulas vazias antes do dia 1 na grade
export function diaDaSemanaDoPrimeiro(ano: number, mesUmIndexado: number): number {
  return new Date(ano, mesUmIndexado - 1, 1).getDay()
}

export function chaveDia(ano: number, mesUmIndexado: number, dia: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${ano}-${pad(mesUmIndexado)}-${pad(dia)}`
}
