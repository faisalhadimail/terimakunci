'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Calendar,
  User,
  Share2,
  Facebook,
  Twitter,
  ArrowLeft,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { useRouter } from '@/hooks/use-router';
import { useDataCache } from '@/lib/store';
import { Article } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import ArticleCard from './ArticleCard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ArticleDetailPage() {
  const { route, navigate, goBack } = useRouter();
  const slug = route.page === 'article-detail' ? route.slug : '';

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { settings } = useDataCache();

  const siteName = settings.find((s) => s.key === 'site_name')?.value || 'PropNusa';

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const loadArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${slug}`);
        const data = res.ok ? await res.json() : null;
        if (cancelled) return;
        const a = data?.data || data;
        if (a) {
          setArticle(a);
          const params = new URLSearchParams();
          params.set('limit', '3');
          if (a.categoryId) params.set('categoryId', a.categoryId);
          params.set('exclude', a.id);
          const relRes = await fetch(`/api/articles?${params.toString()}`);
          if (relRes.ok && !cancelled) {
            const relData = await relRes.json();
            setRelatedArticles(relData.data || relData || []);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    loadArticle();
    return () => { cancelled = true; };
  }, [slug]);

  // Dynamic SEO meta tags
  useEffect(() => {
    if (!article) return;
    const siteTitle = article.metaTitle || `${article.title} - ${siteName}`;
    const siteDesc = article.metaDescription || article.excerpt || article.title;
    const ogImage = article.featuredImage || '';
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

    document.title = siteTitle;

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
    if (article.metaKeywords) setMeta('name', 'keywords', article.metaKeywords);

    return () => {
      document.title = `${siteName} - Jual Beli Properti Terpercaya`;
    };
  }, [article, siteName]);

  // Share functions
  const getShareUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  }, []);

  const handleShare = (platform: string) => {
    if (!article) return;
    const url = getShareUrl();
    const title = article.title;
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + '\n' + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        handleCopyLink();
        break;
    }
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    toast.success('Link berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="aspect-[16/9] w-full rounded-xl mb-4" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <div className="flex gap-3 mb-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Artikel Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500 mb-4">Artikel yang Anda cari tidak tersedia.</p>
        <Button onClick={() => navigate({ page: 'articles' })} className="bg-emerald-600 hover:bg-emerald-700">
          Lihat Semua Artikel
        </Button>
      </div>
    );
  }

  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const readingTime = Math.max(1, Math.ceil((article.content?.length || 0) / 1000));

  return (
    <div className="px-4 py-3">
      {/* Back button */}
      <div className="flex items-center gap-3 mb-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-1 text-gray-600" onClick={goBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium text-gray-700">Baca Artikel</span>
      </div>

      {/* Featured Image */}
      {article.featuredImage && (
        <div className="aspect-[16/9] rounded-xl overflow-hidden mb-4 bg-gray-100">
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Header */}
      <div className="mb-4">
        {article.category && (
          <Badge className="bg-emerald-600 text-white text-[10px] mb-2">
            {article.category.name}
          </Badge>
        )}
        <h1 className="text-lg font-bold text-gray-900 leading-tight mb-2">
          {article.title}
        </h1>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {article.author && (
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {article.author.name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {readingTime} min
          </span>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Content */}
      <div
        className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-sm mb-4"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Share Buttons */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <span className="text-xs font-medium text-gray-700 shrink-0">Bagikan:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('whatsapp')}
          className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 text-xs shrink-0"
        >
          <svg className="size-3.5 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('facebook')}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 text-xs shrink-0"
        >
          <Facebook className="size-3.5 mr-1" />
          Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('copy')}
          className={cn(
            'h-8 text-xs shrink-0 transition-colors',
            copied && 'bg-emerald-50 border-emerald-200 text-emerald-600'
          )}
        >
          {copied ? <Check className="size-3.5 mr-1" /> : <Copy className="size-3.5 mr-1" />}
          {copied ? 'Tersalin' : 'Salin Link'}
        </Button>
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">Artikel Terkait</h2>
          <div className="space-y-3">
            {relatedArticles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
