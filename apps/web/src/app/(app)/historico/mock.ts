import type { TurnoHistorico } from './tipos'

// dados de exemplo so pra visualizar a tela - GET /turnos/historico ainda
// nao ta pronto. gera turnos no mes atual pra sempre ter algo pra mostrar
function isoNoMesAtual(dia: number, hora: number, minuto = 0): string {
  const agora = new Date()
  return new Date(agora.getFullYear(), agora.getMonth(), dia, hora, minuto).toISOString()
}

let proximoId = 1
function turno(
  dia: number,
  entrada: [number, number],
  saida: [number, number],
  status: string,
  contratoId = 1,
  contratoNome = 'Contrato Teste A',
): TurnoHistorico {
  return {
    id: proximoId++,
    contratoId,
    contratoNome,
    iniciadoEm: isoNoMesAtual(dia, ...entrada),
    encerradoEm: isoNoMesAtual(dia, ...saida),
    status,
  }
}

export const TURNOS_EXEMPLO: TurnoHistorico[] = [
  turno(17, [8, 0], [12, 0], 'no_horario'),
  turno(17, [13, 0], [17, 0], 'no_horario'),
  turno(16, [8, 15], [12, 0], 'atraso'),
  turno(16, [13, 0], [17, 0], 'no_horario'),
  turno(15, [8, 0], [12, 0], 'no_horario'),
  turno(15, [13, 0], [17, 30], 'no_horario'),
  turno(12, [8, 5], [12, 0], 'atraso'),
  turno(12, [13, 0], [17, 0], 'no_horario'),
  // dois turnos em outro contrato, pra dar pra testar o filtro
  turno(10, [8, 0], [17, 0], 'no_horario', 2, 'Contrato Teste B'),
  turno(5, [8, 0], [17, 0], 'no_horario', 2, 'Contrato Teste B'),
].sort((a, b) => b.iniciadoEm.localeCompare(a.iniciadoEm))
