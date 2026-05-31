import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, tryCatch } from '@/lib/api-helpers'

// ============ GET - List cities (optional filter by provinceId) ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const { searchParams } = new URL(request.url)
  const provinceId = searchParams.get('provinceId')

  const result = await tryCatch(async () => {
    return db.city.findMany({
      where: provinceId ? { provinceId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        province: { select: { id: true, name: true } },
        _count: {
          select: {
            districts: true,
            properties: { where: { isPublished: true, deletedAt: null } },
          },
        },
      },
    })
  })

  if (result instanceof Response) return result
  return json({ data: result.data })
}
