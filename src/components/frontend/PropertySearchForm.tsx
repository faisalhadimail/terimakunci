'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  MapPin,
  Building2,
  User,
  Phone,
  Banknote,
  Tag,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PropertyType, City, District } from '@/lib/types';

interface PropertySearchFormProps {
  propertyTypes: PropertyType[];
  cities: City[];
  className?: string;
}

export default function PropertySearchForm({
  propertyTypes,
  cities,
  className = '',
}: PropertySearchFormProps) {
  // Form state
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [cityId, setCityId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [dpAmount, setDpAmount] = useState('');
  const [promo, setPromo] = useState('');

  // UI state
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');

  // Fetch districts when city changes
  useEffect(() => {
    if (cityId) {
      setDistrictId('');
      fetch(`/api/locations/districts?cityId=${cityId}`)
        .then((res) => res.json())
        .then((data) => {
          setDistricts(Array.isArray(data.data) ? data.data : []);
        })
        .catch(() => setDistricts([]));
    } else {
      setDistricts([]);
      setDistrictId('');
    }
  }, [cityId]);

  const resetForm = useCallback(() => {
    setNama('');
    setNoHp('');
    setPropertyType('');
    setCityId('');
    setDistrictId('');
    setDpAmount('');
    setPromo('');
    setDistricts([]);
    setError('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nama.trim()) {
      setError('Nama wajib diisi');
      return;
    }
    if (!noHp.trim()) {
      setError('No. HP wajib diisi');
      return;
    }

    setLoading(true);
    try {
      // Build location interest string
      const cityName = cities.find((c) => c.id === cityId)?.name || '';
      const districtName = districts.find((d) => d.id === districtId)?.name || '';
      const locationParts = [cityName, districtName].filter(Boolean).join(', ');
      const typeName = propertyTypes.find((t) => t.id === propertyType)?.name || '';

      const payload = {
        name: nama.trim(),
        whatsapp: noHp.trim(),
        propertyTypeInterest: typeName || undefined,
        locationInterest: locationParts || undefined,
        dpAmount: dpAmount.trim() || undefined,
        promo: promo.trim() || undefined,
        source: 'website',
        needType: 'beli',
        notes: `Pencarian properti: Tipe=${typeName || '-'}, Lokasi=${locationParts || '-'}, DP=${dpAmount ? formatRupiah(dpAmount) : '-'}, Promo=${promo || '-'}`,
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Gagal mengirim data. Coba lagi.');
      }
    } catch {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val: string) => {
    const num = Number(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (submitted) {
    return (
      <Card className={`${className} border-emerald-200 bg-emerald-50`}>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="size-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Terima Kasih!
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Data pencarian Anda telah kami terima. Tim kami akan segera menghubungi Anda via WhatsApp.
          </p>
          <Button
            onClick={() => {
              setSubmitted(false);
              resetForm();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Cari Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-0 shadow-lg`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
            <Search className="size-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900">Cari Properti</h3>
            <p className="text-[11px] text-gray-500">Isi data untuk mendapatkan rekomendasi</p>
          </div>
          <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
            Free
          </Badge>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nama */}
          <div className="mb-3">
            <Label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <User className="size-3.5 text-emerald-500" />
              Nama Lengkap <span className="text-red-400">*</span>
            </Label>
            <Input
              placeholder="Masukkan nama Anda"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* No HP / WhatsApp */}
          <div className="mb-3">
            <Label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Phone className="size-3.5 text-emerald-500" />
              No. HP / WhatsApp <span className="text-red-400">*</span>
            </Label>
            <Input
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Collapsible advanced fields */}
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Building2 className="size-3.5 text-emerald-500" />
                Kriteria Properti (Opsional)
              </span>
              {expanded ? (
                <ChevronUp className="size-4 text-gray-400" />
              ) : (
                <ChevronDown className="size-4 text-gray-400" />
              )}
            </button>

            {expanded && (
              <div className="mt-2 space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                {/* Type Property */}
                <div>
                  <Label className="text-[11px] font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Building2 className="size-3 text-gray-400" />
                    Tipe Properti
                  </Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Pilih tipe properti" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((pt) => (
                        <SelectItem key={pt.id} value={pt.id}>
                          {pt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Kabupaten */}
                <div>
                  <Label className="text-[11px] font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <MapPin className="size-3 text-gray-400" />
                    Kabupaten / Kota
                  </Label>
                  <Select value={cityId} onValueChange={setCityId}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Pilih kabupaten/kota" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Kecamatan */}
                <div>
                  <Label className="text-[11px] font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <MapPin className="size-3 text-gray-400" />
                    Kecamatan
                  </Label>
                  <Select value={districtId} onValueChange={setDistrictId} disabled={!cityId}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue
                        placeholder={cityId ? 'Pilih kecamatan' : 'Pilih kabupaten dulu'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Besaran DP */}
                <div>
                  <Label className="text-[11px] font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Banknote className="size-3 text-gray-400" />
                    Besaran DP (Rp)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 50000000"
                    value={dpAmount}
                    onChange={(e) => setDpAmount(e.target.value)}
                    className="h-9 text-sm"
                  />
                  {dpAmount && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {formatRupiah(dpAmount)}
                    </p>
                  )}
                </div>

                {/* Promo */}
                <div>
                  <Label className="text-[11px] font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Tag className="size-3 text-gray-400" />
                    Kode Promo
                  </Label>
                  <Input
                    placeholder="Masukkan kode promo (jika ada)"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-3 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <X className="size-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Search className="size-4" />
                Cari Properti Sekarang
              </>
            )}
          </Button>

          <p className="text-center text-[10px] text-gray-400 mt-2">
            Tim kami akan menghubungi Anda via WhatsApp
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
