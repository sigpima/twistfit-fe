// `Role` is the only export still used in production, by
// components/auth/AuthProvider.tsx — a JWT-era, client-side concept
// unrelated to the SQLite `users` table this file used to back.
export type Role = 'user' | 'admin'
