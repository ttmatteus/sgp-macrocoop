import { Test, TestingModule } from '@nestjs/testing';
import { MapsApiService } from './maps-api.service';

describe('MapsApiService', () => {
  let service: MapsApiService;
  const fetchOriginal = global.fetch;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MapsApiService],
    }).compile();

    service = module.get<MapsApiService>(MapsApiService);
    process.env['GOOGLE_MAPS_API_KEY'] = 'chave-de-teste';
  });

  afterEach(() => {
    global.fetch = fetchOriginal;
    delete process.env['GOOGLE_MAPS_API_KEY'];
  });

  it('retorna null sem lançar quando a chave não está configurada', async () => {
    delete process.env['GOOGLE_MAPS_API_KEY'];
    const resultado = await service.buscarEnderecoReverso(-23.55, -46.63);
    expect(resultado).toBeNull();
  });

  it('retorna o endereço formatado quando o Google responde OK', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'OK',
          results: [{ formatted_address: 'Praça da Sé, São Paulo - SP' }],
        }),
    }) as unknown as typeof fetch;

    const resultado = await service.buscarEnderecoReverso(-23.55, -46.63);
    expect(resultado).toBe('Praça da Sé, São Paulo - SP');
  });

  it('retorna null sem lançar quando o Google responde com erro http', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    const resultado = await service.buscarEnderecoReverso(-23.55, -46.63);
    expect(resultado).toBeNull();
  });

  it('retorna null sem lançar quando o fetch rejeita (rede fora do ar)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('timeout')) as unknown as typeof fetch;

    const resultado = await service.buscarEnderecoReverso(-23.55, -46.63);
    expect(resultado).toBeNull();
  });

  it('retorna null quando o Google não encontra nenhum resultado', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ZERO_RESULTS', results: [] }),
    }) as unknown as typeof fetch;

    const resultado = await service.buscarEnderecoReverso(-23.55, -46.63);
    expect(resultado).toBeNull();
  });
});
