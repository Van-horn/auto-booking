import { getAuthToken } from '@/shared/lib/secure-token';

const BASE_URL = 'https://mobifitness.ru/api/v8/';

export async function apiRequest(path, options = {}) {
  const token = await getAuthToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
