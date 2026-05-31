'use client';

import { useEffect, useState, useCallback } from 'react';
import type { City, District } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

export default function AdminLocationManager() {
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'city' | 'district'>('city');
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes] = await Promise.allSettled([
        fetchWithAuth('/api/locations/cities').then((r) => r.json()),
      ]);
      if (cRes.status === 'fulfilled') setCities(Array.isArray(cRes.value?.data) ? cRes.value.data : Array.isArray(cRes.value) ? cRes.value : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchDistricts = async (cityId: string) => {
    setSelectedCity(cityId);
    if (!cityId) { setDistricts([]); return; }
    const res = await fetchWithAuth(`/api/locations/districts?cityId=${cityId}`);
    if (res.ok) {
      const json = await res.json();
      setDistricts(Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []);
    }
  };

  const openAddDialog = (type: 'city' | 'district') => {
    setDialogType(type);
    setEditId(null);
    setFormName('');
    setDialogOpen(true);
  };

  const openEditDialog = (type: 'city' | 'district', item: { id: string; name: string }) => {
    setDialogType(type);
    setEditId(item.id);
    setFormName(item.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const endpoints: Record<string, string> = {
        city: '/api/locations/cities',
        district: `/api/locations/districts${selectedCity ? `?cityId=${selectedCity}` : ''}`,
      };
      const url = editId
        ? `${endpoints[dialogType].replace(/\?.*$/, '')}/${editId}`
        : endpoints[dialogType];
      const method = editId ? 'PUT' : 'POST';

      const body: Record<string, string> = { name: formName };
      if (dialogType === 'district') body.cityId = selectedCity;

      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchData();
        if (selectedCity) fetchDistricts(selectedCity);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Yakin ingin menghapus?')) return;
    try {
      const endpoints: Record<string, string> = {
        city: '/api/locations/cities',
        district: '/api/locations/districts',
      };
      await fetchWithAuth(`${endpoints[type]}/${id}`, { method: 'DELETE' });
      fetchData();
      if (selectedCity) fetchDistricts(selectedCity);
    } catch {}
  };

  const typeLabel: Record<string, string> = { city: 'Kabupaten/Kota', district: 'Kecamatan' };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Manajemen Lokasi</h2>
        <p className="text-sm text-muted-foreground">Kelola data wilayah: kabupaten/kota dan kecamatan</p>
      </div>

      <Tabs defaultValue="cities">
        <TabsList>
          <TabsTrigger value="cities">Kabupaten/Kota</TabsTrigger>
          <TabsTrigger value="districts">Kecamatan</TabsTrigger>
        </TabsList>

        {/* Cities Tab */}
        <TabsContent value="cities" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openAddDialog('city')} className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
              <Plus className="h-3 w-3" /> Tambah Kabupaten/Kota
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
              ) : cities.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Belum ada data kabupaten/kota</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Nama</TableHead><TableHead>Slug</TableHead><TableHead className="w-24">Aksi</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {cities.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.slug}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog('city', c)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete('city', c.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Districts Tab */}
        <TabsContent value="districts" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Label>Kabupaten/Kota:</Label>
              <Select value={selectedCity} onValueChange={fetchDistricts}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Pilih kabupaten/kota" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedCity && (
              <Button onClick={() => openAddDialog('district')} className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                <Plus className="h-3 w-3" /> Tambah Kecamatan
              </Button>
            )}
          </div>
          <Card>
            <CardContent className="p-0">
              {!selectedCity ? (
                <div className="p-8 text-center text-muted-foreground">Pilih kabupaten/kota terlebih dahulu</div>
              ) : districts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Tidak ada kecamatan di kabupaten/kota ini</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Nama</TableHead><TableHead>Slug</TableHead><TableHead className="w-24">Aksi</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {districts.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{d.slug}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog('district', d)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete('district', d.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? `Edit` : `Tambah`} {typeLabel[dialogType]}</DialogTitle>
            <DialogDescription>Masukkan nama {typeLabel[dialogType]?.toLowerCase()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nama {typeLabel[dialogType]}</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={`Nama ${typeLabel[dialogType]}`}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
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
