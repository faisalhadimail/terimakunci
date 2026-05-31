import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, jsonNotFound, jsonError, requireAuth, tryCatch } from '@/lib/api-helpers'

// ============ GET - Single article ============
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const { id } = await params

  const result = await tryCatch(async () => {
    const article = await db.article.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Increment view count for published articles
    if (article && article.isPublished && !article.deletedAt) {
      await db.article.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      })
      article.viewCount += 1
    }

    return article
  })

  if (result instanceof Response) return result
  if (!result.data) return jsonNotFound('Article not found')
  if (result.data.deletedAt) return jsonNotFound('Article has been deleted')

  // Non-admin users can only view published articles
  const authUser = requireAuth(request)
  const isAdmin = !(authUser instanceof Response)
  if (!result.data.isPublished && !isAdmin) {
    return jsonNotFound('Article not found')
  }

  return json({ data: result.data })
}

// ============ PUT - Update article ============
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
    const existing = await db.article.findUnique({ where: { id } })
    if (!existing) return jsonNotFound('Article not found')
    if (existing.deletedAt) return jsonError('Article has been deleted. Restore it first.', 400)

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
      while (await db.article.findFirst({ where: { slug, NOT: { id } } })) {
        slug = `${baseSlug}-${suffix++}`
      }
    }

    const article = await db.article.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title, slug }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.excerpt !== undefined && { excerpt: body.excerpt || null }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
        ...(body.tags !== undefined && { tags: body.tags ? JSON.stringify(body.tags) : null }),
        ...(body.featuredImage !== undefined && { featuredImage: body.featuredImage }),
        ...(body.isPublished !== undefined && {
          isPublished: body.isPublished,
          publishedAt: body.isPublished && !existing.isPublished ? new Date() : existing.publishedAt,
        }),
        ...(body.scheduledAt !== undefined && {
          scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        }),
        ...(body.metaTitle !== undefined && { metaTitle: body.metaTitle || null }),
        ...(body.metaDescription !== undefined && { metaDescription: body.metaDescription || null }),
        ...(body.metaKeywords !== undefined && { metaKeywords: body.metaKeywords || null }),
        ...(body.canonicalUrl !== undefined && { canonicalUrl: body.canonicalUrl || null }),
        ...(body.authorId !== undefined && { authorId: body.authorId || null }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true } },
      },
    })

    return json({ data: article })
  } catch (error) {
    console.error('[Update Article Error]', error)
    return jsonError('Failed to update article.', 500)
  }
}

// ============ DELETE - Soft delete article ============
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
    const existing = await db.article.findUnique({ where: { id } })
    if (!existing) return null
    if (existing.deletedAt) return existing

    return db.article.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isPublished: false,
      },
    })
  })

  if (result instanceof Response) return result
  if (!result.data) return jsonNotFound('Article not found')

  return json({ data: result.data, message: 'Article deleted successfully.' })
}
