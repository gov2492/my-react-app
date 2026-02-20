export interface AuthResponse {
  token: string
  tokenType: string
  expiresInSeconds: number
}
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://127.0.0.1:8083'

/**
 * call localhost:8083
 * @param username 
 * @param password 
 * @returns 
 */
export async function login(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })

  if (!response.ok) {
    throw new Error('Invalid username or password')
  }

  return (await response.json()) as AuthResponse
}
