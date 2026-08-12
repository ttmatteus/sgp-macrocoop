import { hojeEmSaoPaulo } from './data';

describe('hojeEmSaoPaulo', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('usa o dia civil de Sao Paulo, nao o de UTC', () => {
    // 2026-03-10T02:00:00Z = 2026-03-09 23:00 em Sao Paulo (UTC-3): dias diferentes
    jest.useFakeTimers().setSystemTime(new Date('2026-03-10T02:00:00.000Z'));

    expect(hojeEmSaoPaulo()).toEqual(new Date('2026-03-09T00:00:00.000Z'));
  });

  it('retorna meia-noite UTC representando o dia, sem hora', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-15T15:30:00.000Z'));

    const resultado = hojeEmSaoPaulo();
    expect(resultado.getUTCHours()).toBe(0);
    expect(resultado.getUTCMinutes()).toBe(0);
  });
});
