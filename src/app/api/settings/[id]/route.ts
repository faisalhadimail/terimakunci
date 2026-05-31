import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, jsonNotFound, jsonError, requireAuth, tryCatch } from '@/lib/api-helpers'

// ============ PUT - Update a single setting ============
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  const { id } = await params

  try {
    const existing = await db.websiteSetting.findUnique({ where: { id } })
    if (!existing) return jsonNotFound('Setting not found')

    const body = await request.json()

    const updated = await db.websiteSetting.update({
      where: { id },
      data: {
        ...(body.value !== undefined && { value: body.value }),
        ...(body.key !== undefined && { key: body.key }),
        ...(body.group !== undefined && { group: body.group }),
      },
    })

    return json({ data: updated, message: 'Setting updated successfully.' })
  } catch (error) {
    console.error('[Update Setting Error]', error)
    return jsonError('Failed to update setting.', 500)
  }
}
