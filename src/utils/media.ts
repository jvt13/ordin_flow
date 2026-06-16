import { API_URL } from '../constants';

export function resolveMediaUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) {
    return `${API_URL.replace(/\/$/, '')}${url}`;
  }
  return `${API_URL.replace(/\/$/, '')}/${url}`;
}
