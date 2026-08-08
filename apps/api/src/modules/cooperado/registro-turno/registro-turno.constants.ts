export const PRECISAO_MAXIMA_AVALIAVEL_M = 150;

export const JANELA_ONLINE_MS = 5 * 60 * 1000;

export const VELOCIDADE_MAXIMA_PLAUSIVEL_KMH = 200;

// quanto tempo pra tras uma batida pode alegar ter acontecido. limita ate onde
// da pra forjar registradoEm pra passar por alocacao ja encerrada
export const JANELA_RETROATIVA_MS = 48 * 60 * 60 * 1000;

// folga pra relogio do dispositivo adiantado, sem virar janela de data futura
export const TOLERANCIA_RELOGIO_MS = 5 * 60 * 1000;
