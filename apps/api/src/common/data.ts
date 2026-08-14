export function hojeEmSaoPaulo(): Date {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return new Date(`${partes}T00:00:00.000Z`);
}

export function inicioDoDia(data: string): Date {
  return new Date(`${data}T00:00:00.000Z`);
}

export function inicioDoProximoDia( data: string): Date {
  const inicioDia = inicioDoDia(data);

  inicioDia.setUTCDate(inicioDia.getUTCDate() + 1);

  return inicioDia;
}

