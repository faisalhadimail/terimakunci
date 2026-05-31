import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, jsonError, requireAuth, getQueryParams, getPagination, tryCatch } from '@/lib/api-helpers'

// ============ GET - List articles ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const q = getQueryParams(request)
  const page = q.getInt('page', 1) || 1
  const limit = Math.min(q.getInt('limit', 12) || 12, 100)
  const skip = (page - 1) * limit
  const keyword = q.get('keyword') || undefined
  const categoryId = q.get('categoryId') || undefined
  const tag = q.get('tag') || undefined

  // Check if admin (can see unpublished)
  const authUser = requireAuth(request)
  const isAdmin = !(authUser instanceof Response)

  const where: Record<string, unknown> = {
    deletedAt: null,
    ...(isAdmin ? {} : { isPublished: true }),
    ...(keyword && {
      OR: [
        { title: { contains: keyword } },
        { excerpt: { contains: keyword } },
        { content: { contains: keyword } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(tag && { tags: { contains: tag } }),
  }

  const result = await tryCatch(async () => {
    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, name: true } },
        },
      }),
      db.article.count({ where }),
    ])

    return { articles, total }
  })

  if (result instanceof Response) return result

  return json({
    data: result.data.articles,
    pagination: getPagination(page, limit, result.data.total),
  })
}

// ============ POST - Create article ============
export async function POST(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  try {
    const body = await request.json()
    const { title, content, excerpt, categoryId, tags, featuredImage, isPublished, scheduledAt, metaTitle, metaDescription, metaKeywords, canonicalUrl, authorId } = body

    if (!title || !content) {
      return jsonError('Title and content are required.', 400)
    }

    // Generate slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    let slug = baseSlug
    let suffix = 1
    while (await db.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    const resolvedAuthorId = authorId || (typeof authUser === 'object' ? authUser.id : null)

    const article = await db.article.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        categoryId: categoryId || null,
        tags: tags ? JSON.stringify(tags) : null,
        featuredImage: featuredImage || null,
        isPublished: isPublished ?? false,
        publishedAt: isPublished ? new Date() : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        metaKeywords: metaKeywords || null,
        canonicalUrl: canonicalUrl || null,
        authorId: resolvedAuthorId,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true } },
      },
    })

    return json({ data: article }, 201)
  } catch (error) {
    console.error('[Create Article Error]', error)
    return jsonError('Failed to create article.', 500)
  }
}
