import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, jsonNotFound, jsonError, requireAuth, tryCatch } from '@/lib/api-helpers'

// ============ GET - Single lead ============
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  const { id } = await params

  const result = await tryCatch(async () => {
    return db.lead.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true, email: true, phone: true } },
        property: { select: { id: true, title: true, slug: true, mainImage: true, price: true, priceDisplay: true } },
      },
    })
  })

  if (result instanceof Response) return result
  if (!result.data) return jsonNotFound('Lead not found')
  if (result.data.deletedAt) return jsonNotFound('Lead has been deleted')

  return json({ data: result.data })
}

// ============ PUT - Update lead ============
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
    const existing = await db.lead.findUnique({ where: { id } })
    if (!existing) return jsonNotFound('Lead not found')
    if (existing.deletedAt) return jsonError('Lead has been deleted. Restore it first.', 400)

    const body = await request.json()

    const lead = await db.lead.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.whatsapp !== undefined && { whatsapp: body.whatsapp }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.propertyId !== undefined && { propertyId: body.propertyId || null }),
        ...(body.propertyName !== undefined && { propertyName: body.propertyName || null }),
        ...(body.locationInterest !== undefined && { locationInterest: body.locationInterest || null }),
        ...(body.budget !== undefined && { budget: body.budget || null }),
        ...(body.propertyTypeInterest !== undefined && { propertyTypeInterest: body.propertyTypeInterest || null }),
        ...(body.needType !== undefined && { needType: body.needType }),
        ...(body.source !== undefined && { source: body.source }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.agentId !== undefined && { agentId: body.agentId || null }),
        ...(body.nextFollowUp !== undefined && {
          nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null,
        }),
        ...(body.followUpNotes !== undefined && { followUpNotes: body.followUpNotes }),
      },
      include: {
        agent: { select: { id: true, name: true } },
        property: { select: { id: true, title: true, slug: true } },
      },
    })

    return json({ data: lead })
  } catch (error) {
    console.error('[Update Lead Error]', error)
    return jsonError('Failed to update lead.', 500)
  }
}

// ============ DELETE - Soft delete lead ============
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  const { id } = await params

  const result = await tryCatch(async () => {
    const existing = await db.lead.findUnique({ where: { id } })
    if (!existing) return null
    if (existing.deletedAt) return existing

    return db.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  })

  if (result instanceof Response) return result
  if (!result.data) return jsonNotFound('Lead not found')

  return json({ data: result.data, message: 'Lead deleted successfully.' })
}
