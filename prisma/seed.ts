import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
  // Pabrik
  pabrik1: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&h=600&fit=crop&q=80',
  pabrik2: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop&q=80',
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
  // Article images
  article1: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop&q=80',
  article2: 'https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?w=800&h=400&fit=crop&q=80',
  article3: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop&q=80',
  article4: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=400&fit=crop&q=80',
  article5: 'https://images.unsplash.com/photo-1518135714426-c18f5ffb6f4d?w=800&h=400&fit=crop&q=80',
};

// ============ SLUG HELPER ============
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function seed() {
  console.log('🌱 Seeding PropNusa database...\n');

  // ============ 1. PROPERTY TYPES (11 types) ============
  console.log('📦 Seeding property types...');
  const propertyTypes = [
    { name: 'Rumah', slug: 'rumah', icon: 'Home', sortOrder: 1 },
    { name: 'Tanah', slug: 'tanah', icon: 'MapPin', sortOrder: 2 },
    { name: 'Ruko', slug: 'ruko', icon: 'Store', sortOrder: 3 },
    { name: 'Apartemen', slug: 'apartemen', icon: 'Building', sortOrder: 4 },
    { name: 'Villa', slug: 'villa', icon: 'Trees', sortOrder: 5 },
    { name: 'Gudang', slug: 'gudang', icon: 'Warehouse', sortOrder: 6 },
    { name: 'Kantor', slug: 'kantor', icon: 'Briefcase', sortOrder: 7 },
    { name: 'Kost', slug: 'kost', icon: 'Bed', sortOrder: 8 },
    { name: 'Pabrik', slug: 'pabrik', icon: 'Factory', sortOrder: 9 },
    { name: 'Kavling', slug: 'kavling', icon: 'Grid3x3', sortOrder: 10 },
    { name: 'Komersial', slug: 'komersial', icon: 'ShoppingBag', sortOrder: 11 },
  ];
  for (const pt of propertyTypes) {
    await db.propertyType.upsert({ where: { slug: pt.slug }, update: pt, create: pt });
  }
  console.log('  ✅ 11 property types seeded');

  // ============ 2. PROVINCES (3) ============
  console.log('📦 Seeding provinces...');
  const provJB = await db.province.upsert({ where: { slug: 'jawa-barat' }, update: { name: 'Jawa Barat' }, create: { name: 'Jawa Barat', slug: 'jawa-barat' } });
  const provJT = await db.province.upsert({ where: { slug: 'jawa-timur' }, update: { name: 'Jawa Timur' }, create: { name: 'Jawa Timur', slug: 'jawa-timur' } });
  const provBali = await db.province.upsert({ where: { slug: 'bali' }, update: { name: 'Bali' }, create: { name: 'Bali', slug: 'bali' } });
  console.log('  ✅ 3 provinces seeded');

  // ============ 3. CITIES (5) ============
  console.log('📦 Seeding cities...');
  const cityBandung = await db.city.upsert({ where: { id: 'city-bandung' }, update: { name: 'Bandung', slug: 'bandung' }, create: { id: 'city-bandung', name: 'Bandung', slug: 'bandung', provinceId: provJB.id } });
  const cityBogor = await db.city.upsert({ where: { id: 'city-bogor' }, update: { name: 'Bogor', slug: 'bogor' }, create: { id: 'city-bogor', name: 'Bogor', slug: 'bogor', provinceId: provJB.id } });
  const citySurabaya = await db.city.upsert({ where: { id: 'city-surabaya' }, update: { name: 'Surabaya', slug: 'surabaya' }, create: { id: 'city-surabaya', name: 'Surabaya', slug: 'surabaya', provinceId: provJT.id } });
  const cityMalang = await db.city.upsert({ where: { id: 'city-malang' }, update: { name: 'Malang', slug: 'malang' }, create: { id: 'city-malang', name: 'Malang', slug: 'malang', provinceId: provJT.id } });
  const cityDenpasar = await db.city.upsert({ where: { id: 'city-denpasar' }, update: { name: 'Denpasar', slug: 'denpasar' }, create: { id: 'city-denpasar', name: 'Denpasar', slug: 'denpasar', provinceId: provBali.id } });
  console.log('  ✅ 5 cities seeded');

  // ============ 4. DISTRICTS (6) ============
  console.log('📦 Seeding districts...');
  const distCoblong = await db.district.upsert({ where: { id: 'dist-coblong' }, update: { name: 'Coblong', slug: 'coblong' }, create: { id: 'dist-coblong', name: 'Coblong', slug: 'coblong', cityId: cityBandung.id } });
  const distCidadap = await db.district.upsert({ where: { id: 'dist-cidadap' }, update: { name: 'Cidadap', slug: 'cidadap' }, create: { id: 'dist-cidadap', name: 'Cidadap', slug: 'cidadap', cityId: cityBandung.id } });
  const distCimahi = await db.district.upsert({ where: { id: 'dist-cimahi' }, update: { name: 'Cimahi', slug: 'cimahi' }, create: { id: 'dist-cimahi', name: 'Cimahi', slug: 'cimahi', cityId: cityBandung.id } });
  const distGubeng = await db.district.upsert({ where: { id: 'dist-gubeng' }, update: { name: 'Gubeng', slug: 'gubeng' }, create: { id: 'dist-gubeng', name: 'Gubeng', slug: 'gubeng', cityId: citySurabaya.id } });
  const distKuta = await db.district.upsert({ where: { id: 'dist-kuta' }, update: { name: 'Kuta', slug: 'kuta' }, create: { id: 'dist-kuta', name: 'Kuta', slug: 'kuta', cityId: cityDenpasar.id } });
  const distUbud = await db.district.upsert({ where: { id: 'dist-ubud' }, update: { name: 'Ubud', slug: 'ubud' }, create: { id: 'dist-ubud', name: 'Ubud', slug: 'ubud', cityId: cityDenpasar.id } });
  console.log('  ✅ 6 districts seeded');

  // ============ 5. USERS ============
  console.log('📦 Seeding users with real bcrypt hashes...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  console.log('  🔐 bcrypt hash generated for password "admin123"');

  const adminUser = await db.user.upsert({
    where: { email: 'admin@properti.com' },
    update: { password: hashedPassword, name: 'Administrator' },
    create: { email: 'admin@properti.com', name: 'Administrator', password: hashedPassword, role: 'super_admin', phone: '6281234567890' },
  });

  const agentUser1 = await db.user.upsert({
    where: { email: 'agen1@properti.com' },
    update: { password: hashedPassword },
    create: { email: 'agen1@properti.com', name: 'Budi Santoso', password: hashedPassword, role: 'agent', phone: '6281234567891' },
  });
  const agentUser2 = await db.user.upsert({
    where: { email: 'agen2@properti.com' },
    update: { password: hashedPassword, name: 'Siti Rahayu' },
    create: { email: 'agen2@properti.com', name: 'Siti Rahayu', password: hashedPassword, role: 'agent', phone: '6281234567892' },
  });
  const agentUser3 = await db.user.upsert({
    where: { email: 'agen3@properti.com' },
    update: { password: hashedPassword, name: 'Ahmad Wijaya' },
    create: { email: 'agen3@properti.com', name: 'Ahmad Wijaya', password: hashedPassword, role: 'agent', phone: '6281234567893' },
  });
  console.log('  ✅ 4 users seeded (1 admin, 3 agents)');

  // ============ 6. AGENT PROFILES ============
  console.log('📦 Seeding agent profiles...');
  const agentProfiles = [
    {
      userId: agentUser1.id, name: 'Budi Santoso', title: 'Senior Property Consultant',
      photo: IMAGES.agent1, whatsapp: '6281234567891', email: 'budi@properti.com',
      bio: 'Berpengalaman lebih dari 10 tahun di bidang properti Bandung. Spesialis area Dago, Setiabudi, dan Cimahi. Telah menangani ratusan transaksi properti senilai lebih dari Rp 100 Miliar.',
      areaSpec: 'Bandung Utara, Dago, Setiabudi, Cimahi', sortOrder: 1,
    },
    {
      userId: agentUser2.id, name: 'Siti Rahayu', title: 'Property Advisor Bali',
      photo: IMAGES.agent2, whatsapp: '6281234567892', email: 'siti@properti.com',
      bio: 'Ahli properti residensial dan komersial di Bali. Fokus pada rumah mewah, villa, dan apartemen premium. Berpengalaman membantu klien domestik dan internasional.',
      areaSpec: 'Denpasar, Kuta, Ubud, Gianyar', sortOrder: 2,
    },
    {
      userId: agentUser3.id, name: 'Ahmad Wijaya', title: 'Commercial Property Specialist',
      photo: IMAGES.agent3, whatsapp: '6281234567893', email: 'ahmad@properti.com',
      bio: 'Spesialis properti komersial: ruko, gudang, kantor, dan tanah. Menangani client corporate dan investor properti di Jawa Barat dan Jawa Timur.',
      areaSpec: 'Surabaya, Malang, Bogor, Bandung', sortOrder: 3,
    },
  ];
  for (const a of agentProfiles) {
    await db.agentProfile.upsert({ where: { userId: a.userId }, update: a, create: { ...a, isActive: true } });
  }
  console.log('  ✅ 3 agent profiles seeded');

  // ============ 7. WEBSITE SETTINGS (15) ============
  console.log('📦 Seeding website settings...');
  const settings = [
    // General (4)
    { key: 'site_name', value: 'PropNusa', group: 'general' },
    { key: 'site_tagline', value: 'Jual Beli Properti Terpercaya di Indonesia', group: 'general' },
    { key: 'site_description', value: 'Platform jual beli properti terpercaya di Indonesia. Temukan rumah, tanah, ruko, apartemen, villa, dan properti lainnya.', group: 'general' },
    { key: 'site_logo', value: IMAGES.article1, group: 'general' },
    // Contact (4)
    { key: 'contact_phone', value: '+6281234567890', group: 'contact' },
    { key: 'contact_whatsapp', value: '6281234567890', group: 'contact' },
    { key: 'contact_email', value: 'info@propnusa.com', group: 'contact' },
    { key: 'contact_address', value: 'Jl. Asia Afrika No. 88, Bandung, Jawa Barat 40261', group: 'contact' },
    // SEO (4)
    { key: 'seo_meta_title', value: 'PropNusa - Jual Beli Properti Terpercaya di Indonesia', group: 'seo' },
    { key: 'seo_meta_description', value: 'Temukan properti impian Anda di PropNusa. Jual beli rumah, tanah, ruko, apartemen, villa dengan harga terbaik.', group: 'seo' },
    { key: 'seo_meta_keywords', value: 'properti, jual beli, rumah, tanah, ruko, apartemen, villa, Indonesia', group: 'seo' },
    { key: 'seo_canonical_url', value: 'https://www.propnusa.com', group: 'seo' },
    // Social (3)
    { key: 'social_facebook', value: 'https://facebook.com/propnusa', group: 'social' },
    { key: 'social_instagram', value: 'https://instagram.com/propnusa', group: 'social' },
    { key: 'social_youtube', value: 'https://youtube.com/@propnusa', group: 'social' },
  ];
  for (const s of settings) {
    await db.websiteSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }
  console.log('  ✅ 15 website settings seeded');

  // ============ 8. ARTICLE CATEGORIES (5) ============
  console.log('📦 Seeding article categories...');
  const catMap: Record<string, string> = {};
  const articleCategories = [
    { name: 'Tips Properti', slug: 'tips-properti', description: 'Tips dan panduan seputar dunia properti' },
    { name: 'Berita Properti', slug: 'berita-properti', description: 'Berita terbaru dunia properti Indonesia' },
    { name: 'Panduan KPR', slug: 'panduan-kpr', description: 'Panduan lengkap Kredit Pemilikan Rumah' },
    { name: 'Investasi', slug: 'investasi', description: 'Panduan investasi properti' },
    { name: 'Hukum Properti', slug: 'hukum-properti', description: 'Informasi hukum terkait properti' },
  ];
  for (const cat of articleCategories) {
    const created = await db.articleCategory.upsert({ where: { slug: cat.slug }, update: cat, create: cat });
    catMap[cat.slug] = created.id;
  }
  console.log('  ✅ 5 article categories seeded');

  // ============ HELPER: property type ids ============
  const typeIds: Record<string, string> = {};
  for (const pt of await db.propertyType.findMany()) {
    typeIds[pt.slug] = pt.id;
  }

  // ============ 9. PROPERTIES (8 published) ============
  console.log('📦 Seeding properties...');
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const propertyData = [
    // 1. Rumah Mewah - Bandung, Coblong
    {
      code: 'PRP-2025-001',
      title: 'Rumah Mewah Dago Hill dengan Kolam Renang',
      slug: 'rumah-mewah-dago-bandung',
      description: '<p>Dijual rumah mewah eksklusif di kawasan Dago Hill, Bandung. Desain modern minimalis dengan pemandangan kota yang indah dari rooftop. Dilengkapi kolam renang pribadi, taman tropis, dan smart home system.</p><p>Lokasi strategis dekat pusat kota, sekolah internasional, dan Paris Van Java Mall. Akses jalan lebar dan keamanan 24 jam.</p>',
      propertyTypeId: typeIds['rumah'], status: 'dijual', isFeatured: true, isNego: true, isNew: true, isPublished: true,
      price: BigInt(5500000000), priceDisplay: 'Rp 5,5 Miliar',
      provinceId: provJB.id, cityId: cityBandung.id, districtId: distCoblong.id,
      address: 'Jl. Dago Hill No. 88, Coblong, Bandung', latitude: -6.8727, longitude: 107.6329,
      landArea: 500, buildingArea: 450, bedrooms: 5, bathrooms: 4, garages: 2, floors: 3,
      electricity: '7700 Watt', waterSource: 'PDAM + Sumur Bor', certificate: 'SHM', buildingCond: 'baru', orientation: 'utara',
      facilities: JSON.stringify(['Kolam Renang','Taman Tropis','Smart Home','CCTV','Carport 2 Mobil','Gudang','Rooftop']),
      agentId: agentUser1.id, publishedAt: daysAgo(2),
      images: [IMAGES.rumahMewah1, IMAGES.rumahMewah2, IMAGES.interior1, IMAGES.pool1, IMAGES.garden1],
    },
    // 2. Villa - Denpasar, Kuta
    {
      code: 'PRP-2025-002',
      title: 'Villa Modern Kuta Bali Private Pool',
      slug: 'villa-modern-kuta-bali',
      description: '<p>Dijual villa modern di jantung Kuta, Bali. Villa dengan 3 kamar tidur, private pool infinity, dan pemandangan tropis. Ideal untuk investasi sewa harian dengan ROI tinggi.</p><p>5 menit dari pantai Kuta, 10 menit dari Bandara Ngurah Rai. Dikelilingi restoran premium dan shopping center.</p>',
      propertyTypeId: typeIds['villa'], status: 'dijual', isFeatured: true, isNego: true, isNew: false, isPublished: true,
      price: BigInt(8500000000), priceDisplay: 'Rp 8,5 Miliar',
      provinceId: provBali.id, cityId: cityDenpasar.id, districtId: distKuta.id,
      address: 'Jl. Raya Kuta No. 200, Kuta, Denpasar', latitude: -8.7180, longitude: 115.1686,
      landArea: 600, buildingArea: 350, bedrooms: 3, bathrooms: 3, garages: 1, floors: 2,
      electricity: '5500 Watt', waterSource: 'PDAM', certificate: 'SHM', buildingCond: 'baru', orientation: 'selatan',
      facilities: JSON.stringify(['Private Infinity Pool','Taman Tropis','Gazebo','CCTV','Staff Room','Sunset View']),
      agentId: agentUser2.id, publishedAt: daysAgo(4),
      images: [IMAGES.villa1, IMAGES.villa2, IMAGES.pool1, IMAGES.garden2, IMAGES.interior1],
    },
    // 3. Apartemen - Surabaya, Gubeng
    {
      code: 'PRP-2025-003',
      title: 'Apartemen Studio Fully Furnished Surabaya',
      slug: 'apartemen-studio-surabaya',
      description: '<p>Dijual unit apartemen studio di Surabaya. Fully furnished dengan interior modern. View kota Surabaya yang cantik. Fasilitas lengkap: kolam renang, gym, dan keamanan 24 jam.</p>',
      propertyTypeId: typeIds['apartemen'], status: 'dijual', isFeatured: false, isNego: false, isNew: true, isPublished: true,
      price: BigInt(650000000), priceDisplay: 'Rp 650 Juta',
      provinceId: provJT.id, cityId: citySurabaya.id, districtId: distGubeng.id,
      address: 'Jl. Basuki Rahmat No. 100, Gubeng, Surabaya', latitude: -7.2575, longitude: 112.7521,
      landArea: 0, buildingArea: 28, bedrooms: 1, bathrooms: 1, garages: 0, floors: 0,
      electricity: '1300 Watt', waterSource: 'PDAM', certificate: 'SHGB', buildingCond: 'baru', orientation: 'barat',
      facilities: JSON.stringify(['Fully Furnished','AC','Water Heater','Kulkas','TV','WiFi']),
      agentId: agentUser3.id, publishedAt: daysAgo(3),
      images: [IMAGES.apartemen1, IMAGES.apartemen2, IMAGES.interior4],
    },
    // 4. Ruko - Bandung, Cimahi
    {
      code: 'PRP-2025-004',
      title: 'Ruko 3 Lantai Strategis Bandung',
      slug: 'ruko-3-lantai-strategis-bandung',
      description: '<p>Dijual ruko 3 lantai di lokasi strategis Bandung. Di pinggir jalan utama dengan traffic tinggi. Cocok untuk usaha, kantor, atau investasi sewa.</p><p>Dekat kampus dan perumahan. Potensi sewa tinggi dengan ROI menarik.</p>',
      propertyTypeId: typeIds['ruko'], status: 'dijual', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: BigInt(3200000000), priceDisplay: 'Rp 3,2 Miliar',
      provinceId: provJB.id, cityId: cityBandung.id, districtId: distCimahi.id,
      address: 'Jl. Raya Cimahi No. 123, Bandung', latitude: -6.9264, longitude: 107.5349,
      landArea: 150, buildingArea: 300, bedrooms: 0, bathrooms: 3, garages: 0, floors: 3,
      electricity: '4400 Watt', waterSource: 'PDAM', certificate: 'SHGB', buildingCond: 'second', orientation: 'barat',
      facilities: JSON.stringify(['3 Lantai','Toilet 3 Unit','Parkiran Depan','Loading Area']),
      agentId: agentUser1.id, publishedAt: daysAgo(10),
      images: [IMAGES.ruko1, IMAGES.ruko2, IMAGES.ruko3],
    },
    // 5. Tanah - Denpasar, Ubud
    {
      code: 'PRP-2025-005',
      title: 'Tanah Strategis Ubud untuk Villa',
      slug: 'tanah-strategis-ubud-bali',
      description: '<p>Tanah komersial di Ubud, Bali. Lokasi premium untuk pembangunan villa, resort, atau restaurant. Pemandangan sawah terasering dan sungai. Zona kuning (komersial).</p>',
      propertyTypeId: typeIds['tanah'], status: 'dijual', isFeatured: true, isNego: true, isNew: false, isPublished: true,
      price: BigInt(15000000000), priceDisplay: 'Rp 15 Miliar',
      provinceId: provBali.id, cityId: cityDenpasar.id, districtId: distUbud.id,
      address: 'Jl. Raya Tegallalang, Ubud, Denpasar', latitude: -8.4312, longitude: 115.2686,
      landArea: 1500, buildingArea: 0, bedrooms: 0, bathrooms: 0, garages: 0, floors: 0,
      electricity: null, waterSource: 'Sungai', certificate: 'SHM', buildingCond: null, orientation: null,
      facilities: JSON.stringify(['Zona Kuning','View Sawah','Akses Jalan Lebar','Dekat Tourism Area']),
      agentId: agentUser2.id, publishedAt: daysAgo(9),
      images: [IMAGES.tanah1, IMAGES.tanah2, IMAGES.tanah3],
    },
    // 6. Rumah - Bogor
    {
      code: 'PRP-2025-006',
      title: 'Rumah Tropis Bogor Halaman Luas',
      slug: 'rumah-tropis-bogor-halaman-luas',
      description: '<p>Rumah tropis di kawasan Bogor dengan halaman yang sangat luas dan pohon-pohon rindang. Suasana sejuk khas Bogor. Cocok untuk keluarga yang menyukai lingkungan hijau.</p><p>15 menit dari Jungle Land, 20 menit dari Puncak. Dekat sekolah dan pasar tradisional.</p>',
      propertyTypeId: typeIds['rumah'], status: 'dijual', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: BigInt(2200000000), priceDisplay: 'Rp 2,2 Miliar',
      provinceId: provJB.id, cityId: cityBogor.id,
      address: 'Jl. Pajajaran No. 88, Bogor', latitude: -6.5971, longitude: 106.8060,
      landArea: 400, buildingArea: 200, bedrooms: 4, bathrooms: 3, garages: 1, floors: 1,
      electricity: '2200 Watt', waterSource: 'PDAM', certificate: 'SHM', buildingCond: 'second', orientation: 'timur',
      facilities: JSON.stringify(['Halaman Luas','Kebun','Carport','Gazebo','Rumah Pembantu']),
      agentId: agentUser1.id, publishedAt: daysAgo(7),
      images: [IMAGES.rumahMinimalis4, IMAGES.garden1, IMAGES.garden2],
    },
    // 7. Kost - Bandung, Coblong
    {
      code: 'PRP-2025-007',
      title: 'Kost Eksklusif Dekat ITB Bandung',
      slug: 'kost-eksklusif-dekat-itb-bandung',
      description: '<p>Kost eksklusif modern dekat ITB dan Unpar, Bandung. 20 kamar fully furnished dengan fasilitas lengkap. Target mahasiswa dan profesional muda.</p><p>ROI sewa 15% per tahun. Semua kamar terisi penuh.</p>',
      propertyTypeId: typeIds['kost'], status: 'dijual', isFeatured: false, isNego: true, isNew: true, isPublished: true,
      price: BigInt(2500000000), priceDisplay: 'Rp 2,5 Miliar',
      provinceId: provJB.id, cityId: cityBandung.id, districtId: distCoblong.id,
      address: 'Jl. Ganesha No. 10, Coblong, Bandung', latitude: -6.8710, longitude: 107.6105,
      landArea: 200, buildingArea: 350, bedrooms: 20, bathrooms: 20, garages: 4, floors: 3,
      electricity: '4400 Watt', waterSource: 'PDAM', certificate: 'SHM', buildingCond: 'baru', orientation: null,
      facilities: JSON.stringify(['20 Kamar','WiFi','CCTV','Parkir Motor 10','Parkir Mobil 4','Laundry Area','Dapur Bersama']),
      agentId: agentUser1.id, publishedAt: daysAgo(2),
      images: [IMAGES.kost1, IMAGES.kost2, IMAGES.interior4],
    },
    // 8. Gudang - Surabaya, Gubeng
    {
      code: 'PRP-2025-008',
      title: 'Gudang Industrial Surabaya dekat Tol',
      slug: 'gudang-industrial-surabaya-dekat-tol',
      description: '<p>Disewakan gudang industrial di Surabaya. Spesifikasi gudang besar dengan akses truk kontainer. Lokasi dekat pintu tol.</p><p>Cocok untuk gudang distribusi, pabrik kecil, atau workshop.</p>',
      propertyTypeId: typeIds['gudang'], status: 'disewa', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: BigInt(250000000), priceDisplay: 'Rp 250 Juta/Tahun',
      provinceId: provJT.id, cityId: citySurabaya.id, districtId: distGubeng.id,
      address: 'Jl. Industri No. 88, Gubeng, Surabaya', latitude: -7.2650, longitude: 112.7500,
      landArea: 1000, buildingArea: 800, bedrooms: 0, bathrooms: 2, garages: 0, floors: 1,
      electricity: '3300 Watt', waterSource: 'PDAM', certificate: 'SHGB', buildingCond: 'second', orientation: null,
      facilities: JSON.stringify(['Loading Dock','Kantor','Toilet','Parkir Truk','Tinggi Atap 10m']),
      agentId: agentUser3.id, publishedAt: daysAgo(14),
      images: [IMAGES.gudang1, IMAGES.gudang2],
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
  console.log(`  ✅ ${propertyData.length} properties seeded with images`);

  // ============ 10. ARTICLES (3) ============
  console.log('📦 Seeding articles...');
  const articles = [
    {
      title: 'Tips Memilih Rumah Pertama untuk Milenial',
      slug: 'tips-memilih-rumah-pertama-milenial',
      content: '<p>Membeli rumah pertama adalah milestone penting dalam kehidupan. Berikut tips yang bisa membantu Anda:</p><h3>1. Tentukan Anggaran</h3><p>Pertimbangkan penghasilan bulanan, tabungan, dan kemampuan cicilan KPR.</p><h3>2. Pilih Lokasi yang Strategis</h3><p>Lokasi dekat dengan tempat kerja, fasilitas publik, dan memiliki potensi kenaikan harga.</p><h3>3. Perhatikan Legalitas</h3><p>Pastikan sertifikat tanah sudah jelas. Sertifikat SHM adalah yang paling aman.</p><h3>4. Inspeksi Fisik</h3><p>Periksa kondisi bangunan, plumbing, listrik, dan struktur.</p><h3>5. Bandingkan Harga</h3><p>Jangan terburu-buru. Bandingkan harga properti di lokasi yang sama.</p>',
      excerpt: 'Panduan lengkap untuk generasi milenial yang ingin membeli rumah pertama.',
      categoryId: catMap['tips-properti'], tags: JSON.stringify(['rumah','milenial','tips','KPR']),
      featuredImage: IMAGES.article1, isPublished: true, publishedAt: daysAgo(3), authorId: adminUser.id, viewCount: 1250,
    },
    {
      title: 'Panduan Lengkap KPR: Dari Pengajuan hingga Akad',
      slug: 'panduan-lengkap-kpr-pengajuan-akad',
      content: '<p>Kredit Pemilikan Rumah (KPR) adalah solusi terbaik untuk memiliki rumah impian.</p><h3>Persiapan Dokumen</h3><p>KTP, KK, NPWP, slip gaji 3 bulan terakhir, rekening koran, dan surat keterangan kerja.</p><h3>Pilih Bank yang Tepat</h3><p>Bandingkan suku bunga, tenor, dan persyaratan dari beberapa bank.</p><h3>Proses Penilaian</h3><p>Bank akan menilai jaminan properti dan kelayakan kredit Anda. Proses biasanya 2-4 minggu.</p><h3>Akad Kredit</h3><p>Pastikan semua dokumen sudah lengkap sebelum jadwal akad.</p>',
      excerpt: 'Panduan lengkap tentang KPR dari awal hingga akhir.',
      categoryId: catMap['panduan-kpr'], tags: JSON.stringify(['KPR','bank','kredit','rumah']),
      featuredImage: IMAGES.article2, isPublished: true, publishedAt: daysAgo(10), authorId: agentUser1.id, viewCount: 2100,
    },
    {
      title: 'Investasi Properti 2025: Peluang dan Tantangan',
      slug: 'investasi-properti-2025-peluang-tantangan',
      content: '<p>Tahun 2025 membawa peluang baru bagi investor properti di Indonesia.</p><h3>Peluang</h3><p>Infrastruktur baru seperti kereta cepat Jakarta-Bandung memberikan dampak signifikan terhadap harga properti di sepanjang koridor.</p><h3>Kota dengan Pertumbuhan Tertinggi</h3><p>Bandung Utara: 15-20%. Bali (Kuta, Ubud): 20-30%. Surabaya Timur: 10-15%.</p><h3>Tantangan</h3><p>Suku bunga KPR yang fluktuatif dan regulasi sewa properti yang ketat menjadi pertimbangan penting.</p>',
      excerpt: 'Analisis peluang dan tantangan investasi properti di tahun 2025.',
      categoryId: catMap['investasi'], tags: JSON.stringify(['investasi','properti','2025','peluang']),
      featuredImage: IMAGES.article3, isPublished: true, publishedAt: daysAgo(5), authorId: adminUser.id, viewCount: 3400,
    },
  ];

  for (const a of articles) {
    const existing = await db.article.findUnique({ where: { slug: a.slug } });
    if (!existing) {
      await db.article.create({ data: a as any });
    }
  }
  console.log(`  ✅ ${articles.length} articles seeded`);

  // ============ 11. LEADS (3) ============
  console.log('📦 Seeding leads...');
  const leads = [
    {
      name: 'Ahmad Rizky', whatsapp: '628987654321', email: 'ahmad@email.com',
      propertyName: 'Rumah Mewah Dago Hill', locationInterest: 'Bandung',
      budget: '5-6 Miliar', propertyTypeInterest: 'Rumah',
      needType: 'beli', source: 'website', status: 'baru',
      notes: 'Tertarik dengan properti di Dago Hill. Minta jadwal survei weekend depan.',
      agentId: agentUser1.id, nextFollowUp: daysAgo(-3),
    },
    {
      name: 'Linda Permata', whatsapp: '628765432109', email: 'linda@email.com',
      propertyName: 'Villa Modern Kuta Bali', locationInterest: 'Bali',
      budget: '8-10 Miliar', propertyTypeInterest: 'Villa',
      needType: 'beli', source: 'instagram', status: 'prospek',
      notes: 'Sudah survei. Sangat tertarik. Menunggu keputusan dari suami.',
      agentId: agentUser2.id, nextFollowUp: daysAgo(-1),
    },
    {
      name: 'Doni Firmansyah', whatsapp: '628654321098',
      propertyName: 'Ruko 3 Lantai Bandung', locationInterest: 'Bandung',
      budget: '3-4 Miliar', propertyTypeInterest: 'Ruko',
      needType: 'beli', source: 'google_ads', status: 'dihubungi',
      notes: 'Sudah dihubungi via WhatsApp. Respons positif. Minta info detail.',
    },
  ];

  for (const l of leads) {
    const existing = await db.lead.findFirst({ where: { whatsapp: l.whatsapp } });
    if (!existing) {
      await db.lead.create({ data: l as any });
    }
  }
  console.log(`  ✅ ${leads.length} leads seeded`);

  // ============ SUMMARY ============
  console.log('\n🎉 Seeding completed successfully!');
  console.log('═══════════════════════════════════════════════');
  console.log('📦 Property Types  : 11');
  console.log('📍 Provinces       : 3 (Jawa Barat, Jawa Timur, Bali)');
  console.log('🏙️  Cities          : 5 (Bandung, Bogor, Surabaya, Malang, Denpasar)');
  console.log('📌 Districts       : 6 (Coblong, Cidadap, Cimahi, Gubeng, Kuta, Ubud)');
  console.log('👥 Users           : 4 (1 admin + 3 agents)');
  console.log('🏗️  Properties      : 8 published');
  console.log('📰 Articles        : 3 published');
  console.log('📞 Leads           : 3');
  console.log('⚙️  Settings        : 15');
  console.log('📂 Categories      : 5');
  console.log('═══════════════════════════════════════════════');
  console.log('📧 Admin : admin@properti.com / admin123');
  console.log('📧 Agen1: agen1@properti.com / admin123');
  console.log('📧 Agen2: agen2@properti.com / admin123');
  console.log('📧 Agen3: agen3@properti.com / admin123');
  console.log('═══════════════════════════════════════════════');
}

seed()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
