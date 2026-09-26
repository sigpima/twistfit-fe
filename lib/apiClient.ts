const SKIP_REFRESH_RETRY_PATHS = new Set(['/auth/login', '/auth/register', '/auth/refresh'])

function apiBaseUrl(): string {
  // Server (SSR/route handlers) calls the backend directly over the private
  // network — no need to hop through the /api rewrite below. The browser
  // has no route to the backend at all, so it always goes through /api,
  // which next.config.ts rewrites to BACKEND_INTERNAL_URL server-side.
  if (typeof window === 'undefined') {
    return process.env.BACKEND_INTERNAL_URL ?? ''
  }
  // "||" chứ không phải "??": nếu build-arg NEXT_PUBLIC_API_BASE_URL từng
  // được set rỗng (chuỗi ""), "??" sẽ không fallback (chỉ bắt null/undefined)
  // — từng gây bug thật: request thành "" + path, tức đường dẫn tương đối
  // theo origin hiện tại thay vì qua "/api" rewrite.
  return process.env.NEXT_PUBLIC_API_BASE_URL || '/api'
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
