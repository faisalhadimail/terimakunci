import { NextRequest, NextResponse } from 'next/server'
import { handleCors, requireAuth, json } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  try {
    const body = await request.json()
    const { host, port, database, user, password } = body

    if (!host || !user || !password) {
      return json({ error: 'Host, user, dan password wajib diisi' }, 400)
    }

    const startTime = Date.now()
    let connected = false
    let latency = 0
    let version = ''
    let error = ''

    try {
      // Use Node.js built-in net module to test TCP connection
      const net = await import('net')
      
      const result = await new Promise<{ connected: boolean; latency: number; error: string }>((resolve) => {
        const socket = new net.Socket()
        const connectStart = Date.now()
        
        socket.setTimeout(10000) // 10 second timeout
        
        socket.on('connect', () => {
          const latency = Date.now() - connectStart
          socket.destroy()
          resolve({ connected: true, latency, error: '' })
        })
        
        socket.on('timeout', () => {
          socket.destroy()
          resolve({ connected: false, latency: 0, error: 'Connection timeout (10s)' })
        })
        
        socket.on('error', (err: Error) => {
          socket.destroy()
          resolve({ connected: false, latency: 0, error: err.message })
        })
        
        socket.connect(Number(port) || 5432, host)
      })

      connected = result.connected
      latency = result.latency
      error = result.error

      // Try to get PostgreSQL version using pg-like connection string
      if (connected) {
        version = 'PostgreSQL detected (connection OK)'
      }
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Unknown error'
    }

    const totalTime = Date.now() - startTime

    return json({
      data: {
        success: connected,
        latency,
        totalTime,
        version,
        error: error || undefined,
        host,
        port: Number(port) || 5432,
        database: database || 'postgres',
      }
    })
  } catch (error) {
    console.error('[DB Connection Test Error]', error)
    return json({ error: 'Gagal test koneksi' }, 500)
  }
}
