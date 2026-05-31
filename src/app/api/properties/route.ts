import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, jsonError, requireAuth, getQueryParams, getPagination, tryCatch } from '@/lib/api-helpers'

// ============ PROPERTY CODE GENERATOR ============
async function generatePropertyCode(): Promise<string> {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const count = await db.property.count({
    where: {
      createdAt: { gte: startOfDay },
    },
  })

  const seq = String(count + 1).padStart(3, '0')
  return `PRP-${dateStr}-${seq}`
}

// ============ GET - List properties ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const q = getQueryParams(request)

  // Check if admin (can see unpublished)
  const authUser = requireAuth(request)
  const isAdmin = !(authUser instanceof Response)

  const page = q.getInt('page', 1) || 1
  const limit = Math.min(q.getInt('limit', 12) || 12, 100)
  const skip = (page - 1) * limit
  const keyword = q.get('keyword') || undefined
  const cityId = q.get('cityId') || undefined
  const districtId = q.get('districtId') || undefined
  const villageId = q.get('villageId') || undefined
  const propertyTypeId = q.get('propertyTypeId') || undefined
  const status = q.get('status') || undefined
  const priceMin = q.getInt('priceMin') || undefined
  const priceMax = q.getInt('priceMax') || undefined
  const landAreaMin = q.getInt('landAreaMin') || undefined
  const landAreaMax = q.getInt('landAreaMax') || undefined
  const bedroomsMin = q.getInt('bedroomsMin') || undefined
  const bathroomsMin = q.getInt('bathroomsMin') || undefined
  const certificate = q.get('certificate') || undefined
  const isFeatured = q.get('isFeatured') === 'true' ? true : undefined
  const isNew = q.get('isNew') === 'true' ? true : undefined
  const sort = q.get('sort') || 'newest'

  // Build where clause
  const where: Record<string, unknown> = {
    deletedAt: null,
    ...(isAdmin ? {} : { isPublished: true }),
    ...(keyword && {
      OR: [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
        { code: { contains: keyword } },
        { address: { contains: keyword } },
      ],
    }),
    ...(cityId && { cityId }),
    ...(districtId && { districtId }),
    ...(villageId && { villageId }),
    ...(propertyTypeId && { propertyTypeId }),
    ...(status && { status }),
    ...(priceMin !== undefined && { price: { gte: BigInt(priceMin) } }),
    ...(priceMax !== undefined && { price: { lte: BigInt(priceMax) } }),
    ...(priceMin !== undefined && priceMax !== undefined && {
      price: { gte: BigInt(priceMin), lte: BigInt(priceMax) },
    }),
    ...(landAreaMin !== undefined && { landArea: { gte: landAreaMin } }),
    ...(landAreaMax !== undefined && { landArea: { lte: landAreaMax } }),
    ...(bedroomsMin !== undefined && { bedrooms: { gte: bedroomsMin } }),
    ...(bathroomsMin !== undefined && { bathrooms: { gte: bathroomsMin } }),
    ...(certificate && { certificate }),
    ...(isFeatured !== undefined && { isFeatured }),
    ...(isNew !== undefined && { isNew }),
  }

  // Build orderBy
  let orderBy: Record<string, string> = { createdAt: 'desc' }
  switch (sort) {
    case 'price_asc':
      orderBy = { price: 'asc' }
      break
    case 'price_desc':
      orderBy = { price: 'desc' }
      break
    case 'popular':
      orderBy = { id: 'desc' } // fallback; ideally by view count
      break
    case 'largest':
      orderBy = { landArea: 'desc' }
      break
    case 'newest':
    default:
      orderBy = { createdAt: 'desc' }
      break
  }

  const result = await tryCatch(async () => {
    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          propertyType: { select: { id: true, name: true, slug: true, icon: true } },
          city: { select: { id: true, name: true, slug: true } },
          district: { select: { id: true, name: true, slug: true } },
          village: { select: { id: true, name: true, slug: true } },
          agent: {
            select: { id: true, name: true, phone: true, avatar: true },
          },
          images: {
            where: {},
            orderBy: { sortOrder: 'asc' },
            take: 5,
          },
          _count: { select: { leads: true } },
        },
      }),
      db.property.count({ where }),
    ])

    return { properties, total }
  })

  if (result instanceof Response) return result

  return json({
    data: result.data.properties,
    pagination: getPagination(page, limit, result.data.total),
  })
}

// ============ POST - Create property ============
export async function POST(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  try {
    const body = await request.json()

    const code = await generatePropertyCode()

    // Generate slug from title
    const baseSlug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    let slug = baseSlug
    let suffix = 1
    while (await db.property.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    const property = await db.property.create({
      data: {
        code,
        title: body.title,
        slug,
        description: body.description || '',
        propertyTypeId: body.propertyTypeId,
        status: body.status || 'draft',
        isFeatured: body.isFeatured ?? false,
        isNego: body.isNego ?? false,
        isNew: body.isNew ?? false,
        isPublished: body.isPublished ?? false,
        price: body.price ? BigInt(body.price) : BigInt(0),
        priceDisplay: body.priceDisplay || '',
        provinceId: body.provinceId || null,
        cityId: body.cityId || null,
        districtId: body.districtId || null,
        villageId: body.villageId || null,
        address: body.address || null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        landArea: body.landArea || 0,
        buildingArea: body.buildingArea || 0,
        bedrooms: body.bedrooms || 0,
        bathrooms: body.bathrooms || 0,
        garages: body.garages || 0,
        floors: body.floors || 0,
        electricity: body.electricity || null,
        waterSource: body.waterSource || null,
        certificate: body.certificate || null,
        buildingCond: body.buildingCond || null,
        orientation: body.orientation || null,
        facilities: body.facilities ? JSON.stringify(body.facilities) : null,
        mainImage: body.mainImage || null,
        videoUrl: body.videoUrl || null,
        virtualTourUrl: body.virtualTourUrl || null,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        metaKeywords: body.metaKeywords || null,
        agentId: body.agentId || null,
        publishedAt: body.isPublished ? new Date() : null,
        images: body.images
          ? {
              create: body.images.map((img: { url: string; altText?: string; sortOrder?: number }, i: number) => ({
                url: img.url,
                altText: img.altText || null,
                sortOrder: img.sortOrder ?? i,
              })),
            }
          : undefined,
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

    return json({ data: property }, 201)
  } catch (error) {
    console.error('[Create Property Error]', error)
    return jsonError('Failed to create property.', 500)
  }
}
