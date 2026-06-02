'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
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
  Sparkles,
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
import { Badge } from '@/components/ui/badge';
import { PropertyType, City, District } from '@/lib/types';

const STORAGE_KEY = 'terimakunci_search_popup_dismissed';
const POPUP_EVENT = 'terimakunci_popup_dismiss';

// Subscribe to popup dismiss events (custom event for same-tab reactivity)
function subscribePopup(callback: () => void) {
  window.addEventListener(POPUP_EVENT, callback);
  return () => window.removeEventListener(POPUP_EVENT, callback);
}

// Client snapshot: check localStorage
function getPopupSnapshot(): boolean {
  return !localStorage.getItem(STORAGE_KEY);
}

// Server snapshot: always false for hydration safety
function getPopupServerSnapshot(): boolean {
  return false;
}

interface PropertySearchPopupProps {
  propertyTypes: PropertyType[];
  cities: City[];
  open: boolean;
  onClose: () => void;
}

export default function PropertySearchPopup({
  propertyTypes,
  cities,
  open,
  onClose,
}: PropertySearchPopupProps) {
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
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setVisible(true);
        setAnimating(true);
      }, 800); // delay 800ms after page load
      return () => clearTimeout(timer);
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

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

  const handleClose = useCallback(() => {
    setAnimating(false);
    setTimeout(() => {
      setVisible(false);
      onClose();
    }, 300);
  }, [onClose]);

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
        source: 'website_popup',
        needType: 'beli',
        notes: `Pencarian properti (popup): Tipe=${typeName || '-'}, Lokasi=${locationParts || '-'}, DP=${dpAmount ? formatRupiah(dpAmount) : '-'}, Promo=${promo || '-'}`,
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

  if (!visible && !open) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center transition-all duration-300 ${
        animating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Popup Card */}
      <div
        className={`relative z-10 w-full max-w-[360px] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          animating ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'
        }`}
      >
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 pt-5 pb-4">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="size-3.5 text-white" />
          </button>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="size-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cari Properti Impian</h3>
              <p className="text-[11px] text-emerald-100">Gratis! Isi data, kami yang carikan</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="size-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Terima Kasih!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Data pencarian Anda telah kami terima. Tim kami akan segera menghubungi via WhatsApp.
              </p>
              <Button
                onClick={handleClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
              >
                Tutup
              </Button>
            </div>
          ) : (
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

              {/* No HP */}
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

              {/* Collapsible Advanced */}
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
                    <div>
                      <Label className="text-[11px] font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <Building2 className="size-3 text-gray-400" />
                        Tipe Properti
                      </Label>
                      <Select value={propertyType} onValueChange={setPropertyType}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Pilih tipe" />
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
          )}
        </div>
      </div>
    </div>
  );
}

export function useSearchPopup() {
  // useSyncExternalStore handles hydration safely:
  // - Server renders false (getPopupServerSnapshot)
  // - Client hydrates with false, then re-renders with actual localStorage state
  const shouldShow = useSyncExternalStore(subscribePopup, getPopupSnapshot, getPopupServerSnapshot);

  const closePopup = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    // Dispatch custom event so useSyncExternalStore re-reads the snapshot
    window.dispatchEvent(new Event(POPUP_EVENT));
  }, []);

  return { showPopup: shouldShow, closePopup };
}
