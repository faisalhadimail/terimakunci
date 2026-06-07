import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { handleCors, json, jsonError, serializeBigInt } from '@/lib/api-helpers'

const ADMIN_EMAIL = 'admin@properti.com'
const ADMIN_PASSWORD = 'admin123'
const ADMIN_NAME = 'Administrator'
const ADMIN_ROLE = 'super_admin'

export async function POST(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return jsonError('Email dan password wajib diisi.', 400)
    }

    let user = await db.user.findUnique({
      where: { email },
      include: { agentProfile: true },
    })

    // ─── AUTO-SEED: If no user found and credentials are the default admin, create it ───
    if (!user && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log('[Auth] Admin user not found, auto-seeding...')
      try {
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)
        user = await db.user.create({
          data: {
            email: ADMIN_EMAIL,
            name: ADMIN_NAME,
            password: hashedPassword,
            role: ADMIN_ROLE,
            phone: '+62 812-3456-7890',
            isActive: true,
          },
          include: { agentProfile: true },
        })
        console.log('[Auth] Admin user auto-created successfully')
      } catch (createErr: any) {
        console.error('[Auth] Auto-seed failed:', createErr)
        const errMsg = createErr?.message || ''
        if (errMsg.includes('credentials') || errMsg.includes('FIREBASE') || errMsg.includes('default credentials')) {
          return jsonError(
            'Firebase tidak terhubung. Set env FIREBASE_SERVICE_ACCOUNT_KEY di Vercel. Buka /api/setup untuk panduan.',
            503
          )
        }
        return jsonError('Gagal membuat akun admin otomatis.', 500)
      }
    }

    if (!user) {
      return jsonError('Email atau password salah.', 401)
    }

    if (!user.isActive) {
      return jsonError('Akun dinonaktifkan. Hubungi admin.', 403)
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return jsonError('Email atau password salah.', 401)
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
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('credentials') || msg.includes('FIREBASE')) {
      return jsonError(
        'Firebase tidak terhubung. Set env FIREBASE_SERVICE_ACCOUNT_KEY di Vercel. Buka /api/setup untuk panduan.',
        503
      )
    }
    return jsonError('Terjadi kesalahan server.', 500)
  }
}
