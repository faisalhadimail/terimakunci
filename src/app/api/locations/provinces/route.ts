import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, tryCatch } from '@/lib/api-helpers'

// ============ GET - List provinces ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const result = await tryCatch(async () => {
    return db.province.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            cities: true,
            properties: { where: { isPublished: true, deletedAt: null } },
          },
        },
      },
    })
  })

  if (result instanceof Response) return result

  return json({ data: result.data })
}
