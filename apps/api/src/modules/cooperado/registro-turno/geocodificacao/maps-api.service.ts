import { Injectable, Logger } from '@nestjs/common';

const GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

interface RespostaGeocodingGoogle {
  status: string;
  results: Array<{ formatted_address: string }>;
}

@Injectable()
export class MapsApiService {
  private readonly logger = new Logger(MapsApiService.name);

  async buscarEnderecoReverso(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    const apiKey = process.env['GOOGLE_MAPS_API_KEY'];
    if (!apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY não configurada, pulando geocodificação');
      return null;
    }

    const url = new URL(GEOCODING_URL);
    url.searchParams.set('latlng', `${latitude},${longitude}`);
    url.searchParams.set('key', apiKey);

    try {
      const resposta = await fetch(url);
      if (!resposta.ok) {
        this.logger.warn(`Google Geocoding respondeu ${resposta.status}`);
        return null;
      }

      const corpo = (await resposta.json()) as RespostaGeocodingGoogle;
      if (corpo.status !== 'OK' || corpo.results.length === 0) {
        return null;
      }

      return corpo.results[0].formatted_address;
    } catch (erro) {
      this.logger.warn(`Falha ao chamar Google Geocoding: ${(erro as Error).message}`);
      return null;
    }
  }
}
