'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useDataCache, usePropertyStore } from '@/lib/store';
import type { Property, PropertyType, City, District, AgentProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, ArrowLeft, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

const propertySchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter'),
  slug: z.string().min(3, 'Slug minimal 3 karakter'),
  propertyTypeId: z.string().min(1, 'Pilih jenis properti'),
  status: z.enum(['dijual', 'disewa', 'draft']),
  price: z.number().min(0, 'Harga harus lebih dari 0'),
  isNego: z.boolean(),
  isFeatured: z.boolean(),
  isNew: z.boolean(),
  cityId: z.string().optional(),
  districtId: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  landArea: z.number().min(0),
  buildingArea: z.number().min(0),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  garages: z.number().min(0),
  floors: z.number().min(0),
  electricity: z.string().optional(),
  waterSource: z.string().optional(),
  certificate: z.string().optional(),
  buildingCond: z.string().optional(),
  orientation: z.string().optional(),
  facilities: z.string().optional(),
  visibleSpecs: z.string().optional(),
  description: z.string().optional(),
  mainImage: z.string().optional(),
  videoUrl: z.string().optional(),
  virtualTourUrl: z.string().optional(),
  agentId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function AdminPropertyForm() {
  const { route, navigate, goBack } = useRouter();
  const propertyId = route.page === 'admin-property-edit' ? route.id : undefined;
  const isEdit = !!propertyId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [visibleSpecs, setVisibleSpecs] = useState<string[]>([]);

  const allSpecKeys = ['landArea', 'buildingArea', 'bedrooms', 'bathrooms', 'garages', 'floors', 'electricity', 'waterSource', 'certificate', 'buildingCond', 'orientation'];
  const specLabels: Record<string, string> = {
    landArea: 'Luas Tanah', buildingArea: 'Luas Bangunan', bedrooms: 'Kamar Tidur',
    bathrooms: 'Kamar Mandi', garages: 'Garasi', floors: 'Lantai',
    electricity: 'Listrik', waterSource: 'Sumber Air', certificate: 'Sertifikat',
    buildingCond: 'Kondisi Bangunan', orientation: 'Arah Hadap',
  };

  const toggleVisibleSpec = (key: string) => {
    setVisibleSpecs(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const propertyTypes = useDataCache((s) => s.propertyTypes);
  const cities = useDataCache((s) => s.cities);
  const districts = useDataCache((s) => s.districts);
  const agents = useDataCache((s) => s.agents);
  const currentProperty = usePropertyStore((s) => s.currentProperty);
  const setCurrentProperty = usePropertyStore((s) => s.setCurrentProperty);

  const setPropertyTypes = useDataCache((s) => s.setPropertyTypes);
  const setCities = useDataCache((s) => s.setCities);
  const setDistricts = useDataCache((s) => s.setDistricts);
  const setAgents = useDataCache((s) => s.setAgents);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: '', slug: '', propertyTypeId: '', status: 'dijual',
      price: 0, isNego: false, isFeatured: false, isNew: false,
      landArea: 0, buildingArea: 0, bedrooms: 0, bathrooms: 0,
      garages: 0, floors: 0,
    },
  });

  const { watch, setValue } = form;
  const watchedTitle = watch('title');
  const watchedCityId = watch('cityId');

  // Auto-generate slug from title
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

  // Fetch districts when city changes
  const fetchDistricts = useCallback(async (cityId: string) => {
    if (!cityId) { setDistricts([]); return; }
    try {
      const res = await fetchWithAuth(`/api/locations/districts?cityId=${cityId}`);
      if (res.ok) {
        const json = await res.json();
        setDistricts(Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []);
      }
    } catch {}
  }, [setDistricts]);

  useEffect(() => { fetchDistricts(watchedCityId || ''); }, [watchedCityId, fetchDistricts]);

  // Load reference data
  useEffect(() => {
    const loadRefData = async () => {
      setLoading(true);
      try {
        const [ptRes, cRes, aRes] = await Promise.allSettled([
          fetchWithAuth('/api/property-types').then((r) => r.json()),
          fetchWithAuth('/api/locations/cities').then((r) => r.json()),
          fetchWithAuth('/api/agents').then((r) => r.json()),
        ]);
        if (ptRes.status === 'fulfilled') setPropertyTypes(Array.isArray(ptRes.value?.data) ? ptRes.value.data : Array.isArray(ptRes.value) ? ptRes.value : []);
        if (cRes.status === 'fulfilled') setCities(Array.isArray(cRes.value?.data) ? cRes.value.data : Array.isArray(cRes.value) ? cRes.value : []);
        if (aRes.status === 'fulfilled') setAgents(Array.isArray(aRes.value?.data) ? aRes.value.data : Array.isArray(aRes.value) ? aRes.value : []);

        // Load existing property for edit
        if (isEdit && propertyId) {
          const res = await fetchWithAuth(`/api/properties/${propertyId}`);
          if (res.ok) {
            const json = await res.json();
            const p = (json.data || json) as Property;
            setCurrentProperty(p);
            form.reset({
              title: p.title || '',
              slug: p.slug || '',
              propertyTypeId: p.propertyTypeId || '',
              status: p.status || 'dijual',
              price: p.price || 0,
              isNego: p.isNego || false,
              isFeatured: p.isFeatured || false,
              isNew: p.isNew || false,
              cityId: p.cityId || '',
              districtId: p.districtId || '',
              address: p.address || '',
              latitude: p.latitude || undefined,
              longitude: p.longitude || undefined,
              landArea: p.landArea || 0,
              buildingArea: p.buildingArea || 0,
              bedrooms: p.bedrooms || 0,
              bathrooms: p.bathrooms || 0,
              garages: p.garages || 0,
              floors: p.floors || 0,
              electricity: p.electricity || '',
              waterSource: p.waterSource || '',
              certificate: p.certificate || '',
              buildingCond: p.buildingCond || '',
              orientation: p.orientation || '',
              facilities: p.facilities || '',
              visibleSpecs: p.visibleSpecs || '',
              description: p.description || '',
              mainImage: p.mainImage || '',
              videoUrl: p.videoUrl || '',
              virtualTourUrl: p.virtualTourUrl || '',
              agentId: p.agentId || '',
              metaTitle: p.metaTitle || '',
              metaDescription: p.metaDescription || '',
              metaKeywords: p.metaKeywords || '',
            });
            if (p.images) setImages(p.images.map((img: { url: string }) => img.url));
            // Parse visibleSpecs
            try {
              const parsed = JSON.parse(p.visibleSpecs || '[]');
              if (Array.isArray(parsed)) setVisibleSpecs(parsed);
            } catch { setVisibleSpecs([]); }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    loadRefData();
  }, [isEdit, propertyId, form, setPropertyTypes, setCities, setAgents, setCurrentProperty]);

  const onSubmit = async (data: PropertyFormData) => {
    setSaving(true);
    try {
      const payload = { ...data, visibleSpecs: JSON.stringify(visibleSpecs), images: images.map((url) => ({ url, altText: '', sortOrder: 0 })) };
      const url = isEdit ? `/api/properties/${propertyId}` : '/api/properties';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetchWithAuth(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        navigate({ page: 'admin-properties' });
      }
    } finally {
      setSaving(false);
    }
  };

  const addImage = () => {
    const url = prompt('Masukkan URL gambar:');
    if (url) setImages((prev) => [...prev, url]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {isEdit ? 'Edit Properti' : 'Tambah Properti Baru'}
          </h2>
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
            <CardHeader><CardTitle className="text-base">Informasi Dasar</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField name="title" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Judul Properti</FormLabel>
                  <FormControl><Input {...field} placeholder="Judul listing properti" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl><Input {...field} placeholder="slug-properti" /></FormControl>
                  <FormDescription>Otomatis di-generate dari judul</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="propertyTypeId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Properti</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih jenis" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {propertyTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="dijual">Dijual</SelectItem>
                      <SelectItem value="disewa">Disewa</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga (Rp)</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex items-end gap-6">
                <FormField name="isNego" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="!mt-0">Nego</FormLabel>
                  </FormItem>
                )} />
                <FormField name="isFeatured" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="!mt-0">Featured</FormLabel>
                  </FormItem>
                )} />
                <FormField name="isNew" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="!mt-0">Baru</FormLabel>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader><CardTitle className="text-base">Lokasi</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField name="cityId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kabupaten/Kota</FormLabel>
                  <Select value={field.value || ''} onValueChange={(v) => { field.onChange(v); setValue('districtId', ''); }}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih kota" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="districtId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kecamatan</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih kecamatan" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {districts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="address" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Alamat Detail</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Alamat lengkap properti" rows={2} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="latitude" render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl><Input type="number" step="any" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                </FormItem>
              )} />
              <FormField name="longitude" render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl><Input type="number" step="any" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Spesifikasi</CardTitle>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={() => setVisibleSpecs(allSpecKeys)}>
                    <Eye className="h-3 w-3 mr-1" /> Tampilkan Semua
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={() => setVisibleSpecs([])}>
                    <EyeOff className="h-3 w-3 mr-1" /> Sembunyikan Semua
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Centang spesifikasi yang ingin ditampilkan di halaman detail properti. {visibleSpecs.length} dari {allSpecKeys.length} dipilih.</p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Visible specs checkboxes row */}
              <div className="sm:col-span-2 lg:col-span-4">
                <div className="flex flex-wrap gap-2">
                  {allSpecKeys.map((key) => (
                    <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none">
                      <Checkbox
                        checked={visibleSpecs.includes(key)}
                        onCheckedChange={() => toggleVisibleSpec(key)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <span className={`text-xs ${visibleSpecs.includes(key) ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                        {specLabels[key]}
                      </span>
                    </label>
                  ))}
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <Checkbox
                      checked={!!currentProperty?.facilities}
                      disabled
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <span className="text-xs text-gray-400">Fasilitas (otomatis jika ada)</span>
                  </label>
                </div>
              </div>
              <Separator className="sm:col-span-2 lg:col-span-4" />
              {[
                { name: 'landArea' as const, label: 'Luas Tanah (m²)', visible: visibleSpecs.includes('landArea') },
                { name: 'buildingArea' as const, label: 'Luas Bangunan (m²)', visible: visibleSpecs.includes('buildingArea') },
                { name: 'bedrooms' as const, label: 'Kamar Tidur', visible: visibleSpecs.includes('bedrooms') },
                { name: 'bathrooms' as const, label: 'Kamar Mandi', visible: visibleSpecs.includes('bathrooms') },
                { name: 'garages' as const, label: 'Garasi', visible: visibleSpecs.includes('garages') },
                { name: 'floors' as const, label: 'Lantai', visible: visibleSpecs.includes('floors') },
              ].map(({ name, label, visible }) => (
                <FormField key={name} name={name} render={({ field }) => (
                  <FormItem>
                    <FormLabel className={visible ? '' : 'text-muted-foreground'}>{label}</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
              <FormField name="electricity" render={({ field }) => (
                <FormItem>
                  <FormLabel className={visibleSpecs.includes('electricity') ? '' : 'text-muted-foreground'}>Listrik</FormLabel>
                  <FormControl><Input {...field} placeholder="Contoh: 2200 watt" /></FormControl>
                </FormItem>
              )} />
              <FormField name="waterSource" render={({ field }) => (
                <FormItem>
                  <FormLabel className={visibleSpecs.includes('waterSource') ? '' : 'text-muted-foreground'}>Sumber Air</FormLabel>
                  <FormControl><Input {...field} placeholder="Contoh: PDAM" /></FormControl>
                </FormItem>
              )} />
              <FormField name="certificate" render={({ field }) => (
                <FormItem>
                  <FormLabel className={visibleSpecs.includes('certificate') ? '' : 'text-muted-foreground'}>Sertifikat</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih sertifikat" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="SHM">SHM</SelectItem>
                      <SelectItem value="SHGB">SHGB</SelectItem>
                      <SelectItem value="AJB">AJB</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField name="buildingCond" render={({ field }) => (
                <FormItem>
                  <FormLabel className={visibleSpecs.includes('buildingCond') ? '' : 'text-muted-foreground'}>Kondisi Bangunan</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih kondisi" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="baru">Baru</SelectItem>
                      <SelectItem value="bagus">Bagus</SelectItem>
                      <SelectItem value="sedang">Sedang</SelectItem>
                      <SelectItem value="renovasi">Perlu Renovasi</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField name="orientation" render={({ field }) => (
                <FormItem>
                  <FormLabel className={visibleSpecs.includes('orientation') ? '' : 'text-muted-foreground'}>Arah Hadap</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih arah" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {['Utara', 'Selatan', 'Timur', 'Barat', 'Barat Laut', 'Tenggara'].map((d) => (
                        <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField name="facilities" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Fasilitas</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Contoh: Kolam Renang, Taman, CCTV, Keamanan 24 Jam (pisahkan dengan koma)" rows={2} /></FormControl>
                  <FormDescription className="text-xs">Fasilitas otomatis ditampilkan di frontend jika diisi.</FormDescription>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader><CardTitle className="text-base">Deskripsi</CardTitle></CardHeader>
            <CardContent>
              <FormField name="description" render={({ field }) => (
                <FormItem>
                  <FormControl><Textarea {...field} placeholder="Deskripsi lengkap properti..." rows={8} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Gambar</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addImage}>
                  <Plus className="h-3 w-3" /> Tambah Gambar URL
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {images.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {images.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border bg-gray-50">
                      <img src={url} alt={`Gambar ${i + 1}`} className="w-full h-32 object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded">Utama</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada gambar. Klik tombol di atas untuk menambahkan.</p>
              )}
              <FormField name="mainImage" render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Main Image URL (alternatif)</FormLabel>
                  <FormControl><Input {...field} placeholder="URL gambar utama" /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Media URLs */}
          <Card>
            <CardHeader><CardTitle className="text-base">Media</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField name="videoUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://youtube.com/watch?v=..." /></FormControl>
                </FormItem>
              )} />
              <FormField name="virtualTourUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Virtual Tour URL</FormLabel>
                  <FormControl><Input {...field} placeholder="URL virtual tour" /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Agent Assignment */}
          <Card>
            <CardHeader><CardTitle className="text-base">Penugasan Agen</CardTitle></CardHeader>
            <CardContent>
              <FormField name="agentId" render={({ field }) => (
                <FormItem className="max-w-md">
                  <FormLabel>Agen Penanggung Jawab</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Pilih agen" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
            <Button type="button" variant="outline" onClick={() => navigate({ page: 'admin-properties' })}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan Properti'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
