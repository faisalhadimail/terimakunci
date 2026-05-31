import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { handleCors, json, jsonError, getAuthUser, serializeBigInt } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return jsonError('Email and password are required.', 400)
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { agentProfile: true },
    })

    if (!user) {
      return jsonError('Invalid email or password.', 401)
    }

    if (!user.isActive) {
      return jsonError('Account is deactivated. Please contact admin.', 403)
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return jsonError('Invalid email or password.', 401)
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Create mock token (base64 encoded user info)
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64')

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user
    const serialized = serializeBigInt(userWithoutPassword)

    return json({
      user: serialized,
      token: `mock-jwt-token-${user.id}`,
      rawToken: token,
    })
  } catch (error) {
    console.error('[Login Error]', error)
    return jsonError('Internal server error.', 500)
  }
}
