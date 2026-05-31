import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

// ============ CORS ============
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function corsHeaders() {
  return CORS_HEADERS
}

export function handleCors(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
  }
}

export function withCors(response: NextResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

// ============ AUTH ============
export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7)
  if (!token) return null

  // Simplified mock auth: token is user ID (in production, verify JWT)
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    if (decoded && decoded.id && decoded.email) {
      return decoded as AuthUser
    }
  } catch {
    // Not a valid base64 JSON token
  }

  // Fallback: treat token as "mock-jwt-token-{userId}" format
  const match = token.match(/^mock-jwt-token-(.+)$/)
  if (match) {
    return {
      id: match[1],
      email: '',
      name: '',
      role: '',
    }
  }

  return null
}

export function requireAuth(request: NextRequest): AuthUser | NextResponse {
  const user = getAuthUser(request)
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please login first.' },
      { status: 401, headers: CORS_HEADERS }
    )
  }
  return user
}

// ============ JSON RESPONSE HELPERS ============
export function json(data: unknown, status = 200) {
  const serialized = serializeBigInt(data)
  const response = NextResponse.json(serialized, { status })
  return withCors(response)
}

export function jsonError(message: string, status = 400) {
  return json({ error: message }, status)
}

export function jsonNotFound(message = 'Resource not found') {
  return json({ error: message }, 404)
}

// ============ BIGINT SERIALIZATION ============
export function serializeBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return Number(obj)
  if (typeof obj === 'number') return obj
  if (typeof obj === 'string') return obj
  if (typeof obj === 'boolean') return obj

  if (obj instanceof Date) return obj.toISOString()

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt)
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeBigInt(value)
    }
    return result
  }

  return obj
}

// ============ QUERY PARSING ============
export function getQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  return {
    get: (key: string) => searchParams.get(key),
    getAll: (key: string) => searchParams.getAll(key),
    getInt: (key: string, defaultValue = 0) => {
      const val = searchParams.get(key)
      return val ? parseInt(val, 10) || defaultValue : defaultValue
    },
    getFloat: (key: string, defaultValue = 0) => {
      const val = searchParams.get(key)
      return val ? parseFloat(val) || defaultValue : defaultValue
    },
    getBool: (key: string, defaultValue = false) => {
      const val = searchParams.get(key)
      if (val === 'true' || val === '1') return true
      if (val === 'false' || val === '0') return false
      return defaultValue
    },
  }
}

// ============ PAGINATION HELPER ============
export function getPagination(
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return {
    page,
    limit,
    total,
    totalPages,
  }
}

// ============ SAFE DB CALL ============
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage = 'Internal server error'
): Promise<{ data: T } | NextResponse> {
  try {
    const data = await fn()
    return { data }
  } catch (error) {
    console.error('[API Error]', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const code = error.code
      if (code === 'P2025') return jsonNotFound()
      if (code === 'P2002') return jsonError('Duplicate entry. This record already exists.', 409)
      if (code === 'P2023') return jsonError('Invalid field value.', 400)
    }
    return jsonError(errorMessage, 500)
  }
}
