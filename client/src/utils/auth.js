const STORAGE_KEY = 'wiki-admin-token';

export function getAuthToken() {
  return localStorage.getItem(STORAGE_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(STORAGE_KEY, token);
  window.dispatchEvent(new Event('authchange'));
}

export function clearAuthToken() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('authchange'));
}

