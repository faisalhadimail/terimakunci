import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, corsHeaders, serializeBigInt } from '@/lib/api-helpers'
import * as XLSX from 'xlsx'

// ============ GET - Export properties to Excel ============
export async function GET(request: NextRequest) {
  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const published = searchParams.get('published')

    // Build where clause
    const where: Record<string, unknown> = { deletedAt: null }
    if (status && status !== 'all') where.status = status
    if (published === 'true') where.isPublished = true
    if (published === 'false') where.isPublished = false

    const properties = await db.property.findMany({
      where,
      include: {
        propertyType: { select: { name: true } },
        city: { select: { name: true } },
        district: { select: { name: true } },
        agent: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to flat rows
    const rows = properties.map((p) => ({
      'Kode Properti': p.code,
      'Judul': p.title,
      'Jenis Properti': p.propertyType?.name || '',
      'Status': p.status,
      'Harga (Rp)': Number(p.price),
      'Nego': p.isNego ? 'Ya' : 'Tidak',
      'Featured': p.isFeatured ? 'Ya' : 'Tidak',
      'Published': p.isPublished ? 'Ya' : 'Tidak',
      'Kabupaten/Kota': p.city?.name || '',
      'Kecamatan': p.district?.name || '',
      'Alamat': p.address || '',
      'Luas Tanah (m²)': p.landArea || 0,
      'Luas Bangunan (m²)': p.buildingArea || 0,
      'Kamar Tidur': p.bedrooms || 0,
      'Kamar Mandi': p.bathrooms || 0,
      'Garasi': p.garages || 0,
      'Lantai': p.floors || 0,
      'Listrik': p.electricity || '',
      'Sumber Air': p.waterSource || '',
      'Sertifikat': p.certificate || '',
      'Kondisi Bangunan': p.buildingCond || '',
      'Arah Hadap': p.orientation || '',
      'Fasilitas': p.facilities || '',
      'Gambar Utama': p.mainImage || '',
      'Video URL': p.videoUrl || '',
      'Virtual Tour URL': p.virtualTourUrl || '',
      'Agen': p.agent?.name || '',
      'Deskripsi': p.description || '',
      'Meta Title': p.metaTitle || '',
      'Meta Description': p.metaDescription || '',
      'Meta Keywords': p.metaKeywords || '',
      'Tanggal Dibuat': p.createdAt ? new Date(p.createdAt).toLocaleString('id-ID') : '',
      'Tanggal Diupdate': p.updatedAt ? new Date(p.updatedAt).toLocaleString('id-ID') : '',
    }))

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Data sheet
    const ws = XLSX.utils.json_to_sheet(rows)

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Kode Properti
      { wch: 40 }, // Judul
      { wch: 15 }, // Jenis Properti
      { wch: 10 }, // Status
      { wch: 18 }, // Harga
      { wch: 6 },  // Nego
      { wch: 8 },  // Featured
      { wch: 10 }, // Published
      { wch: 20 }, // Kota
      { wch: 18 }, // Kecamatan
      { wch: 30 }, // Alamat
      { wch: 12 }, // Luas Tanah
      { wch: 14 }, // Luas Bangunan
      { wch: 10 }, // KT
      { wch: 10 }, // KM
      { wch: 8 },  // Garasi
      { wch: 8 },  // Lantai
      { wch: 12 }, // Listrik
      { wch: 12 }, // Sumber Air
      { wch: 12 }, // Sertifikat
      { wch: 14 }, // Kondisi
      { wch: 12 }, // Arah
      { wch: 30 }, // Fasilitas
      { wch: 40 }, // Gambar
      { wch: 40 }, // Video
      { wch: 40 }, // Virtual Tour
      { wch: 20 }, // Agen
      { wch: 50 }, // Deskripsi
      { wch: 30 }, // Meta Title
      { wch: 40 }, // Meta Desc
      { wch: 30 }, // Meta Keywords
      { wch: 20 }, // Tanggal Dibuat
      { wch: 20 }, // Tanggal Diupdate
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Properti')

    // Template sheet (instructions for import)
    const templateHeaders = [
      'Judul *',
      'Jenis Properti *',
      'Status',
      'Harga (Rp) *',
      'Nego',
      'Featured',
      'Kabupaten/Kota',
      'Kecamatan',
      'Alamat',
      'Luas Tanah (m²)',
      'Luas Bangunan (m²)',
      'Kamar Tidur',
      'Kamar Mandi',
      'Garasi',
      'Lantai',
      'Listrik',
      'Sumber Air',
      'Sertifikat',
      'Kondisi Bangunan',
      'Arah Hadap',
      'Fasilitas',
      'Gambar Utama (URL)',
      'Video URL',
      'Virtual Tour URL',
      'Agen (Nama)',
      'Deskripsi',
      'Meta Title',
      'Meta Description',
      'Meta Keywords',
    ]

    const exampleRow = [
      'Rumah Minimalis Modern 2 Lantai',
      'Rumah',
      'dijual',
      1500000000,
      'Ya',
      'Tidak',
      'Badung',
      'Kuta',
      'Jl. Raya Kuta No. 123',
      200,
      150,
      4,
      3,
      1,
      2,
      '2200 watt',
      'PDAM',
      'SHM',
      'bagus',
      'selatan',
      'Kolam Renang, Taman, CCTV',
      'https://example.com/image.jpg',
      '',
      '',
      'John Agent',
      'Rumah modern minimalis dengan kolam renang...',
      '',
      '',
      '',
    ]

    const templateRows = [templateHeaders, exampleRow]
    const templateWs = XLSX.utils.aoa_to_sheet(templateRows)
    templateWs['!cols'] = templateHeaders.map((h) => ({ wch: Math.max(h.length + 4, 15) }))
    XLSX.utils.book_append_sheet(wb, templateWs, 'Template Import')

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return as downloadable file
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const filename = `properti-propnusa-${timestamp}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        ...corsHeaders(),
      },
    })
  } catch (error) {
    console.error('[Export Properties Error]', error)
    return NextResponse.json(
      { error: 'Failed to export properties.' },
      { status: 500, headers: corsHeaders() }
    )
  }
}
