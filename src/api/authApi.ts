export interface AuthResponse {
  token: string
  tokenType: string
  expiresInSeconds: number
  shopName: string
  role: string
  shopId: string
  logoUrl?: string
  email?: string
  address?: string
  contactNumber?: string
  gstNumber?: string
}

export interface UserDetails {
  id: number
  username: string
  email: string
  role: string
  shopName: string
  shopId: string
  gstNumber: string | null
  contactNumber: string | null
  address: string | null
  logoUrl: string | null
  enabled: boolean
}

const AUTH_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080'

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

export async function register(token: string, data: any): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error('Failed to create shop')
  }

  return (await response.json()) as AuthResponse
}

export const forgotPassword = async (identifier: string): Promise<void> => {
  const response = await fetch(`${AUTH_API_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Account not found. Please check your username or email.')
  }
}

export const verifyOtp = async (identifier: string, otp: string): Promise<void> => {
  const response = await fetch(`${AUTH_API_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier, otp }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Invalid OTP. Please try again.')
  }
}

export const resetPassword = async (identifier: string, otp: string, newPassword: string): Promise<void> => {
  const response = await fetch(`${AUTH_API_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier, otp, newPassword }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to reset password')
  }
}

export async function getUsers(token: string): Promise<UserDetails[]> {
  const response = await fetch(`${AUTH_API_URL}/api/auth/users`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }

  return (await response.json()) as UserDetails[]
}

export async function deleteUser(token: string, userId: number): Promise<void> {
  const response = await fetch(`${AUTH_API_URL}/api/auth/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Cannot delete main admin account')
    }
    throw new Error('Failed to delete user')
  }
}

export async function toggleUserStatus(token: string, userId: number): Promise<UserDetails> {
  const response = await fetch(`${AUTH_API_URL}/api/auth/users/${userId}/toggle-status`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Cannot disable main admin account')
    }
    throw new Error('Failed to toggle user status')
  }

  return (await response.json()) as UserDetails
}
