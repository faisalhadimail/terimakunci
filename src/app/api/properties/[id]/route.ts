import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, jsonNotFound, requireAuth, tryCatch } from '@/lib/api-helpers'

// ============ GET - Single property ============
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const { id } = await params

  const result = await tryCatch(async () => {
    // Support lookup by both id (cuid) and slug
    let property = await db.property.findUnique({
      where: { id },
      include: {
        propertyType: true,
        province: { select: { id: true, name: true, slug: true } },
        city: { select: { id: true, name: true, slug: true } },
        district: { select: { id: true, name: true, slug: true } },
        village: { select: { id: true, name: true, slug: true } },
        agent: { select: { id: true, name: true, phone: true, avatar: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { leads: true } },
      },
    })

    // If not found by id, try looking up by slug
    if (!property) {
      property = await db.property.findUnique({
        where: { slug: id },
        include: {
          propertyType: true,
          province: { select: { id: true, name: true, slug: true } },
          city: { select: { id: true, name: true, slug: true } },
          district: { select: { id: true, name: true, slug: true } },
          village: { select: { id: true, name: true, slug: true } },
          agent: { select: { id: true, name: true, phone: true, avatar: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { leads: true } },
        },
      })
    }

    return property
  })

  if (result instanceof Response) return result

  if (!result.data) return jsonNotFound('Property not found')
  if (result.data.deletedAt) return jsonNotFound('Property has been deleted')

  return json({ data: result.data })
}

// ============ PUT - Update property ============
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
    const existing = await db.property.findUnique({ where: { id } })
    if (!existing) return jsonNotFound('Property not found')
    if (existing.deletedAt) return jsonNotFound('Property has been deleted. Restore it first.')

    const body = await request.json()

    // Generate new slug if title changed
    let slug = existing.slug
    if (body.title && body.title !== existing.title) {
      const baseSlug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      slug = baseSlug
      let suffix = 1
      while (await db.property.findFirst({ where: { slug, NOT: { id } } })) {
        slug = `${baseSlug}-${suffix++}`
      }
    }

    const property = await db.property.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title, slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.propertyTypeId !== undefined && { propertyTypeId: body.propertyTypeId }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.isNego !== undefined && { isNego: body.isNego }),
        ...(body.isNew !== undefined && { isNew: body.isNew }),
        ...(body.isPublished !== undefined && {
          isPublished: body.isPublished,
          publishedAt: body.isPublished && !existing.isPublished ? new Date() : existing.publishedAt,
        }),
        ...(body.price !== undefined && { price: BigInt(body.price) }),
        ...(body.priceDisplay !== undefined && { priceDisplay: body.priceDisplay }),
        ...(body.provinceId !== undefined && { provinceId: body.provinceId || null }),
        ...(body.cityId !== undefined && { cityId: body.cityId || null }),
        ...(body.districtId !== undefined && { districtId: body.districtId || null }),
        ...(body.villageId !== undefined && { villageId: body.villageId || null }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.latitude !== undefined && { latitude: body.latitude ?? null }),
        ...(body.longitude !== undefined && { longitude: body.longitude ?? null }),
        ...(body.landArea !== undefined && { landArea: body.landArea }),
        ...(body.buildingArea !== undefined && { buildingArea: body.buildingArea }),
        ...(body.bedrooms !== undefined && { bedrooms: body.bedrooms }),
        ...(body.bathrooms !== undefined && { bathrooms: body.bathrooms }),
        ...(body.garages !== undefined && { garages: body.garages }),
        ...(body.floors !== undefined && { floors: body.floors }),
        ...(body.electricity !== undefined && { electricity: body.electricity }),
        ...(body.waterSource !== undefined && { waterSource: body.waterSource }),
        ...(body.certificate !== undefined && { certificate: body.certificate }),
        ...(body.buildingCond !== undefined && { buildingCond: body.buildingCond }),
        ...(body.orientation !== undefined && { orientation: body.orientation }),
        ...(body.facilities !== undefined && {
          facilities: body.facilities ? JSON.stringify(body.facilities) : null,
        }),
        ...(body.mainImage !== undefined && { mainImage: body.mainImage }),
        ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
        ...(body.virtualTourUrl !== undefined && { virtualTourUrl: body.virtualTourUrl }),
        ...(body.metaTitle !== undefined && { metaTitle: body.metaTitle }),
        ...(body.metaDescription !== undefined && { metaDescription: body.metaDescription }),
        ...(body.metaKeywords !== undefined && { metaKeywords: body.metaKeywords }),
        ...(body.agentId !== undefined && { agentId: body.agentId || null }),
      },
      include: {
        propertyType: true,
        city: true,
        district: true,
        village: true,
        agent: { select: { id: true, name: true, phone: true, avatar: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return json({ data: property })
  } catch (error) {
    console.error('[Update Property Error]', error)
    return json({ error: 'Failed to update property.' }, 500)
  }
}

// ============ DELETE - Soft delete property ============
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
    const existing = await db.property.findUnique({ where: { id } })
    if (!existing) return null
    if (existing.deletedAt) return existing

    return db.property.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isPublished: false,
      },
    })
  })

  if (result instanceof Response) return result
  if (!result.data) return jsonNotFound('Property not found')

  return json({ data: result.data, message: 'Property deleted successfully.' })
}
