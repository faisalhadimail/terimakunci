'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from '@/hooks/use-router';
import { usePropertyStore, useDataCache } from '@/lib/store';
import type { Property, PaginatedResponse } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Combobox } from '@/components/ui/combobox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Copy, Star, Globe, BookOpen,
  ChevronLeft, ChevronRight, Loader2, Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X,
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function AdminPropertyList() {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [publishedFilter, setPublishedFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; total: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const properties = usePropertyStore((s) => s.properties);
  const setProperties = usePropertyStore((s) => s.setProperties);
  const pagination = usePropertyStore((s) => s.pagination);
  const setPage = usePropertyStore((s) => s.setPage);
  const propertyTypes = useDataCache((s) => s.propertyTypes);
  const setPropertyTypes = useDataCache((s) => s.setPropertyTypes);

  const fetchProperties = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('keyword', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('propertyTypeId', typeFilter);
      if (publishedFilter !== 'all') params.set('published', publishedFilter);
      if (featuredFilter !== 'all') params.set('featured', featuredFilter);

      const res = await fetchWithAuth(`/api/properties?${params}`);
      if (res.ok) {
        const data: PaginatedResponse<Property> = await res.json();
        setProperties(data.data, data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, publishedFilter, featuredFilter, setProperties]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (propertyTypes.length === 0) {
      fetchWithAuth('/api/property-types')
        .then((r) => r.json())
        .then((data) => setPropertyTypes(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [propertyTypes.length, setPropertyTypes]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === properties.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(properties.map((p) => p.id)));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchWithAuth(`/api/properties/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchProperties(pagination.page);
    } catch {}
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return;
    try {
      await fetchWithAuth('/api/properties/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: bulkAction, ids: Array.from(selected) }),
      });
      setSelected(new Set());
      setBulkAction(null);
      fetchProperties(pagination.page);
    } catch {}
  };

  const handleDuplicate = async (prop: Property) => {
    try {
      await fetchWithAuth(`/api/properties/${prop.id}/duplicate`, { method: 'POST' });
      fetchProperties(pagination.page);
    } catch {}
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetchWithAuth('/api/properties/template');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template-import-properti-propnusa.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch {}
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (publishedFilter !== 'all') params.set('published', publishedFilter);

      const res = await fetchWithAuth(`/api/properties/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `properti-propnusa-${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch {}
    setExporting(false);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await fetchWithAuth('/api/properties/import', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        setImportResult(json.data);
        fetchProperties(1);
      }
    } catch {}
    setImporting(false);
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      dijual: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
      disewa: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400',
      terjual: 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      tersewa: 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
    };
    return (
      <Badge variant="outline" className={variants[status] || ''}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Daftar Properti</h2>
          <p className="text-sm text-muted-foreground">{pagination.total} properti ditemukan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setImportResult(null); setImportFile(null); setImportDialogOpen(true); }}>
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
          <Button
            onClick={() => navigate({ page: 'admin-property-edit' })}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Tambah Properti
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari properti..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProperties(1)}
                className="pl-9"
              />
            </div>
            <Combobox
              options={[{ value: 'all', label: 'Semua Status' }, { value: 'dijual', label: 'Dijual' }, { value: 'disewa', label: 'Disewa' }, { value: 'draft', label: 'Draft' }, { value: 'terjual', label: 'Terjual' }, { value: 'tersewa', label: 'Tersewa' }]}
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
              placeholder="Status"
              searchPlaceholder="Cari status..."
              buttonClassName="w-full lg:w-[160px]"
            />
            <Combobox
              options={[{ value: 'all', label: 'Semua Jenis' }, ...propertyTypes.map((t) => ({ value: t.id, label: t.name }))]}
              value={typeFilter}
              onValueChange={(v) => { setTypeFilter(v); setPage(1); }}
              placeholder="Jenis Properti"
              searchPlaceholder="Cari jenis..."
              emptyMessage="Jenis tidak ditemukan"
              buttonClassName="w-full lg:w-[180px]"
            />
            <Combobox
              options={[{ value: 'all', label: 'Semua' }, { value: 'true', label: 'Published' }, { value: 'false', label: 'Unpublished' }]}
              value={publishedFilter}
              onValueChange={(v) => { setPublishedFilter(v); setPage(1); }}
              placeholder="Published"
              searchPlaceholder="Cari..."
              buttonClassName="w-full lg:w-[160px]"
            />
            <Combobox
              options={[{ value: 'all', label: 'Semua' }, { value: 'true', label: 'Featured' }, { value: 'false', label: 'Non-Featured' }]}
              value={featuredFilter}
              onValueChange={(v) => { setFeaturedFilter(v); setPage(1); }}
              placeholder="Featured"
              searchPlaceholder="Cari..."
              buttonClassName="w-full lg:w-[160px]"
            />
          </div>

          {/* Bulk Actions */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t">
              <span className="text-sm text-muted-foreground">{selected.size} dipilih</span>
              <Button size="sm" variant="outline" onClick={() => setBulkAction('publish')}>
                <Globe className="h-3 w-3" /> Publish
              </Button>
              <Button size="sm" variant="outline" onClick={() => setBulkAction('unpublish')}>
                <BookOpen className="h-3 w-3" /> Unpublish
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setBulkAction('delete')}>
                <Trash2 className="h-3 w-3" /> Hapus
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={properties.length > 0 && selected.size === properties.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agen</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="w-12">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    Tidak ada properti ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((prop) => (
                  <TableRow key={prop.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(prop.id)}
                        onCheckedChange={() => toggleSelect(prop.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{prop.code}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{prop.title}</TableCell>
                    <TableCell className="text-sm">{prop.propertyType?.name || '-'}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(prop.price)}</TableCell>
                    <TableCell>{statusBadge(prop.status)}</TableCell>
                    <TableCell className="text-sm">{prop.agent?.name || '-'}</TableCell>
                    <TableCell>
                      {prop.isFeatured ? (
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      ) : (
                        <Star className="h-4 w-4 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={prop.isPublished ? 'default' : 'secondary'} className="text-xs">
                        {prop.isPublished ? 'Ya' : 'Tidak'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate({ page: 'property-detail', slug: prop.slug })}>
                            <Eye className="mr-2 h-4 w-4" /> Lihat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate({ page: 'admin-property-edit', id: prop.id })}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(prop)}>
                            <Copy className="mr-2 h-4 w-4" /> Duplikat
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDeleteTarget(prop);
                              setDeleteDialogOpen(true);
                            }}
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
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4)) + i;
                  if (pageNum > pagination.totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage(pagination.page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Properti</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus properti &quot;{deleteTarget?.title}&quot;? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Excel Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => { if (!open) { setImportDialogOpen(false); setImportResult(null); setImportFile(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Import Properti dari Excel
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              Upload file Excel (.xlsx / .xls / .csv) berisi data listing properti.
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 shrink-0"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-3 w-3" />
                Download Template
              </Button>
            </DialogDescription>
          </DialogHeader>

          {!importResult ? (
            <>
              {/* File upload area */}
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file) setImportFile(file);
                }}
              >
                {importFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{importFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(importFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-2" onClick={(e) => { e.stopPropagation(); setImportFile(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">Klik atau seret file ke sini</p>
                    <p className="text-xs text-muted-foreground mt-1">Format: .xlsx, .xls, .csv</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) setImportFile(file); }}
              />

              {/* Tips */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
                <p className="font-semibold">Tips:</p>
                <p>• Klik <strong>&quot;Download Template&quot;</strong> di atas untuk mendapat file format yang benar lengkap dengan data referensi.</p>
                <p>• Kolom wajib: <strong>Judul</strong>, <strong>Jenis Properti</strong>, <strong>Harga (Rp)</strong></p>
                <p>• Jenis Properti, Kota, Kecamatan, dan Agen harus sesuai data di sheet <strong>&quot;Data Referensi&quot;</strong> pada template.</p>
                <p>• Status: dijual, disewa, atau draft. Sertifikat: SHM, SHGB, AJB, Girik.</p>
              </div>
            </>
          ) : (
            /* Import result */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-medium text-emerald-800">Import Selesai</p>
                  <p className="text-sm text-emerald-700">
                    <strong>{importResult.imported}</strong> properti berhasil diimport,
                    {importResult.skipped > 0 && (
                      <> <strong>{importResult.skipped}</strong> dilewati</>
                    )} dari {importResult.total} baris.
                  </p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-700 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> Detail Error ({importResult.errors.length})
                  </p>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-700">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {importResult ? (
              <Button onClick={() => setImportDialogOpen(false)}>Selesai</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Batal</Button>
                <Button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {importing ? 'Mengimport...' : 'Import Data'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
