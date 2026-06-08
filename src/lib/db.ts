// ─── Firestore REST API Client ────────────────────────────────────────
// Uses the Firebase REST API with API key — no service account needed.

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'terimakunci-7bf84'
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)`

function apiUrl(path: string, params?: Record<string, string | string[]>): string {
  const sp = new URLSearchParams()
  if (API_KEY) sp.set('key', API_KEY)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v)) v.forEach(item => sp.append(k, item))
      else if (v !== undefined) sp.set(k, v)
    }
  }
  const qs = sp.toString()
  return `${BASE_URL}${path}${qs ? '?' + qs : ''}`
}

// ─── Value conversion helpers ─────────────────────────────────────────
function jsToRestValue(v: any): any {
  if (v === null || v === undefined) return { nullValue: 'NULL_VALUE' }
  if (v instanceof Date) return { timestampValue: v.toISOString() }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number' || typeof v === 'bigint') return { integerValue: Number(v) }
  if (typeof v === 'string') return { stringValue: v }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(jsToRestValue).filter((x: any) => x !== null) } }
  if (typeof v === 'object') {
    const map: Record<string, any> = {}
    for (const [k, val] of Object.entries(v)) {
      if (val !== undefined && val !== null) map[k] = jsToRestValue(val)
    }
    return { mapValue: { fields: map } }
  }
  return { stringValue: String(v) }
}

function restValueToJs(v: any): any {
  if (!v || typeof v !== 'object') return v
  if ('stringValue' in v) return v.stringValue
  if ('booleanValue' in v) return v.booleanValue
  if ('integerValue' in v) return Number(v.integerValue)
  if ('doubleValue' in v) return Number(v.doubleValue)
  if ('timestampValue' in v) return new Date(v.timestampValue)
  if ('nullValue' in v) return null
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(restValueToJs)
  if ('mapValue' in v) {
    const obj: Record<string, any> = {}
    for (const [k, val] of Object.entries(v.mapValue?.fields || {})) {
      obj[k] = restValueToJs(val)
    }
    return obj
  }
  if ('referenceValue' in v) return v.referenceValue
  if ('geoPointValue' in v) return v.geoPointValue
  return v
}

function restDocToObj(doc: { name: string; fields?: Record<string, any> }): Record<string, any> | null {
  if (!doc?.fields) return null
  const id = doc.name.split('/').pop() || ''
  const obj: Record<string, any> = { id }
  for (const [k, v] of Object.entries(doc.fields)) {
    obj[k] = restValueToJs(v)
  }
  return obj
}

// ─── REST API methods ────────────────────────────────────────────────

function firelog(label: string, err: any) {
  const msg = err?.message || err?.toString?.() || String(err)
  console.error(`[Firestore:${label}] ${msg}`)
}

async function restGet(collection: string, docId: string): Promise<Record<string, any> | null> {
  const res = await fetch(apiUrl(`/documents/${collection}/${docId}`))
  if (res.status === 404) return null
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return restDocToObj(data)
}

interface RestQueryOptions {
  where?: Array<{ field: string; op: string; value: any }>
  orderBy?: Array<{ field: string; direction: string }>
  limit?: number
  offset?: number
  select?: string[]
}

async function restQuery(collection: string, options?: RestQueryOptions): Promise<{ docs: Record<string, any>[], totalCount?: number }> {
  const structuredQuery: any = { from: [{ collectionId: collection }] }

  if (options?.where && options.where.length > 0) {
    if (options.where.length === 1) {
      structuredQuery.where = {
        fieldFilter: {
          field: { fieldPath: options.where[0].field },
          op: options.where[0].op,
          value: jsToRestValue(options.where[0].value),
        }
      }
    } else {
      structuredQuery.where = {
        compositeFilter: {
          op: 'AND',
          filters: options.where.map(w => ({
            fieldFilter: {
              field: { fieldPath: w.field },
              op: w.op,
              value: jsToRestValue(w.value),
            }
          }))
        }
      }
    }
  }

  if (options?.orderBy) {
    structuredQuery.orderBy = options.orderBy.map(o => ({
      field: { fieldPath: o.field },
      direction: o.direction || 'ASCENDING',
    }))
  }

  if (options?.offset) structuredQuery.offset = options.offset
  if (options?.limit) structuredQuery.limit = options.limit

  // Firestore REST API silently truncates results when composite index is missing
  // for equality+inequality queries. To be safe, always sort client-side when both
  // where and orderBy are present.
  if (options?.where && options.where.length > 0 && options?.orderBy && options.orderBy.length > 0) {
    // Query without orderBy (avoids composite index requirement)
    const safeQuery = { ...structuredQuery }
    delete safeQuery.orderBy
    const safeRes = await fetch(apiUrl(`/documents:runQuery`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: safeQuery }),
    })
    const safeData = await safeRes.json()
    if (safeData.error) throw new Error(safeData.error.message)

    const docs = (safeData || [])
      .filter((item: any) => item.document)
      .map((item: any) => restDocToObj(item.document)!)
      .filter(Boolean)

    // Sort client-side
    const sortedDocs = sortDocsClientSide(docs, options.orderBy.map(o => ({ [o.field]: o.direction === 'DESCENDING' ? 'desc' : 'asc' })))

    // Apply limit/offset after sorting
    const skipCount = options?.offset || 0
    const limitedDocs = skipCount > 0 ? sortedDocs.slice(skipCount) : sortedDocs
    const finalDocs = options?.limit ? limitedDocs.slice(0, options.limit) : limitedDocs

    return { docs: finalDocs }
  }

  const res = await fetch(apiUrl(`/documents:runQuery`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery }),
  })

  const data = await res.json()
  if (data.error) {
    if (data.error.code === 400 && options?.orderBy) {
      const { docs: fallbackDocs } = await restQuery(collection, {
        where: options.where,
        limit: options.limit,
        offset: options.offset,
      })
      return { docs: sortDocsClientSide(fallbackDocs, options.orderBy.map(o => ({ [o.field]: o.direction === 'DESCENDING' ? 'desc' : 'asc' }))) }
    }
    throw new Error(data.error.message)
  }

  const docs = (data || [])
    .filter((item: any) => item.document)
    .map((item: any) => restDocToObj(item.document)!)
    .filter(Boolean)

  return { docs }
}

async function restQueryCount(collection: string, options?: RestQueryOptions): Promise<number> {
  try {
    // Build where clause for structuredAggregationQuery
    let whereClause: any = {}
    if (options?.where && options.where.length > 0) {
      if (options.where.length === 1) {
        whereClause = {
          fieldFilter: {
            field: { fieldPath: options.where[0].field },
            op: options.where[0].op,
            value: jsToRestValue(options.where[0].value),
          }
        }
      } else {
        whereClause = {
          compositeFilter: {
            op: 'AND',
            filters: options.where.map(w => ({
              fieldFilter: {
                field: { fieldPath: w.field },
                op: w.op,
                value: jsToRestValue(w.value),
              }
            }))
          }
        }
      }
    }

    const parent = `projects/${PROJECT_ID}/databases/(default)/documents/${collection}`
    const body: any = {
      structuredAggregationQuery: {
        ...(Object.keys(whereClause).length > 0 ? { where: whereClause } : {}),
        aggregations: [{ alias: 'count', count: {} }]
      },
      parent,
    }

    const res = await fetch(apiUrl(`/documents:runAggregationQuery`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    return Number(data?.[0]?.result?.aggregateFields?.count?.integerValue || data?.result?.aggregateFields?.count?.integerValue || 0)
  } catch {
    // Fallback: use findMany and count
    try {
      const { docs } = await restQuery(collection, {
        where: options?.where,
        limit: options?.limit,
      })
      return docs.length
    } catch {
      return 0
    }
  }
}

async function restCreate(collection: string, data: Record<string, any>, docId?: string): Promise<Record<string, any>> {
  const fields: Record<string, any> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) fields[k] = jsToRestValue(v)
  }

  let url: string
  if (docId) {
    url = apiUrl(`/documents/${collection}`, { documentId: docId })
  } else {
    url = apiUrl(`/documents/${collection}`)
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  const result = await res.json()
  if (result.error) throw new Error(result.error.message)
  return restDocToObj(result)!
}

async function restUpdate(collection: string, docId: string, data: Record<string, any>): Promise<Record<string, any>> {
  const fields: Record<string, any> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) fields[k] = jsToRestValue(v)
  }

  // REST API update uses PATCH with updateMask (repeated for each field)
  const fieldPaths = Object.keys(fields)
  const url = apiUrl(`/documents/${collection}/${docId}`, { 'updateMask.fieldPaths': fieldPaths })

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  const result = await res.json()
  if (result.error) throw new Error(result.error.message)
  return restDocToObj(result)!
}

async function restDelete(collection: string, docId: string): Promise<Record<string, any>> {
  const res = await fetch(apiUrl(`/documents/${collection}/${docId}`), { method: 'DELETE' })
  if (res.status === 404) throw new Error('Document not found')
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return { id: docId }
}

// ─── Helpers ────────────────────────────────────────────────
function cuid(): string {
  const len = 25
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  const bytes = new Uint8Array(len)
  if (typeof crypto !== 'undefined') crypto.getRandomValues(bytes)
  for (let i = 0; i < len; i++) id += chars[bytes[i] % chars.length]
  return id
}

// ─── Client-side filter/sort fallback ────────────────────
function matchFilter(doc: Record<string, any>, field: string, value: any): boolean {
  const dv = doc[field]
  if (value === null) return dv === null || dv === undefined
  if (typeof value === 'object' && !(value instanceof Date) && value !== null) {
    if ('equals' in value && dv !== value.equals) return false
    if ('contains' in value && typeof dv === 'string' && !dv.includes(value.contains)) return false
    if ('startsWith' in value && typeof dv === 'string' && !dv.startsWith(value.startsWith)) return false
    if ('gt' in value && !(dv > value.gt)) return false
    if ('gte' in value && !(dv >= value.gte)) return false
    if ('lt' in value && !(dv < value.lt)) return false
    if ('lte' in value && !(dv <= value.lte)) return false
    if ('in' in value && Array.isArray(value.in) && !value.in.includes(dv)) return false
    if ('notIn' in value && Array.isArray(value.notIn) && value.notIn.includes(dv)) return false
    return true
  }
  return dv === value
}

function filterDocsClientSide(docs: Record<string, any>[], whereClause: Record<string, any>): Record<string, any>[] {
  let result = [...docs]
  for (const [key, val] of Object.entries(whereClause)) {
    if (key === 'OR' && Array.isArray(val)) {
      const orFiltered = docs.filter(doc =>
        val.some(orClause =>
          Object.entries(orClause).every(([of, ov]) => matchFilter(doc, of, ov))
        )
      )
      result = result.filter(d => orFiltered.some(o => o.id === d.id))
    } else if (key === 'NOT' && typeof val === 'object') {
      for (const [nf, nv] of Object.entries(val as Record<string, any>)) {
        result = result.filter(d => !matchFilter(d, nf, nv))
      }
    } else if (key !== 'AND') {
      result = result.filter(d => matchFilter(d, key, val))
    }
  }
  return result
}

function sortDocsClientSide(docs: Record<string, any>[], orderBy: any): Record<string, any>[] {
  const obs = Array.isArray(orderBy) ? orderBy : [orderBy]
  const sortFields: { field: string; dir: 'asc' | 'desc' }[] = []
  for (const o of obs) {
    if (typeof o === 'string') sortFields.push({ field: o, dir: 'asc' })
    else if (typeof o === 'object' && o !== null) {
      const [f, d] = Object.entries(o)[0]
      sortFields.push({ field: f, dir: d === 'desc' ? 'desc' : 'asc' })
    }
  }
  return [...docs].sort((a, b) => {
    for (const { field, dir } of sortFields) {
      let va = a[field], vb = b[field]
      if (va == null && vb == null) continue
      if (va == null) return dir === 'asc' ? -1 : 1
      if (vb == null) return dir === 'asc' ? 1 : -1
      if (va instanceof Date && vb instanceof Date) {
        const diff = va.getTime() - vb.getTime()
        if (diff !== 0) return dir === 'desc' ? -diff : diff
      }
      if (typeof va === 'string' && typeof vb === 'string') {
        const cmp = va.localeCompare(vb)
        if (cmp !== 0) return dir === 'desc' ? -cmp : cmp
      }
      const diff = (va as number) - (vb as number)
      if (diff !== 0) return dir === 'desc' ? -diff : diff
    }
    return 0
  })
}

// ─── Convert Prisma-style where clause to REST API filters ───
// Note: null equality filters are skipped for REST API because Firestore REST
// doesn't match documents where the field is missing (only where it's explicitly null).
// These are handled via client-side filtering instead.
function whereToRestFilters(whereClause: Record<string, any>): { filters: Array<{ field: string; op: string; value: any }>, hasNullFilter: boolean } {
  const filters: Array<{ field: string; op: string; value: any }> = []
  let hasNullFilter = false

  for (const [key, val] of Object.entries(whereClause)) {
    if (key === 'OR' || key === 'AND' || key === 'NOT') continue
    if (val === null) {
      // Skip null filters for REST API — handled client-side
      hasNullFilter = true
      continue
    } else if (Array.isArray(val)) {
      if (val.length > 0) filters.push({ field: key, op: 'IN', value: val })
    } else if (typeof val === 'object' && !(val instanceof Date)) {
      if ('equals' in val) filters.push({ field: key, op: 'EQUAL', value: val.equals })
      if ('gt' in val) filters.push({ field: key, op: 'GREATER_THAN', value: val.gt })
      if ('gte' in val) filters.push({ field: key, op: 'GREATER_THAN_OR_EQUAL', value: val.gte })
      if ('lt' in val) filters.push({ field: key, op: 'LESS_THAN', value: val.lt })
      if ('lte' in val) filters.push({ field: key, op: 'LESS_THAN_OR_EQUAL', value: val.lte })
      if ('in' in val && Array.isArray(val.in)) filters.push({ field: key, op: 'IN', value: val.in })
      if ('notIn' in val && Array.isArray(val.notIn)) filters.push({ field: key, op: 'NOT_IN', value: val.notIn })
    } else {
      filters.push({ field: key, op: 'EQUAL', value: val })
    }
  }

  return { filters, hasNullFilter }
}

function orderByToRest(orderByOpt: any): Array<{ field: string; direction: string }> {
  if (!orderByOpt) return []
  const obs = Array.isArray(orderByOpt) ? orderByOpt : [orderByOpt]
  return obs.map(o => {
    if (typeof o === 'string') return { field: o, direction: 'ASCENDING' }
    if (typeof o === 'object' && o !== null) {
      const [f, d] = Object.entries(o)[0]
      return { field: f, direction: d === 'desc' ? 'DESCENDING' : 'ASCENDING' }
    }
    return { field: String(o), direction: 'ASCENDING' }
  })
}

// ─── Include resolver ──────────────────────────────────────
async function resolveIncludes(
  docs: Record<string, any>[],
  include: Record<string, any>,
  collectionName: string
): Promise<void> {
  if (!include || docs.length === 0) return

  for (const [relKey, relOpt] of Object.entries(include)) {
    if (relKey === '_count') {
      await resolveCounts(docs, relOpt as Record<string, any>, collectionName)
      continue
    }

    // Special: images for properties → propertyImages collection
    if ((relKey === 'images' || relKey === 'propertyImages') && collectionName === 'properties') {
      const ids = [...new Set(docs.map(d => d.id).filter(Boolean))]
      if (ids.length === 0) continue
      let allImages: Record<string, any>[] = []
      for (let i = 0; i < ids.length; i += 30) {
        const batch = ids.slice(i, i + 30)
        const { docs: batchDocs } = await restQuery('propertyImages', {
          where: [{ field: 'propertyId', op: 'IN', value: batch }]
        })
        allImages.push(...batchDocs)
      }
      allImages.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      const imgMap = new Map<string, Record<string, any>[]>()
      for (const img of allImages) {
        if (!imgMap.has(img.propertyId)) imgMap.set(img.propertyId, [])
        imgMap.get(img.propertyId)!.push(img)
      }
      const imgTake = typeof relOpt === 'object' && 'take' in relOpt ? (relOpt as any).take : undefined
      for (const doc of docs) {
        let imgs = imgMap.get(doc.id) || []
        if (imgTake) imgs = imgs.slice(0, imgTake)
        doc.images = imgs
      }
      continue
    }

    // Special: agentProfile for users
    if (relKey === 'agentProfile' && collectionName === 'users') {
      const ids = [...new Set(docs.map(d => d.id).filter(Boolean))]
      if (ids.length === 0) continue
      let allAP: Record<string, any>[] = []
      for (let i = 0; i < ids.length; i += 30) {
        const batch = ids.slice(i, i + 30)
        const { docs: batchDocs } = await restQuery('agentProfiles', {
          where: [{ field: 'userId', op: 'IN', value: batch }]
        })
        allAP.push(...batchDocs)
      }
      const apMap = new Map(allAP.map(d => [d.userId, d]))
      for (const doc of docs) doc.agentProfile = apMap.get(doc.id) || null
      continue
    }

    // Special: followUps for leads
    if (relKey === 'followUps' && collectionName === 'leads') {
      const ids = [...new Set(docs.map(d => d.id).filter(Boolean))]
      if (ids.length === 0) continue
      let allFU: Record<string, any>[] = []
      for (let i = 0; i < ids.length; i += 30) {
        const batch = ids.slice(i, i + 30)
        const { docs: batchDocs } = await restQuery('leadFollowUps', {
          where: [{ field: 'leadId', op: 'IN', value: batch }]
        })
        allFU.push(...batchDocs)
      }
      allFU.sort((a, b) => {
        const da = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
        const db2 = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
        return db2 - da
      })
      const fuMap = new Map<string, Record<string, any>[]>()
      for (const fu of allFU) {
        if (!fuMap.has(fu.leadId)) fuMap.set(fu.leadId, [])
        fuMap.get(fu.leadId)!.push(fu)
      }
      for (const doc of docs) doc.followUps = fuMap.get(doc.id) || []
      continue
    }

    // Standard FK relation
    const fkField = relKey + 'Id'
    const ids = [...new Set(docs.map(d => d[fkField]).filter(Boolean))]
    if (ids.length === 0) {
      for (const doc of docs) doc[relKey] = null
      continue
    }

    const relCollection = relationToCollection(relKey)
    if (!relCollection) continue

    // Fetch related docs by their IDs (REST API can't query by __name__ easily)
    let relDocs: Record<string, any>[] = []
    for (const id of ids) {
      try {
        const doc = await restGet(relCollection, id)
        if (doc) relDocs.push(doc)
      } catch { /* skip missing docs */ }
    }
    const lookup = new Map(relDocs.map(d => [d.id, d]))
    for (const doc of docs) {
      const relId = doc[fkField]
      doc[relKey] = (relId && lookup.has(relId)) ? lookup.get(relId) : null
    }
  }
}

async function resolveCounts(
  docs: Record<string, any>[],
  countSpec: Record<string, any>,
  parentCollection: string
): Promise<void> {
  if (!countSpec || docs.length === 0) return

  // Handle Prisma's { select: { field: true } } format
  let countFields = countSpec
  if (countSpec.select && typeof countSpec.select === 'object') {
    countFields = countSpec.select
  }

  for (const doc of docs) {
    if (!doc._count) doc._count = {}
    for (const [countKey] of Object.entries(countFields)) {
      const countCollection = relationToCollection(countKey)
      if (!countCollection) { doc._count[countKey] = 0; continue }

      let fkField = countKey + 'Id'
      if (countKey === 'properties' && parentCollection === 'propertyTypes') fkField = 'propertyTypeId'
      if (countKey === 'properties' && parentCollection === 'cities') fkField = 'cityId'
      if (countKey === 'properties' && parentCollection === 'districts') fkField = 'districtId'
      if (countKey === 'properties' && parentCollection === 'provinces') fkField = 'provinceId'
      if (countKey === 'cities' && parentCollection === 'provinces') fkField = 'provinceId'
      if (countKey === 'districts' && parentCollection === 'cities') fkField = 'cityId'
      if (countKey === 'villages' && parentCollection === 'districts') fkField = 'districtId'
      if (countKey === 'articles' && parentCollection === 'articleCategories') fkField = 'categoryId'
      if (countKey === 'leads' && parentCollection === 'properties') fkField = 'propertyId'
      if (countKey === 'leads' && parentCollection === 'users') fkField = 'agentId'

      try {
        const cnt = await restQueryCount(countCollection, {
          where: [{ field: fkField, op: 'EQUAL', value: doc.id }]
        })
        doc._count[countKey] = cnt
      } catch { doc._count[countKey] = 0 }
    }
  }
}

function relationToCollection(relation: string): string | null {
  const map: Record<string, string> = {
    propertyType: 'propertyTypes', province: 'provinces', city: 'cities',
    district: 'districts', village: 'villages', agent: 'users', user: 'users',
    author: 'users', category: 'articleCategories', images: 'propertyImages',
    propertyImages: 'propertyImages', leads: 'leads', articles: 'articles',
    properties: 'properties', agentProfile: 'agentProfiles',
    followUps: 'leadFollowUps',
  }
  return map[relation] ?? null
}

// ─── Model factory ─────────────────────────────────────────
const COLLECTION_NAMES: Record<string, string> = {
  user: 'users', propertyType: 'propertyTypes', province: 'provinces',
  city: 'cities', district: 'districts', village: 'villages',
  property: 'properties', propertyImage: 'propertyImages', lead: 'leads',
  article: 'articles', articleCategory: 'articleCategories',
  agentProfile: 'agentProfiles', websiteSetting: 'websiteSettings',
  media: 'media', activityLog: 'activityLogs', leadFollowUp: 'leadFollowUps',
}

const UNIQUE_FIELDS: Record<string, string[]> = {
  user: ['id', 'email'], propertyType: ['id', 'slug'],
  province: ['id', 'slug', 'name'], city: ['id', 'slug'],
  district: ['id', 'slug'], village: ['id', 'slug'],
  property: ['id', 'slug', 'code'], propertyImage: ['id'],
  lead: ['id'], article: ['id', 'slug'],
  articleCategory: ['id', 'slug', 'name'], agentProfile: ['id', 'userId'],
  websiteSetting: ['id', 'key'], media: ['id'], activityLog: ['id'],
  leadFollowUp: ['id'],
}

function createModelAccessors(modelName: string) {
  const collName = COLLECTION_NAMES[modelName] || modelName + 's'
  const uniqueFields = UNIQUE_FIELDS[modelName] || ['id']

  function getUniqueField(w: Record<string, any>): { field: string; value: string } | null {
    for (const f of uniqueFields) if (w[f] !== undefined) return { field: f, value: w[f] }
    if (w.id) return { field: 'id', value: w.id }
    return null
  }

  return {
    async findMany(options: { where?: Record<string, any>; orderBy?: any; skip?: number; take?: number; include?: Record<string, any> } = {}): Promise<any[]> {
      try {
        const { where = {}, orderBy: orderByOpt, skip, take } = options

        // Check if we have OR/NOT filters — these aren't supported by REST API directly
        const hasOrNot = Object.keys(where).some(k => k === 'OR' || k === 'NOT')
        const hasContains = Object.values(where).some(v =>
          v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && ('contains' in v || 'startsWith' in v)
        )

        // Build REST API filters (exclude OR/NOT/contains/null — handle client-side)
        const { filters: restFilters, hasNullFilter } = whereToRestFilters(where)
        const restOrderBy = orderByToRest(orderByOpt)

        // For contains/startsWith, we get all and filter client-side
        if (hasContains) {
          restFilters.length = 0
          restOrderBy.length = 0
        }

        const { docs } = await restQuery(collName, {
          where: restFilters.length > 0 ? restFilters : undefined,
          orderBy: restOrderBy.length > 0 ? restOrderBy : undefined,
          limit: take,
          offset: skip,
        })

        let result = docs
        if (hasOrNot || hasContains || hasNullFilter) {
          result = filterDocsClientSide(result, where)
        }
        if (hasContains && orderByOpt) {
          result = sortDocsClientSide(result, orderByOpt)
        }

        if (options.include) await resolveIncludes(result, options.include, collName)
        return result
      } catch (error: any) {
        firelog(`findMany ${collName}`, error)
        return []
      }
    },

    async findUnique(options: { where: Record<string, any>; include?: Record<string, any> }): Promise<any | null> {
      const unique = getUniqueField(options.where)
      if (!unique) return null
      const { field, value } = unique
      try {
        let doc: Record<string, any> | null = null
        if (field === 'id') {
          doc = await restGet(collName, value)
        } else {
          const { docs } = await restQuery(collName, {
            where: [{ field, op: 'EQUAL', value }],
            limit: 1,
          })
          doc = docs[0] || null
        }
        if (!doc) return null
        if (options.include) await resolveIncludes([doc], options.include, collName)
        return doc
      } catch (e: any) { firelog(`findUnique ${collName}`, e); return null }
    },

    async findFirst(options: { where?: Record<string, any>; orderBy?: any; include?: Record<string, any> } = {}): Promise<any | null> {
      try {
        const { filters: restFilters, hasNullFilter } = whereToRestFilters(options.where || {})
        const restOrderBy = orderByToRest(options.orderBy)
        const { docs } = await restQuery(collName, {
          where: restFilters.length > 0 ? restFilters : undefined,
          orderBy: restOrderBy.length > 0 ? restOrderBy : undefined,
          limit: 1,
        })
        let result = docs
        if (hasNullFilter && result.length > 0) {
          result = filterDocsClientSide(result, options.where || {})
        }
        if (result.length === 0) return null
        const d = result[0]
        if (options.include) await resolveIncludes([d], options.include, collName)
        return d
      } catch (e: any) { firelog(`findFirst ${collName}`, e); return null }
    },

    async create(options: { data: Record<string, any>; include?: Record<string, any> }): Promise<any> {
      const id = cuid()
      const now = new Date()
      const data = { ...options.data, createdAt: options.data.createdAt || now, updatedAt: options.data.updatedAt || now }

      // Separate nested create data
      const nestedKeys: string[] = []
      const mainData: Record<string, any> = {}
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'object' && v !== null && 'create' in v) nestedKeys.push(k)
        else mainData[k] = v
      }

      await restCreate(collName, mainData, id)

      // Handle nested creates
      for (const nk of nestedKeys) {
        const nestedData = (data as any)[nk].create as Record<string, any>[]
        if (Array.isArray(nestedData)) {
          const nestedColl = relationToCollection(nk) || nk + 's'
          for (const item of nestedData) {
            const nId = cuid()
            await restCreate(nestedColl, { ...item, [modelName + 'Id']: id, createdAt: new Date() }, nId)
          }
        }
      }

      const result = (await restGet(collName, id))!
      if (options.include) await resolveIncludes([result], options.include, collName)
      return result
    },

    async update(options: { where: Record<string, any>; data: Record<string, any>; include?: Record<string, any> }): Promise<any> {
      const unique = getUniqueField(options.where)
      if (!unique) throw new Error(`update: no unique field for ${collName}`)
      const { field, value } = unique

      let docId: string
      if (field === 'id') {
        docId = value
      } else {
        const { docs } = await restQuery(collName, {
          where: [{ field, op: 'EQUAL', value }],
          limit: 1,
        })
        if (docs.length === 0) throw new Error('Record not found')
        docId = docs[0].id
      }

      const ud: Record<string, any> = { updatedAt: new Date() }
      for (const [k, v] of Object.entries(options.data)) {
        if (v === undefined) continue
        if (typeof v === 'object' && v !== null && ('increment' in v || 'decrement' in v)) {
          // For increment/decrement, we need to read current value first
          const current = await restGet(collName, docId)
          const curVal = Number(current?.[k] || 0)
          ud[k] = curVal + (Number(v.increment || 0)) - (Number(v.decrement || 0))
        } else if (typeof v === 'object' && v !== null && 'set' in v) {
          ud[k] = v.set
        } else {
          ud[k] = v
        }
      }

      await restUpdate(collName, docId, ud)
      const result = (await restGet(collName, docId))!
      if (options.include) await resolveIncludes([result], options.include, collName)
      return result
    },

    async delete(options: { where: Record<string, any> }): Promise<any> {
      const unique = getUniqueField(options.where)
      if (!unique) throw new Error(`delete: no unique field for ${collName}`)
      const { field, value } = unique

      let docId: string
      if (field === 'id') {
        docId = value
      } else {
        const { docs } = await restQuery(collName, {
          where: [{ field, op: 'EQUAL', value }],
          limit: 1,
        })
        if (docs.length === 0) throw new Error('Record not found')
        docId = docs[0].id
      }

      const before = await restGet(collName, docId)
      await restDelete(collName, docId)
      return before
    },

    async deleteMany(options?: { where?: Record<string, any> }): Promise<{ count: number }> {
      try {
        const { filters: restFilters, hasNullFilter } = whereToRestFilters(options?.where || {})
        let { docs } = await restQuery(collName, {
          where: restFilters.length > 0 ? restFilters : undefined,
        })
        if (hasNullFilter) docs = filterDocsClientSide(docs, options?.where || {})
        if (docs.length === 0) return { count: 0 }
        for (const doc of docs) {
          await restDelete(collName, doc.id)
        }
        return { count: docs.length }
      } catch (e: any) {
        firelog(`deleteMany ${collName}`, e)
        return { count: 0 }
      }
    },

    async count(options: { where?: Record<string, any> } = {}): Promise<number> {
      try {
        const { filters: restFilters } = whereToRestFilters(options.where || {})
        return await restQueryCount(collName, {
          where: restFilters.length > 0 ? restFilters : undefined,
        })
      } catch (error: any) {
        firelog(`count ${collName}`, error)
        return 0
      }
    },

    async upsert(options: { where: Record<string, any>; update: Record<string, any>; create: Record<string, any> }): Promise<any> {
      const existing = await this.findFirst({ where: options.where })
      if (existing) return this.update({ where: { id: existing.id }, data: options.update })
      return this.create({ data: options.create })
    },

    async groupBy(options: { by: string[]; where?: Record<string, any>; _count?: Record<string, any> }): Promise<any[]> {
      try {
        const { filters: restFilters } = whereToRestFilters(options.where || {})
        let { docs } = await restQuery(collName, {
          where: restFilters.length > 0 ? restFilters : undefined,
        })
        const groups = new Map<string, any>()
        for (const d of docs) {
          const gk = options.by.map(b => String(d[b] ?? 'null')).join('|')
          if (!groups.has(gk)) groups.set(gk, { ...Object.fromEntries(options.by.map(b => [b, d[b] ?? null])), _count: {} })
          const g = groups.get(gk)!
          for (const ck of Object.keys(options._count || {})) g._count[ck] = (g._count[ck] || 0) + 1
        }
        return Array.from(groups.values())
      } catch (e: any) {
        firelog(`groupBy ${collName}`, e)
        return []
      }
    },

    async findFirstOrThrow(options: any): Promise<any> {
      const r = await this.findFirst(options)
      if (!r) throw new Error(`Record not found in ${collName}`)
      return r
    },
  }
}

// ─── Build the db object ───────────────────────────────────
function createDb() {
  const models = Object.keys(COLLECTION_NAMES)
  const dbObj: Record<string, ReturnType<typeof createModelAccessors>> = {} as any
  for (const model of models) dbObj[model] = createModelAccessors(model)

  const handler: ProxyHandler<typeof dbObj> = {
    get(target, prop) {
      if (prop in target) return (target as any)[prop]
      const s = String(prop)
      const m: Record<string, string> = {
        website_setting:'websiteSetting',property_type:'propertyType',property_image:'propertyImage',
        agent_profile:'agentProfile',article_category:'articleCategory',activity_log:'activityLog',
        lead_follow_up:'leadFollowUp',
        websiteSettings:'websiteSetting',propertyTypes:'propertyType',propertyImages:'propertyImage',
        agentProfiles:'agentProfile',articleCategories:'articleCategory',activityLogs:'activityLog',
        leadFollowUps:'leadFollowUp',
        PropertyType:'propertyType',Province:'province',City:'city',District:'district',
        Village:'village',User:'user',AgentProfile:'agentProfile',Property:'property',
        PropertyImage:'propertyImage',Lead:'lead',Article:'article',
        ArticleCategory:'articleCategory',WebsiteSetting:'websiteSetting',Media:'media',
        ActivityLog:'activityLog',LeadFollowUp:'leadFollowUp',
      }
      if (m[s]) return target[m[s]]
      if (models.includes(s)) return target[s]
      return undefined
    }
  }
  return new Proxy(dbObj, handler)
}

export const db = createDb()

export const Prisma = {
  PrismaClientKnownRequestError: class extends Error {
    code: string; meta?: any
    constructor(message: string, options?: { code: string; meta?: any }) {
      super(message); this.code = options?.code || 'UNKNOWN'; this.meta = options?.meta; this.name = 'PrismaClientKnownRequestError'
    }
  },
}
