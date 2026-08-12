import sodium from 'libsodium-wrappers';

import { GITHUB_OWNER, GITHUB_REPO, MOBIFIT_SECRET_NAME } from '@/shared/lib/github-config';
import { getGithubToken } from '@/shared/lib/github-token';

const API_BASE = 'https://api.github.com';
const REPO_PATH = `repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

async function ghRequest(path, options = {}) {
  const token = getGithubToken();
  if (!token) {
    const error = new Error('GitHub токен не задан');
    error.status = 401;
    throw error;
  }

  const response = await fetch(`${API_BASE}/${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message ?? `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function setMobifitTokenSecret(token) {
  await sodium.ready;
  const publicKey = await ghRequest(`${REPO_PATH}/actions/secrets/public-key`);

  const messageBytes = sodium.from_string(token);
  const keyBytes = sodium.from_base64(publicKey.key, sodium.base64_variants.ORIGINAL);
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
  const encryptedValue = sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);

  await ghRequest(`${REPO_PATH}/actions/secrets/${MOBIFIT_SECRET_NAME}`, {
    method: 'PUT',
    body: JSON.stringify({ encrypted_value: encryptedValue, key_id: publicKey.key_id }),
  });
}

export async function fetchLatestWorkflowRun() {
  const data = await ghRequest(`${REPO_PATH}/actions/runs?per_page=1`);
  return data?.workflow_runs?.[0] ?? null;
}
