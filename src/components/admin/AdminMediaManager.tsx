'use client';

import { useEffect, useState, useRef } from 'react';
import type { Media } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload, Trash2, Image as ImageIcon, Pencil, Download, Loader2,
  FileIcon, VideoIcon, FileTextIcon,
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminMediaManager() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMedia, setEditMedia] = useState<Media | null>(null);
  const [editAltText, setEditAltText] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = search ? `?keyword=${search}` : '';
      const res = await fetchWithAuth(`/api/upload${params}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(Array.isArray(data) ? data : data.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMedia(); }, [search]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      const res = await fetchWithAuth('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        fetchMedia();
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus file ini?')) return;
    try {
      await fetchWithAuth(`/api/upload/${id}`, { method: 'DELETE' });
      fetchMedia();
    } catch {}
  };

  const openEditAlt = (item: Media) => {
    setEditMedia(item);
    setEditAltText(item.altText || '');
    setEditDialogOpen(true);
  };

  const handleSaveAlt = async () => {
    if (!editMedia) return;
    setSaving(true);
    try {
      await fetchWithAuth(`/api/upload/${editMedia.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ altText: editAltText }),
      });
      setEditDialogOpen(false);
      fetchMedia();
    } finally {
      setSaving(false);
    }
  };

  const getMediaIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return VideoIcon;
    return FileTextIcon;
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Media Manager</h2>
          <p className="text-sm text-muted-foreground">{media.length} file</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Cari file..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Mengupload...' : 'Upload'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-16">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">Belum ada file. Klik tombol Upload untuk menambahkan.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {media.map((item) => {
            const isImage = item.mimeType.startsWith('image/');
            return (
              <Card key={item.id} className="overflow-hidden group">
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                  {isImage ? (
                    <img
                      src={item.url}
                      alt={item.altText || item.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {(() => { const Icon = getMediaIcon(item.mimeType); return <Icon className="h-12 w-12 text-muted-foreground" />; })()}
                    </div>
                  )}
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => openEditAlt(item)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => copyUrl(item.url)}>
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-2">
                  <p className="text-xs font-medium truncate">{item.filename}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{formatSize(item.size)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Alt Text Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Alt Text</DialogTitle>
            <DialogDescription>Ubah teks alternatif untuk {editMedia?.filename}</DialogDescription>
          </DialogHeader>
          {editMedia && (
            <div className="space-y-4">
              {editMedia.mimeType.startsWith('image/') && (
                <div className="rounded-lg overflow-hidden bg-gray-100 max-h-40">
                  <img src={editMedia.url} alt="Preview" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Alt Text</label>
                <Input
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  placeholder="Deskripsi gambar untuk aksesibilitas"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveAlt} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
