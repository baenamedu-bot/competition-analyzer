const KEY = 'gemini_api_key';

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY);
}

export function setApiKey(value: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, value.trim());
  window.dispatchEvent(new Event('apikey:changed'));
}

export function clearApiKey() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event('apikey:changed'));
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}
