import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

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
  console.log('🌱 Seeding PropNesia database...\n');

  // Clean existing data in reverse dependency order
  console.log('🧹 Cleaning existing data...');
  await db.propertyImage.deleteMany();
  await db.property.deleteMany();
  await db.lead.deleteMany();
  await db.article.deleteMany();
  await db.articleCategory.deleteMany();
  await db.agentProfile.deleteMany();
  await db.activityLog.deleteMany();
  await db.websiteSetting.deleteMany();
  await db.user.deleteMany();
  await db.village.deleteMany();
  await db.district.deleteMany();
  await db.city.deleteMany();
  await db.propertyType.deleteMany();
  await db.province.deleteMany();
  console.log('  ✅ Existing data cleaned\n');

  // ============ 1. WEBSITE SETTINGS ============
  console.log('📦 Seeding website settings...');
  const settings = [
    // General (7)
    { key: 'site_name', value: 'PropNesia', group: 'general' },
    { key: 'site_description', value: 'Platform jual beli dan sewa properti terpercaya di Indonesia. Temukan rumah, apartemen, tanah, ruko, dan properti impian Anda.', group: 'general' },
    { key: 'site_logo', value: '/logo.svg', group: 'general' },
    { key: 'site_favicon', value: '/favicon.ico', group: 'general' },
    { key: 'phone_number', value: '+62 812-3456-7890', group: 'general' },
    { key: 'email', value: 'info@propnesia.id', group: 'general' },
    { key: 'address', value: 'Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10220', group: 'general' },
    // Social (5)
    { key: 'instagram', value: 'https://instagram.com/propnesia', group: 'social' },
    { key: 'facebook', value: 'https://facebook.com/propnesia', group: 'social' },
    { key: 'youtube', value: 'https://youtube.com/@propnesia', group: 'social' },
    { key: 'tiktok', value: 'https://tiktok.com/@propnesia', group: 'social' },
    { key: 'whatsapp', value: '6281234567890', group: 'social' },
    // SEO (2)
    { key: 'meta_title', value: 'PropNesia - Jual Beli Properti Terpercaya di Indonesia', group: 'seo' },
    { key: 'meta_description', value: 'Temukan properti impian Anda di PropNesia. Jual beli dan sewa rumah, apartemen, tanah, ruko, villa, dan properti lainnya dengan harga terbaik di seluruh Indonesia.', group: 'seo' },
    // Contact (1)
    { key: 'google_maps_embed', value: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126920.29279499065!2d106.7588372!3d-6.197610399999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5d2e764b12d%3A0x3d2ad6e1e0e9bcc8!2sJakarta%20Pusat%2C%20Kota%20Jakarta%20Pusat%2C%20Daerah%20Khusus%20Ibukota%20Jakarta!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid', group: 'contact' },
  ];
  for (const s of settings) {
    await db.websiteSetting.create({ data: s });
  }
  console.log(`  ✅ ${settings.length} website settings seeded`);

  // ============ 2. PROPERTY TYPES (9) ============
  console.log('📦 Seeding property types...');
  const propertyTypesData = [
    { name: 'Rumah', slug: 'rumah', icon: '🏠', isActive: true, sortOrder: 1 },
    { name: 'Tanah', slug: 'tanah', icon: '🗺️', isActive: true, sortOrder: 2 },
    { name: 'Ruko', slug: 'ruko', icon: '🏪', isActive: true, sortOrder: 3 },
    { name: 'Apartemen', slug: 'apartemen', icon: '🏢', isActive: true, sortOrder: 4 },
    { name: 'Villa', slug: 'villa', icon: '🏡', isActive: true, sortOrder: 5 },
    { name: 'Gudang', slug: 'gudang', icon: '🏭', isActive: true, sortOrder: 6 },
    { name: 'Kantor', slug: 'kantor', icon: '💼', isActive: true, sortOrder: 7 },
    { name: 'Kost', slug: 'kost', icon: '🛏️', isActive: true, sortOrder: 8 },
    { name: 'Kavling', slug: 'kavling', icon: '📐', isActive: true, sortOrder: 9 },
  ];
  for (const pt of propertyTypesData) {
    await db.propertyType.create({ data: pt });
  }
  const typeIds: Record<string, string> = {};
  for (const pt of await db.propertyType.findMany()) {
    typeIds[pt.slug] = pt.id;
  }
  console.log(`  ✅ ${propertyTypesData.length} property types seeded`);

  // ============ 3. PROVINCES & CITIES ============
  console.log('📦 Seeding provinces and cities...');

  const provDKI = await db.province.create({
    data: { name: 'DKI Jakarta', slug: 'dki-jakarta' },
  });
  const provJB = await db.province.create({
    data: { name: 'Jawa Barat', slug: 'jawa-barat' },
  });
  const provBanten = await db.province.create({
    data: { name: 'Banten', slug: 'banten' },
  });

  const cityJakPusat = await db.city.create({ data: { name: 'Jakarta Pusat', slug: 'jakarta-pusat', provinceId: provDKI.id } });
  const cityJakSelatan = await db.city.create({ data: { name: 'Jakarta Selatan', slug: 'jakarta-selatan', provinceId: provDKI.id } });
  const cityJakBarat = await db.city.create({ data: { name: 'Jakarta Barat', slug: 'jakarta-barat', provinceId: provDKI.id } });
  const cityJakTimur = await db.city.create({ data: { name: 'Jakarta Timur', slug: 'jakarta-timur', provinceId: provDKI.id } });
  const cityJakUtara = await db.city.create({ data: { name: 'Jakarta Utara', slug: 'jakarta-utara', provinceId: provDKI.id } });

  const cityBandung = await db.city.create({ data: { name: 'Bandung', slug: 'bandung', provinceId: provJB.id } });
  const cityBogor = await db.city.create({ data: { name: 'Bogor', slug: 'bogor', provinceId: provJB.id } });
  const cityDepok = await db.city.create({ data: { name: 'Depok', slug: 'depok', provinceId: provJB.id } });
  const cityBekasi = await db.city.create({ data: { name: 'Bekasi', slug: 'bekasi', provinceId: provJB.id } });

  const cityTangerang = await db.city.create({ data: { name: 'Tangerang', slug: 'tangerang', provinceId: provBanten.id } });
  const cityTangerangSel = await db.city.create({ data: { name: 'Tangerang Selatan', slug: 'tangerang-selatan', provinceId: provBanten.id } });

  console.log(`  ✅ 3 provinces, 11 cities seeded`);

  // ============ 4. ADMIN USER ============
  console.log('📦 Seeding admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await db.user.create({
    data: {
      email: 'admin@propnesia.id',
      name: 'Admin PropNesia',
      password: adminPassword,
      role: 'super_admin',
      phone: '+62 812-3456-7890',
      isActive: true,
    },
  });
  console.log('  ✅ Admin user seeded (admin@propnesia.id)');

  // ============ 5. AGENT USERS & PROFILES ============
  console.log('📦 Seeding agent users and profiles...');
  const agentPassword = await bcrypt.hash('agent123', 10);

  const agentUser1 = await db.user.create({
    data: {
      email: 'budi.santoso@propnesia.id',
      name: 'Budi Santoso',
      password: agentPassword,
      role: 'agent',
      phone: '+62 813-1111-2222',
      isActive: true,
    },
  });
  const agentUser2 = await db.user.create({
    data: {
      email: 'siti.rahayu@propnesia.id',
      name: 'Siti Rahayu',
      password: agentPassword,
      role: 'agent',
      phone: '+62 813-3333-4444',
      isActive: true,
    },
  });
  const agentUser3 = await db.user.create({
    data: {
      email: 'ahmad.wijaya@propnesia.id',
      name: 'Ahmad Wijaya',
      password: agentPassword,
      role: 'agent',
      phone: '+62 813-5555-6666',
      isActive: true,
    },
  });

  const agentProfiles = [
    {
      userId: agentUser1.id,
      name: 'Budi Santoso',
      title: 'Senior Property Consultant',
      photo: 'https://placehold.co/400x400/1a1a2e/eaeaea?text=Budi',
      whatsapp: '6281311112222',
      email: 'budi@propnesia.id',
      bio: 'Berpengalaman lebih dari 10 tahun di bidang properti Jakarta. Spesialis area Jakarta Selatan, Jakarta Pusat, dan Tangerang Selatan. Telah menangani ratusan transaksi properti senilai lebih dari Rp 200 Miliar.',
      areaSpec: 'Jakarta Selatan, Jakarta Pusat, Tangerang Selatan',
      isActive: true,
      sortOrder: 1,
    },
    {
      userId: agentUser2.id,
      name: 'Siti Rahayu',
      title: 'Marketing Executive',
      photo: 'https://placehold.co/400x400/eaeaea/1a1a2e?text=Siti',
      whatsapp: '6281333334444',
      email: 'siti@propnesia.id',
      bio: 'Ahli properti residensial dan komersial. Fokus pada rumah mewah, apartemen premium, dan tanah strategis. Berpengalaman membantu klien domestik dan ekspat.',
      areaSpec: 'Jakarta Barat, Tangerang, Bekasi',
      isActive: true,
      sortOrder: 2,
    },
    {
      userId: agentUser3.id,
      name: 'Ahmad Wijaya',
      title: 'Property Investment Advisor',
      photo: 'https://placehold.co/400x400/2e1a2e/eaeaea?text=Ahmad',
      whatsapp: '6281355556666',
      email: 'ahmad@propnesia.id',
      bio: 'Spesialis investasi properti dan properti komersial. Menangani klien investor dan corporate di area Jakarta Timur, Depok, dan Bogor.',
      areaSpec: 'Jakarta Timur, Depok, Bogor, Bandung',
      isActive: true,
      sortOrder: 3,
    },
  ];
  for (const a of agentProfiles) {
    await db.agentProfile.create({ data: a });
  }
  console.log('  ✅ 3 agent users + 3 agent profiles seeded');

  // ============ 6. PROPERTIES (10) ============
  console.log('📦 Seeding properties...');
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const propertyData = [
    // 1. Rumah Mewah - Jakarta Selatan (dijual, featured)
    {
      code: 'PRP-2025-001',
      title: 'Rumah Mewah 2 Lantai di Pondok Indah, Jakarta Selatan',
      slug: 'rumah-mewah-pondok-indah-jakarta-selatan',
      description: '<p>Dijual rumah mewah 2 lantai di kawasan premium Pondok Indah, Jakarta Selatan. Desain modern minimalis dengan material berkualitas tinggi. Dilengkapi kolam renang pribadi, taman tropis, dan smart home system.</p><p>Lokasi strategis dekat Pondok Indah Mall, sekolah internasional, dan akses tol JORR. Keamanan 24 jam dengan cluster system.</p>',
      propertyTypeId: typeIds['rumah'], status: 'dijual', isFeatured: true, isNego: true, isNew: true, isPublished: true,
      price: BigInt(12500000000), priceDisplay: 'Rp 12,5 Miliar',
      provinceId: provDKI.id, cityId: cityJakSelatan.id,
      address: 'Jl. Pondok Indah Raya No. 45, Pondok Indah, Jakarta Selatan', latitude: -6.2615, longitude: 106.7820,
      landArea: 450, buildingArea: 600, bedrooms: 5, bathrooms: 5, garages: 2, floors: 2,
      electricity: '7700 Watt', waterSource: 'PDAM + Sumur Bor', certificate: 'SHM', buildingCond: 'baru', orientation: 'utara',
      facilities: JSON.stringify(['Kolam Renang', 'Taman Tropis', 'Smart Home', 'CCTV', 'Carport 2 Mobil', 'Gudang']),
      agentId: agentUser1.id, publishedAt: daysAgo(2),
      mainImage: 'https://placehold.co/800x600/1a1a2e/eaeaea?text=Rumah+Pondok+Indah',
      images: [
        { url: 'https://placehold.co/800x600/1a1a2e/eaeaea?text=Rumah+Pondok+Indah', altText: 'Tampak depan rumah mewah Pondok Indah', sortOrder: 1 },
        { url: 'https://placehold.co/800x600/2e1a2e/eaeaea?text=Ruang+Tamu', altText: 'Interior ruang tamu', sortOrder: 2 },
        { url: 'https://placehold.co/800x600/2e2e1a/eaeaea?text=Kolam+Renang', altText: 'Kolam renang pribadi', sortOrder: 3 },
      ],
    },
    // 2. Apartemen - Jakarta Pusat (dijual, featured)
    {
      code: 'PRP-2025-002',
      title: 'Apartemen Sudirman Park Fully Furnished 3BR',
      slug: 'apartemen-sudirman-park-jakarta-pusat',
      description: '<p>Dijual unit apartemen 3 kamar tidur di Sudirman Park, Jakarta Pusat. Fully furnished dengan interior modern dan view skyline Jakarta yang memukau.</p><p>Terintegrasi dengan Sudirman Central Business District. Walking distance ke MRT Dukuh Atas dan Grand Indonesia.</p>',
      propertyTypeId: typeIds['apartemen'], status: 'dijual', isFeatured: true, isNego: false, isNew: true, isPublished: true,
      price: BigInt(3500000000), priceDisplay: 'Rp 3,5 Miliar',
      provinceId: provDKI.id, cityId: cityJakPusat.id,
      address: 'Sudirman Park Tower B Lt. 35, Jl. Jend. Sudirman, Jakarta Pusat', latitude: -6.2088, longitude: 106.8456,
      landArea: 0, buildingArea: 128, bedrooms: 3, bathrooms: 2, garages: 1, floors: 0,
      electricity: '3500 Watt', waterSource: 'PDAM', certificate: 'SHGB', buildingCond: 'baru', orientation: 'timur',
      facilities: JSON.stringify(['Fully Furnished', 'AC', 'Water Heater', 'Kulkas', 'Washing Machine', 'TV']),
      agentId: agentUser1.id, publishedAt: daysAgo(3),
      mainImage: 'https://placehold.co/800x600/1a1a2e/eaeaea?text=Apartemen+Sudirman',
      images: [
        { url: 'https://placehold.co/800x600/1a1a2e/eaeaea?text=Apartemen+Sudirman', altText: 'View apartemen Sudirman Park', sortOrder: 1 },
        { url: 'https://placehold.co/800x600/1a2e1a/eaeaea?text=Interior+Bedroom', altText: 'Kamar tidur utama', sortOrder: 2 },
        { url: 'https://placehold.co/800x600/2e1a1a/eaeaea?text=Living+Room', altText: 'Ruang tamu apartemen', sortOrder: 3 },
      ],
    },
    // 3. Tanah - Tangerang Selatan (dijual, featured)
    {
      code: 'PRP-2025-003',
      title: 'Tanah Strategis BSD City Tangerang Selatan',
      slug: 'tanah-strategis-bsd-city-tangerang-selatan',
      description: '<p>Dijual tanah strategis di kawasan BSD City, Tangerang Selatan. Lokasi premium dekat The Breeze, AEON Mall, dan akses tol Serpong-Bintaro.</p><p>Cocok untuk pembangunan rumah tinggal, ruko, atau investasi jangka panjang. Harga tanah di BSD terus naik rata-rata 15% per tahun.</p>',
      propertyTypeId: typeIds['tanah'], status: 'dijual', isFeatured: true, isNego: true, isNew: false, isPublished: true,
      price: BigInt(8500000000), priceDisplay: 'Rp 8,5 Miliar',
      provinceId: provBanten.id, cityId: cityTangerangSel.id,
      address: 'BSD City, Serpong, Tangerang Selatan', latitude: -6.3000, longitude: 106.6500,
      landArea: 1000, buildingArea: 0, bedrooms: 0, bathrooms: 0, garages: 0, floors: 0,
      electricity: null, waterSource: 'PDAM', certificate: 'SHM', buildingCond: null, orientation: 'utara',
      facilities: JSON.stringify(['Hook', '2 Muka Jalan', 'Zona Kuning', 'Dekat Mall']),
      agentId: agentUser1.id, publishedAt: daysAgo(7),
      mainImage: 'https://placehold.co/800x600/1a2e1a/eaeaea?text=Tanah+BSD+City',
      images: [
        { url: 'https://placehold.co/800x600/1a2e1a/eaeaea?text=Tanah+BSD+City', altText: 'Lahan tanah BSD City', sortOrder: 1 },
        { url: 'https://placehold.co/800x600/2e2e1a/eaeaea?text=Lokasi+Tanah', altText: 'Lokasi strategis BSD', sortOrder: 2 },
      ],
    },
    // 4. Ruko - Jakarta Barat (dijual)
    {
      code: 'PRP-2025-004',
      title: 'Ruko 3 Lantai Grogol Jakarta Barat',
      slug: 'ruko-3-lantai-grogol-jakarta-barat',
      description: '<p>Dijual ruko 3 lantai di kawasan Grogol, Jakarta Barat. Lokasi di pinggir jalan utama dengan traffic tinggi. Cocok untuk usaha retail, kantor, atau investasi sewa.</p><p>Dekat with Mall Ciputra, Universitas Tarumanagara, dan akses tol dalam kota. Potensi sewa Rp 150 juta/tahun.</p>',
      propertyTypeId: typeIds['ruko'], status: 'dijual', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: BigInt(4800000000), priceDisplay: 'Rp 4,8 Miliar',
      provinceId: provDKI.id, cityId: cityJakBarat.id,
      address: 'Jl. Jend. S. Parman No. 88, Grogol, Jakarta Barat', latitude: -6.1750, longitude: 106.7950,
      landArea: 120, buildingArea: 300, bedrooms: 0, bathrooms: 4, garages: 0, floors: 3,
      electricity: '4400 Watt', waterSource: 'PDAM', certificate: 'SHGB', buildingCond: 'second', orientation: 'barat',
      facilities: JSON.stringify(['3 Lantai', 'Toilet 4 Unit', 'Parkiran Depan', 'Loading Area']),
      agentId: agentUser2.id, publishedAt: daysAgo(10),
      mainImage: 'https://placehold.co/800x600/2e1a2e/eaeaea?text=Ruko+Grogol',
      images: [
        { url: 'https://placehold.co/800x600/2e1a2e/eaeaea?text=Ruko+Grogol', altText: 'Tampak depan ruko Grogol', sortOrder: 1 },
        { url: 'https://placehold.co/800x600/1a1a2e/eaeaea?text=Interior+Ruko', altText: 'Interior lantai 1 ruko', sortOrder: 2 },
        { url: 'https://placehold.co/800x600/2e2e2e/eaeaea?text=Lantai+Atas', altText: 'Lantai atas ruko', sortOrder: 3 },
      ],
    },
    // 5. Villa - Bogor (dijual, featured)
    {
      code: 'PRP-2025-005',
      title: 'Villa Tropis Strategis Bogor dengan Pemandangan Gunung',
      slug: 'villa-tropis-bogor-pemandangan-gunung',
      description: '<p>Dijual villa tropis eksklusif di Bogor dengan pemandangan Gunung Gede-Pangrango yang menakjubkan. Desain arsitektur Jawa modern dengan material alami.</p><p>Suasana sejuk khas Puncak-Bogor sepanjang tahun. Ideal untuk tempat tinggal, retreat, atau homestay. 30 menit dari Jakarta via tol Jagorawi.</p>',
      propertyTypeId: typeIds['villa'], status: 'dijual', isFeatured: true, isNego: true, isNew: true, isPublished: true,
      price: BigInt(6200000000), priceDisplay: 'Rp 6,2 Miliar',
      provinceId: provJB.id, cityId: cityBogor.id,
      address: 'Jl. Pajajaran Indah V No. 12, Bogor Selatan', latitude: -6.5971, longitude: 106.7990,
      landArea: 800, buildingArea: 400, bedrooms: 4, bathrooms: 4, garages: 2, floors: 2,
      electricity: '5500 Watt', waterSource: 'PDAM + Sumur Bor', certificate: 'SHM', buildingCond: 'baru', orientation: 'utara',
      facilities: JSON.stringify(['Kolam Renang', 'Taman Luas', 'Gazebo', 'BBQ Area', 'CCTV', 'Carport 2 Mobil']),
      agentId: agentUser3.id, publishedAt: daysAgo(4),
      mainImage: 'https://placehold.co/800x600/1a2e2e/eaeaea?text=Villa+Bogor',
      images: [
        { url: 'https://placehold.co/800x600/1a2e2e/eaeaea?text=Villa+Bogor', altText: 'Villa tropis Bogor', sortOrder: 1 },
        { url: 'https://placehold.co/800x600/2e1a2e/eaeaea?text=View+Gunung', altText: 'Pemandangan gunung dari villa', sortOrder: 2 },
        { url: 'https://placehold.co/800x600/2e2e1a/eaeaea?text=Taman+Villa', altText: 'Taman villa tropis', sortOrder: 3 },
      ],
    },
    // 6. Kost Eksklusif - Depok (dijual)
    {
      code: 'PRP-2025-006',
      title: 'Kost Eksklusif 25 Kamar Dekat UI Depok',
      slug: 'kost-eksklusif-dekat-ui-depok',
      description: '<p>Dijual kos-kosan eksklusif 25 kamar di Depok, dekat Universitas Indonesia. Semua kamar terisi penuh dengan tenant mahasiswa dan profesional muda.</p><p>ROI sewa 18% per tahun. Fully furnished dengan WiFi, AC, dan kamar mandi dalam. Potensi pengembangan menjadi 40 kamar.</p>',
      propertyTypeId: typeIds['kost'], status: 'dijual', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: BigInt(2800000000), priceDisplay: 'Rp 2,8 Miliar',
      provinceId: provJB.id, cityId: cityDepok.id,
      address: 'Jl. Margonda Raya No. 250, Depok', latitude: -6.3950, longitude: 106.8190,
      landArea: 300, buildingArea: 500, bedrooms: 25, bathrooms: 25, garages: 5, floors: 3,
      electricity: '7700 Watt', waterSource: 'PDAM + Sumur Bor', certificate: 'SHM', buildingCond: 'baru', orientation: 'timur',
      facilities: JSON.stringify(['25 Kamar', 'WiFi', 'CCTV', 'Parkir Motor 20', 'Parkir Mobil 5', 'Laundry Area', 'Dapur Bersama', 'Ruang Tamu']),
      agentId: agentUser3.id, publishedAt: daysAgo(5),
      mainImage: 'https://placehold.co/800x600/2e2e1a/eaeaea?text=Kost+Depok',
      images: [
        { url: 'https://placehold.co/800x600/2e2e1a/eaeaea?text=Kost+Depok', altText: 'Tampak depan kost eksklusif', sortOrder: 1 },
        { url: 'https://placehold.co/800x600/1a2e1a/eaeaea?text=Kamar+Kost', altText: 'Interior kamar kost', sortOrder: 2 },
      ],
    },
    // 7. Gudang - Bekasi (disewa)
    {
      code: 'PRP-2025-007',
      title: 'Gudang Modern Kawasan Industri Bekasi',
      slug: 'gudang-modern-kawasan-industri-bekasi',
      description: '<p>Disewakan gudang modern di kawasan industri Bekasi. Spesifikasi tinggi dengan akses truk kontainer dan dock loading. Lokasi dekat pintu tol Bekasi Barat dan Timur.</p><p>Cocok untuk gudang distribusi, manufaktur ringan, atau logistik. One gate system dengan keamanan 24 jam.</p>',
      propertyTypeId: typeIds['gudang'], status: 'disewa', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: BigInt(500000000), priceDisplay: 'Rp 500 Juta/Tahun',
      provinceId: provJB.id, cityId: cityBekasi.id,
      address: 'Kawasan Industri Jababeka, Bekasi', latitude: -6.3550, longitude: 107.1500,
      landArea: 2000, buildingArea: 1500, bedrooms: 0, bathrooms: 4, garages: 0, floors: 1,
      electricity: '33000 Watt', waterSource: 'PDAM', certificate: 'SHGB', buildingCond: 'baru', orientation: null,
      facilities: JSON.stringify(['Loading Dock 4 Unit', 'Kantor Manager', 'Toilet 4', 'Parkir Truk', 'Tinggi Atap 12m', 'CCTV', 'Sprinkler']),
      agentId: agentUser2.id, publishedAt: daysAgo(12),
      mainImage: 'https://placehold.co/800x600/1a1a2e/eaeaea?text=Gudang+Bekasi',
      images: [
        { url: 'https://placehold.co/800x600/1a1a2e/eaeaea?text=Gudang+Bekasi', altText: 'Gudang industri Bekasi', sortOrder: 1 },
        { url: 'https://placehold.co/800x600/2e1a1a/eaeaea?text=Interior+Gudang', altText: 'Interior gudang', sortOrder: 2 },
      ],
    },
    // 8. Rumah Minimalis - Tangerang (dijual)
    {
      code: 'PRP-2025-008',
      title: 'Rumah Minimalis Modern di Bumi Serpong Damai',
      slug: 'rumah-minimalis-bsd-tangerang',
      description: '<p>Dijual rumah minimalis modern di cluster eksklusif BSD City, Tangerang. Desain compact tapi fungsional dengan material berkualitas.</p><p>Cluster one gate system dengan keamanan 24 jam. Dekat sekolah, pasar modern, dan fasilitas olahraga BSD.</p>',
      propertyTypeId: typeIds['rumah'], status: 'dijual', isFeatured: false, isNego: true, isNew: true, isPublished: true,
      price: BigInt(1800000000), priceDisplay: 'Rp 1,8 Miliar',
      provinceId: provBanten.id, cityId: cityTangerang.id,
      address: 'BSD City Cluster De Helios, Serpong, Tangerang', latitude: -6.2950, longitude: 106.6300,
      landArea: 200, buildingArea: 150, bedrooms: 3, bathrooms: 2, garages: 1, floors: 2,
      electricity: '2200 Watt', waterSource: 'PDAM', certificate: 'SHM', buildingCond: 'baru', orientation: 'selatan',
      facilities: JSON.stringify(['Cluster', 'CCTV', 'Carport 1 Mobil', 'Taman Depan', 'Taman Belakang']),
      agentId: agentUser1.id, publishedAt: daysAgo(1),
      mainImage: 'https://placehold.co/800x600/2e1a2e/eaeaea?text=Rumah+BSD',
      images: [
        { url: 'https://placehold.co/800x600/2e1a2e/eaeaea?text=Rumah+BSD', altText: 'Rumah minimalis BSD', sortOrder: 1 },
        { url: 'https://placehold.co/800x600/1a2e2e/eaeaea?text=Living+Room', altText: 'Ruang keluarga rumah BSD', sortOrder: 2 },
        { url: 'https://placehold.co/800x600/2e2e1a/eaeaea?text=Kitchen', altText: 'Dapur rumah BSD', sortOrder: 3 },
      ],
    },
    // 9. Kantor - Jakarta Pusat (disewa, featured)
    {
      code: 'PRP-2025-009',
      title: 'Kantor Premium di Gatot Subroto Jakarta Pusat',
      slug: 'kantor-premium-gatot-subroto-jakarta-pusat',
      description: '<p>Disewakan ruang kantor premium di kawasan Gatot Subroto, Jakarta Pusat. Gedung grade A dengan fasilitas lengkap dan manajemen profesional.</p><p>Lokasi di jantung CBD Jakarta. Walking distance ke Kuningan, Sudirman, dan MRT. Parkir luas untuk karyawan dan tamu.</p>',
      propertyTypeId: typeIds['kantor'], status: 'disewa', isFeatured: true, isNego: true, isNew: false, isPublished: true,
      price: BigInt(850000000), priceDisplay: 'Rp 850 Juta/Tahun',
      provinceId: provDKI.id, cityId: cityJakPusat.id,
      address: 'Jl. Gatot Subroto Kav. 36-38, Jakarta Pusat', latitude: -6.2240, longitude: 106.8290,
      landArea: 0, buildingArea: 500, bedrooms: 0, bathrooms: 6, garages: 0, floors: 1,
      electricity: '7700 Watt', waterSource: 'PDAM', certificate: 'Strata Title', buildingCond: 'baru', orientation: 'barat',
      facilities: JSON.stringify(['AC Central', 'Lift', 'Security 24 Jam', 'Parkir Luas', 'Pantry', 'Meeting Room', 'Fiber Optic']),
      agentId: agentUser2.id, publishedAt: daysAgo(8),
      mainImage: 'https://placehold.co/800x600/1a2e1a/eaeaea?text=Kantor+Gatot+Subroto',
      images: [
        { url: 'https://placehold.co/800x600/1a2e1a/eaeaea?text=Kantor+Gatot+Subroto', altText: 'Gedung kantor Gatot Subroto', sortOrder: 1 },
        { url: 'https://placehold.co/800x600/2e2e1a/eaeaea?text=Interior+Kantor', altText: 'Interior ruang kantor', sortOrder: 2 },
      ],
    },
    // 10. Kavling - Bandung (dijual)
    {
      code: 'PRP-2025-010',
      title: 'Kavling Premium di Bandung Utara Dengan View Kota',
      slug: 'kavling-premium-bandung-utara-view-kota',
      description: '<p>Dijual kavling premium di kawasan Bandung Utara dengan view kota yang spektakuler. Lingkungan asri dengan udara sejuk khas Bandung. Ideal untuk villa atau rumah second home.</p><p>Dekat Dago, Setiabudi, dan Lembang. Akses jalan lebar, sudah tersedia listrik dan air.</p>',
      propertyTypeId: typeIds['kavling'], status: 'dijual', isFeatured: false, isNego: true, isNew: false, isPublished: true,
      price: BigInt(2500000000), priceDisplay: 'Rp 2,5 Miliar',
      provinceId: provJB.id, cityId: cityBandung.id,
      address: 'Jl. Bukit Dago Indah No. 5, Bandung Utara', latitude: -6.8727, longitude: 107.6329,
      landArea: 600, buildingArea: 0, bedrooms: 0, bathrooms: 0, garages: 0, floors: 0,
      electricity: null, waterSource: 'PDAM', certificate: 'SHM', buildingCond: null, orientation: 'utara',
      facilities: JSON.stringify(['View Kota', 'Hook', 'Jalan Lebar', 'Listrik Tersedia', 'Air Tersedia', 'Udara Sejuk']),
      agentId: agentUser3.id, publishedAt: daysAgo(6),
      mainImage: 'https://placehold.co/800x600/2e1a1a/eaeaea?text=Kavling+Bandung',
      images: [
        { url: 'https://placehold.co/800x600/2e1a1a/eaeaea?text=Kavling+Bandung', altText: 'Kavling Bandung Utara', sortOrder: 1 },
        { url: 'https://placehold.co/800x600/1a2e2e/eaeaea?text=View+Kota', altText: 'View kota dari kavling', sortOrder: 2 },
      ],
    },
  ];

  let totalPropertyImages = 0;
  for (const p of propertyData) {
    const imgs = p.images || [];
    const { images: _i, ...propertyFields } = p as any;
    const created = await db.property.create({
      data: { ...propertyFields },
    });
    if (imgs.length > 0) {
      await db.propertyImage.createMany({
        data: imgs.map((img: any) => ({
          propertyId: created.id,
          url: img.url,
          altText: img.altText,
          sortOrder: img.sortOrder,
        })),
      });
      totalPropertyImages += imgs.length;
    }
  }
  console.log(`  ✅ ${propertyData.length} properties seeded with ${totalPropertyImages} images`);

  // ============ 7. ARTICLE CATEGORIES ============
  console.log('📦 Seeding article categories...');
  const catMap: Record<string, string> = {};
  const articleCategories = [
    { name: 'Tips Properti', slug: 'tips-properti', description: 'Tips dan panduan seputar dunia properti untuk pembeli, penjual, dan investor' },
    { name: 'Berita Pasar', slug: 'berita-pasar', description: 'Berita terbaru tentang pasar properti Indonesia dan tren harga' },
    { name: 'Panduan Investasi', slug: 'panduan-investasi', description: 'Panduan lengkap investasi properti untuk pemula hingga profesional' },
  ];
  for (const cat of articleCategories) {
    const created = await db.articleCategory.create({ data: cat });
    catMap[cat.slug] = created.id;
  }
  console.log(`  ✅ ${articleCategories.length} article categories seeded`);

  // ============ 8. ARTICLES ============
  console.log('📦 Seeding articles...');
  const articles = [
    {
      title: '5 Tips Memilih Rumah Pertama untuk Generasi Milenial di Jakarta',
      slug: 'tips-memilih-rumah-pertama-milenial-jakarta',
      content: '<p>Membeli rumah pertama adalah milestone penting dalam kehidupan, terutama bagi generasi milenial yang baru memulai karir di Jakarta. Berikut 5 tips yang bisa membantu Anda:</p><h3>1. Tentukan Anggaran Secara Realistis</h3><p>Perhitungkan penghasilan bulanan, tabungan untuk DP minimal 10-20%, dan kemampuan cicilan KPR. Jangan lupa sisakan dana darurat minimal 6 bulan pengeluaran.</p><h3>2. Pilih Lokasi dengan Akses Transportasi Publik</h3><p>Dengan MRT, LRT, dan TransJakarta yang semakin luas, pilih lokasi dekat stasiun atau halte. Ini akan menghemat waktu dan biaya transportasi harian Anda.</p><h3>3. Perhatikan Legalitas Sertifikat</h3><p>Pastikan sertifikat tanah sudah jelas. Sertifikat SHM (Sertifikat Hak Milik) adalah yang paling aman. Hindari properti dengan status Girik atau AJB yang belum bersertifikat.</p><h3>4. Pertimbangkan Potensi Kenaikan Harga</h3><p>Area yang sedang berkembang seperti Tangerang Selatan, Bekasi Timur, dan Depok memiliki potensi kenaikan harga yang tinggi dalam 3-5 tahun ke depan.</p><h3>5. Gunakan Layanan Agen Properti Terpercaya</h3><p>Agen properti profesional dapat membantu Anda menemukan properti yang sesuai, menegosiasikan harga, dan mengurus proses legalitas.</p>',
      excerpt: 'Panduan lengkap untuk generasi milenial yang ingin membeli rumah pertama di Jakarta dengan budget yang terjangkau.',
      categoryId: catMap['tips-properti'],
      tags: JSON.stringify(['rumah pertama', 'milenial', 'jakarta', 'KPR', 'tips']),
      featuredImage: 'https://placehold.co/800x400/1a1a2e/eaeaea?text=Tips+Rumah+Pertama',
      isPublished: true,
      publishedAt: daysAgo(3),
      authorId: adminUser.id,
      viewCount: 1250,
    },
    {
      title: 'Tren Harga Properti Jakarta Semester 1 2025: Naik atau Turun?',
      slug: 'tren-harga-properti-jakarta-semester-1-2025',
      content: '<p>Pasar properti Jakarta memasuki semester 1 tahun 2025 dengan dinamika yang menarik. Berikut ulasan tren harga berdasarkan data dan analisis terkini.</p><h3>Rumah Residensial: Stabil dengan Tren Naik</h3><p>Harga rumah di Jakarta secara rata-rata mengalami kenaikan 5-8% dibandingkan tahun sebelumnya. Kawasan Jakarta Selatan dan Tangerang Selatan menjadi yang paling aktif dengan pertumbuhan tertinggi.</p><h3>Apartemen: Permintaan Tinggi di Segmen Mid-End</h3><p>Permintaan apartemen segmen mid-end meningkat signifikan, didorong oleh generasi muda yang lebih memilih gaya hidup vertikal. Pasokan baru juga terus bertambah di koridor Sudirman dan Kuningan.</p><h3>Tanah: Kenaikan Paling Tinggi</h3><p>Harga tanah di Jakarta dan sekitarnya terus meroket, terutama di area yang terdampak proyek infrastruktur baru seperti IKN dan tol baru. Rata-rata kenaikan 12-15% per tahun.</p><h3>Outlook Semester 2</h3><p>Para ahli memprediksi pasar properti akan terus stabil dengan potensi kenaikan moderat. Suku bunga KPR yang mulai turun menjadi katalis positif bagi pasar.</p>',
      excerpt: 'Analisis lengkap tren harga properti Jakarta semester 1 2025 berdasarkan data pasar terkini dan prediksi ke depan.',
      categoryId: catMap['berita-pasar'],
      tags: JSON.stringify(['harga properti', 'jakarta', '2025', 'tren', 'pasar']),
      featuredImage: 'https://placehold.co/800x400/2e1a2e/eaeaea?text=Tren+Harga+Properti',
      isPublished: true,
      publishedAt: daysAgo(5),
      authorId: agentUser1.id,
      viewCount: 2100,
    },
    {
      title: 'Panduan Investasi Properti untuk Pemula: Mulai dari Rp 500 Juta',
      slug: 'panduan-investasi-properti-pemula-rp-500-juta',
      content: '<p>Investasi properti bukan hanya untuk orang kaya. Dengan modal Rp 500 juta, Anda sudah bisa mulai berinvestasi di pasar properti Indonesia. Simak panduan lengkapnya.</p><h3>Kenapa Properti?</h3><p>Properti adalah aset yang nilainya cenderung naik seiring waktu, memberikan passive income melalui sewa, dan dapat dijadikan jaminan kredit. Return rata-rata properti di Indonesia adalah 10-15% per tahun.</p><h3>Opsi Investasi dengan Budget Rp 500 Juta</h3><p><strong>1. Kost-Kostan</strong> - Beli kos-kosan di dekat kampus atau kawasan industri. ROI sewa bisa mencapai 15-20% per tahun.</p><p><strong>2. Apartemen Studio</strong> - Unit studio di kawasan bisnis atau dekat MRT sangat diminati ekspat dan profesional muda.</p><p><strong>3. Tanah Kavling</strong> - Tanah di area pengembangan baru seperti BSD, Summarecon, atau Lippo Cikarang.</p><h3>Tips untuk Investor Pemula</h3><p>Mulailah dengan riset mendalam, jangan terburu-buru. Gunakan KPR jika dana belum cukup. Fokus pada lokasi, bukan harga murah. Dan yang paling penting, diversifikasi!</p>',
      excerpt: 'Belajar investasi properti dari nol dengan modal mulai Rp 500 juta. Panduan lengkap untuk pemula dari pemilihan aset hingga strategi.',
      categoryId: catMap['panduan-investasi'],
      tags: JSON.stringify(['investasi', 'properti', 'pemula', 'Rp 500 juta', 'panduan']),
      featuredImage: 'https://placehold.co/800x400/1a2e2e/eaeaea?text=Panduan+Investasi',
      isPublished: true,
      publishedAt: daysAgo(7),
      authorId: agentUser2.id,
      viewCount: 3400,
    },
    {
      title: '10 Area Terbaik untuk Investasi Properti di Jabodetabek 2025',
      slug: '10-area-terbaik-investasi-properti-jabodetabek-2025',
      content: '<p>Jabodetabek masih menjadi magnet utama investasi properti di Indonesia. Berikut 10 area dengan potensi pertumbuhan tertinggi di tahun 2025.</p><h3>1. BSD City, Tangerang Selatan</h3><p>Kawasan terintegrasi dengan pertumbuhan 15% per tahun. Dekat akses tol dan fasilitas lengkap.</p><h3>2. Cibubur, Jakarta Timur</h3><p>Berkembang pesat dengan proyek LRT. Cocok untuk rumah tinggal dan kost.</p><h3>3. Sentul, Bogor</h3><p>Kawasan hijau dengan akses tol langsung ke Jakarta. Harga masih terjangkau.</p><h3>4. Bekasi Timur</h3><p>Kawasan industri yang berkembang menjadi area residensial. Potensi sewa tinggi.</p><h3>5. Depok Margonda</h3><p>Area pendidikan dengan populasi mahasiswa besar. Ideal untuk kost dan apartemen.</p>',
      excerpt: 'Rekomendasi 10 area terbaik untuk investasi properti di Jabodetabek tahun 2025 berdasarkan potensi pertumbuhan dan ROI.',
      categoryId: catMap['panduan-investasi'],
      tags: JSON.stringify(['investasi', 'jabodetabek', '2025', 'area terbaik', 'properti']),
      featuredImage: 'https://placehold.co/800x400/2e2e1a/eaeaea?text=Area+Investasi',
      isPublished: true,
      publishedAt: daysAgo(10),
      authorId: agentUser3.id,
      viewCount: 1850,
    },
  ];

  for (const a of articles) {
    await db.article.create({ data: a as any });
  }
  console.log(`  ✅ ${articles.length} articles seeded`);

  // ============ VERIFY COUNTS ============
  console.log('\n📊 Verifying seeded data...');
  const settingsCount = await db.websiteSetting.count();
  const propertyTypesCount = await db.propertyType.count();
  const provincesCount = await db.province.count();
  const citiesCount = await db.city.count();
  const usersCount = await db.user.count();
  const agentProfilesCount = await db.agentProfile.count();
  const propertiesCount = await db.property.count();
  const propertyImagesCount = await db.propertyImage.count();
  const articleCategoriesCount = await db.articleCategory.count();
  const articlesCount = await db.article.count();

  // ============ SUMMARY ============
  console.log('\n🎉 Seeding completed successfully!');
  console.log('═══════════════════════════════════════════════════');
  console.log(`⚙️  Website Settings     : ${settingsCount}`);
  console.log(`🏷️  Property Types       : ${propertyTypesCount}`);
  console.log(`🗺️  Provinces            : ${provincesCount}`);
  console.log(`🏙️  Cities               : ${citiesCount}`);
  console.log(`👥 Users                : ${usersCount} (1 admin + 3 agents)`);
  console.log(`🧑‍💼 Agent Profiles       : ${agentProfilesCount}`);
  console.log(`🏠 Properties            : ${propertiesCount} (published)`);
  console.log(`📸 Property Images      : ${propertyImagesCount}`);
  console.log(`📂 Article Categories   : ${articleCategoriesCount}`);
  console.log(`📰 Articles             : ${articlesCount} (published)`);
  console.log('═══════════════════════════════════════════════════');
  console.log('📧 Admin : admin@propnesia.id / admin123');
  console.log('📧 Agent1: budi.santoso@propnesia.id / agent123');
  console.log('📧 Agent2: siti.rahayu@propnesia.id / agent123');
  console.log('📧 Agent3: ahmad.wijaya@propnesia.id / agent123');
  console.log('═══════════════════════════════════════════════════');
}

seed()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
