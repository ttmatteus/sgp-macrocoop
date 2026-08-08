import { distanciaMetros } from './geo';

describe('distanciaMetros', () => {
  it('retorna 0 pro mesmo ponto', () => {
    expect(distanciaMetros(-23.55052, -46.63331, -23.55052, -46.63331)).toBe(0);
  });

  it('calcula a distancia aproximada entre dois pontos conhecidos', () => {
    // Sao Paulo (Se) -> Rio de Janeiro (Centro), ~360km em linha reta
    const distancia = distanciaMetros(-23.5505, -46.6333, -22.9068, -43.1729);
    expect(distancia).toBeGreaterThan(350000);
    expect(distancia).toBeLessThan(370000);
  });

  it('calcula distancia pequena com precisao (raio de geofence)', () => {
    // ~0.0045 graus de latitude equivale a aproximadamente 500m
    const distancia = distanciaMetros(-23.55052, -46.63331, -23.55502, -46.63331);
    expect(distancia).toBeGreaterThan(490);
    expect(distancia).toBeLessThan(510);
  });
});
