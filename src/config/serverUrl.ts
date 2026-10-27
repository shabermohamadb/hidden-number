// src/config/serverUrl.ts

export function getServerUrl(): string {
  // 1. User custom override in localStorage
  const localOverride = localStorage.getItem('hn_server_url');
  if (localOverride && localOverride.trim()) {
    return localOverride.trim().replace(/\/+$/, '');
  }

  // 2. Environment variable injected at build/runtime (Vercel)
  const envUrl = import.meta.env.VITE_SERVER_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. In local dev, if on Vite port 5173 and no VITE_SERVER_URL, default to localhost:3001
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '5173') {
    return 'http://localhost:3001';
  }

  // 4. If hosted on Vercel and no override set, automatically connect to the Render backend!
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://hidden-number.onrender.com';
  }

  // 5. Default to current host (works directly on Render when serving dist)
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
}

export function setServerUrl(url: string): void {
  if (!url || !url.trim()) {
    localStorage.removeItem('hn_server_url');
  } else {
    localStorage.setItem('hn_server_url', url.trim().replace(/\/+$/, ''));
  }
}
