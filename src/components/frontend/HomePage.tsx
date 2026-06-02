'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Home,
  Building2,
  MapPin,
  Warehouse,
  Building,
  TreePine,
  ShieldCheck,
  Layers,
  BadgeDollarSign,
  HeadphonesIcon,
  Star,
  Quote,
  ChevronRight,
  Phone,
  MessageCircle,
  MapPinned,
} from 'lucide-react';
import { useRouter } from '@/hooks/use-router';
import { useDataCache } from '@/lib/store';
import { Property, Article, AgentProfile, City, PropertyType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PropertyCard from './PropertyCard';
import ArticleCard from './ArticleCard';
import SearchBar from './SearchBar';
import { cn } from '@/lib/utils';

const PROPERTY_TYPE_ICONS: Record<string, React.ElementType> = {
  rumah: Home,
  tanah: MapPin,
  ruko: Warehouse,
  apartemen: Building,
  villa: TreePine,
  kavling: Layers,
};

const TESTIMONIALS = [
  {
    name: 'Budi Santoso',
    role: 'Pembeli Rumah',
    text: 'Pelayanan sangat memuaskan! Agen TerimaKunci sangat membantu dalam proses pencarian rumah impian saya.',
    rating: 5,
  },
  {
    name: 'Siti Rahayu',
    role: 'Investor Properti',
    text: 'Sudah 3 kali investasi properti melalui TerimaKunci. Harga kompetitif dan legalitas terjamin.',
    rating: 5,
  },
  {
    name: 'Ahmad Wijaya',
    role: 'Pembeli Tanah',
    text: 'Proses pembelian tanah berjalan lancar. Tim TerimaKunci profesional dan responsif.',
    rating: 4,
  },
];

export default function HomePage() {
  const router = useRouter();
  const { cities, settings, setCities, setSettings } = useDataCache();

  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [latestProperties, setLatestProperties] = useState<Property[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);

  const getSetting = (key: string, fallback: string = ''): string => {
    const s = settings.find((s) => s.key === key);
    return s?.value || fallback;
  };

  const whatsappNumber = getSetting('whatsapp_number', '6281234567890');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [featuredRes, latestRes, articlesRes, agentsRes, settingsRes, citiesRes, typesRes] =
        await Promise.allSettled([
          fetch('/api/properties?isFeatured=true&limit=6'),
          fetch('/api/properties?limit=6'),
          fetch('/api/articles?limit=3'),
          fetch('/api/agents'),
          fetch('/api/settings'),
          fetch('/api/locations/cities').catch(() => null),
          fetch('/api/property-types'),
        ]);

      if (featuredRes.status === 'fulfilled' && featuredRes.value.ok) {
        const data = await featuredRes.value.json();
        setFeaturedProperties(data.data || data);
      }
      if (latestRes.status === 'fulfilled' && latestRes.value.ok) {
        const data = await latestRes.value.json();
        setLatestProperties(data.data || data);
      }
      if (articlesRes.status === 'fulfilled' && articlesRes.value.ok) {
        const data = await articlesRes.value.json();
        setArticles(data.data || data);
      }
      if (agentsRes.status === 'fulfilled' && agentsRes.value.ok) {
        const data = await agentsRes.value.json();
        const agentList = data.data || data;
        setAgents(Array.isArray(agentList) ? agentList : []);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
        const data = await settingsRes.value.json();
        setSettings(Array.isArray(data) ? data : data.data || []);
      }
      if (citiesRes.status === 'fulfilled' && citiesRes.value.ok) {
        const data = await citiesRes.value.json();
        setCities(Array.isArray(data) ? data : data.data || []);
      }
      if (typesRes.status === 'fulfilled' && typesRes.value.ok) {
        const data = await typesRes.value.json();
        setPropertyTypes(Array.isArray(data) ? data : data.data || []);
      }
    } catch {
      // Silently fail - skeletons will show
    } finally {
      setLoading(false);
    }
  }, [setCities, setSettings]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex flex-col">
      {/* ========== HERO SECTION ========== */}
      <section className="relative bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative px-4 py-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="bg-emerald-500/30 text-emerald-100 border-emerald-400/30 mb-3 text-xs px-2.5 py-0.5">
              TerimaKunci - Platform Properti Terpercaya
            </Badge>
            <h1 className="text-2xl font-bold leading-tight mb-2">
              Temukan Properti Impian Anda
            </h1>
            <p className="text-emerald-100 text-sm mb-6 max-w-xl mx-auto">
              Ribuan properti pilihan dari agen terpercaya di seluruh Indonesia.
            </p>
            <SearchBar cities={cities} variant="hero" />
          </div>
        </div>
      </section>

      {/* ========== QUICK FILTERS ========== */}
      <section className="py-4 bg-gray-50">
        <div className="px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {propertyTypes.slice(0, 8).map((pt) => {
              const Icon = PROPERTY_TYPE_ICONS[pt.slug] || Building2;
              return (
                <button
                  key={pt.id}
                  onClick={() => router.navigate({ page: 'properties', params: { propertyTypeId: pt.id } })}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border hover:border-emerald-300 hover:bg-emerald-50 transition-colors group shrink-0 min-w-[72px]"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                    <Icon className="size-5 text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 group-hover:text-emerald-700 whitespace-nowrap">
                    {pt.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== FEATURED PROPERTIES ========== */}
      <section className="py-5 bg-gray-50">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Properti Unggulan
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Pilihan terbaik untuk Anda</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700 text-xs h-8"
              onClick={() => router.navigate({ page: 'properties' })}
            >
              Semua
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[260px] shrink-0 bg-white rounded-xl border overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {featuredProperties.map((property) => (
                <div key={property.id} className="w-[260px] shrink-0">
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ========== LATEST PROPERTIES ========== */}
      <section className="py-5 bg-white">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Properti Terbaru
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Listing terbaru dari agen kami</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700 text-xs h-8"
              onClick={() => router.navigate({ page: 'properties' })}
            >
              Semua
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-2.5 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {latestProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========== WHY CHOOSE US ========== */}
      <section className="py-5 bg-emerald-700 text-white">
        <div className="px-4">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">Mengapa Memilih TerimaKunci?</h2>
            <p className="text-emerald-200 mt-1 text-xs">Keunggulan yang kami tawarkan</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: ShieldCheck,
                title: 'Terpercaya',
                desc: 'Semua properti terverifikasi dan legalitas dijamin.',
              },
              {
                icon: Layers,
                title: 'Banyak Pilihan',
                desc: 'Ribuan listing properti dari berbagai kota.',
              },
              {
                icon: BadgeDollarSign,
                title: 'Harga Terbaik',
                desc: 'Harga kompetitif dan transparan.',
              },
              {
                icon: HeadphonesIcon,
                title: 'Layanan 24/7',
                desc: 'Tim agen berpengalaman siap membantu.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 text-center"
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/30 flex items-center justify-center mb-2">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="font-semibold text-sm mb-0.5">{feature.title}</h3>
                <p className="text-[11px] text-emerald-200 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== POPULAR LOCATIONS ========== */}
      <section className="py-5 bg-gray-50">
        <div className="px-4">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Lokasi Populer</h2>
            <p className="text-xs text-gray-500 mt-0.5">Jelajahi properti di kabupaten/kota favorit</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {cities.slice(0, 6).map((city) => (
              <button
                key={city.id}
                onClick={() =>
                  router.navigate({ page: 'properties', params: { cityId: city.id } })
                }
                className="relative group rounded-xl overflow-hidden aspect-[3/2] bg-gray-200"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                <div className="absolute inset-0 bg-emerald-800/80 z-0" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 z-20">
                  <div className="flex items-center gap-1.5 text-white">
                    <MapPinned className="size-3.5" />
                    <span className="font-semibold text-sm">{city.name}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ARTICLES SECTION ========== */}
      <section className="py-5 bg-white">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Artikel Terbaru</h2>
              <p className="text-xs text-gray-500 mt-0.5">Tips dan informasi seputar properti</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700 text-xs h-8"
              onClick={() => router.navigate({ page: 'articles' })}
            >
              Semua
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[280px] shrink-0 bg-white rounded-xl border overflow-hidden">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <div className="p-3 space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {articles.map((article) => (
                <div key={article.id} className="w-[280px] shrink-0">
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="py-5 bg-gray-50">
        <div className="px-4">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Apa Kata Mereka?</h2>
            <p className="text-xs text-gray-500 mt-0.5">Testimoni dari pelanggan kami</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="bg-white border-gray-200 shrink-0 w-[280px]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className={cn(
                          'size-3.5',
                          si < t.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                        )}
                      />
                    ))}
                  </div>
                  <Quote className="size-5 text-emerald-200 mb-1.5" />
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-700 font-bold text-xs">
                        {t.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-gray-900">{t.name}</p>
                      <p className="text-[10px] text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-6 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white">
        <div className="px-4 text-center">
          <Phone className="size-8 mx-auto mb-2 opacity-80" />
          <h2 className="text-lg font-bold mb-1.5">Konsultasi Gratis</h2>
          <p className="text-emerald-100 mb-4 max-w-lg mx-auto text-xs">
            Butuh bantuan menemukan properti yang tepat? Tim kami siap membantu Anda via WhatsApp.
          </p>
          <a
            href={`https://wa.me/${whatsappNumber}?text=Halo, saya tertarik dengan properti di TerimaKunci.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm shadow-lg"
          >
            <MessageCircle className="size-4" />
            Chat WhatsApp
          </a>
        </div>
      </section>

      {/* ========== AGENTS SECTION ========== */}
      <section className="py-5 bg-white">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Agen Kami</h2>
              <p className="text-xs text-gray-500 mt-0.5">Tim profesional siap membantu</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700 text-xs h-8"
              onClick={() => router.navigate({ page: 'agents' })}
            >
              Semua
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[180px] shrink-0 flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <Skeleton className="h-4 w-24 mt-2" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {agents.slice(0, 4).map((agent) => (
                <div
                  key={agent.id}
                  className="w-[180px] shrink-0 flex flex-col items-center p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors"
                  onClick={() => router.navigate({ page: 'agent-detail', id: agent.id })}
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-2 overflow-hidden">
                    {agent.photo ? (
                      <img
                        src={agent.photo}
                        alt={agent.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-emerald-700 font-bold text-xl">
                        {agent.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900">{agent.name}</h3>
                  {agent.title && (
                    <p className="text-[11px] text-gray-500">{agent.title}</p>
                  )}
                  <a
                    href={`https://wa.me/${agent.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg transition-colors"
                  >
                    <MessageCircle className="size-3" />
                    Hubungi
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
