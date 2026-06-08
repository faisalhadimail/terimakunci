import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, corsHeaders } from '@/lib/api-helpers'
import * as XLSX from 'xlsx'

// ============ GET - Download Excel template for property import ============
export async function GET(request: NextRequest) {
  const authUser = requireAuth(request)
  if (authUser instanceof Response) return authUser

  try {
    // Load reference data
    const [propertyTypes, cities, districts, agents] = await Promise.all([
      db.propertyType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      db.city.findMany({ orderBy: { name: 'asc' } }),
      db.district.findMany({ orderBy: { name: 'asc' }, include: { city: { select: { name: true } } } }),
      db.agentProfile.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    ])

    const wb = XLSX.utils.book_new()

    // ============ SHEET 1: Template Import ============
    const headers = [
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

    const exampleRows = [
      [
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
        'Rumah modern minimalis dengan kolam renang pribadi, dekat pantai.',
        '',
        '',
        '',
      ],
      [
        'Tanah Strategis Cocok untuk Villa',
        'Tanah',
        'dijual',
        2500000000,
        'Ya',
        'Tidak',
        'Gianyar',
        'Ubud',
        'Jl. Raya Ubud No. 45',
        500,
        0,
        0,
        0,
        0,
        0,
        '',
        '',
        'SHM',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'Tanah datar dengan view sawah, cocok untuk investasi villa.',
        '',
        '',
        '',
      ],
      [
        'Ruko 3 Lantai Pusat Kota',
        'Ruko',
        'disewa',
        150000000,
        'Ya',
        'Ya',
        'Denpasar',
        'Denpasar Selatan',
        'Jl. Teuku Umar No. 88',
        0,
        250,
        0,
        3,
        2,
        3,
        '3500 watt',
        'PDAM',
        'SHGB',
        'bagus',
        'barat',
        'AC, Keamanan 24 Jam, Parkir Luas',
        'https://example.com/ruko.jpg',
        '',
        '',
        '',
        'Ruko strategis di jalan utama, cocok untuk segala usaha.',
        '',
        '',
        '',
      ],
    ]

    const ws1 = XLSX.utils.aoa_to_sheet([headers, ...exampleRows])
    ws1['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }))

    // Bold header row styling (xlsx doesn't support rich formatting natively, but we set widths)
    XLSX.utils.book_append_sheet(wb, ws1, 'Template Import')

    // ============ SHEET 2: Panduan Isian ============
    const guideRows = [
      ['PANDUAN PENGISIAN TEMPLATE IMPORT PROPERTI'],
      [''],
      ['KOLOM', 'WAJIB', 'KETERANGAN'],
      ['Judul *', 'Ya', 'Nama listing properti (min 5 karakter)'],
      ['Jenis Properti *', 'Ya', 'Harus sesuai nama di sheet "Data Referensi" (contoh: Rumah, Tanah, Ruko, Apartemen)'],
      ['Status', 'Tidak', 'Isi: dijual / disewa / draft. Default: draft'],
      ['Harga (Rp) *', 'Ya', 'Harga dalam angka (contoh: 1500000000 untuk 1,5 Miliar). Jangan pakai titik/koma.'],
      ['Nego', 'Tidak', 'Isi: Ya / Tidak. Apakah harga bisa dinego?'],
      ['Featured', 'Tidak', 'Isi: Ya / Tidak. Tampilkan sebagai properti unggulan?'],
      ['Kabupaten/Kota', 'Tidak', 'Nama kota/kabupaten sesuai data di sheet "Data Referensi"'],
      ['Kecamatan', 'Tidak', 'Nama kecamatan sesuai data di sheet "Data Referensi"'],
      ['Alamat', 'Tidak', 'Alamat lengkap properti'],
      ['Luas Tanah (m²)', 'Tidak', 'Luas tanah dalam meter persegi (angka)'],
      ['Luas Bangunan (m²)', 'Tidak', 'Luas bangunan dalam meter persegi (angka)'],
      ['Kamar Tidur', 'Tidak', 'Jumlah kamar tidur (angka)'],
      ['Kamar Mandi', 'Tidak', 'Jumlah kamar mandi (angka)'],
      ['Garasi', 'Tidak', 'Jumlah garasi (angka)'],
      ['Lantai', 'Tidak', 'Jumlah lantai (angka)'],
      ['Listrik', 'Tidak', 'Daya listrik (contoh: 2200 watt)'],
      ['Sumber Air', 'Tidak', 'Sumber air (contoh: PDAM, Sumur Bor)'],
      ['Sertifikat', 'Tidak', 'Jenis sertifikat: SHM / SHGB / AJB / Girik'],
      ['Kondisi Bangunan', 'Tidak', 'baru / bagus / sedang / renovasi'],
      ['Arah Hadap', 'Tidak', 'Utara / Selatan / Timur / Barat / Barat Laut / Tenggara'],
      ['Fasilitas', 'Tidak', 'Daftar fasilitas pisahkan dengan koma (contoh: Kolam Renang, Taman, CCTV)'],
      ['Gambar Utama (URL)', 'Tidak', 'URL gambar utama properti'],
      ['Video URL', 'Tidak', 'Link video properti (YouTube, dll)'],
      ['Virtual Tour URL', 'Tidak', 'Link virtual tour (Matterport, dll)'],
      ['Agen (Nama)', 'Tidak', 'Nama agen sesuai data di sheet "Data Referensi"'],
      ['Deskripsi', 'Tidak', 'Deskripsi lengkap properti'],
      ['Meta Title', 'Tidak', 'Meta title untuk SEO'],
      ['Meta Description', 'Tidak', 'Meta description untuk SEO'],
      ['Meta Keywords', 'Tidak', 'Meta keywords untuk SEO (pisahkan koma)'],
      [''],
      ['CATATAN PENTING:'],
      ['- Kolom bertanda * wajib diisi'],
      ['- Judul harus unik (tidak boleh sama dengan properti yang sudah ada)'],
      ['- Jenis Properti, Kabupaten/Kota, Kecamatan, dan Agen harus sesuai data yang sudah terdaftar di sistem'],
      ['- Gunakan sheet "Data Referensi" sebagai panduan nilai yang valid'],
      ['- Baris dengan data tidak valid akan dilewati, detail error ditampilkan setelah import'],
    ]

    const ws2 = XLSX.utils.aoa_to_sheet(guideRows)
    ws2['!cols'] = [
      { wch: 28 },
      { wch: 8 },
      { wch: 70 },
    ]
    XLSX.utils.book_append_sheet(wb, ws2, 'Panduan Isian')

    // ============ SHEET 3: Data Referensi ============
    const refRows = [
      ['DATA REFERENSI'],
      [''],
      ['--- Jenis Properti ---'],
      ...propertyTypes.map((t: any) => [t.name]),
      [''],
      ['--- Kabupaten/Kota ---'],
      ...cities.map((c: any) => [c.name]),
      [''],
      ['--- Kecamatan (Nama Kecamatan — Kota/Kabupaten) ---'],
      ...districts.map((d: any) => [`${d.name} — ${d.city?.name || '?'}`]),
      [''],
      ['--- Agen ---'],
      ...agents.map((a: any) => [a.name || '?']),
      [''],
      ['--- Nilai Status ---'],
      ['dijual'],
      ['disewa'],
      ['draft'],
      [''],
      ['--- Nilai Sertifikat ---'],
      ['SHM'],
      ['SHGB'],
      ['AJB'],
      ['Girik'],
      [''],
      ['--- Kondisi Bangunan ---'],
      ['baru'],
      ['bagus'],
      ['sedang'],
      ['renovasi'],
      [''],
      ['--- Arah Hadap ---'],
      ['Utara'],
      ['Selatan'],
      ['Timur'],
      ['Barat'],
      ['Barat Laut'],
      ['Tenggara'],
    ]

    const ws3 = XLSX.utils.aoa_to_sheet(refRows)
    ws3['!cols'] = [{ wch: 40 }]
    XLSX.utils.book_append_sheet(wb, ws3, 'Data Referensi')

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-import-properti-terimakunci.xlsx"',
        ...corsHeaders(),
      },
    })
  } catch (error) {
    console.error('[Template Download Error]', error)
    return NextResponse.json(
      { error: 'Failed to generate template.' },
      { status: 500, headers: corsHeaders() }
    )
  }
}
