// ─── Firestore REST API Client (Optimized) ────────────────────────────────
// Uses the Firebase REST API with API key — no service account needed.
// Optimizations: in-memory cache, batch FK lookups, parallel queries,
//                eliminated double reads, batch count queries.

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

// ─── In-Memory Cache ──────────────────────────────────────────
const DEFAULT_TTL = 30_000 // 30 seconds
const LONG_TTL = 300_000   // 5 minutes (static data: types, locations, settings)

interface CacheEntry<T> {
  data: T
  expiry: number
}

const cache = new Map<string, CacheEntry<any>>()

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function cacheSet<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  // Prevent cache from growing too large
  if (cache.size > 500) {
    const now = Date.now()
    for (const [k, v] of cache) {
      if (now > v.expiry) cache.delete(k)
    }
    if (cache.size > 500) {
      // Evict oldest entries
      const entries = Array.from(cache.entries()).sort((a, b) => a[1].expiry - b[1].expiry)
      for (let i = 0; i < 100; i++) cache.delete(entries[i][0])
    }
  }
  cache.set(key, { data, expiry: Date.now() + ttl })
}

// Cache invalidation for mutations
function invalidateCollection(collection: string, docId?: string): void {
  // Invalidate all cache entries for this collection
  for (const key of cache.keys()) {
    if (key.startsWith(`query:${collection}`) || key.startsWith(`doc:${collection}`) || key.startsWith(`count:${collection}`)) {
      cache.delete(key)
    }
  }
  // Also invalidate related caches
  if (collection === 'properties') {
    for (const key of cache.keys()) {
      if (key.startsWith('query:propertyImages') || key.startsWith('query:leads') || key.startsWith('count:properties') || key.startsWith('count:leads')) {
        cache.delete(key)
      }
    }
  }
}

// Static collections that rarely change → longer TTL
const STATIC_COLLECTIONS = new Set(['propertyTypes', 'provinces', 'cities', 'districts', 'villages', 'websiteSettings', 'articleCategories'])

// ─── Value conversion helpers ─────────────────────────────────
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

// ─── REST API methods (with caching) ────────────────────────────

function firelog(label: string, err: any) {
  const msg = err?.message || err?.toString?.() || String(err)
  console.error(`[Firestore:${label}] ${msg}`)
}

async function restGet(collection: string, docId: string, skipCache = false): Promise<Record<string, any> | null> {
  const cacheKey = `doc:${collection}:${docId}`
  if (!skipCache) {
    const cached = cacheGet(cacheKey)
    if (cached !== null) return cached
  }

  const res = await fetch(apiUrl(`/documents/${collection}/${docId}`))
  if (res.status === 404) return null
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const result = restDocToObj(data)
  if (result) {
    const ttl = STATIC_COLLECTIONS.has(collection) ? LONG_TTL : DEFAULT_TTL
    cacheSet(cacheKey, result, ttl)
  }
  return result
}

// Batch get multiple documents by ID — replaces N+1 individual restGet calls
async function restBatchGet(collection: string, docIds: string[]): Promise<Record<string, any>[]> {
  if (docIds.length === 0) return []
  const uniqueIds = [...new Set(docIds)]

  // Try cache first for all
  const results: Record<string, any>[] = []
  const missingIds: string[] = []

  for (const id of uniqueIds) {
    const cached = cacheGet<Record<string, any>>(`doc:${collection}:${id}`)
    if (cached) {
      results.push(cached)
    } else {
      missingIds.push(id)
    }
  }

  if (missingIds.length === 0) return results

  // Batch fetch missing docs in parallel
  const fetchPromises = missingIds.map(async (id) => {
    try {
      const doc = await restGet(collection, id, true) // skip individual cache check
      if (doc) {
        const ttl = STATIC_COLLECTIONS.has(collection) ? LONG_TTL : DEFAULT_TTL
        cacheSet(`doc:${collection}:${id}`, doc, ttl)
        return doc
      }
    } catch { /* skip missing */ }
    return null
  })

  const fetched = await Promise.all(fetchPromises)
  for (const doc of fetched) {
    if (doc) results.push(doc)
  }

  return results
}

interface RestQueryOptions {
  where?: Array<{ field: string; op: string; value: any }>
  orderBy?: Array<{ field: string; direction: string }>
  limit?: number
  offset?: number
  select?: string[]
}

function queryCacheKey(collection: string, options?: RestQueryOptions): string {
  return `query:${collection}:${JSON.stringify(options?.where || [])}:${JSON.stringify(options?.orderBy || [])}:${options?.limit || 0}:${options?.offset || 0}`
}

async function restQuery(collection: string, options?: RestQueryOptions): Promise<{ docs: Record<string, any>[], totalCount?: number }> {
  // Don't cache queries with contains/startsWith since they can be large and variable
  const hasClientSideFilter = options?.where?.some(w => w.op === 'EQUAL' && (typeof w.value === 'string' ? false : false))

  const structuredQuery: any = { from: [{ collectionId: collection }] }

  if (options?.where && options.where.length > 0) {
    if (options?.where.length === 1) {
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
  // for equality+inequality queries. Query without orderBy and sort client-side.
  if (options?.where && options.where.length > 0 && options?.orderBy && options.orderBy.length > 0) {
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

    const sortedDocs = sortDocsClientSide(docs, options.orderBy.map(o => ({ [o.field]: o.direction === 'DESCENDING' ? 'desc' : 'asc' })))
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
  // Use runQuery instead of runAggregationQuery (aggregation returns wrong counts in REST API)
  // For large collections, this fetches doc IDs only with field mask to minimize data transfer
  try {
    const structuredQuery: any = {
      from: [{ collectionId: collection }],
      // Select only the document name (no fields) for efficiency
      select: { fields: [{ fieldPath: 'name' }] },
      limit: 5000, // Reasonable upper limit for count queries
    }

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

    // If there are client-side filters (contains, startsWith), we can't apply them server-side
    const hasClientSideFilter = options?.where?.some(w => {
      return w.op === 'EQUAL' && (typeof w.value === 'string' ? false : false)
    })

    let allDocs: any[] = []
    let pageToken: string | null = null

    do {
      const body: any = { structuredQuery }
      if (pageToken) body.pageToken = pageToken

      const res = await fetch(apiUrl('/documents:runQuery'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)

      const docs = (data || []).filter((item: any) => item.document).map((item: any) => item.document)
      allDocs.push(...docs)

      pageToken = null
      // Check if there are more results
      for (const item of (data || [])) {
        if (!item.document && item.done === false) {
          // This shouldn't happen with our approach, but just in case
        }
      }
    } while (pageToken)

    return allDocs.length
  } catch (error: any) {
    firelog(`restQueryCount ${collection}`, error)
    return 0
  }
}

// Batch count — counts related documents for multiple parent IDs in parallel
async function restBatchCount(
  collection: string,
  fkField: string,
  parentIds: string[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  if (parentIds.length === 0) return result

  const uniqueIds = [...new Set(parentIds)]

  // Count in parallel for each parent ID (max 10 concurrent to avoid rate limits)
  const BATCH_SIZE = 10
  for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + BATCH_SIZE)
    const promises = batch.map(async (parentId) => {
      try {
        const cnt = await restQueryCount(collection, {
          where: [{ field: fkField, op: 'EQUAL', value: parentId }]
        })
        return { id: parentId, count: cnt }
      } catch {
        return { id: parentId, count: 0 }
      }
    })
    const results = await Promise.all(promises)
    for (const r of results) result.set(r.id, r.count)
  }

  return result
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

  // Build object from response + original data (avoid extra round-trip)
  const obj = restDocToObj(result) || { id: docId || result.name?.split('/').pop() }
  // Merge original data values that might not be in the response
  for (const [k, v] of Object.entries(data)) {
    if (!(k in obj) || obj[k] === undefined) obj[k] = v
  }

  invalidateCollection(collection)
  return obj
}

async function restUpdate(collection: string, docId: string, data: Record<string, any>): Promise<Record<string, any>> {
  const fields: Record<string, any> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) fields[k] = jsToRestValue(v)
  }

  const fieldPaths = Object.keys(fields)
  const url = apiUrl(`/documents/${collection}/${docId}`, { 'updateMask.fieldPaths': fieldPaths })

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  const result = await res.json()
  if (result.error) throw new Error(result.error.message)

  // Build object from response + original data (avoid extra round-trip)
  const existingCache = cacheGet<Record<string, any>>(`doc:${collection}:${docId}`)
  const obj: Record<string, any> = restDocToObj(result) || { id: docId }
  // Merge existing cached data for fields not in the update
  if (existingCache) {
    for (const [k, v] of Object.entries(existingCache)) {
      if (!(k in obj)) obj[k] = v
    }
  }

  invalidateCollection(collection)
  // Update cache with merged object
  cacheSet(`doc:${collection}:${docId}`, obj, DEFAULT_TTL)
  return obj
}

async function restDelete(collection: string, docId: string): Promise<Record<string, any>> {
  const res = await fetch(apiUrl(`/documents/${collection}/${docId}`), { method: 'DELETE' })
  if (res.status === 404) throw new Error('Document not found')
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  invalidateCollection(collection)
  cache.delete(`doc:${collection}:${docId}`)
  return { id: docId }
}

// ─── Helpers ────────────────────────────────────────
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
function whereToRestFilters(whereClause: Record<string, any>): { filters: Array<{ field: string; op: string; value: any }>, hasNullFilter: boolean } {
  const filters: Array<{ field: string; op: string; value: any }> = []
  let hasNullFilter = false

  for (const [key, val] of Object.entries(whereClause)) {
    if (key === 'OR' || key === 'AND' || key === 'NOT') continue
    if (val === null) {
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

// ─── Include resolver (OPTIMIZED: batch FK lookups) ──────────
async function resolveIncludes(
  docs: Record<string, any>[],
  include: Record<string, any>,
  collectionName: string
): Promise<void> {
  if (!include || docs.length === 0) return

  // Resolve all relations in parallel using Promise.all
  const promises: Promise<void>[] = []

  for (const [relKey, relOpt] of Object.entries(include)) {
    if (relKey === '_count') {
      promises.push(resolveCounts(docs, relOpt as Record<string, any>, collectionName))
      continue
    }

    // Special: images for properties → propertyImages collection
    if ((relKey === 'images' || relKey === 'propertyImages') && collectionName === 'properties') {
      promises.push((async () => {
        const ids = [...new Set(docs.map(d => d.id).filter(Boolean))]
        if (ids.length === 0) return
        let allImages: Record<string, any>[] = []
        // Batch queries in parallel (30 IDs per batch)
        const batches = Math.ceil(ids.length / 30)
        const batchPromises = Array.from({ length: batches }, (_, i) => {
          const batch = ids.slice(i * 30, (i + 1) * 30)
          return restQuery('propertyImages', {
            where: [{ field: 'propertyId', op: 'IN', value: batch }]
          }).then(r => r.docs)
        })
        const batchResults = await Promise.all(batchPromises)
        allImages = batchResults.flat()
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
      })())
      continue
    }

    // Special: agentProfile for users
    if (relKey === 'agentProfile' && collectionName === 'users') {
      promises.push((async () => {
        const ids = [...new Set(docs.map(d => d.id).filter(Boolean))]
        if (ids.length === 0) return
        let allAP: Record<string, any>[] = []
        const batches = Math.ceil(ids.length / 30)
        const batchPromises = Array.from({ length: batches }, (_, i) => {
          const batch = ids.slice(i * 30, (i + 1) * 30)
          return restQuery('agentProfiles', {
            where: [{ field: 'userId', op: 'IN', value: batch }]
          }).then(r => r.docs)
        })
        const batchResults = await Promise.all(batchPromises)
        allAP = batchResults.flat()
        const apMap = new Map(allAP.map(d => [d.userId, d]))
        for (const doc of docs) doc.agentProfile = apMap.get(doc.id) || null
      })())
      continue
    }

    // Special: followUps for leads
    if (relKey === 'followUps' && collectionName === 'leads') {
      promises.push((async () => {
        const ids = [...new Set(docs.map(d => d.id).filter(Boolean))]
        if (ids.length === 0) return
        let allFU: Record<string, any>[] = []
        const batches = Math.ceil(ids.length / 30)
        const batchPromises = Array.from({ length: batches }, (_, i) => {
          const batch = ids.slice(i * 30, (i + 1) * 30)
          return restQuery('leadFollowUps', {
            where: [{ field: 'leadId', op: 'IN', value: batch }]
          }).then(r => r.docs)
        })
        const batchResults = await Promise.all(batchPromises)
        allFU = batchResults.flat()
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
      })())
      continue
    }

    // Standard FK relation — BATCH lookup instead of N+1
    promises.push((async () => {
      const fkField = relKey + 'Id'
      const ids = [...new Set(docs.map(d => d[fkField]).filter(Boolean))]
      if (ids.length === 0) {
        for (const doc of docs) doc[relKey] = null
        return
      }

      const relCollection = relationToCollection(relKey)
      if (!relCollection) return

      // Use batch get instead of N+1 individual restGet calls
      const relDocs = await restBatchGet(relCollection, ids)
      const lookup = new Map(relDocs.map(d => [d.id, d]))
      for (const doc of docs) {
        const relId = doc[fkField]
        doc[relKey] = (relId && lookup.has(relId)) ? lookup.get(relId) : null
      }
    })())
  }

  await Promise.all(promises)
}

// ─── Count resolver (OPTIMIZED: batch counts) ──────────────
async function resolveCounts(
  docs: Record<string, any>[],
  countSpec: Record<string, any>,
  parentCollection: string
): Promise<void> {
  if (!countSpec || docs.length === 0) return

  let countFields = countSpec
  if (countSpec.select && typeof countSpec.select === 'object') {
    countFields = countSpec.select
  }

  // Process all count keys in parallel, batching by count collection
  const countGroups = new Map<string, { docs: Record<string, any>[], fkField: string }>()

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

      if (!countGroups.has(countKey)) {
        countGroups.set(countKey, { docs: [], fkField, countCollection: countCollection || countKey })
      }
      countGroups.get(countKey)!.docs.push(doc)
    }
  }

  // Run all count groups in parallel
  const countPromises = Array.from(countGroups.entries()).map(async ([countKey, { docs: docsToCount, fkField }]) => {
    const countCollection = relationToCollection(countKey)
    if (!countCollection) return

    const parentIds = docsToCount.map(d => d.id)
    const countMap = await restBatchCount(countCollection, fkField, parentIds)
    for (const doc of docsToCount) {
      doc._count[countKey] = countMap.get(doc.id) || 0
    }
  })

  await Promise.all(countPromises)
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

        const hasOrNot = Object.keys(where).some(k => k === 'OR' || k === 'NOT')
        const hasContains = Object.values(where).some(v =>
          v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && ('contains' in v || 'startsWith' in v)
        )

        const { filters: restFilters, hasNullFilter } = whereToRestFilters(where)
        const restOrderBy = orderByToRest(orderByOpt)

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

      // Create main doc + nested docs in parallel
      const nestedPromises = []
      for (const nk of nestedKeys) {
        const nestedData = (data as any)[nk].create as Record<string, any>[]
        if (Array.isArray(nestedData)) {
          const nestedColl = relationToCollection(nk) || nk + 's'
          nestedPromises.push(
            Promise.all(nestedData.map(item => {
              const nId = cuid()
              return restCreate(nestedColl, { ...item, [modelName + 'Id']: id, createdAt: new Date() }, nId)
            }))
          )
        }
      }

      const [mainResult] = await Promise.all([
        restCreate(collName, { ...mainData, id }, id),
        ...nestedPromises
      ])

      // Build result from created data (no extra round-trip)
      const result: Record<string, any> = { id, ...mainData }
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
          const current = await restGet(collName, docId)
          const curVal = Number(current?.[k] || 0)
          ud[k] = curVal + (Number(v.increment || 0)) - (Number(v.decrement || 0))
        } else if (typeof v === 'object' && v !== null && 'set' in v) {
          ud[k] = v.set
        } else {
          ud[k] = v
        }
      }

      const result = await restUpdate(collName, docId, ud)
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

      const before = await restGet(collName, docId) // Use cached value if available
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
        // Delete in parallel (max 10 concurrent)
        const BATCH_SIZE = 10
        let count = 0
        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
          const batch = docs.slice(i, i + BATCH_SIZE)
          await Promise.all(batch.map(doc => restDelete(collName, doc.id).catch(() => {})))
          count += batch.length
        }
        return { count }
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
