import {
  Timestamp,
  FieldValue,
  FieldPath,
  Filter,
  Query,
  DocumentSnapshot,
  CollectionReference,
  DocumentReference,
} from 'firebase-admin/firestore'
import { getAdminDb } from './firebase-admin'

type AdminFirestore = ReturnType<typeof getAdminDb>
type DocData = { [key: string]: any }

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

function toDate(v: any): any {
  if (!v) return v
  if (v instanceof Date) return v
  if (v instanceof Timestamp) return v.toDate()
  if (v && typeof v === 'object' && '_seconds' in v) {
    return new Date(v._seconds * 1000 + (v._nanoseconds || 0) / 1e6)
  }
  return v
}

function toFirestoreData(data: Record<string, any>): DocData {
  const out: DocData = {}
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue
    out[k] = v
  }
  return out
}

function fromFirestoreDoc(snap: DocumentSnapshot): Record<string, any> | null {
  if (!snap.exists) return null
  const data = snap.data()!
  const obj: Record<string, any> = { id: snap.id }
  for (const [k, v] of Object.entries(data)) {
    obj[k] = toDate(v)
  }
  return obj
}

function getDb(): AdminFirestore {
  return getAdminDb()
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
      // Handle null/undefined
      if (va == null && vb == null) continue
      if (va == null) return dir === 'asc' ? -1 : 1
      if (vb == null) return dir === 'asc' ? 1 : -1
      // Handle dates
      if (va instanceof Date && vb instanceof Date) {
        const diff = va.getTime() - vb.getTime()
        if (diff !== 0) return dir === 'desc' ? -diff : diff
      }
      // Handle strings
      if (typeof va === 'string' && typeof vb === 'string') {
        const cmp = va.localeCompare(vb)
        if (cmp !== 0) return dir === 'desc' ? -cmp : cmp
      }
      // Handle numbers
      const diff = (va as number) - (vb as number)
      if (diff !== 0) return dir === 'desc' ? -diff : diff
    }
    return 0
  })
}

// ─── Query builder using chained .where() ──────────────────
function buildQuery(
  collectionRef: CollectionReference,
  options: { where?: Record<string, any>; orderBy?: any; skip?: number; take?: number }
): Query {
  const { where: whereClause = {}, orderBy: orderByOpt, skip, take } = options

  // Collect all filter conditions as {field, op, value} tuples
  const filters: { field: string; op: string; value: any }[] = []

  for (const [key, val] of Object.entries(whereClause)) {
    if (key === 'OR' || key === 'AND' || key === 'NOT') continue
    if (val === null) {
      filters.push({ field: key, op: '==', value: null })
    } else if (Array.isArray(val)) {
      if (val.length > 0) filters.push({ field: key, op: 'in', value: val })
    } else if (typeof val === 'object' && !(val instanceof Date)) {
      if ('equals' in val) filters.push({ field: key, op: '==', value: val.equals })
      if ('contains' in val) {
        filters.push({ field: key, op: '>=', value: val.contains })
        filters.push({ field: key, op: '<=', value: val.contains + '\uf8ff' })
      }
      if ('startsWith' in val) {
        filters.push({ field: key, op: '>=', value: val.startsWith })
        filters.push({ field: key, op: '<=', value: val.startsWith + '\uf8ff' })
      }
      if ('gt' in val) filters.push({ field: key, op: '>', value: val.gt })
      if ('gte' in val) filters.push({ field: key, op: '>=', value: val.gte })
      if ('lt' in val) filters.push({ field: key, op: '<', value: val.lt })
      if ('lte' in val) filters.push({ field: key, op: '<=', value: val.lte })
      if ('in' in val && Array.isArray(val.in)) filters.push({ field: key, op: 'in', value: val.in })
      if ('notIn' in val && Array.isArray(val.notIn)) filters.push({ field: key, op: 'not-in', value: val.notIn })
    } else {
      filters.push({ field: key, op: '==', value: val })
    }
  }

  // Apply chained .where() calls
  let q: Query = collectionRef
  for (const f of filters) {
    q = q.where(f.field, f.op as any, f.value)
  }

  // Order by
  if (orderByOpt) {
    const obs = Array.isArray(orderByOpt) ? orderByOpt : [orderByOpt]
    for (const o of obs) {
      let field: string
      let dir: 'asc' | 'desc'
      if (typeof o === 'string') { field = o; dir = 'asc' }
      else if (typeof o === 'object' && o !== null) {
        const entries = Object.entries(o)
        const [f, d] = entries[0]
        field = f; dir = (d === 'desc') ? 'desc' : 'asc'
      } else { continue }
      q = q.orderBy(field, dir)
    }
  }

  // Limit for pagination
  const effectiveTake = take && skip ? take + skip : take
  if (effectiveTake) q = q.limit(effectiveTake)

  return q
}

// ─── Include resolver ──────────────────────────────────────
async function resolveIncludes(
  docs: Record<string, any>[],
  include: Record<string, any>,
  collectionName: string
): Promise<void> {
  if (!include || docs.length === 0) return
  const fs = getDb()

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
        const snap = await fs.collection('propertyImages').where('propertyId', 'in', batch).get()
        snap.forEach(s => { const d = fromFirestoreDoc(s); if (d) allImages.push(d) })
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
        const snap = await fs.collection('agentProfiles').where('userId', 'in', batch).get()
        snap.forEach(s => { const d = fromFirestoreDoc(s); if (d) allAP.push(d) })
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
        const snap = await fs.collection('leadFollowUps').where('leadId', 'in', batch).get()
        snap.forEach(s => { const d = fromFirestoreDoc(s); if (d) allFU.push(d) })
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

    let relDocs: Record<string, any>[] = []
    for (let i = 0; i < ids.length; i += 30) {
      const batch = ids.slice(i, i + 30)
      const snap = await fs.collection(relCollection).where(FieldPath.documentId(), 'in', batch).get()
      snap.forEach(s => { const d = fromFirestoreDoc(s); if (d) relDocs.push(d) })
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
  const fs = getDb()

  for (const doc of docs) {
    if (!doc._count) doc._count = {}
    for (const [countKey] of Object.entries(countSpec)) {
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
        const snap = await fs.collection(countCollection).where(fkField, '==', doc.id).count().get()
        doc._count[countKey] = snap.data().count
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

  function getCollectionRef(): CollectionReference {
    return getDb().collection(collName)
  }

  function getUniqueField(w: Record<string, any>): { field: string; value: string } | null {
    for (const f of uniqueFields) if (w[f] !== undefined) return { field: f, value: w[f] }
    if (w.id) return { field: 'id', value: w.id }
    return null
  }

  return {
    async findMany(options: { where?: Record<string, any>; orderBy?: any; skip?: number; take?: number; include?: Record<string, any> } = {}): Promise<any[]> {
      try {
        const q = buildQuery(getCollectionRef(), options)
        const snap = await q.get()
        let docs = snap.docs.map(s => fromFirestoreDoc(s)!)
        if (options.skip) docs = docs.length > options.skip ? docs.slice(options.skip) : []
        if (options.take && docs.length > options.take) docs = docs.slice(0, options.take)
        if (options.include) await resolveIncludes(docs, options.include, collName)
        return docs
      } catch (error: any) {
        // Fallback: if index is missing (FAILED_PRECONDITION), fetch all and filter/sort client-side
        if (error.message?.includes('FAILED_PRECONDITION') || error.code === 9) {
          try {
            const allDocs = await getDb().collection(collName).get()
            let docs = allDocs.docs.map(s => fromFirestoreDoc(s)!)
            // Client-side filtering
            if (options.where && Object.keys(options.where).length > 0) {
              docs = filterDocsClientSide(docs, options.where)
            }
            // Client-side sorting
            if (options.orderBy) {
              docs = sortDocsClientSide(docs, options.orderBy)
            }
            // Pagination
            if (options.skip) docs = docs.length > options.skip ? docs.slice(options.skip) : []
            if (options.take && docs.length > options.take) docs = docs.slice(0, options.take)
            if (options.include) await resolveIncludes(docs, options.include, collName)
            return docs
          } catch (e2: any) {
            console.error(`[Firestore] findMany fallback ${collName}:`, e2.message)
            return []
          }
        }
        console.error(`[Firestore] findMany ${collName}:`, error.message)
        return []
      }
    },

    async findUnique(options: { where: Record<string, any>; include?: Record<string, any> }): Promise<any | null> {
      const unique = getUniqueField(options.where)
      if (!unique) return null
      const { field, value } = unique
      try {
        if (field === 'id') {
          const s = await getDb().collection(collName).doc(value).get()
          if (!s.exists) return null
          const d = fromFirestoreDoc(s)!
          if (options.include) await resolveIncludes([d], options.include, collName)
          return d
        }
        const snap = await getDb().collection(collName).where(field, '==', value).limit(1).get()
        if (snap.empty) return null
        const d = fromFirestoreDoc(snap.docs[0])!
        if (options.include) await resolveIncludes([d], options.include, collName)
        return d
      } catch (e: any) { console.error(`[Firestore] findUnique ${collName}:`, e.message); return null }
    },

    async findFirst(options: { where?: Record<string, any>; orderBy?: any; include?: Record<string, any> } = {}): Promise<any | null> {
      try {
        const q = buildQuery(getCollectionRef(), { ...options, take: 1 })
        const snap = await q.get()
        if (snap.empty) return null
        const d = fromFirestoreDoc(snap.docs[0])!
        if (options.include) await resolveIncludes([d], options.include, collName)
        return d
      } catch (e: any) { console.error(`[Firestore] findFirst ${collName}:`, e.message); return null }
    },

    async create(options: { data: Record<string, any>; include?: Record<string, any> }): Promise<any> {
      const fs = getDb()
      const id = cuid()
      const now = new Date()
      const data = { ...options.data, createdAt: options.data.createdAt || now, updatedAt: options.data.updatedAt || now }

      const nestedKeys: string[] = []
      const mainData: Record<string, any> = {}
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'object' && v !== null && 'create' in v) nestedKeys.push(k)
        else mainData[k] = v
      }

      await fs.collection(collName).doc(id).set(toFirestoreData(mainData))

      for (const nk of nestedKeys) {
        const nestedData = (data as any)[nk].create as Record<string, any>[]
        if (Array.isArray(nestedData)) {
          const nestedColl = relationToCollection(nk) || nk + 's'
          for (const item of nestedData) {
            const nId = cuid()
            await fs.collection(nestedColl).doc(nId).set(toFirestoreData({ ...item, [modelName + 'Id']: id, createdAt: new Date() }))
          }
        }
      }

      const result = fromFirestoreDoc(await fs.collection(collName).doc(id).get())!
      if (options.include) await resolveIncludes([result], options.include, collName)
      return result
    },

    async update(options: { where: Record<string, any>; data: Record<string, any>; include?: Record<string, any> }): Promise<any> {
      const fs = getDb()
      const unique = getUniqueField(options.where)
      if (!unique) throw new Error(`update: no unique field for ${collName}`)
      const { field, value } = unique
      let docRef: DocumentReference
      if (field === 'id') {
        docRef = fs.collection(collName).doc(value)
      } else {
        const snap = await fs.collection(collName).where(field, '==', value).limit(1).get()
        if (snap.empty) throw new Error('Record not found')
        docRef = snap.docs[0].ref
      }

      const ud: Record<string, any> = { updatedAt: new Date() }
      for (const [k, v] of Object.entries(options.data)) {
        if (v === undefined) continue
        if (typeof v === 'object' && v !== null && 'increment' in v) ud[k] = FieldValue.increment(v.increment as number)
        else if (typeof v === 'object' && v !== null && 'decrement' in v) ud[k] = FieldValue.increment(-(v.decrement as number))
        else if (typeof v === 'object' && v !== null && 'set' in v) ud[k] = v.set
        else ud[k] = v
      }
      await docRef.update(toFirestoreData(ud))
      const result = fromFirestoreDoc(await docRef.get())!
      if (options.include) await resolveIncludes([result], options.include, collName)
      return result
    },

    async delete(options: { where: Record<string, any> }): Promise<any> {
      const fs = getDb()
      const unique = getUniqueField(options.where)
      if (!unique) throw new Error(`delete: no unique field for ${collName}`)
      const { field, value } = unique
      let docRef: DocumentReference
      if (field === 'id') {
        docRef = fs.collection(collName).doc(value)
      } else {
        const snap = await fs.collection(collName).where(field, '==', value).limit(1).get()
        if (snap.empty) throw new Error('Record not found')
        docRef = snap.docs[0].ref
      }
      const before = fromFirestoreDoc(await docRef.get())
      await docRef.delete()
      return before
    },

    async deleteMany(options?: { where?: Record<string, any> }): Promise<{ count: number }> {
      const fs = getDb()
      const ref = getCollectionRef()
      const q = options?.where ? buildQuery(ref, options) : ref
      const snap = await q.get()
      if (snap.docs.length === 0) return { count: 0 }
      const batch = fs.batch()
      snap.docs.forEach(d => batch.delete(d.ref))
      await batch.commit()
      return { count: snap.docs.length }
    },

    async count(options: { where?: Record<string, any> } = {}): Promise<number> {
      try {
        const ref = getCollectionRef()
        if (options.where && Object.keys(options.where).length > 0) {
          return (await buildQuery(ref, options).count().get()).data().count
        }
        return (await ref.count().get()).data().count
      } catch (error: any) {
        // Fallback: count client-side
        if (error.message?.includes('FAILED_PRECONDITION') || error.code === 9) {
          try {
            const allDocs = await getDb().collection(collName).get()
            let docs = allDocs.docs.map(s => fromFirestoreDoc(s)!)
            if (options.where && Object.keys(options.where).length > 0) {
              docs = filterDocsClientSide(docs, options.where)
            }
            return docs.length
          } catch { return 0 }
        }
        console.error(`[Firestore] count ${collName}:`, error.message)
        return 0
      }
    },

    async upsert(options: { where: Record<string, any>; update: Record<string, any>; create: Record<string, any> }): Promise<any> {
      const existing = await this.findFirst({ where: options.where })
      if (existing) return this.update({ where: { id: existing.id }, data: options.update })
      return this.create({ data: options.create })
    },

    async groupBy(options: { by: string[]; where?: Record<string, any>; _count?: Record<string, any> }): Promise<any[]> {
      const ref = getCollectionRef()
      const q = options.where ? buildQuery(ref, options) : ref
      const snap = await q.get()
      const groups = new Map<string, any>()
      for (const s of snap.docs) {
        const d = fromFirestoreDoc(s)!
        const gk = options.by.map(b => String(d[b] ?? 'null')).join('|')
        if (!groups.has(gk)) groups.set(gk, { ...Object.fromEntries(options.by.map(b => [b, d[b] ?? null])), _count: {} })
        const g = groups.get(gk)!
        for (const ck of Object.keys(options._count || {})) g._count[ck] = (g._count[ck] || 0) + 1
      }
      return Array.from(groups.values())
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
