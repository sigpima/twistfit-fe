const SKIP_REFRESH_RETRY_PATHS = new Set(['/auth/login', '/auth/register', '/auth/refresh'])

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
}

async function rawFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${apiBaseUrl()}${path}`, { ...init, credentials: 'include' })
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await rawFetch(path, init)
  if (response.status !== 401 || SKIP_REFRESH_RETRY_PATHS.has(path)) {
    return response
  }

  const refreshResponse = await rawFetch('/auth/refresh', { method: 'POST' })
  if (!refreshResponse.ok) {
    return response
  }

  return rawFetch(path, init)
}
