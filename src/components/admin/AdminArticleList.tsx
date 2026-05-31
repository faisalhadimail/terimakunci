'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useDataCache } from '@/lib/store';
import type { Article, PaginatedResponse } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Globe, BookOpen, EyeIcon,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminArticleList() {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  const articleCategories = useDataCache((s) => s.articleCategories);
  const setArticleCategories = useDataCache((s) => s.setArticleCategories);

  const fetchArticles = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('keyword', search);
      if (publishedFilter !== 'all') params.set('published', publishedFilter);
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter);

      const res = await fetchWithAuth(`/api/articles?${params}`);
      if (res.ok) {
        const data: PaginatedResponse<Article> = await res.json();
        setArticles(data.data);
        setPagination(data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [search, publishedFilter, categoryFilter]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  useEffect(() => {
    if (articleCategories.length === 0) {
      fetchWithAuth('/api/article-categories')
        .then((r) => r.json())
        .then((data) => setArticleCategories(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [articleCategories.length, setArticleCategories]);

  const handleTogglePublish = async (article: Article) => {
    try {
      await fetchWithAuth(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !article.isPublished }),
      });
      fetchArticles(pagination.page);
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchWithAuth(`/api/articles/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchArticles(pagination.page);
    } catch {}
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Daftar Artikel</h2>
          <p className="text-sm text-muted-foreground">{pagination.total} artikel ditemukan</p>
        </div>
        <Button
          onClick={() => navigate({ page: 'admin-article-edit' })}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-4 w-4" />
          Tambah Artikel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari artikel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchArticles(1)}
                className="pl-9"
              />
            </div>
            <Select value={publishedFilter} onValueChange={setPublishedFilter}>
              <SelectTrigger className="w-full lg:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="true">Published</SelectItem>
                <SelectItem value="false">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-[180px]"><SelectValue placeholder="Kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {articleCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Views</TableHead>
                <TableHead className="w-12">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : articles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Tidak ada artikel ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium max-w-[250px] truncate">{article.title}</TableCell>
                    <TableCell className="text-sm">{article.category?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={article.isPublished ? 'default' : 'secondary'}>
                        {article.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {article.publishedAt ? formatDate(article.publishedAt) : formatDate(article.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="h-3 w-3" /> {article.viewCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate({ page: 'article-detail', slug: article.slug })}>
                            <Eye className="mr-2 h-4 w-4" /> Lihat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate({ page: 'admin-article-edit', id: article.id })}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(article)}>
                            {article.isPublished ? (
                              <><BookOpen className="mr-2 h-4 w-4" /> Unpublish</>
                            ) : (
                              <><Globe className="mr-2 h-4 w-4" /> Publish</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setDeleteTarget(article); setDeleteDialogOpen(true); }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Halaman {pagination.page} dari {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchArticles(pagination.page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchArticles(pagination.page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Artikel</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus artikel &quot;{deleteTarget?.title}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
