// o brasil nao tem mais horario de verao desde 2019, entao o offset de
// sao paulo e sempre -03:00 pra qualquer data que esse sistema trata
const OFFSET_SAO_PAULO = '-03:00';

export function hojeEmSaoPaulo(): Date {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return new Date(`${partes}T00:00:00.000Z`);
}

// @IsDateString aceita tanto "2026-06-01" quanto ISO completo
function apenasODia(data: string): string {
  return data.slice(0, 10);
}

export function inicioDoDiaEmSaoPaulo(data: string): Date {
  return new Date(`${apenasODia(data)}T00:00:00.000${OFFSET_SAO_PAULO}`);
}

// borda superior exclusiva do filtro por periodo
export function inicioDoProximoDiaEmSaoPaulo(data: string): Date {
  const inicio = inicioDoDiaEmSaoPaulo(data);
  inicio.setUTCDate(inicio.getUTCDate() + 1);
  return inicio;
}
