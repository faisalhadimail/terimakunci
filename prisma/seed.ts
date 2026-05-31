import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const db = new PrismaClient();

// ============ REAL UNSPLASH IMAGES ============
const IMAGES = {
  // Rumah Mewah
  rumahMewah1: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop&q=80',
  rumahMewah2: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80',
  rumahMewah3: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&q=80',
  rumahMewah4: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80',
  rumahMewah5: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&q=80',
  // Rumah Minimalis
  rumahMinimalis1: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop&q=80',
  rumahMinimalis2: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop&q=80',
  rumahMinimalis3: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop&q=80',
  rumahMinimalis4: 'https://images.unsplash.com/photo-1564594736624-def7a10ab047?w=800&h=600&fit=crop&q=80',
  // Villa
  villa1: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80',
  villa2: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop&q=80',
  villa3: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=600&fit=crop&q=80',
  villa4: 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=800&h=600&fit=crop&q=80',
  villa5: 'https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=800&h=600&fit=crop&q=80',
  // Apartemen
  apartemen1: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&q=80',
  apartemen2: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&q=80',
  apartemen3: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&q=80',
  apartemen4: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&q=80',
  // Ruko
  ruko1: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&q=80',
  ruko2: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&q=80',
  ruko3: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop&q=80',
  // Tanah/Kavling
  tanah1: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop&q=80',
  tanah2: 'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&h=600&fit=crop&q=80',
  tanah3: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop&q=80',
  // Gudang
  gudang1: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop&q=80',
  gudang2: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80',
  // Kantor
  kantor1: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop&q=80',
  kantor2: 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&h=600&fit=crop&q=80',
  // Kost
  kost1: 'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800&h=600&fit=crop&q=80',
  kost2: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop&q=80',
  // Interiors
  interior1: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop&q=80',
  interior2: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop&q=80',
  interior3: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop&q=80',
  interior4: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop&q=80',
  // Pool
  pool1: 'https://images.unsplash.com/photo-1572331165267-854da2b021b1?w=800&h=600&fit=crop&q=80',
  pool2: 'https://images.unsplash.com/photo-1585128792020-803d29415281?w=800&h=600&fit=crop&q=80',
  // Garden
  garden1: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=600&fit=crop&q=80',
  garden2: 'https://images.unsplash.com/photo-1598902108854-d1446a3a8e56?w=800&h=600&fit=crop&q=80',
  // Agent photos
  agent1: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&q=80',
  agent2: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80',
  agent3: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80',
  agent4: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80',
  // Article images
  article1: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop&q=80',
  article2: 'https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?w=800&h=400&fit=crop&q=80',
  article3: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop&q=80',
  article4: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=400&fit=crop&q=80',
  article5: 'https://images.unsplash.com/photo-1518135714426-c18f5ffb6f4d?w=800&h=400&fit=crop&q=80',
  article6: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&h=400&fit=crop&q=80',
  article7: 'https://images.unsplash.com/photo-1431576901776-e539bd916ba2?w=800&h=400&fit=crop&q=80',
  article8: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop&q=80',
  // Logo/brand
  logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=200&fit=crop&q=80',
};

async function seed() {
  console.log('🌱 Seeding comprehensive dummy data...\n');

  // ============ PROPERTY TYPES ============
  const propertyTypes = [
    { name: 'Rumah', slug: 'rumah', icon: 'Home', sortOrder: 1 },
    { name: 'Tanah', slug: 'tanah', icon: 'MapPin', sortOrder: 2 },
    { name: 'Ruko', slug: 'ruko', icon: 'Store', sortOrder: 3 },
    { name: 'Apartemen', slug: 'apartemen', icon: 'Building', sortOrder: 4 },
    { name: 'Villa', slug: 'villa', icon: 'Trees', sortOrder: 5 },
    { name: 'Gudang', slug: 'gudang', icon: 'Warehouse', sortOrder: 6 },
    { name: 'Kantor', slug: 'kantor', icon: 'Briefcase', sortOrder: 7 },
    { name: 'Kost', slug: 'kost', icon: 'Bed', sortOrder: 8 },
    { name: 'Kavling', slug: 'kavling', icon: 'Grid3x3', sortOrder: 9 },
    { name: 'Komersial', slug: 'komersial', icon: 'ShoppingBag', sortOrder: 10 },
  ];
  for (const pt of propertyTypes) {
    await db.propertyType.upsert({ where: { slug: pt.slug }, update: pt, create: pt });
  }
  console.log('✅ Property types seeded');

  // ============ LOCATIONS ============
  const provJB = await db.province.upsert({ where: { slug: 'jawa-barat' }, update: { name: 'Jawa Barat' }, create: { name: 'Jawa Barat', slug: 'jawa-barat' } });
  const provBali = await db.province.upsert({ where: { slug: 'bali' }, update: { name: 'Bali' }, create: { name: 'Bali', slug: 'bali' } });
  const provJT = await db.province.upsert({ where: { slug: 'jawa-tengah' }, update: { name: 'Jawa Tengah' }, create: { name: 'Jawa Tengah', slug: 'jawa-tengah' } });
  const provDKI = await db.province.upsert({ where: { slug: 'dki-jakarta' }, update: { name: 'DKI Jakarta' }, create: { name: 'DKI Jakarta', slug: 'dki-jakarta' } });
  const provDIY = await db.province.upsert({ where: { slug: 'diy' }, update: { name: 'DI Yogyakarta' }, create: { name: 'DI Yogyakarta', slug: 'diy' } });
  const provJTimur = await db.province.upsert({ where: { slug: 'jawa-timur' }, update: { name: 'Jawa Timur' }, create: { name: 'Jawa Timur', slug: 'jawa-timur' } });

  const cities = await Promise.all([
    db.city.upsert({ where: { id: 'city-bandung' }, update: { name: 'Bandung', slug: 'bandung' }, create: { id: 'city-bandung', name: 'Bandung', slug: 'bandung', provinceId: provJB.id } }),
    db.city.upsert({ where: { id: 'city-cimahi' }, update: { name: 'Cimahi', slug: 'cimahi' }, create: { id: 'city-cimahi', name: 'Cimahi', slug: 'cimahi', provinceId: provJB.id } }),
    db.city.upsert({ where: { id: 'city-denpasar' }, update: { name: 'Denpasar', slug: 'denpasar' }, create: { id: 'city-denpasar', name: 'Denpasar', slug: 'denpasar', provinceId: provBali.id } }),
    db.city.upsert({ where: { id: 'city-badung' }, update: { name: 'Badung', slug: 'badung' }, create: { id: 'city-badung', name: 'Badung', slug: 'badung', provinceId: provBali.id } }),
    db.city.upsert({ where: { id: 'city-semarang' }, update: { name: 'Semarang', slug: 'semarang' }, create: { id: 'city-semarang', name: 'Semarang', slug: 'semarang', provinceId: provJT.id } }),
    db.city.upsert({ where: { id: 'city-jaksel' }, update: { name: 'Jakarta Selatan', slug: 'jakarta-selatan' }, create: { id: 'city-jaksel', name: 'Jakarta Selatan', slug: 'jakarta-selatan', provinceId: provDKI.id } }),
    db.city.upsert({ where: { id: 'city-yogya' }, update: { name: 'Yogyakarta', slug: 'yogyakarta' }, create: { id: 'city-yogya', name: 'Yogyakarta', slug: 'yogyakarta', provinceId: provDIY.id } }),
    db.city.upsert({ where: { id: 'city-surabaya' }, update: { name: 'Surabaya', slug: 'surabaya' }, create: { id: 'city-surabaya', name: 'Surabaya', slug: 'surabaya', provinceId: provJTimur.id } }),
    db.city.upsert({ where: { id: 'city-gianyar' }, update: { name: 'Gianyar', slug: 'gianyar' }, create: { id: 'city-gianyar', name: 'Gianyar', slug: 'gianyar', provinceId: provBali.id } }),
    db.city.upsert({ where: { id: 'city-bogor' }, update: { name: 'Bogor', slug: 'bogor' }, create: { id: 'city-bogor', name: 'Bogor', slug: 'bogor', provinceId: provJB.id } }),
  ]);
  const [bandung, cimahi, denpasar, badung, semarang, jaksel, yogya, surabaya, gianyar, bogor] = cities;

  const districts = await Promise.all([
    db.district.upsert({ where: { id: 'dist-coblong' }, update: { name: 'Coblong', slug: 'coblong' }, create: { id: 'dist-coblong', name: 'Coblong', slug: 'coblong', cityId: bandung.id } }),
    db.district.upsert({ where: { id: 'dist-cidadap' }, update: { name: 'Cidadap', slug: 'cidadap' }, create: { id: 'dist-cidadap', name: 'Cidadap', slug: 'cidadap', cityId: bandung.id } }),
    db.district.upsert({ where: { id: 'dist-sukasari' }, update: { name: 'Sukasari', slug: 'sukasari' }, create: { id: 'dist-sukasari', name: 'Sukasari', slug: 'sukasari', cityId: bandung.id } }),
    db.district.upsert({ where: { id: 'dist-cibiru' }, update: { name: 'Cibiru', slug: 'cibiru' }, create: { id: 'dist-cibiru', name: 'Cibiru', slug: 'cibiru', cityId: bandung.id } }),
    db.district.upsert({ where: { id: 'dist-kuta' }, update: { name: 'Kuta', slug: 'kuta' }, create: { id: 'dist-kuta', name: 'Kuta', slug: 'kuta', cityId: badung.id } }),
    db.district.upsert({ where: { id: 'dist-seminyak' }, update: { name: 'Seminyak', slug: 'seminyak' }, create: { id: 'dist-seminyak', name: 'Seminyak', slug: 'seminyak', cityId: badung.id } }),
    db.district.upsert({ where: { id: 'dist-setiabudi' }, update: { name: 'Setiabudi', slug: 'setiabudi' }, create: { id: 'dist-setiabudi', name: 'Setiabudi', slug: 'setiabudi', cityId: bandung.id } }),
    db.district.upsert({ where: { id: 'dist-margasari' }, update: { name: 'Margasari', slug: 'margasari' }, create: { id: 'dist-margasari', name: 'Margasari', slug: 'margasari', cityId: denpasar.id } }),
    db.district.upsert({ where: { id: 'dist-kebayoran' }, update: { name: 'Kebayoran Baru', slug: 'kebayoran-baru' }, create: { id: 'dist-kebayoran', name: 'Kebayoran Baru', slug: 'kebayoran-baru', cityId: jaksel.id } }),
    db.district.upsert({ where: { id: 'dist-mertoyudan' }, update: { name: 'Mertoyudan', slug: 'mertoyudan' }, create: { id: 'dist-mertoyudan', name: 'Mertoyudan', slug: 'mertoyudan', cityId: semarang.id } }),
    db.district.upsert({ where: { id: 'dist-ubud' }, update: { name: 'Ubud', slug: 'ubud' }, create: { id: 'dist-ubud', name: 'Ubud', slug: 'ubud', cityId: gianyar.id } }),
    db.district.upsert({ where: { id: 'dist-babakan' }, update: { name: 'Babakan Ciparay', slug: 'babakan-ciparay' }, create: { id: 'dist-babakan', name: 'Babakan Ciparay', slug: 'babakan-ciparay', cityId: bandung.id } }),
  ]);
  const [coblong, cidadap, sukasari, cibiru, kuta, seminyak, setiabudi, margasari, kebayoran, _mertoyudan, ubud, babakan] = districts;

  await Promise.all([
    db.village.upsert({ where: { id: 'vill-dago' }, update: { name: 'Dago', slug: 'dago' }, create: { id: 'vill-dago', name: 'Dago', slug: 'dago', districtId: coblong.id } }),
    db.village.upsert({ where: { id: 'vill-lembang' }, update: { name: 'Lembang', slug: 'lembang' }, create: { id: 'vill-lembang', name: 'Lembang', slug: 'lembang', districtId: cidadap.id } }),
    db.village.upsert({ where: { id: 'vill-setiabudi' }, update: { name: 'Setiabudi', slug: 'setiabudi' }, create: { id: 'vill-setiabudi', name: 'Setiabudi', slug: 'setiabudi', districtId: setiabudi.id } }),
    db.village.upsert({ where: { id: 'vill-ubud' }, update: { name: 'Ubud', slug: 'ubud' }, create: { id: 'vill-ubud', name: 'Ubud', slug: 'ubud', districtId: ubud.id } }),
  ]);

  console.log('✅ Locations seeded (6 provinces, 10 cities, 12 districts, 4 villages)');

  // ============ USERS & AGENTS ============
  const hashedPassword = await hash('admin123', 10);

  const adminUser = await db.user.upsert({ where: { email: 'admin@properti.com' }, update: {}, create: { email: 'admin@properti.com', name: 'Admin Utama', password: hashedPassword, role: 'super_admin', phone: '6281234567890' } });

  const agentUser1 = await db.user.upsert({ where: { email: 'agen1@properti.com' }, update: {}, create: { email: 'agen1@properti.com', name: 'Budi Santoso', password: hashedPassword, role: 'agent', phone: '6281234567891' } });
  const agentUser2 = await db.user.upsert({ where: { email: 'agen2@properti.com' }, update: {}, create: { email: 'agen2@properti.com', name: 'Sari Dewi', password: hashedPassword, role: 'agent', phone: '6281234567892' } });
  const agentUser3 = await db.user.upsert({ where: { email: 'agen3@properti.com' }, update: {}, create: { email: 'agen3@properti.com', name: 'Raka Pratama', password: hashedPassword, role: 'agent', phone: '6281234567893' } });
  const agentUser4 = await db.user.upsert({ where: { email: 'agen4@properti.com' }, update: {}, create: { email: 'agen4@properti.com', name: 'Dewi Anggraini', password: hashedPassword, role: 'agent', phone: '6281234567894' } });

  const agents = [
    { userId: agentUser1.id, name: 'Budi Santoso', title: 'Senior Property Consultant', photo: IMAGES.agent1, whatsapp: '6281234567891', email: 'budi@properti.com', bio: 'Berpengalaman lebih dari 10 tahun di bidang properti Bandung. Spesialis area Dago, Setiabudi, dan Cimahi. Telah menangani ratusan transaksi properti senilai lebih dari Rp 100 Miliar.', areaSpec: 'Bandung Utara, Dago, Setiabudi, Cimahi', sortOrder: 1 },
    { userId: agentUser2.id, name: 'Sari Dewi', title: 'Property Advisor Bali', photo: IMAGES.agent2, whatsapp: '6281234567892', email: 'sari@properti.com', bio: 'Ahli properti residensial dan komersial di Bali. Fokus pada rumah mewah, villa, dan apartemen premium. Berpengalaman membantu klien domestik dan internasional.', areaSpec: 'Denpasar, Seminyak, Kuta, Ubud, Gianyar', sortOrder: 2 },
    { userId: agentUser3.id, name: 'Raka Pratama', title: 'Commercial Property Specialist', photo: IMAGES.agent3, whatsapp: '6281234567893', email: 'raka@properti.com', bio: 'Spesialis properti komersial: ruko, gudang, kantor, dan tanah. Menangani client corporate dan investor properti di Jawa Barat dan Jakarta.', areaSpec: 'Jakarta, Bogor, Bandung, Semarang', sortOrder: 3 },
    { userId: agentUser4.id, name: 'Dewi Anggraini', title: 'Residential Agent', photo: IMAGES.agent4, whatsapp: '6281234567894', email: 'dewi@properti.com', bio: 'Fokus pada properti residensial entry-level hingga mid-range. Membantu keluarga muda menemukan rumah impian pertama mereka dengan harga terjangkau.', areaSpec: 'Bandung Timur, Cibiru, Cimahi, Bogor', sortOrder: 4 },
  ];

  for (const a of agents) {
    await db.agentProfile.upsert({ where: { userId: a.userId }, update: {}, create: { ...a, isActive: true } });
  }
  console.log('✅ Users & agents seeded (1 admin, 4 agents)');

  // ============ ARTICLE CATEGORIES ============
  const catMap: Record<string, string> = {};
  for (const cat of [
    { name: 'Tips Properti', slug: 'tips-properti', description: 'Tips dan panduan seputar properti' },
    { name: 'Beranda Properti', slug: 'beranda-properti', description: 'Berita terbaru dunia properti' },
    { name: 'Hukum Properti', slug: 'hukum-properti', description: 'Informasi hukum properti' },
    { name: 'Desain Rumah', slug: 'desain-rumah', description: 'Inspirasi desain dan arsitektur' },
    { name: 'Investasi', slug: 'investasi', description: 'Panduan investasi properti' },
  ]) {
    const created = await db.articleCategory.upsert({ where: { slug: cat.slug }, update: cat, create: cat });
    catMap[cat.slug] = created.id;
  }
  console.log('✅ Article categories seeded');

  // ============ HELPER: get property type id ============
  const typeIds: Record<string, string> = {};
  for (const slug of ['rumah','tanah','ruko','apartemen','villa','gudang','kantor','kost','kavling','komersial']) {
    const pt = await db.propertyType.findFirst({ where: { slug } });
    if (pt) typeIds[slug] = pt.id;
  }

  // ============ PROPERTIES (24 total) ============
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const propertyData: any[] = [
    // === RUMAH MEWAH ===
    {
      code: 'PRP-2024-001', title: 'Rumah Mewah Dago Hill dengan Kolam Renang',
      slug: 'rumah-mewah-dago-hill-bandung',
      description: '<p>Dijual rumah mewah eksklusif di kawasan Dago Hill, Bandung. Rumah ini memiliki desain modern minimalis dengan pemandangan kota yang indah dari rooftop. Dilengkapi dengan kolam renang pribadi, taman tropis yang asri, dan smart home system terintegrasi.</p><p>Lokasi strategis dekat dengan pusat kota, sekolah internasional Bina Bangsa, rumah sakit Borromeus, dan Paris Van Java Mall. Akses jalan lebar dan keamanan 24 jam dengan sistem CCTV.</p><h3>Spesifikasi Tambahan:</h3><ul><li>Marmer import lantai utama</li><li>Kitchen set modern + island</li><li>Smart lighting & security system</li><li>Private pool 4x12m dengan heater</li><li>2-car garage + carport</li></ul>',
      propertyTypeId: typeIds['rumah'], status: 'dijual', isFeatured: true, isNego: true, isNew: true, isPublished: true,
      price: 5500000000n, priceDisplay: 'Rp 5,5 Miliar',
      cityId: bandung.id, districtId: coblong.id, villageId: (await db.village.findFirst({ where: { slug: 'dago' } }))?.id,
      address: 'Jl. Dago Hill No. 88, RT 05/RW 03, Coblong', latitude: -6.8727, longitude: 107.6329,
      landArea: 500, buildingArea: 450, bedrooms: 5, bathrooms: 4, garages: 2, floors: 3,
      electricity: '7700 Watt', waterSource: 'PDAM + Sumur Bor', certificate: 'SHM', buildingCond: 'baru', orientation: 'utara',
      facilities: JSON.stringify(['Kolam Renang','Taman Tropis','Smart Home','CCTV','Carport 2 Mobil','Gudang','Rooftop','Kitchen Set']),
      agentId: agentUser1.id, publishedAt: daysAgo(2),
      images: [IMAGES.rumahMewah1, IMAGES.rumahMewah2, IMAGES.interior1, IMAGES.pool1, IMAGES.garden1],
    },
    {
      code: 'PRP-2024-002', title: 'Rumah Modern Minimalis Setiabudi Bandung',
      slug: 'rumah-modern-minimalis-setiabudi-bandung',
      description: '<p>Rumah modern minimalis di kawasan elite Setiabudi, Bandung. Desain kontemporer dengan material premium dan pencahayaan natural yang optimal. Lingkungan asri dan tenang, sangat cocok untuk keluarga.</p><p>Dekat ITB, Ranch Market, dan terminal bus Setiabudi. Akses mudah ke tol Pasteur dalam 10 menit.</p>',
      propertyTypeId: typeIds['rumah'], status: 'dijual', isFeatured: true, isNego: true, isNew: false, isPublished: true,
      price: 3750000000n, priceDisplay: 'Rp 3,75 Miliar',
      cityId: bandung.id, districtId: setiabudi.id, villageId: (await db.village.findFirst({ where: { slug: 'setiabudi' } }))?.id,
      address: 'Jl. Setiabudi No. 145, Bandung', latitude: -6.8589, longitude: 107.6246,
      landArea: 350, buildingArea: 280, bedrooms: 4, bathrooms: 3, garages: 1, floors: 2,
      electricity: '5500 Watt', waterSource: 'PDAM', certificate: 'SHM', buildingCond: 'baru', orientation: 'timur',
      facilities: JSON.stringify(['Carport','Taman','Kitchen Set','AC 6 Unit','Water Heater']),
      agentId: agentUser1.id, publishedAt: daysAgo(5),
      images: [IMAGES.rumahMewah5, IMAGES.interior2, IMAGES.garden2, IMAGES.interior4],
    },
    {
      code: 'PRP-2024-009', title: 'Rumah Mewah Kebayoran Jakarta Selatan',
      slug: 'rumah-mewah-kebayoran-jakarta-selatan',
      description: '<p>Dijual rumah mewah di kawasan elite Kebayoran Baru, Jakarta Selatan. Lokasi premium dekat Pondok Indah Mall, Senayan City, dan Jakarta Convention Center. Rumah dengan desain mediterania klasik yang timeless.</p><p>Keamanan ketat 24 jam, one gate system. Ideal untuk ekspatriat atau keluarga executive.</p>',
      propertyTypeId: typeIds['rumah'], status: 'dijual', isFeatured: true, isNego: false, isNew: false, isPublished: true,
      price: 12000000000n, priceDisplay: 'Rp 12 Miliar',
      cityId: jaksel.id, districtId: kebayoran.id,
      address: 'Jl. Kebayoran Baru No. 23', latitude: -6.2440, longitude: 106.7835,
      landArea: 600, buildingArea: 500, bedrooms: 6, bathrooms: 5, garages: 3, floors: 2,
      electricity: '13000 Watt', waterSource: 'PDAM + Sumur Artetis', certificate: 'SHM', buildingCond: 'renovasi', orientation: 'selatan',
      facilities: JSON.stringify(['Swimming Pool','Taman Luas','Gudang','AC Central','Smart Home','Lift Pribadi','CCTV 24 Jam']),
      agentId: agentUser3.id, publishedAt: daysAgo(3),
      images: [IMAGES.rumahMewah4, IMAGES.rumahMewah3, IMAGES.interior3, IMAGES.pool2],
    },
    {
      code: 'PRP-2024-015', title: 'Rumah Minimalis Cibiru Bandung Siap Huni',
      slug: 'rumah-minimalis-cibiru-bandung',
      description: '<p>Rumah minimalis siap huni di Cibiru, Bandung Timur. Harga terjangkau untuk keluarga muda. Lingkungan aman, dekat kampus UNPAD dan ITB Jatinangor. Perumahan cluster dengan keamanan one gate.</p>',
      propertyTypeId: typeIds['rumah'], status: 'dijual', isFeatured: false, isNego: true, isNew: true, isPublished: true,
      price: 750000000n, priceDisplay: 'Rp 750 Juta',
      cityId: bandung.id, districtId: cibiru.id,
      address: 'Perumahan Griya Asri Cibiru Blok A-12', latitude: -6.9173, longitude: 107.6470,
      landArea: 120, buildingArea: 70, bedrooms: 2, bathrooms: 1, garages: 0, floors: 1,
      electricity: '1300 Watt', waterSource: 'PDAM', certificate: 'SHM', buildingCond: 'baru', orientation: 'utara',
      facilities: JSON.stringify(['Carport','Taman Depan','Kitchen Set']),
      agentId: agentUser4.id, publishedAt: daysAgo(1),
      images: [IMAGES.rumahMinimalis1, IMAGES.rumahMinimalis3, IMAGES.rumahMinimalis2],
    },
    {
      code: 'PRP-2024-016', title: 'Rumah Tropis di Bogor dengan Halaman Luas',
      slug: 'rumah-tropis-bogor-halaman-luas',
      description: '<p>Rumah tropis di kawasan Bogor dengan halaman yang sangat luas dan pohon-pohon rindang. Suasana sejuk khas Bogor. Cocok untuk keluarga yang menyukai lingkungan hijau dan natural.</p><p>15 menit dari Jungle Land, 20 menit dari Puncak. Dekat sekolah dan pasar tradisional.</p>',
      propertyTypeId: typeIds['rumah'], status: 'dijual', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: 2200000000n, priceDisplay: 'Rp 2,2 Miliar',
      cityId: bogor.id,
      address: 'Jl. Pajajaran No. 88, Bogor Selatan', latitude: -6.5971, longitude: 106.8060,
      landArea: 400, buildingArea: 200, bedrooms: 4, bathrooms: 3, garages: 1, floors: 1,
      electricity: '2200 Watt', waterSource: 'PDAM', certificate: 'SHM', buildingCond: 'second', orientation: 'timur',
      facilities: JSON.stringify(['Halaman Luas','Kebun','Carport','Gazebo','Rumah Pembantu']),
      agentId: agentUser4.id, publishedAt: daysAgo(7),
      images: [IMAGES.rumahMinimalis4, IMAGES.garden1, IMAGES.garden2],
    },
    // === VILLA ===
    {
      code: 'PRP-2024-003', title: 'Villa Modern Seminyak Bali Private Pool',
      slug: 'villa-modern-seminyak-bali-private-pool',
      description: '<p>Dijual villa modern di jantung Seminyak, Bali. Villa dengan 3 kamar tidur, private pool infinity, dan pemandangan sawah. Ideal untuk investasi sewa harian dengan ROI tinggi atau hunian pribadi.</p><p>5 menit dari pantai Seminyak, 10 menit dari Kuta. Dikelilingi restoran premium, beach club, dan shopping center.</p>',
      propertyTypeId: typeIds['villa'], status: 'dijual', isFeatured: true, isNego: true, isNew: false, isPublished: true,
      price: 8500000000n, priceDisplay: 'Rp 8,5 Miliar',
      cityId: badung.id, districtId: seminyak.id,
      address: 'Jl. Kayu Aya No. 45, Seminyak', latitude: -8.6917, longitude: 115.1668,
      landArea: 600, buildingArea: 350, bedrooms: 3, bathrooms: 3, garages: 1, floors: 2,
      electricity: '5500 Watt', waterSource: 'PDAM', certificate: 'SHM', buildingCond: 'baru', orientation: 'selatan',
      facilities: JSON.stringify(['Private Infinity Pool','Taman Tropis','Gazebo','CCTV','Staff Room','Sunset View']),
      agentId: agentUser2.id, publishedAt: daysAgo(4),
      images: [IMAGES.villa1, IMAGES.villa2, IMAGES.pool1, IMAGES.garden2, IMAGES.interior1],
    },
    {
      code: 'PRP-2024-008', title: 'Rumah Tropis Kuta Bali Kolam Renang',
      slug: 'rumah-tropis-kuta-bali-kolam-renang',
      description: '<p>Dijual rumah tropis di Kuta, Bali. Rumah dengan desain Bali modern, halaman luas, kolam renang pribadi, dan suasana tenang namun dekat pusat keramaian.</p><p>10 menit dari Bandara Ngurah Rai, dekat Pantai Kuta, Waterboom, dan Discovery Mall.</p>',
      propertyTypeId: typeIds['villa'], status: 'dijual', isFeatured: true, isNego: true, isNew: false, isPublished: true,
      price: 4200000000n, priceDisplay: 'Rp 4,2 Miliar',
      cityId: badung.id, districtId: kuta.id,
      address: 'Jl. Raya Kuta No. 200', latitude: -8.7180, longitude: 115.1686,
      landArea: 350, buildingArea: 250, bedrooms: 4, bathrooms: 3, garages: 2, floors: 2,
      electricity: '4400 Watt', waterSource: 'PDAM', certificate: 'SHM', buildingCond: 'renovasi', orientation: 'barat',
      facilities: JSON.stringify(['Kolam Renang','Taman Tropis','Bale Bengong','Carport','Bale Dangin']),
      agentId: agentUser2.id, publishedAt: daysAgo(8),
      images: [IMAGES.villa3, IMAGES.villa4, IMAGES.pool2, IMAGES.garden1],
    },
    {
      code: 'PRP-2024-017', title: 'Villa Ubud Bali Panorama Sawah dan Sungai',
      slug: 'villa-ubud-bali-panorama-sawah',
      description: '<p>Villa eksklusif di Ubud, Gianyar dengan panorama sawah terasering dan sungai mengalir di bawahnya. Villa butik dengan arsitektur Bali kontemporer. Sangat cocok untuk retreat, homestay premium, atau investasi.</p><p>5 menit dari Monkey Forest, 10 menit dari pusat Ubud. Kawasan seni dan budaya terkenal.</p>',
      propertyTypeId: typeIds['villa'], status: 'dijual', isFeatured: false, isNego: true, isNew: true, isPublished: true,
      price: 6800000000n, priceDisplay: 'Rp 6,8 Miliar',
      cityId: gianyar.id, districtId: ubud.id, villageId: (await db.village.findFirst({ where: { slug: 'ubud' } }))?.id,
      address: 'Jl. Raya Tegallalang, Ubud', latitude: -8.4312, longitude: 115.2686,
      landArea: 800, buildingArea: 300, bedrooms: 4, bathrooms: 4, garages: 1, floors: 2,
      electricity: '4400 Watt', waterSource: 'PDAM + Sumur', certificate: 'SHM', buildingCond: 'baru', orientation: 'utara',
      facilities: JSON.stringify(['Infinity Pool','View Sawah','Yoga Deck','Rice Terrace','Staff Room','Library']),
      agentId: agentUser2.id, publishedAt: daysAgo(1),
      images: [IMAGES.villa5, IMAGES.villa1, IMAGES.pool1, IMAGES.garden2],
    },
    // === APARTEMEN ===
    {
      code: 'PRP-2024-006', title: 'Apartemen Studio Fully Furnished Gateway Bandung',
      slug: 'apartemen-studio-gateway-bandung',
      description: '<p>Dijual unit apartemen studio di Gateway Ahmad Yani, Bandung. Fully furnished dengan interior modern scandinavian. View kota Bandung yang cantik dari lantai 25.</p><p>Fasilitas lengkap: kolam renang, gym, sky garden, minimarket, dan keamanan 24 jam. Lokasi strategis di pusat kota.</p>',
      propertyTypeId: typeIds['apartemen'], status: 'dijual', isFeatured: false, isNego: false, isNew: true, isPublished: true,
      price: 650000000n, priceDisplay: 'Rp 650 Juta',
      cityId: bandung.id,
      address: 'Gateway Ahmad Yani, Lt. 25 Unit A', latitude: -6.9247, longitude: 107.6353,
      landArea: 0, buildingArea: 28, bedrooms: 1, bathrooms: 1, garages: 0, floors: 0,
      electricity: '1300 Watt', waterSource: 'PDAM', certificate: 'SHGB', buildingCond: 'baru', orientation: 'barat',
      facilities: JSON.stringify(['Fully Furnished','AC','Water Heater','Kulkas','TV','WiFi']),
      agentId: agentUser1.id, publishedAt: daysAgo(3),
      images: [IMAGES.apartemen1, IMAGES.apartemen2, IMAGES.interior4],
    },
    {
      code: 'PRP-2024-018', title: 'Apartemen 2BR Mewah Sudirman Jakarta',
      slug: 'apartemen-2br-mewah-sudirman-jakarta',
      description: '<p>Unit apartemen 2 kamar di Sudirman Park, Jakarta. Layout luas dengan balkon menghadap kota. Fully furnished premium. Ideal untuk ekspatriat atau profesional muda.</p><p>Terintegrasi dengan mall, dekat MRT, Bundaran HI, dan Grand Indonesia.</p>',
      propertyTypeId: typeIds['apartemen'], status: 'disewa', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: 180000000n, priceDisplay: 'Rp 180 Juta/Tahun',
      cityId: jaksel.id,
      address: 'Sudirman Park Tower A, Lt. 35 Unit 3508', latitude: -6.2088, longitude: 106.8456,
      landArea: 0, buildingArea: 86, bedrooms: 2, bathrooms: 1, garages: 0, floors: 0,
      electricity: '3500 Watt', waterSource: 'PDAM', certificate: 'SHGB', buildingCond: 'baru', orientation: 'timur',
      facilities: JSON.stringify(['Fully Furnished','AC 3 Unit','Water Heater','Washer','Dryer','Gym','Pool']),
      agentId: agentUser3.id, publishedAt: daysAgo(6),
      images: [IMAGES.apartemen3, IMAGES.apartemen4, IMAGES.interior2, IMAGES.interior3],
    },
    // === RUKO ===
    {
      code: 'PRP-2024-005', title: 'Ruko 3 Lantai Strategis Cibiru Bandung',
      slug: 'ruko-3-lantai-strategis-cibiru-bandung',
      description: '<p>Dijual ruko 3 lantai di lokasi strategis Cibiru, Bandung. Di pinggir jalan utama dengan traffic tinggi. Cocok untuk usaha, kantor, atau investasi sewa.</p><p>Dekat kampus UNPAD, perumahan, dan pusat kegiatan masyarakat. Potensi sewa tinggi.</p>',
      propertyTypeId: typeIds['ruko'], status: 'dijual', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: 3200000000n, priceDisplay: 'Rp 3,2 Miliar',
      cityId: bandung.id, districtId: cibiru.id,
      address: 'Jl. Raya Cibiru No. 123', latitude: -6.9173, longitude: 107.6470,
      landArea: 150, buildingArea: 300, bedrooms: 0, bathrooms: 3, garages: 0, floors: 3,
      electricity: '4400 Watt', waterSource: 'PDAM', certificate: 'SHGB', buildingCond: 'second', orientation: 'barat',
      facilities: JSON.stringify(['3 Lantai','Toilet 3 Unit','Parkiran Depan','Loading Area']),
      agentId: agentUser1.id, publishedAt: daysAgo(10),
      images: [IMAGES.ruko1, IMAGES.ruko2, IMAGES.ruko3],
    },
    {
      code: 'PRP-2024-019', title: 'Ruko Premium Gandaria Jakarta Selatan',
      slug: 'ruko-premium-gandaria-jakarta-selatan',
      description: '<p>Ruko premium di kawasan Gandaria, Jakarta Selatan. Area komersial elite dengan banyak restoran dan kantor. Cocok untuk usaha F&B, retail, atau kantor startup.</p>',
      propertyTypeId: typeIds['ruko'], status: 'dijual', isFeatured: false, isNego: false, isNew: false, isPublished: true,
      price: 8500000000n, priceDisplay: 'Rp 8,5 Miliar',
      cityId: jaksel.id,
      address: 'Jl. Gandaria Tengah No. 15', latitude: -6.2450, longitude: 106.7850,
      landArea: 120, buildingArea: 250, bedrooms: 0, bathrooms: 2, garages: 0, floors: 4,
      electricity: '5500 Watt', waterSource: 'PDAM', certificate: 'SHGB', buildingCond: 'baru', orientation: 'utara',
      facilities: JSON.stringify(['4 Lantai','Toilet 2 Unit','Parkiran','CCTV','Lift Barang']),
      agentId: agentUser3.id, publishedAt: daysAgo(12),
      images: [IMAGES.ruko2, IMAGES.ruko1, IMAGES.ruko3],
    },
    // === TANAH / KAVLING ===
    {
      code: 'PRP-2024-025', title: 'Tanah Kavling Premium Lembang Bandung',
      slug: 'tanah-kavling-premium-lembang-bandung',
      description: '<p>Dijual tanah kavling premium di Lembang, Bandung. Lokasi di ketinggian 1.200 mdpl dengan udara sejuk dan pemandangan pegunungan. Cocok untuk villa, homestay, atau rumah tinggal.</p><p>Akses jalan lebar, listrik dan air tersedia. Lingkungan perumahan berkembang pesat.</p>',
      propertyTypeId: typeIds['kavling'], status: 'dijual', isFeatured: true, isNego: true, isNew: true, isPublished: true,
      price: 2800000000n, priceDisplay: 'Rp 2,8 Miliar',
      cityId: bandung.id, districtId: cidadap.id, villageId: (await db.village.findFirst({ where: { slug: 'lembang' } }))?.id,
      address: 'Jl. Raya Lembang No. 156', latitude: -6.8235, longitude: 107.6430,
      landArea: 800, buildingArea: 0, bedrooms: 0, bathrooms: 0, garages: 0, floors: 0,
      electricity: '2200 Watt', waterSource: 'Sumur Bor', certificate: 'SHM', buildingCond: null, orientation: null,
      facilities: JSON.stringify(['Akses Jalan Lebar','Listrik','Air','View Pegunungan']),
      agentId: agentUser1.id, publishedAt: daysAgo(5),
      images: [IMAGES.tanah1, IMAGES.tanah2, IMAGES.tanah3],
    },
    {
      code: 'PRP-2024-020', title: 'Tanah Strategis Ubud Bali untuk Villa',
      slug: 'tanah-strategis-ubud-bali-villa',
      description: '<p>Tanah komersial di Ubud, Bali. Lokasi premium untuk pembangunan villa, resort, atau restaurant. Pemandangan sawah terasering dan sungai. Zona kuning (komersial).</p>',
      propertyTypeId: typeIds['tanah'], status: 'dijual', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: 15000000000n, priceDisplay: 'Rp 15 Miliar',
      cityId: gianyar.id, districtId: ubud.id, villageId: (await db.village.findFirst({ where: { slug: 'ubud' } }))?.id,
      address: 'Jl. Tegallalang, Ubud, Bali', latitude: -8.4300, longitude: 115.2700,
      landArea: 1500, buildingArea: 0, bedrooms: 0, bathrooms: 0, garages: 0, floors: 0,
      electricity: null, waterSource: 'Sungai', certificate: 'SHM', buildingCond: null, orientation: null,
      facilities: JSON.stringify(['Zona Kuning','View Sawah','Akses Jalan Lebar','Dekat Tourism Area']),
      agentId: agentUser2.id, publishedAt: daysAgo(9),
      images: [IMAGES.tanah2, IMAGES.tanah1, IMAGES.tanah3],
    },
    // === GUDANG ===
    {
      code: 'PRP-2024-007', title: 'Gudang Industrial Cimahi dekat Tol',
      slug: 'gudang-industrial-cimahi-dekat-tol',
      description: '<p>Disewakan gudang industrial di Cimahi. Spesifikasi gudang besar dengan akses truk kontainer. Lokasi dekat pintu tol Cimahi.</p><p>Cocok untuk gudang distribusi, pabrik kecil, atau workshop.</p>',
      propertyTypeId: typeIds['gudang'], status: 'disewa', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: 150000000n, priceDisplay: 'Rp 150 Juta/Tahun',
      cityId: cimahi.id,
      address: 'Jl. Industri No. 88, Cimahi', latitude: -6.9264, longitude: 107.5349,
      landArea: 1000, buildingArea: 800, bedrooms: 0, bathrooms: 2, garages: 0, floors: 1,
      electricity: '3300 Watt', waterSource: 'PDAM', certificate: 'SHGB', buildingCond: 'second', orientation: null,
      facilities: JSON.stringify(['Loading Dock','Kantor','Toilet','Parkir Truk','Tinggi Atap 10m']),
      agentId: agentUser1.id, publishedAt: daysAgo(14),
      images: [IMAGES.gudang1, IMAGES.gudang2],
    },
    // === KANTOR ===
    {
      code: 'PRP-2024-021', title: 'Kantor Premium di CBD Jakarta Selatan',
      slug: 'kantor-premium-cbd-jakarta-selatan',
      description: '<p>Disewakan ruang kantor premium di gedung grade A, CBD Jakarta. Interior modern, furnished, dengan pemandangan city skyline. Ideal untuk perusahaan startup hingga corporate.</p>',
      propertyTypeId: typeIds['kantor'], status: 'disewa', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: 350000000n, priceDisplay: 'Rp 350 Juta/Tahun',
      cityId: jaksel.id,
      address: 'Sudirman Central Business District Lt. 18', latitude: -6.2080, longitude: 106.8460,
      landArea: 0, buildingArea: 200, bedrooms: 0, bathrooms: 2, garages: 0, floors: 0,
      electricity: 'included', waterSource: 'PDAM', certificate: 'SHGB', buildingCond: 'baru', orientation: null,
      facilities: JSON.stringify(['Furnished','AC Central','Meeting Room 2 Unit','Pantry','Lift','Security 24 Jam','Parking']),
      agentId: agentUser3.id, publishedAt: daysAgo(4),
      images: [IMAGES.kantor1, IMAGES.kantor2, IMAGES.interior3],
    },
    // === KOST ===
    {
      code: 'PRP-2024-022', title: 'Kost Eksklusif Dekat ITB Bandung',
      slug: 'kost-eksklusif-dekat-itb-bandung',
      description: '<p>Kost eksklusif modern dekat ITB dan Unpar, Bandung. 20 kamar fully furnished dengan fasilitas lengkap. Target mahasiswa dan profesional muda.</p><p>ROI sewa 15% per tahun. Semua kamar terisi penuh.</p>',
      propertyTypeId: typeIds['kost'], status: 'dijual', isFeatured: false, isNego: true, isNew: true, isPublished: true,
      price: 2500000000n, priceDisplay: 'Rp 2,5 Miliar',
      cityId: bandung.id, districtId: coblong.id,
      address: 'Jl. Ganesha No. 10, Coblong', latitude: -6.8710, longitude: 107.6105,
      landArea: 200, buildingArea: 350, bedrooms: 20, bathrooms: 20, garages: 4, floors: 3,
      electricity: '4400 Watt', waterSource: 'PDAM', certificate: 'SHM', buildingCond: 'baru', orientation: null,
      facilities: JSON.stringify(['20 Kamar','WiFi','CCTV','Parkir Motor 10','Parkir Mobil 4','Laundry Area','R. Tamu','Dapur Bersama']),
      agentId: agentUser1.id, publishedAt: daysAgo(2),
      images: [IMAGES.kost1, IMAGES.kost2, IMAGES.interior4],
    },
    // === RUMAH TAMBAHAN ===
    {
      code: 'PRP-2024-023', title: 'Rumah Cluster Sukasari Bandung',
      slug: 'rumah-cluster-sukasari-bandung',
      description: '<p>Rumah di cluster eksklusif Sukasari, Bandung. Desain modern minimalis, one gate system. Lingkungan bersih, aman, dan nyaman untuk keluarga.</p>',
      propertyTypeId: typeIds['rumah'], status: 'dijual', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: 1850000000n, priceDisplay: 'Rp 1,85 Miliar',
      cityId: bandung.id, districtId: sukasari.id,
      address: 'Jl. Sukasari No. 77, Bandung', latitude: -6.8791, longitude: 107.6094,
      landArea: 200, buildingArea: 150, bedrooms: 3, bathrooms: 2, garages: 1, floors: 2,
      electricity: '2200 Watt', waterSource: 'PDAM', certificate: 'SHM', buildingCond: 'baru', orientation: 'timur',
      facilities: JSON.stringify(['Carport','Taman Depan','Kitchen Set','AC','One Gate System']),
      agentId: agentUser4.id, publishedAt: daysAgo(6),
      images: [IMAGES.rumahMinimalis2, IMAGES.interior1, IMAGES.garden1],
    },
    {
      code: 'PRP-2024-024', title: 'Rumah Townhouse Elite Yogyakarta',
      slug: 'rumah-townhouse-elite-yogyakarta',
      description: '<p>Townhouse eksklusif di Yogyakarta. Konsep semi-detached house dengan private garden. Dekat UGM, Malioboro, dan kawasan budaya Yogyakarta.</p>',
      propertyTypeId: typeIds['rumah'], status: 'dijual', isFeatured: false, isNego: false, isNew: true, isPublished: true,
      price: 2800000000n, priceDisplay: 'Rp 2,8 Miliar',
      cityId: yogya.id,
      address: 'Jl. Kaliurang Km 5 No. 88', latitude: -7.7575, longitude: 110.3790,
      landArea: 180, buildingArea: 160, bedrooms: 3, bathrooms: 2, garages: 1, floors: 2,
      electricity: '2200 Watt', waterSource: 'PDAM', certificate: 'SHM', buildingCond: 'baru', orientation: 'utara',
      facilities: JSON.stringify(['Private Garden','Carport','Smart Lock','AC 3 Unit','Kitchen Set']),
      agentId: agentUser3.id, publishedAt: daysAgo(1),
      images: [IMAGES.rumahMewah2, IMAGES.interior4, IMAGES.garden2],
    },
    // === TERJUAL ===
    {
      code: 'PRP-2024-010', title: 'Rumah Lantai 2 Babakan Ciparay Bandung [TERJUAL]',
      slug: 'rumah-2-lantai-babakan-ciparay-bandung',
      description: '<p>Rumah 2 lantai di Babakan Ciparay, Bandung. Lokasi dekat pusat kecamatan. Rumah luas cocok untuk keluarga besar. Sudah terjual.</p>',
      propertyTypeId: typeIds['rumah'], status: 'terjual', isFeatured: false, isNego: false, isNew: false, isPublished: true,
      price: 950000000n, priceDisplay: 'Rp 950 Juta',
      cityId: bandung.id, districtId: babakan.id,
      address: 'Jl. Babakan Ciparay No. 55', latitude: -6.9300, longitude: 107.6800,
      landArea: 180, buildingArea: 160, bedrooms: 4, bathrooms: 2, garages: 1, floors: 2,
      electricity: '2200 Watt', waterSource: 'PDAM', certificate: 'SHM', buildingCond: 'second', orientation: 'selatan',
      facilities: JSON.stringify(['Carport','Taman','Gudang Kecil']),
      agentId: agentUser4.id, publishedAt: daysAgo(30),
      images: [IMAGES.rumahMinimalis3, IMAGES.rumahMinimalis1],
    },
    {
      code: 'PRP-2024-011', title: 'Villa Canggu Bali Tepi Pantai [TERJUAL]',
      slug: 'villa-canggu-bali-tepi-pantai',
      description: '<p>Villa mewah tepi pantai di Canggu, Bali. Private pool, 4 bedroom, sunset view. Sudah terjual.</p>',
      propertyTypeId: typeIds['villa'], status: 'terjual', isFeatured: false, isNego: false, isNew: false, isPublished: true,
      price: 15000000000n, priceDisplay: 'Rp 15 Miliar',
      cityId: badung.id,
      address: 'Jl. Batu Mejan, Canggu, Badung', latitude: -8.6430, longitude: 115.1230,
      landArea: 700, buildingArea: 450, bedrooms: 4, bathrooms: 4, garages: 2, floors: 2,
      electricity: '7700 Watt', waterSource: 'PDAM + Sumur', certificate: 'SHM', buildingCond: 'baru', orientation: 'barat',
      facilities: JSON.stringify(['Private Pool','Beach Access','Sunset View','CCTV','Staff Room','Library']),
      agentId: agentUser2.id, publishedAt: daysAgo(60),
      images: [IMAGES.villa4, IMAGES.villa5, IMAGES.pool2],
    },
  ];

  for (const p of propertyData) {
    const existing = await db.property.findUnique({ where: { code: p.code } });
    if (!existing) {
      const imgs = p.images || [];
      const mainImg = imgs[0] || '';
      const { images: _i, ...propertyFields } = p;
      const created = await db.property.create({ data: { ...propertyFields, mainImage: mainImg } });
      if (imgs.length > 0) {
        await db.propertyImage.createMany({
          data: imgs.map((url: string, idx: number) => ({
            propertyId: created.id,
            url,
            altText: `${p.title} - foto ${idx + 1}`,
            sortOrder: idx + 1,
          })),
        });
      }
    }
  }
  console.log(`✅ Properties seeded (${propertyData.length} properties with real images)`);

  // ============ ARTICLES (8 total) ============
  const articles = [
    {
      title: 'Tips Memilih Rumah Pertama untuk Milenial', slug: 'tips-memilih-rumah-pertama-milenial',
      content: '<p>Membeli rumah pertama adalah milestone penting dalam kehidupan. Namun, bagi generasi milenial, proses ini bisa menjadi tantangan tersendiri. Berikut adalah tips yang bisa membantu Anda:</p><h3>1. Tentukan Anggaran</h3><p>Langkah pertama adalah menentukan berapa anggaran yang Anda miliki. Pertimbangkan penghasilan bulanan, tabungan, dan kemampuan cicilan KPR.</p><h3>2. Pilih Lokasi yang Strategis</h3><p>Lokasi adalah faktor utama. Pilih lokasi yang dekat dengan tempat kerja, fasilitas publik, dan memiliki potensi kenaikan harga.</p><h3>3. Perhatikan Legalitas</h3><p>Pastikan sertifikat tanah sudah jelas dan tidak bermasalah. Sertifikat SHM (Sertifikat Hak Milik) adalah yang paling aman.</p><h3>4. Inspeksi Fisik</h3><p>Lakukan inspeksi fisik secara langsung. Periksa kondisi bangunan, plumbing, listrik, dan struktur.</p><h3>5. Bandingkan Harga</h3><p>Jangan terburu-buru. Bandingkan harga properti di lokasi yang sama untuk mendapatkan penawaran terbaik.</p>',
      excerpt: 'Panduan lengkap untuk generasi milenial yang ingin membeli rumah pertama.',
      categoryId: catMap['tips-properti'], tags: JSON.stringify(['rumah','milenial','tips','KPR']),
      featuredImage: IMAGES.article1, isPublished: true, publishedAt: daysAgo(3), authorId: adminUser.id, viewCount: 1250,
    },
    {
      title: 'Tren Harga Properti 2024: Naik atau Turun?', slug: 'tren-harga-properti-2024',
      content: '<p>Harga properti di Indonesia terus menunjukkan tren kenaikan sepanjang 2024. Pertumbuhan ini didorong oleh beberapa faktor utama termasuk infrastruktur baru dan meningkatnya demand.</p><h3>Faktor Pendorong</h3><p>Pembangunan infrastruktur baru seperti kereta cepat Jakarta-Bandung dan tol baru memberikan dampak signifikan terhadap harga properti.</p><h3>Kota dengan Kenaikan Tertinggi</h3><p>Bandung Utara mengalami kenaikan 15-20%. Bali (Seminyak, Canggu) naik 20-30%. Jakarta Selatan tetap stabil dengan kenaikan 8-10%.</p><h3>Prediksi 2025</h3><p>Harga properti diprediksi naik 10-15% di tahun 2025 didukung demand tinggi dan limited supply.</p>',
      excerpt: 'Analisis tren harga properti Indonesia 2024. Kota mana yang naik tertinggi?',
      categoryId: catMap['beranda-properti'], tags: JSON.stringify(['harga properti','tren','investasi','2024']),
      featuredImage: IMAGES.article2, isPublished: true, publishedAt: daysAgo(7), authorId: adminUser.id, viewCount: 890,
    },
    {
      title: 'Panduan Lengkap KPR: Dari Pengajuan hingga Akad', slug: 'panduan-lengkap-kpr-pengajuan-akad',
      content: '<p>Kredit Pemilikan Rumah (KPR) adalah solusi terbaik untuk memiliki rumah impian. Namun, prosesnya bisa membingungkan bagi yang pertama kali.</p><h3>Persiapan Dokumen</h3><p>Dokumen yang diperlukan: KTP, KK, NPWP, slip gaji 3 bulan terakhir, rekening koran, dan surat keterangan kerja.</p><h3>Pilih Bank yang Tepat</h3><p>Bandingkan suku bunga, tenor, dan persyaratan dari beberapa bank. Setiap bank memiliki keunggulan masing-masing.</p><h3>Proses Penilaian</h3><p>Bank akan menilai jaminan properti dan kelayakan kredit Anda. Proses ini biasanya memakan waktu 2-4 minggu.</p><h3>Akad Kredit</h3><p>Setelah disetujui, Anda akan dijadwalkan untuk akad kredit. Pastikan semua dokumen sudah lengkap.</p>',
      excerpt: 'Panduan lengkap tentang KPR dari awal hingga akhir. Persiapan, bank, dan proses.',
      categoryId: catMap['investasi'], tags: JSON.stringify(['KPR','bank','kredit','rumah']),
      featuredImage: IMAGES.article3, isPublished: true, publishedAt: daysAgo(10), authorId: agentUser1.id, viewCount: 2100,
    },
    {
      title: 'Desain Interior Rumah Minimalis Modern 2024', slug: 'desain-interior-rumah-minimalis-modern-2024',
      content: '<p>Tren desain interior rumah minimalis modern terus berkembang di 2024. Berikut inspirasi yang bisa Anda terapkan untuk rumah impian Anda.</p><h3>1. Warna Netral + Aksen</h3><p>Gunakan warna netral seperti putih, abu-abu, dan beige sebagai base. Tambahkan aksen warna melalui dekorasi, bantal, atau tanaman hias.</p><h3>2. Material Natural</h3><p>Gunakan material alami seperti kayu, batu, dan rotan untuk memberikan kehangatan pada ruangan.</p><h3>3. Pencahayaan</h3><p>Manfaatkan pencahayaan natural semaksimal mungkin. Gunakan gorden tipis dan cermin untuk memperluas ruangan.</p><h3>4. Furnitur Multifungsi</h3><p>Pilih furnitur yang serbaguna untuk menghemat ruang. Sofa bed, meja lipat, dan rak dinding adalah pilihan tepat.</p>',
      excerpt: 'Inspirasi desain interior rumah minimalis modern tahun 2024.',
      categoryId: catMap['desain-rumah'], tags: JSON.stringify(['desain','interior','minimalis','rumah']),
      featuredImage: IMAGES.article4, isPublished: true, publishedAt: daysAgo(5), authorId: adminUser.id, viewCount: 3400,
    },
    {
      title: 'Mengenal Jenis Sertifikat Tanah di Indonesia', slug: 'mengenal-jenis-sertifikat-tanah-indonesia',
      content: '<p>Sertifikat tanah adalah dokumen yang membuktikan kepemilikan suatu bidang tanah. Di Indonesia, ada beberapa jenis sertifikat yang perlu Anda ketahui sebelum membeli properti.</p><h3>SHM (Sertifikat Hak Milik)</h3><p>Jenis sertifikat paling kuat dan aman. Pemilik memiliki hak penuh atas tanah selamanya. Bisa dijual, dibeli, diwariskan, dan dijadikan jaminan bank.</p><h3>SHGB (Sertifikat Hak Guna Bangunan)</h3><p>Berlaku selama 30 tahun dan bisa diperpanjang. Bisa dialihkan ke pihak lain. Biasanya untuk apartemen atau properti di atas tanah negara.</p><h3>AJB (Akta Jual Beli)</h3><p>Bukti transaksi jual beli. Bukan sertifikat kepemilikan. Perlu diikuti proses balik nama untuk mendapatkan SHM/SHGB.</p><h3>Girik/Surat Keterangan Desa</h3><p>Dokumen paling awal. Bukan bukti kepemilikan yang sah. Perlu ditingkatkan menjadi SHM melalui proses sertifikasi.</p>',
      excerpt: 'Panduan lengkap jenis sertifikat tanah: SHM, SHGB, AJB, dan Girik.',
      categoryId: catMap['hukum-properti'], tags: JSON.stringify(['sertifikat','tanah','hukum','SHM','SHGB']),
      featuredImage: IMAGES.article5, isPublished: true, publishedAt: daysAgo(15), authorId: agentUser3.id, viewCount: 5600,
    },
    {
      title: 'Investasi Properti vs Saham: Mana yang Lebih Baik?', slug: 'investasi-properti-vs-saham',
      content: '<p>Investasi properti dan saham keduanya memiliki kelebihan dan kekurangan. Berikut perbandingan yang perlu Anda pertimbangkan.</p><h3>Properti</h3><p>Kelebihan: Passive income dari sewa, capital appreciation, leverage tinggi, aset nyata. Kekurangan: Modal besar, illiquid, perawatan rutin.</p><h3>Saham</h3><p>Kelebihan: Modal kecil, liquid, diversifikasi mudah. Kekurangan: Volatilitas tinggi, tidak menghasilkan passive income (kecuali dividen).</p><h3>Kesimpulan</h3><p>Kombinasi keduanya adalah strategi terbaik. Gunakan properti untuk passive income dan saham untuk pertumbuhan jangka panjang.</p>',
      excerpt: 'Perbandingan investasi properti vs saham. Mana yang cocok untuk Anda?',
      categoryId: catMap['investasi'], tags: JSON.stringify(['investasi','properti','saham','keuangan']),
      featuredImage: IMAGES.article6, isPublished: true, publishedAt: daysAgo(20), authorId: adminUser.id, viewCount: 4200,
    },
    {
      title: '10 Kesalahan Umum Saat Membeli Rumah', slug: '10-kesalahan-umum-membeli-rumah',
      content: '<p>Membeli rumah adalah keputusan besar. Hindari 10 kesalahan umum berikut agar Anda tidak menyesal di kemudian hari.</p><h3>1. Tidak Meny survey Lokasi</h3><p> selalu kunjungi lokasi di berbagai waktu untuk mengetahui kondisi lingkungan.</p><h3>2. Melebihi Anggaran</h3><p>Tetap pada budget yang sudah ditentukan. Jangan tergoda rumah di luar kemampuan.</p><h3>3. Mengabaikan Legalitas</h3><p>Periksa sertifikat dan legalitas sebelum transaksi. Lebih baik meminta bantuan notaris.</p><h3>4. Tidak Memeriksa Struktur Bangunan</h3><p>Gunakan jasa inspektor properti profesional untuk memeriksa kondisi bangunan.</p><h3>5. Lupa Biaya Tambahan</h3><p>Perhitungkan biaya notaris, pajak, renovasi, dan furnitur tambahan.</p>',
      excerpt: 'Hindari 10 kesalahan fatal saat membeli rumah pertama Anda.',
      categoryId: catMap['tips-properti'], tags: JSON.stringify(['tips','rumah','kesalahan','beli properti']),
      featuredImage: IMAGES.article7, isPublished: true, publishedAt: daysAgo(25), authorId: agentUser2.id, viewCount: 7800,
    },
    {
      title: 'Bali vs Bandung: Mana yang Lebih Baik untuk Investasi Properti?', slug: 'bali-vs-bandung-investasi-properti',
      content: '<p>Bali dan Bandung adalah dua kota paling populer untuk investasi properti di Indonesia. Mana yang lebih cocok untuk Anda?</p><h3>Bali</h3><p>Kelebihan: ROI sewa harian sangat tinggi (15-25%), demand turis internasional, capital appreciation kuat. Kekurangan: Harga sudah tinggi, regulasi sewa ketat.</p><h3>Bandung</h3><p>Kelebihan: Harga masih terjangkau, infrastruktur berkembang pesat (kereta cepat), demand dari Jakarta. Kekurangan: ROI lebih rendah (8-12%), kompetisi sewa tinggi.</p><h3>Verdict</h3><p>Untuk investasi jangka pendek & passive income: Bali. Untuk capital appreciation jangka panjang: Bandung.</p>',
      excerpt: 'Perbandingan investasi properti Bali vs Bandung. ROI, prospek, dan risiko.',
      categoryId: catMap['investasi'], tags: JSON.stringify(['bali','bandung','investasi','properti','ROI']),
      featuredImage: IMAGES.article8, isPublished: true, publishedAt: daysAgo(8), authorId: adminUser.id, viewCount: 6200,
    },
  ];

  for (const a of articles) {
    const existing = await db.article.findUnique({ where: { slug: a.slug } });
    if (!existing) {
      await db.article.create({ data: a as any });
    }
  }
  console.log(`✅ Articles seeded (${articles.length} articles with images)`);

  // ============ LEADS (15 total) ============
  const leads = [
    { name: 'Ahmad Rizky', whatsapp: '628987654321', email: 'ahmad@email.com', propertyName: 'Rumah Mewah Dago Hill', locationInterest: 'Bandung', budget: '5-6 Miliar', propertyTypeInterest: 'Rumah', needType: 'beli', source: 'website', status: 'baru', notes: 'Tertarik dengan properti di Dago Hill. Minta jadwal survei weekend depan.', agentId: agentUser1.id, nextFollowUp: daysAgo(-3).toISOString() },
    { name: 'Linda Permata', whatsapp: '628765432109', email: 'linda@email.com', propertyName: 'Villa Modern Seminyak Bali', locationInterest: 'Bali', budget: '8-10 Miliar', propertyTypeInterest: 'Villa', needType: 'beli', source: 'instagram', status: 'prospek', notes: 'Sudah survei. Sangat tertarik. Menunggu keputusan dari suami.', agentId: agentUser2.id, nextFollowUp: daysAgo(-1).toISOString() },
    { name: 'Doni Firmansyah', whatsapp: '628654321098', propertyName: 'Ruko 3 Lantai Cibiru', locationInterest: 'Bandung', budget: '3-4 Miliar', propertyTypeInterest: 'Ruko', needType: 'beli', source: 'google_ads', status: 'dihubungi', notes: 'Sudah dihubungi via WhatsApp. Respons positif. Minta info detail.', },
    { name: 'Ratna Sari', whatsapp: '628543210987', email: 'ratna@email.com', propertyTypeInterest: 'Apartemen', needType: 'sewa', source: 'facebook_ads', status: 'baru', notes: 'Mencari apartemen sewa di area Bandung, budget 5-10 juta/bulan.' },
    { name: 'Hendra Wijaya', whatsapp: '628432109876', propertyName: 'Tanah Kavling Premium Lembang', locationInterest: 'Lembang', budget: '2-3 Miliar', propertyTypeInterest: 'Kavling', needType: 'investasi', source: 'referral', status: 'negosiasi', notes: 'Negosiasi harga sedang berjalan. Menawar Rp 2,5 Miliar.', agentId: agentUser1.id, nextFollowUp: daysAgo(-2).toISOString() },
    { name: 'Maya Anggraini', whatsapp: '628321098765', propertyTypeInterest: 'Rumah', needType: 'beli', source: 'website', status: 'spam', notes: 'Nomor tidak aktif, email bounce.' },
    { name: 'Tommy Kusuma', whatsapp: '628210987654', email: 'tommy@company.com', propertyName: 'Kantor Premium CBD Jakarta', locationInterest: 'Jakarta', budget: '300-400 Juta/tahun', propertyTypeInterest: 'Kantor', needType: 'sewa', source: 'google_ads', status: 'prospek', notes: 'Perusahaan startup butuh kantor untuk 15 orang. Sangat tertarik.', agentId: agentUser3.id, nextFollowUp: daysAgo(-4).toISOString() },
    { name: 'Sarah Amelia', whatsapp: '628198765432', email: 'sarah@email.com', propertyName: 'Villa Ubud Bali', locationInterest: 'Ubud', budget: '5-7 Miliar', propertyTypeInterest: 'Villa', needType: 'investasi', source: 'website', status: 'baru', notes: 'Ingin investasi villa untuk disewakan ke turis. Minta ROI info.', agentId: agentUser2.id },
    { name: 'Bambang Prasetyo', whatsapp: '628087654321', propertyName: 'Rumah Mewah Kebayoran', locationInterest: 'Jakarta Selatan', budget: '10-15 Miliar', propertyTypeInterest: 'Rumah', needType: 'beli', source: 'referral', status: 'survei', notes: 'Jadwal survei tanggal 28. Minta arahan dari agen untuk persiapan.', agentId: agentUser3.id, nextFollowUp: daysAgo(-5).toISOString() },
    { name: 'Diana Putri', whatsapp: '628076543210', email: 'diana@email.com', propertyTypeInterest: 'Rumah', needType: 'beli', source: 'facebook_ads', status: 'baru', notes: 'Pertama kali beli rumah. Budget 500-800 juta di area Bandung timur.', agentId: agentUser4.id },
    { name: 'Rudi Hermawan', whatsapp: '628065432109', propertyName: 'Gudang Industrial Cimahi', locationInterest: 'Cimahi', budget: '150 Juta/tahun', propertyTypeInterest: 'Gudang', needType: 'sewa', source: 'website', status: 'closing', notes: 'Deal! Akan signing kontrak minggu depan. Dokumen sedang disiapkan.', agentId: agentUser1.id },
    { name: 'Indah Permatasari', whatsapp: '628054321098', email: 'indah@email.com', propertyName: 'Kost Eksklusif ITB', locationInterest: 'Bandung', budget: '2-3 Miliar', propertyTypeInterest: 'Kost', needType: 'investasi', source: 'whatsapp', status: 'prospek', notes: 'Tertarik investasi kost karena ROI tinggi. Minta data penghuni saat ini.', agentId: agentUser1.id, nextFollowUp: daysAgo(-6).toISOString() },
    { name: 'Agus Setiawan', whatsapp: '628043210987', propertyTypeInterest: 'Tanah', needType: 'investasi', source: 'website', status: 'baru', notes: 'Cari tanah di Lembang atau Cisarua untuk dibangun villa.', agentId: agentUser4.id },
    { name: 'Fitri Handayani', whatsapp: '628032109876', email: 'fitri@email.com', propertyName: 'Apartemen 2BR Sudirman', locationInterest: 'Jakarta', budget: '150-200 Juta/tahun', propertyTypeInterest: 'Apartemen', needType: 'sewa', source: 'google_ads', status: 'dihubungi', notes: 'Sudah WA. Minta foto unit dan detail fasilitas gedung.', agentId: agentUser3.id },
    { name: 'Yoga Pratama', whatsapp: '628021098765', propertyName: 'Rumah Tropis Kuta Bali', locationInterest: 'Bali', budget: '3-5 Miliar', propertyTypeInterest: 'Rumah', needType: 'beli', source: 'instagram', status: 'gagal', notes: 'Budget tidak mencukupi. Minta rekomendasi properti lebih murah di Bali.', agentId: agentUser2.id },
  ];

  for (const l of leads) {
    const existing = await db.lead.findFirst({ where: { whatsapp: l.whatsapp } });
    if (!existing) {
      await db.lead.create({ data: l as any });
    }
  }
  console.log(`✅ Leads seeded (${leads.length} leads)`);

  // ============ WEBSITE SETTINGS ============
  const settings = [
    // General
    { key: 'site_name', value: 'PropNusa', group: 'general' },
    { key: 'site_tagline', value: 'Jual Beli Properti Terpercaya', group: 'general' },
    { key: 'site_logo', value: IMAGES.logo, group: 'general' },
    { key: 'site_favicon', value: '', group: 'general' },
    { key: 'site_description', value: 'Platform jual beli properti terpercaya di Indonesia. Temukan rumah, tanah, ruko, apartemen, villa, dan properti lainnya.', group: 'general' },
    // Contact
    { key: 'contact_phone', value: '+6281234567890', group: 'contact' },
    { key: 'contact_whatsapp', value: '6281234567890', group: 'contact' },
    { key: 'contact_email', value: 'info@propnusa.com', group: 'contact' },
    { key: 'contact_address', value: 'Jl. Asia Afrika No. 88, Bandung, Jawa Barat 40261', group: 'contact' },
    { key: 'contact_map_embed', value: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d253840.65295069!2d107.43659!3d-6.90344!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e6398252477f%3A0x146a1f93d3e815b2!2sKota+Bandung!5e0!3m2!1sid!2sid!4v1700000000000', group: 'contact' },
    { key: 'contact_working_hours', value: 'Senin - Sabtu: 09:00 - 17:00 WIB', group: 'contact' },
    // Social
    { key: 'social_facebook', value: 'https://facebook.com/propnusa', group: 'social' },
    { key: 'social_instagram', value: 'https://instagram.com/propnusa', group: 'social' },
    { key: 'social_youtube', value: 'https://youtube.com/@propnusa', group: 'social' },
    { key: 'social_tiktok', value: 'https://tiktok.com/@propnusa', group: 'social' },
    { key: 'social_linkedin', value: '', group: 'social' },
    // SEO
    { key: 'seo_meta_title', value: 'PropNusa - Jual Beli Properti Terpercaya di Indonesia', group: 'seo' },
    { key: 'seo_meta_description', value: 'Temukan properti impian Anda di PropNusa. Jual beli rumah, tanah, ruko, apartemen, villa dengan harga terbaik di seluruh Indonesia.', group: 'seo' },
    { key: 'seo_meta_keywords', value: 'properti, jual beli, rumah, tanah, ruko, apartemen, villa, Indonesia', group: 'seo' },
    { key: 'seo_canonical_url', value: 'https://www.propnusa.com', group: 'seo' },
    { key: 'seo_robots', value: 'index, follow', group: 'seo' },
    { key: 'seo_og_image', value: '', group: 'seo' },
    // Analytics
    { key: 'analytics_ga_id', value: '', group: 'analytics' },
    { key: 'analytics_gtm_id', value: '', group: 'analytics' },
    { key: 'analytics_fb_pixel', value: '', group: 'analytics' },
    { key: 'analytics_head_scripts', value: '', group: 'analytics' },
    { key: 'analytics_body_scripts', value: '', group: 'analytics' },
    // Extras
    { key: 'whatsapp_number', value: '6281234567890', group: 'contact' },
    { key: 'cta_whatsapp_message', value: 'Halo, saya tertarik dengan properti di PropNusa. Bisa dibantu info lebih lanjut?', group: 'contact' },
    { key: 'kpr_interest_rate', value: '7', group: 'general' },
  ];
  for (const s of settings) {
    await db.websiteSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }
  console.log('✅ Website settings seeded');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('═══════════════════════════════════════════');
  console.log(`📊 Total Properties : ${propertyData.length}`);
  console.log(`📊 Total Articles    : ${articles.length}`);
  console.log(`📊 Total Leads       : ${leads.length}`);
  console.log(`📊 Total Agents      : 4`);
  console.log(`📊 Locations         : 6 provinces, 10 cities, 12 districts`);
  console.log('═══════════════════════════════════════════');
  console.log('📧 Admin : admin@properti.com / admin123');
  console.log('📧 Agent1: agen1@properti.com / admin123');
  console.log('📧 Agent2: agen2@properti.com / admin123');
  console.log('📧 Agent3: agen3@properti.com / admin123');
  console.log('📧 Agent4: agen4@properti.com / admin123');
}

seed()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
