const GITHUB_TOKEN_KEY = 'github_pat';

export function getGithubToken() {
  return localStorage.getItem(GITHUB_TOKEN_KEY);
}

export function setGithubToken(token) {
  localStorage.setItem(GITHUB_TOKEN_KEY, token);
}
