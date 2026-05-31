'use client';

import { useEffect, useState } from 'react';
import type { PropertyType } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Home } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

export default function AdminPropertyTypeManager() {
  const [types, setTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/property-types');
      if (res.ok) {
        const json = await res.json();
        setTypes(Array.isArray(json) ? json : json.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTypes(); }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  const openAdd = () => {
    setEditId(null);
    setFormName('');
    setFormIcon('');
    setFormSlug('');
    setFormActive(true);
    setDialogOpen(true);
  };

  const openEdit = (type: PropertyType) => {
    setEditId(type.id);
    setFormName(type.name);
    setFormIcon(type.icon || '');
    setFormSlug(type.slug);
    setFormActive(type.isActive);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const url = editId ? `/api/property-types/${editId}` : '/api/property-types';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          slug: formSlug || generateSlug(formName),
          icon: formIcon,
          isActive: formActive,
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        fetchTypes();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (type: PropertyType) => {
    try {
      await fetchWithAuth(`/api/property-types/${type.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !type.isActive }),
      });
      fetchTypes();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus tipe ini?')) return;
    try {
      await fetchWithAuth(`/api/property-types/${id}`, { method: 'DELETE' });
      fetchTypes();
    } catch {}
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Jenis Properti</h2>
          <p className="text-sm text-muted-foreground">{types.length} tipe terdaftar</p>
        </div>
        <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="h-4 w-4" />
          Tambah Jenis
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Aktif</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Home className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Belum ada jenis properti. Klik tombol di atas untuk menambahkan.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  types.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell className="text-sm">{type.icon || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{type.slug}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={type.isActive}
                            onCheckedChange={() => handleToggleActive(type)}
                          />
                          <Badge variant={type.isActive ? 'default' : 'secondary'} className="text-xs">
                            {type.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(type)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(type.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit' : 'Tambah'} Jenis Properti</DialogTitle>
            <DialogDescription>Masukkan informasi jenis properti</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (!editId) setFormSlug(generateSlug(e.target.value));
                }}
                placeholder="Contoh: Rumah, Apartemen, Ruko"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="rumah"
              />
            </div>
            <div className="space-y-2">
              <Label>Icon (Lucide icon name)</Label>
              <Input
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                placeholder="Home, Building, Warehouse, dll"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Aktif</Label>
                <p className="text-sm text-muted-foreground">Tampilkan di website</p>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
