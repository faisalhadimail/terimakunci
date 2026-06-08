'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  MapPin,
  Phone,
  MessageCircle,
  Calculator,
  ArrowLeft,
  Copy,
  Check,
  Facebook,
  Twitter,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from '@/hooks/use-router';
import { useDataCache } from '@/lib/store';
import { Property } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import PropertyCard from './PropertyCard';
import { cn } from '@/lib/utils';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function PropertyDetailPage() {
  const { route, navigate, goBack } = useRouter();
  const { settings } = useDataCache();
  const slug = route.page === 'property-detail' ? route.slug : '';

  const [property, setProperty] = useState<Property | null>(null);
  const [relatedProperties, setRelatedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  const [kprTenor, setKprTenor] = useState(20);
  const [kprDpPercent, setKprDpPercent] = useState(20);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [copied, setCopied] = useState(false);

  // Lead form
  const [leadName, setLeadName] = useState('');
  const [leadWhatsapp, setLeadWhatsapp] = useState('');
  const [leadMessage, setLeadMessage] = useState('');

  const getSetting = (key: string, fallback: string = ''): string => {
    const s = settings.find((s) => s.key === key);
    return s?.value || fallback;
  };

  const whatsappNumber = getSetting('contact_whatsapp', '6281234567890');
  const siteName = getSetting('site_name', 'TerimaKunci');

  // Build share URL from current page
  const getShareUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  }, []);

  // Dynamic SEO meta tags
  useEffect(() => {
    if (!property) return;
    const siteTitle = property.metaTitle || `${property.title} - ${siteName}`;
    const siteDesc = property.metaDescription || `${property.priceDisplay || formatPrice(property.price)} · ${property.landArea}m² · ${[property.district?.name, property.city?.name].filter(Boolean).join(', ')} · ${siteName}`;
    const ogImage = property.mainImage || '';
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

    // Update document title
    document.title = siteTitle;

    // Helper to set/update meta tag content
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('property', 'og:title', siteTitle);
    setMeta('property', 'og:description', siteDesc);
    setMeta('property', 'og:url', pageUrl);
    setMeta('property', 'og:type', 'article');
    if (ogImage) setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:site_name', siteName);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', siteTitle);
    setMeta('name', 'twitter:description', siteDesc);
    if (ogImage) setMeta('name', 'twitter:image', ogImage);
    setMeta('name', 'description', siteDesc);
    if (property.metaKeywords) setMeta('name', 'keywords', property.metaKeywords);

    return () => {
      // Reset to default title on unmount
      document.title = `${siteName} - Jual Beli Properti Terpercaya`;
    };
  }, [property, siteName]);

  // Share functions
  const handleShareWhatsApp = () => {
    const url = getShareUrl();
    const text = `${property?.title} - ${property?.priceDisplay || (property ? formatPrice(property.price) : '')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
  };

  const handleShareFacebook = () => {
    const url = getShareUrl();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const handleShareTwitter = () => {
    const url = getShareUrl();
    const text = `${property?.title} - ${property?.priceDisplay || (property ? formatPrice(property.price) : '')}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success('Link berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setSelectedImage(0);
    setFormSuccess(false);
    setLeadName('');
    setLeadWhatsapp('');
    setLeadMessage('');

    Promise.all([
      fetch(`/api/properties/${slug}`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(async ([propData]) => {
        const p = propData?.data || propData;
        if (p) {
          setProperty(p);
          if (p.cityId) {
            const relRes = await fetch(`/api/properties?cityId=${p.cityId}&limit=4&exclude=${p.id}`);
            if (relRes.ok) {
              const relData = await relRes.json();
              setRelatedProperties(relData.data || relData || []);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const images = useMemo(() => {
    if (!property) return [];
    const imgs: string[] = [];
    if (property.mainImage) imgs.push(property.mainImage);
    if (property.images && property.images.length > 0) {
      property.images.forEach((img) => {
        if (img.url !== property.mainImage) imgs.push(img.url);
      });
    }
    return imgs.length > 0 ? imgs : ['/placeholder-property.jpg'];
  }, [property]);

  const kprRate = parseFloat(getSetting('kpr_interest_rate', '7')) || 7;

  // KPR slider range
  const kprDpMin = 10;
  const kprDpMax = 80;
  const kprTenorMin = 1;
  const kprTenorMax = 30;

  const kprResult = useMemo(() => {
    if (!property) return null;
    const price = Number(property.price);
    const dp = kprDpPercent / 100;
    const tenor = kprTenor;
    const rate = kprRate / 100;
    const downPayment = price * dp;
    const loanAmount = price - downPayment;
    if (loanAmount <= 0 || tenor <= 0 || rate <= 0) return null;
    const monthlyRate = rate / 12;
    const months = tenor * 12;
    const monthly =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    return { monthly, downPayment, loanAmount };
  }, [property, kprDpPercent, kprTenor, kprRate]);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property || !leadName || !leadWhatsapp) return;
    setFormSubmitting(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName,
          whatsapp: leadWhatsapp,
          message: leadMessage,
          propertyId: property.id,
          propertyName: property.title,
          needType: 'tanya_harga',
          source: 'website',
        }),
      });
      setFormSuccess(true);
    } catch {
      // silent fail
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="aspect-[4/3] w-full rounded-xl mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-14 h-10 rounded-lg" />
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Properti Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500 mb-4">Properti yang Anda cari tidak tersedia.</p>
        <Button onClick={() => navigate({ page: 'properties' })} className="bg-emerald-600 hover:bg-emerald-700">
          Lihat Semua Properti
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      {/* Top Bar with Back */}
      <div className="flex items-center gap-3 mb-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-1 text-gray-600" onClick={goBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium text-gray-700">Detail Properti</span>
      </div>

      {/* Image Gallery */}
      <div className="space-y-2">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
          <img
            src={images[selectedImage]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && selectedImage > 0 && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow h-8 w-8"
              onClick={() => setSelectedImage((s) => s - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
          )}
          {images.length > 1 && selectedImage < images.length - 1 && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow h-8 w-8"
              onClick={() => setSelectedImage((s) => s + 1)}
            >
              <ChevronLeft className="size-4 rotate-180" />
            </Button>
          )}
          {/* Badges on image */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {property.status === 'dijual' && (
              <Badge className="bg-emerald-600 text-white text-[10px]">Dijual</Badge>
            )}
            {property.status === 'disewa' && (
              <Badge className="bg-blue-600 text-white text-[10px]">Disewa</Badge>
            )}
            {property.isFeatured && (
              <Badge className="bg-amber-500 text-white text-[10px]">Featured</Badge>
            )}
            {property.isNego && (
              <Badge className="bg-purple-500 text-white text-[10px]">Nego</Badge>
            )}
          </div>
          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {selectedImage + 1}/{images.length}
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={cn(
                  'w-12 h-9 rounded-lg overflow-hidden shrink-0 border-2 transition-colors',
                  i === selectedImage
                    ? 'border-emerald-600'
                    : 'border-transparent opacity-60 hover:opacity-100'
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Share Buttons */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-gray-400 mr-0.5">Bagikan:</span>
        <button
          onClick={handleShareWhatsApp}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 hover:bg-green-200 text-green-600 transition-colors"
          title="Bagikan ke WhatsApp"
        >
          <MessageCircle className="size-3.5" />
        </button>
        <button
          onClick={handleShareFacebook}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
          title="Bagikan ke Facebook"
        >
          <Facebook className="size-3.5" />
        </button>
        <button
          onClick={handleShareTwitter}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-100 hover:bg-sky-200 text-sky-500 transition-colors"
          title="Bagikan ke X (Twitter)"
        >
          <Twitter className="size-3.5" />
        </button>
        <button
          onClick={handleCopyLink}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-full transition-colors',
            copied
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
          )}
          title="Salin Link"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      {/* Title & Price */}
      <div className="mt-4">
        <div className="flex items-start gap-2 mb-1.5">
          <h1 className="text-base font-bold text-gray-900 flex-1">
            {property.title}
          </h1>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {property.code}
          </Badge>
        </div>
        <p className="text-xl font-bold text-emerald-700">
          {property.priceDisplay || formatPrice(property.price)}
        </p>
        {(property.address || property.city?.name) && (
          <div className="text-xs text-gray-500 flex items-start gap-1 mt-1.5">
            <MapPin className="size-3.5 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              {property.address && <span>{property.address}</span>}
              <span>
                {[property.district?.name, property.city?.name].filter(Boolean).join(', ')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {property.description && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Deskripsi</h3>
          <div
            className="prose prose-xs max-w-none text-gray-600 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: property.description }}
          />
        </div>
      )}

      {/* Map - only show if coordinates are filled */}
      {property.latitude && property.longitude && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Lokasi</h3>
          <div className="w-full h-40 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
            <div className="text-center">
              <MapPin className="size-6 mx-auto mb-1" />
              <p>{[property.district?.name, property.city?.name].filter(Boolean).join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* KPR Calculator */}
      <Card className="mt-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="size-3.5 text-emerald-600" />
            Simulasi KPR
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-4">
          {/* Uang Muka (DP) Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700">Uang Muka (DP)</Label>
              <span className="text-xs font-bold text-emerald-700">{kprResult ? formatPrice(Math.round(kprResult.downPayment)) : '-'}</span>
            </div>
            <Slider
              value={[kprDpPercent]}
              onValueChange={(v) => setKprDpPercent(v[0])}
              min={kprDpMin}
              max={kprDpMax}
              step={1}
              className="w-full [&_[data-slot=slider-range]]:bg-emerald-600 [&_[data-slot=slider-thumb]]:border-emerald-600"
            />
            <div className="flex justify-between">
              <span className="text-[10px] text-gray-400">{kprDpMin}%</span>
              <span className="text-[10px] text-gray-500 font-medium">{kprDpPercent}% dari harga</span>
              <span className="text-[10px] text-gray-400">{kprDpMax}%</span>
            </div>
          </div>

          {/* Tenor Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700">Tenor</Label>
              <span className="text-xs font-bold text-emerald-700">{kprTenor} Tahun</span>
            </div>
            <Slider
              value={[kprTenor]}
              onValueChange={(v) => setKprTenor(v[0])}
              min={kprTenorMin}
              max={kprTenorMax}
              step={1}
              className="w-full [&_[data-slot=slider-range]]:bg-emerald-600 [&_[data-slot=slider-thumb]]:border-emerald-600"
            />
            <div className="flex justify-between">
              <span className="text-[10px] text-gray-400">{kprTenorMin} Tahun</span>
              <span className="text-[10px] text-gray-400">{kprTenorMax} Tahun</span>
            </div>
          </div>

          {/* Result - only monthly installment */}
          {kprResult && isFinite(kprResult.monthly) && kprResult.monthly > 0 && (
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Estimasi Cicilan/bulan</span>
                <span className="text-lg font-bold text-emerald-700">{formatPrice(Math.round(kprResult.monthly))}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                *Bunga {kprRate}% · Tenor {kprTenor} tahun · DP {kprDpPercent}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Card - Inline */}
      {property.agent && (
        <Card className="mt-4">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                {property.agent.avatar ? (
                  <img src={property.agent.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-emerald-700 font-bold text-lg">
                    {property.agent.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{property.agent.name}</p>
                <p className="text-[11px] text-gray-500">Agen Properti</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <a
                href={`https://wa.me/${property.agent.phone || whatsappNumber}?text=Halo, saya tertarik dengan properti: ${property.title}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors text-sm"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
              <Button
                variant="outline"
                onClick={() => setShowContactSheet(!showContactSheet)}
                className="flex-1 text-sm"
              >
                <Phone className="size-4 mr-1" />
                {property.agent.phone || 'Hubungi'}
              </Button>
            </div>

            {/* Contact Form (expandable) */}
            {showContactSheet && (
              <div className="border-t pt-3 space-y-2">
                <h4 className="text-xs font-semibold text-gray-900">Tanya Properti</h4>
                {formSuccess ? (
                  <div className="bg-emerald-50 text-emerald-700 text-xs rounded-lg p-2.5 text-center">
                    Pesan berhasil dikirim!
                  </div>
                ) : (
                  <form onSubmit={handleSubmitLead} className="space-y-2">
                    <Input
                      placeholder="Nama Anda"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                    <Input
                      placeholder="Nomor WhatsApp"
                      value={leadWhatsapp}
                      onChange={(e) => setLeadWhatsapp(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                    <Textarea
                      placeholder="Pertanyaan..."
                      value={leadMessage}
                      onChange={(e) => setLeadMessage(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                    <Button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-9 text-sm"
                      disabled={formSubmitting}
                    >
                      {formSubmitting ? 'Mengirim...' : 'Kirim Pesan'}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Related Properties */}
      {relatedProperties.length > 0 && (
        <section className="mt-6 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">Properti Serupa</h2>
          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {relatedProperties.slice(0, 6).map((p) => (
              <div key={p.id} className="w-[180px] shrink-0">
                <PropertyCard property={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


