import sodium from 'libsodium-wrappers';

import {
  GITHUB_BRANCH,
  GITHUB_OWNER,
  GITHUB_PAT,
  GITHUB_REPO,
  LOGS_PATH,
} from '@/shared/lib/github-config';

const API_BASE = 'https://api.github.com';
const REPO_PATH = `repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

async function ghRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}/${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_PAT}`,
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

export async function getPausedScheduleId() {
  try {
    const data = await ghRequest(`${REPO_PATH}/actions/variables/PAUSED_SCHEDULE_ID`);
    return data?.value || null;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export async function setPausedScheduleId(scheduleId) {
  const value = scheduleId ?? '';
  try {
    await ghRequest(`${REPO_PATH}/actions/variables/PAUSED_SCHEDULE_ID`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'PAUSED_SCHEDULE_ID', value }),
    });
  } catch (error) {
    if (error.status !== 404) throw error;
    await ghRequest(`${REPO_PATH}/actions/variables`, {
      method: 'POST',
      body: JSON.stringify({ name: 'PAUSED_SCHEDULE_ID', value }),
    });
  }
}

export async function setMobifitTokenSecret(token) {
  await sodium.ready;
  const publicKey = await ghRequest(`${REPO_PATH}/actions/secrets/public-key`);

  const messageBytes = sodium.from_string(token);
  const keyBytes = sodium.from_base64(publicKey.key, sodium.base64_variants.ORIGINAL);
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
  const encryptedValue = sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);

  await ghRequest(`${REPO_PATH}/actions/secrets/MOBIFIT_TOKEN`, {
    method: 'PUT',
    body: JSON.stringify({ encrypted_value: encryptedValue, key_id: publicKey.key_id }),
  });
}

async function fetchLogsFile() {
  try {
    const data = await ghRequest(`${REPO_PATH}/contents/${LOGS_PATH}?ref=${GITHUB_BRANCH}`);
    const json = decodeURIComponent(escape(atob(data.content)));
    return { logs: JSON.parse(json), sha: data.sha };
  } catch (error) {
    if (error.status === 404) return { logs: [], sha: null };
    throw error;
  }
}

export async function fetchLogs() {
  const { logs } = await fetchLogsFile();
  return logs;
}

export async function clearLogs() {
  const { sha } = await fetchLogsFile();
  if (!sha) return;
  await ghRequest(`${REPO_PATH}/contents/${LOGS_PATH}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: 'chore: clear auto-booking logs',
      content: btoa(unescape(encodeURIComponent('[]'))),
      sha,
      branch: GITHUB_BRANCH,
    }),
  });
}

export async function fetchLatestWorkflowRun() {
  const data = await ghRequest(`${REPO_PATH}/actions/runs?per_page=1`);
  return data?.workflow_runs?.[0] ?? null;
}
