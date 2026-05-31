import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, json, jsonError, corsHeaders } from '@/lib/api-helpers'
import * as XLSX from 'xlsx'

// Column mapping: Excel header → field
const COLUMN_MAP: Record<string, string> = {
  'judul': 'title',
  'jenis properti': 'propertyTypeName',
  'status': 'status',
  'harga (rp)': 'price',
  'nego': 'isNego',
  'featured': 'isFeatured',
  'kabupaten/kota': 'cityName',
  'kecamatan': 'districtName',
  'alamat': 'address',
  'luas tanah (m²)': 'landArea',
  'luas bangunan (m²)': 'buildingArea',
  'kamar tidur': 'bedrooms',
  'kamar mandi': 'bathrooms',
  'garasi': 'garages',
  'lantai': 'floors',
  'listrik': 'electricity',
  'sumber air': 'waterSource',
  'sertifikat': 'certificate',
  'kondisi bangunan': 'buildingCond',
  'arah hadap': 'orientation',
  'fasilitas': 'facilities',
  'gambar utama (url)': 'mainImage',
  'gambar utama': 'mainImage',
  'video url': 'videoUrl',
  'virtual tour url': 'virtualTourUrl',
  'agen (nama)': 'agentName',
  'agen': 'agentName',
  'deskripsi': 'description',
  'meta title': 'metaTitle',
  'meta description': 'metaDescription',
  'meta keywords': 'metaKeywords',
}

async function generatePropertyCode(): Promise<string> {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const count = await db.property.count({
    where: { createdAt: { gte: startOfDay } },
  })
  const seq = String(count + 1).padStart(3, '0')
  return `PRP-${dateStr}-${seq}`
}

async function generateSlug(title: string): Promise<string> {
  const baseSlug = title
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
  return slug
}

function formatPriceDisplay(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)
}

export async function POST(request: NextRequest) {
  const corsResp = (request as unknown as { method: string }).method === 'OPTIONS'
    ? new NextResponse(null, { status: 204, headers: corsHeaders() })
    : null
  if (corsResp) return corsResp

  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return jsonError('No file uploaded.', 400)
    }

    // Validate file type
    if (
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.xls') &&
      !file.name.endsWith('.csv')
    ) {
      return jsonError('Invalid file format. Please upload .xlsx, .xls, or .csv file.', 400)
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // Use the first sheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)

    if (rows.length === 0) {
      return jsonError('File is empty or has no data rows.', 400)
    }

    // Pre-load reference data
    const [propertyTypes, cities, districts, agents] = await Promise.all([
      db.propertyType.findMany(),
      db.city.findMany(),
      db.district.findMany(),
      db.agentProfile.findMany({ include: { user: { select: { id: true, name: true } } } }),
    ])

    const typeMap = new Map(propertyTypes.map((t) => [t.name.toLowerCase(), t]))
    const cityMap = new Map(cities.map((c) => [c.name.toLowerCase(), c]))
    const districtMap = new Map(districts.map((d) => [d.name.toLowerCase(), d]))
    const agentMap = new Map(agents.map((a) => [a.name.toLowerCase(), a]))

    // Process rows
    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2 // Excel row number (1 = header)

      // Normalize keys to lowercase
      const normalized: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(row)) {
        normalized[key.toLowerCase().trim()] = value
      }

      // Title is required
      const title = String(normalized['judul'] || '').trim()
      if (!title) {
        errors.push(`Baris ${rowNumber}: Judul kosong, dilewati`)
        skipped++
        continue
      }

      // Property type is required
      const typeName = String(normalized['jenis properti'] || '').trim()
      const propertyType = typeName ? typeMap.get(typeName.toLowerCase()) : undefined
      if (!propertyType) {
        errors.push(`Baris ${rowNumber}: Jenis properti "${typeName}" tidak ditemukan, dilewati`)
        skipped++
        continue
      }

      // Price is required
      const priceRaw = normalized['harga (rp)']
      const price = typeof priceRaw === 'number' ? priceRaw
        : typeof priceRaw === 'string' ? parseInt(priceRaw.replace(/[^0-9]/g, ''), 10) || 0
        : 0

      if (price <= 0) {
        errors.push(`Baris ${rowNumber}: Harga tidak valid (${priceRaw}), dilewati`)
        skipped++
        continue
      }

      // Parse optional fields
      const statusVal = String(normalized['status'] || 'draft').trim().toLowerCase()
      const validStatuses = ['dijual', 'disewa', 'draft']
      const status = validStatuses.includes(statusVal) ? statusVal : 'draft'

      const isNego = ['ya', 'yes', 'true', '1'].includes(String(normalized['nego'] || '').trim().toLowerCase())
      const isFeatured = ['ya', 'yes', 'true', '1'].includes(String(normalized['featured'] || '').trim().toLowerCase())

      const cityName = String(normalized['kabupaten/kota'] || '').trim()
      const city = cityName ? cityMap.get(cityName.toLowerCase()) : undefined

      const districtName = String(normalized['kecamatan'] || '').trim()
      const district = districtName ? districtMap.get(districtName.toLowerCase()) : undefined

      const agentName = String(normalized['agen (nama)'] || normalized['agen'] || '').trim()
      const agent = agentName ? agentMap.get(agentName.toLowerCase()) : undefined

      // Generate code and slug
      const code = await generatePropertyCode()
      const slug = await generateSlug(title)

      // Create property
      try {
        await db.property.create({
          data: {
            code,
            title,
            slug,
            description: String(normalized['deskripsi'] || ''),
            propertyTypeId: propertyType.id,
            status,
            isFeatured,
            isNego,
            isNew: false,
            isPublished: false,
            price: BigInt(price),
            priceDisplay: formatPriceDisplay(price),
            cityId: city?.id || null,
            districtId: district?.id || null,
            address: String(normalized['alamat'] || ''),
            landArea: Number(normalized['luas tanah (m²)']) || 0,
            buildingArea: Number(normalized['luas bangunan (m²)']) || 0,
            bedrooms: Number(normalized['kamar tidur']) || 0,
            bathrooms: Number(normalized['kamar mandi']) || 0,
            garages: Number(normalized['garasi']) || 0,
            floors: Number(normalized['lantai']) || 0,
            electricity: String(normalized['listrik'] || ''),
            waterSource: String(normalized['sumber air'] || ''),
            certificate: String(normalized['sertifikat'] || ''),
            buildingCond: String(normalized['kondisi bangunan'] || ''),
            orientation: String(normalized['arah hadap'] || ''),
            facilities: String(normalized['fasilitas'] || ''),
            mainImage: String(normalized['gambar utama (url)'] || normalized['gambar utama'] || ''),
            videoUrl: String(normalized['video url'] || ''),
            virtualTourUrl: String(normalized['virtual tour url'] || ''),
            agentId: agent?.user.id || null,
            metaTitle: String(normalized['meta title'] || ''),
            metaDescription: String(normalized['meta description'] || ''),
            metaKeywords: String(normalized['meta keywords'] || ''),
          },
        })
        imported++
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        errors.push(`Baris ${rowNumber}: Gagal menyimpan "${title}" - ${errMsg}`)
        skipped++
      }
    }

    return json({
      data: {
        imported,
        skipped,
        total: rows.length,
        errors,
      },
    })
  } catch (error) {
    console.error('[Import Properties Error]', error)
    return jsonError('Failed to import properties.', 500)
  }
}
