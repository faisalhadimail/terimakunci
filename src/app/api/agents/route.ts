import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, tryCatch } from '@/lib/api-helpers'

// ============ GET - List agents ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const result = await tryCatch(async () => {
    // Fetch agents + batch counts in parallel
    const [agents, propertyCountsByAgent, leadCountsByAgent] = await Promise.all([
      db.agentProfile.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          user: {
            select: { id: true, email: true, phone: true, avatar: true, name: true },
          },
        },
      }),
      // Batch: count properties per agent using groupBy
      db.property.groupBy({
        by: ['agentId'],
        where: { isPublished: true, deletedAt: null },
        _count: { agentId: true },
      }),
      // Batch: count leads per agent using groupBy
      db.lead.groupBy({
        by: ['agentId'],
        where: { deletedAt: null },
        _count: { agentId: true },
      }),
    ])

    // Build lookup maps from groupBy results
    const propCountMap = new Map(
      propertyCountsByAgent.map((item: any) => [item.agentId, item._count?.agentId || item._count?.properties || 0])
    )
    const leadCountMap = new Map(
      leadCountsByAgent.map((item: any) => [item.agentId, item._count?.agentId || item._count?.leads || 0])
    )

    // Enrich agents with batch counts (no per-agent queries)
    const enriched = agents.map((agent: any) => ({
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
      _count: {
        properties: propCountMap.get(agent.userId) || 0,
        leads: leadCountMap.get(agent.userId) || 0,
      },
    }))

    return enriched
  })

  if (result instanceof Response) return result
  return json({ data: result.data })
}
