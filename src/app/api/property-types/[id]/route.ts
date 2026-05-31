import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, jsonNotFound, jsonError, requireAuth, tryCatch } from '@/lib/api-helpers'

// ============ GET - Single property type ============
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const { id } = await params

  const result = await tryCatch(async () => {
    return db.propertyType.findUnique({
      where: { id },
      include: {
        _count: { select: { properties: true } },
      },
    })
  })

  if (result instanceof Response) return result
  if (!result.data) return jsonNotFound('Property type not found')

  return json({ data: result.data })
}

// ============ PUT - Update property type (admin) ============
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
    const existing = await db.propertyType.findUnique({ where: { id } })
    if (!existing) return jsonNotFound('Property type not found')

    const body = await request.json()

    // Generate new slug if name changed
    let slug = existing.slug
    if (body.name && body.name !== existing.name) {
      const baseSlug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      slug = baseSlug
      let suffix = 1
      while (await db.propertyType.findFirst({ where: { slug, NOT: { id } } })) {
        slug = `${baseSlug}-${suffix++}`
      }
    }

    const propertyType = await db.propertyType.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name, slug }),
        ...(body.icon !== undefined && { icon: body.icon || null }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
      include: {
        _count: { select: { properties: true } },
      },
    })

    return json({ data: propertyType })
  } catch (error) {
    console.error('[Update PropertyType Error]', error)
    return jsonError('Failed to update property type.', 500)
  }
}

// ============ DELETE - Delete property type (admin) ============
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  const { id } = await params

  try {
    const existing = await db.propertyType.findUnique({
      where: { id },
      include: { _count: { select: { properties: true } } },
    })
    if (!existing) return jsonNotFound('Property type not found')

    // Prevent deleting if properties are still using this type
    if (existing._count.properties > 0) {
      return jsonError(
        `Cannot delete "${existing.name}" because it is used by ${existing._count.properties} properti(es). Remove or reassign them first.`,
        400
      )
    }

    await db.propertyType.delete({ where: { id } })

    return json({ data: null, message: 'Property type deleted successfully.' })
  } catch (error) {
    console.error('[Delete PropertyType Error]', error)
    return jsonError('Failed to delete property type.', 500)
  }
}
