import {
  hojeEmSaoPaulo,
  inicioDoDiaEmSaoPaulo,
  inicioDoProximoDiaEmSaoPaulo,
} from './data';

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

describe('inicioDoDiaEmSaoPaulo', () => {
  it('usa a meia-noite de Sao Paulo, nao a de UTC', () => {
    expect(inicioDoDiaEmSaoPaulo('2026-06-10')).toEqual(
      new Date('2026-06-10T03:00:00.000Z'),
    );
  });

  it('aceita ISO completo, considerando so o dia', () => {
    expect(inicioDoDiaEmSaoPaulo('2026-06-10T18:45:00.000Z')).toEqual(
      new Date('2026-06-10T03:00:00.000Z'),
    );
  });
});

describe('inicioDoProximoDiaEmSaoPaulo', () => {
  it('avanca um dia civil', () => {
    expect(inicioDoProximoDiaEmSaoPaulo('2026-06-10')).toEqual(
      new Date('2026-06-11T03:00:00.000Z'),
    );
  });

  it('vira o mes corretamente', () => {
    expect(inicioDoProximoDiaEmSaoPaulo('2026-06-30')).toEqual(
      new Date('2026-07-01T03:00:00.000Z'),
    );
  });

  it('cobre um turno noturno no dia certo', () => {
    // 10/06 as 21h30 em Sao Paulo, que em UTC ja e 11/06
    const turnoNoturno = new Date('2026-06-11T00:30:00.000Z');

    expect(turnoNoturno >= inicioDoDiaEmSaoPaulo('2026-06-10')).toBe(true);
    expect(turnoNoturno < inicioDoProximoDiaEmSaoPaulo('2026-06-10')).toBe(true);

    expect(turnoNoturno >= inicioDoDiaEmSaoPaulo('2026-06-11')).toBe(false);
  });
});
