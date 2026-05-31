import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, jsonError, requireAuth, getQueryParams, getPagination, tryCatch } from '@/lib/api-helpers'

// ============ GET - List leads ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  const q = getQueryParams(request)
  const page = q.getInt('page', 1) || 1
  const limit = Math.min(q.getInt('limit', 20) || 20, 100)
  const skip = (page - 1) * limit
  const keyword = q.get('keyword') || undefined
  const status = q.get('status') || undefined
  const agentId = q.get('agentId') || undefined
  const source = q.get('source') || undefined

  const where: Record<string, unknown> = {
    deletedAt: null,
    ...(keyword && {
      OR: [
        { name: { contains: keyword } },
        { whatsapp: { contains: keyword } },
        { email: { contains: keyword } },
        { propertyName: { contains: keyword } },
        { notes: { contains: keyword } },
      ],
    }),
    ...(status && { status }),
    ...(agentId && { agentId }),
    ...(source && { source }),
  }

  const result = await tryCatch(async () => {
    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          agent: { select: { id: true, name: true } },
          property: { select: { id: true, title: true, slug: true } },
        },
      }),
      db.lead.count({ where }),
    ])

    return { leads, total }
  })

  if (result instanceof Response) return result

  return json({
    data: result.data.leads,
    pagination: getPagination(page, limit, result.data.total),
  })
}

// ============ POST - Create lead (public) ============
export async function POST(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  try {
    const body = await request.json()
    const { name, whatsapp, email, phone, propertyId, propertyName, locationInterest, budget, propertyTypeInterest, needType, source, notes, dpAmount, promo } = body

    if (!name || !whatsapp) {
      return jsonError('Name and WhatsApp number are required.', 400)
    }

    // If propertyId is provided, fetch the property name
    let resolvedPropertyName = propertyName
    if (propertyId && !propertyName) {
      const property = await db.property.findUnique({
        where: { id: propertyId },
        select: { title: true },
      })
      if (property) resolvedPropertyName = property.title
    }

    const lead = await db.lead.create({
      data: {
        name,
        whatsapp,
        email: email || undefined,
        phone: phone || undefined,
        property: propertyId ? { connect: { id: propertyId } } : undefined,
        propertyName: resolvedPropertyName || undefined,
        locationInterest: locationInterest || undefined,
        budget: budget || undefined,
        propertyTypeInterest: propertyTypeInterest || undefined,
        needType: needType || 'beli',
        source: source || 'website',
        notes: notes || undefined,
        dpAmount: dpAmount || undefined,
        promo: promo || undefined,
      },
      include: {
        agent: { select: { id: true, name: true } },
        property: { select: { id: true, title: true, slug: true } },
      },
    })

    return json({ data: lead }, 201)
  } catch (error) {
    console.error('[Create Lead Error]', error)
    return jsonError('Failed to create lead.', 500)
  }
}
