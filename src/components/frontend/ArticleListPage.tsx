'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useDataCache } from '@/lib/store';
import { Article } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ArticleCard from './ArticleCard';

export default function ArticleListPage() {
  const { articleCategories, setArticleCategories } = useDataCache();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchCategories = useCallback(async () => {
    if (articleCategories.length === 0) {
      try {
        const res = await fetch('/api/article-categories');
        if (res.ok) {
          const data = await res.json();
          setArticleCategories(Array.isArray(data) ? data : data.data || []);
        }
      } catch {}
    }
  }, [articleCategories.length, setArticleCategories]);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '12');
      if (activeCategory !== 'all') params.set('categoryId', activeCategory);
      if (search) params.set('keyword', search);

      const res = await fetch(`/api/articles?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.data || data);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }, [activeCategory, search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">Artikel</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Tips, panduan, dan informasi seputar properti
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder="Cari artikel..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 text-sm"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs h-8">Semua</TabsTrigger>
          {articleCategories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs h-8">
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Articles */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 bg-white rounded-xl border overflow-hidden p-2">
              <Skeleton className="w-24 h-20 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5 py-0.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Search className="size-10 text-gray-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Tidak Ada Artikel</h3>
          <p className="text-xs text-gray-500">Belum ada artikel yang sesuai.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
