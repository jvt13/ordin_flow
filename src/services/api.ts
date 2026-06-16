import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../constants';
import { clearAuthStorage, getAccessToken, getRefreshToken, saveTokens } from '../utils/storage';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && original && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (!token) {
              reject(error);
              return;
            }
            if (original.headers) original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        await saveTokens(data.accessToken, data.refreshToken);
        processQueue(data.accessToken);
        if (original.headers) original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        processQueue(null);
        await clearAuthStorage();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

const FRIENDLY_ERRORS: Record<string, string> = {
  SttServiceError:
    'O serviço de transcrição local não respondeu. Confira se o Whisper está rodando (npm start) e tente de novo.',
  AIStructureError:
    'A IA não conseguiu interpretar o texto. Tente falar de forma mais clara ou use texto digitado.',
  GeminiModelError:
    'Modelo de IA inválido ou indisponível. Verifique GEMINI_MODEL no backend (ex.: gemini-2.0-flash).',
  MissingAudio: 'Nenhum áudio foi enviado. Grave novamente e solte o botão.',
};

export function isSttError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    (error.response?.data as { error?: string })?.error === 'SttServiceError'
  );
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string };
    if (data?.error && FRIENDLY_ERRORS[data.error]) {
      return FRIENDLY_ERRORS[data.error];
    }
    return data?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Erro desconhecido';
}
