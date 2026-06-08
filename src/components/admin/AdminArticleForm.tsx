'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useDataCache } from '@/lib/store';
import type { Article } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

const articleSchema = z.object({
  title: z.string().min(1, 'Judul tidak boleh kosong'),
  slug: z.string().min(1, 'Slug tidak boleh kosong'),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  content: z.string().min(1, 'Konten tidak boleh kosong'),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  isPublished: z.boolean(),
  scheduledAt: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

export default function AdminArticleForm() {
  const { route, navigate, goBack } = useRouter();
  const articleId = route.page === 'admin-article-edit' ? route.id : undefined;
  const isEdit = !!articleId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'published' | 'draft' | 'scheduled'>('draft');

  const articleCategories = useDataCache((s) => s.articleCategories);
  const setArticleCategories = useDataCache((s) => s.setArticleCategories);

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '', slug: '', content: '', isPublished: false,
    },
  });

  const { watch, setValue } = form;
  const watchedTitle = watch('title');

  // Auto-generate slug
  useEffect(() => {
    if (!isEdit && watchedTitle) {
      const slug = watchedTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  }, [watchedTitle, isEdit, setValue]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [catRes] = await Promise.allSettled([
          fetchWithAuth('/api/article-categories').then((r) => r.json()),
        ]);
        if (catRes.status === 'fulfilled') {
          setArticleCategories(Array.isArray(catRes.value?.data) ? catRes.value.data : Array.isArray(catRes.value) ? catRes.value : []);
        }

        if (isEdit && articleId) {
          const res = await fetchWithAuth(`/api/articles/${articleId}`);
          if (res.ok) {
            const article = await res.json() as Article;
            form.reset({
              title: article.title || '',
              slug: article.slug || '',
              categoryId: article.categoryId || '',
              tags: article.tags || '',
              content: article.content || '',
              excerpt: article.excerpt || '',
              featuredImage: article.featuredImage || '',
              isPublished: article.isPublished,
              scheduledAt: article.scheduledAt || '',
              metaTitle: article.metaTitle || '',
              metaDescription: article.metaDescription || '',
              metaKeywords: article.metaKeywords || '',
            });
            setPublishStatus(article.isPublished ? 'published' : article.scheduledAt ? 'scheduled' : 'draft');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEdit, articleId, form, setArticleCategories]);

  const onSubmit = async (data: ArticleFormData) => {
    setSaving(true);
    try {
      const isPub = publishStatus === 'published';
      const scheduledAt = publishStatus === 'scheduled' ? data.scheduledAt : undefined;
      const payload = { ...data, isPublished: isPub, scheduledAt };
      const url = isEdit ? `/api/articles/${articleId}` : '/api/articles';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        navigate({ page: 'admin-articles' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Artikel' : 'Tambah Artikel Baru'}</h2>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          {saving ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Informasi Artikel</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <FormField name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul</FormLabel>
                  <FormControl><Input {...field} placeholder="Judul artikel" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl><Input {...field} placeholder="slug-artikel" /></FormControl>
                  <FormDescription>Otomatis di-generate dari judul</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih kategori" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {articleCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="tags" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl><Input {...field} placeholder="tag1, tag2, tag3" /></FormControl>
                    <FormDescription>Pisahkan dengan koma</FormDescription>
                  </FormItem>
                )} />
              </div>

              {/* Publish Status */}
              <div className="space-y-2">
                <Label>Status Publish</Label>
                <RadioGroup value={publishStatus} onValueChange={(v) => setPublishStatus(v as 'published' | 'draft' | 'scheduled')} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="draft" id="draft" />
                    <Label htmlFor="draft" className="!mt-0 font-normal">Draft</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="published" id="published" />
                    <Label htmlFor="published" className="!mt-0 font-normal">Publish Sekarang</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="scheduled" id="scheduled" />
                    <Label htmlFor="scheduled" className="!mt-0 font-normal">Terjadwal</Label>
                  </div>
                </RadioGroup>
                {publishStatus === 'scheduled' && (
                  <FormField name="scheduledAt" render={({ field }) => (
                    <FormItem className="max-w-xs">
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader><CardTitle className="text-base">Konten</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <FormField name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>Isi Artikel</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Tulis isi artikel..." rows={16} className="font-mono text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="excerpt" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ringkasan (Excerpt)</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Ringkasan singkat artikel..." rows={3} /></FormControl>
                </FormItem>
              )} />
              <FormField name="featuredImage" render={({ field }) => (
                <FormItem className="max-w-lg">
                  <FormLabel>Featured Image URL</FormLabel>
                  <FormControl><Input {...field} placeholder="URL gambar utama" /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <FormField name="metaTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Title</FormLabel>
                  <FormControl><Input {...field} placeholder="Meta title untuk SEO" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="metaDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Description</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Meta description untuk SEO" rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="metaKeywords" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Keywords</FormLabel>
                  <FormControl><Input {...field} placeholder="keyword1, keyword2, keyword3" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end pb-6">
            <Button type="button" variant="outline" onClick={() => navigate({ page: 'admin-articles' })}>Batal</Button>
            <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan Artikel'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
