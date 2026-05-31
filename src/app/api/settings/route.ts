import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { handleCors, json, requireAuth, tryCatch } from '@/lib/api-helpers'

// ============ GET - All settings as key-value ============
export async function GET(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const result = await tryCatch(async () => {
    const settings = await db.websiteSetting.findMany({
      orderBy: { group: 'asc' },
    })

    // Convert to key-value object, grouped by group
    const grouped: Record<string, Record<string, string>> = {}
    const flat: Record<string, string> = {}

    for (const setting of settings) {
      if (!grouped[setting.group]) grouped[setting.group] = {}
      grouped[setting.group][setting.key] = setting.value
      flat[setting.key] = setting.value
    }

    return { settings, grouped, flat }
  })

  if (result instanceof Response) return result

  return json({ data: result.data.settings })
}

// ============ PUT - Update settings ============
export async function PUT(request: NextRequest) {
  const corsResp = handleCors(request)
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  try {
    const body = await request.json()
    const { settings } = body // Array of { key, value } or { key, value, group }

    if (!settings || !Array.isArray(settings)) {
      return json({ error: 'settings array is required.' }, 400)
    }

    const updated = await Promise.all(
      settings.map(async (item: { key: string; value: string; group?: string }) => {
        const { key, value, group } = item
        return db.websiteSetting.upsert({
          where: { key },
          update: { value },
          create: {
            key,
            value,
            group: group || 'general',
          },
        })
      })
    )

    return json({ data: updated, message: 'Settings updated successfully.' })
  } catch (error) {
    console.error('[Update Settings Error]', error)
    return json({ error: 'Failed to update settings.' }, 500)
  }
}
