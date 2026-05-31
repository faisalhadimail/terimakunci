import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, tryCatch } from '@/lib/api-helpers'

// ============ GET - List agents ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const result = await tryCatch(async () => {
    const agents = await db.agentProfile.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        user: {
          select: { id: true, email: true, phone: true, avatar: true, name: true },
        },
      },
    })

    // Enrich with property and lead counts
    const enriched = await Promise.all(
      agents.map(async (agent) => {
        const userId = agent.userId
        const [propertyCount, leadCount] = await Promise.all([
          db.property.count({
            where: { agentId: userId, isPublished: true, deletedAt: null },
          }),
          db.lead.count({
            where: { agentId: userId, deletedAt: null },
          }),
        ])

        return {
          id: agent.id,
          userId: agent.userId,
          name: agent.name,
          title: agent.title,
          photo: agent.photo,
          whatsapp: agent.whatsapp,
          email: agent.email,
          bio: agent.bio,
          areaSpec: agent.areaSpec,
          isActive: agent.isActive,
          sortOrder: agent.sortOrder,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
          _count: { properties: propertyCount, leads: leadCount },
        }
      })
    )

    return enriched
  })

  if (result instanceof Response) return result
  return json({ data: result.data })
}
