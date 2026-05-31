'use client';

import { useEffect, useState, useCallback } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, SearchX } from 'lucide-react';
import { useRouter } from '@/hooks/use-router';
import { usePropertyStore, useDataCache } from '@/lib/store';
import { City, PropertyType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import PropertyCard from './PropertyCard';
import { cn } from '@/lib/utils';

export default function PropertyListPage() {
  const router = useRouter();
  const { route } = router;
  const { cities, propertyTypes, setCities, setPropertyTypes } = useDataCache();
  const { properties, pagination, loading, setProperties, setPage } = usePropertyStore();

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Read initial params from route
  useEffect(() => {
    if (route.page === 'properties' && route.params) {
      const p = route.params || {};
      setFilters(p);
    }
    setMounted(true);
  }, []);

  // Fetch reference data
  useEffect(() => {
    if (cities.length === 0) {
      fetch('/api/locations/cities')
        .then((r) => r.ok ? r.json() : { data: [] })
        .then((data) => setCities(Array.isArray(data) ? data : data.data || []))
        .catch(() => {});
    }
    if (propertyTypes.length === 0) {
      fetch('/api/property-types')
        .then((r) => r.json())
        .then((data) => setPropertyTypes(Array.isArray(data) ? data : data.data || []))
        .catch(() => {});
    }
  }, [cities.length, propertyTypes.length, setCities, setPropertyTypes]);

  // Fetch properties when filters/sort/page change
  const fetchProperties = useCallback(async () => {
    usePropertyStore.getState().setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '12');
      params.set('page', String(pagination.page));
      params.set('sort', sort);

      if (filters.keyword) params.set('keyword', filters.keyword);
      if (filters.cityId && filters.cityId !== 'all') params.set('cityId', filters.cityId);
      if (filters.propertyTypeId && filters.propertyTypeId !== 'all')
        params.set('propertyTypeId', filters.propertyTypeId);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.priceMin) params.set('priceMin', filters.priceMin);
      if (filters.priceMax) params.set('priceMax', filters.priceMax);
      if (filters.bedroomsMin) params.set('bedroomsMin', filters.bedroomsMin);

      const res = await fetch(`/api/properties?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data.data || [], data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
      }
    } catch {
      // silent fail
    } finally {
      usePropertyStore.getState().setLoading(false);
    }
  }, [filters, sort, pagination.page, setProperties]);

  useEffect(() => {
    if (mounted) fetchProperties();
  }, [fetchProperties, mounted]);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSort('newest');
    setPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== 'all'
  ).length;

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-lg font-bold text-gray-900">Cari Properti</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Temukan properti sesuai kebutuhan
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-3">
        <div className="relative">
          <SearchX className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Cari nama, alamat, keyword..."
            value={filters.keyword || ''}
            onChange={(e) => updateFilter('keyword', e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>
      </div>

      {/* Filters - Collapsible */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="mb-3 w-full justify-between h-9 text-sm">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="size-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {activeFilterCount}
                </span>
              )}
            </span>
            {filtersOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="bg-white rounded-xl border p-3 mb-3 space-y-3">
            {/* City */}
            <div className="space-y-1">
              <Label className="text-[11px] text-gray-500">Kabupaten/Kota</Label>
              <Select
                value={filters.cityId || 'all'}
                onValueChange={(v) => updateFilter('cityId', v)}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder="Semua Kabupaten/Kota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kabupaten/Kota</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Property Type */}
              <div className="space-y-1">
                <Label className="text-[11px] text-gray-500">Jenis</Label>
                <Select
                  value={filters.propertyTypeId || 'all'}
                  onValueChange={(v) => updateFilter('propertyTypeId', v)}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {propertyTypes.map((pt) => (
                      <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <Label className="text-[11px] text-gray-500">Status</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(v) => updateFilter('status', v)}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="dijual">Dijual</SelectItem>
                    <SelectItem value="disewa">Disewa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Price Range */}
              <div className="space-y-1">
                <Label className="text-[11px] text-gray-500">Harga</Label>
                <Select
                  value={`${filters.priceMin || ''}-${filters.priceMax || ''}`}
                  onValueChange={(v) => {
                    const [min, max] = v.split('-');
                    updateFilter('priceMin', min || '');
                    updateFilter('priceMax', max || '');
                  }}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">Semua Harga</SelectItem>
                    <SelectItem value="0-500000000">&lt; 500 Jt</SelectItem>
                    <SelectItem value="500000000-1000000000">500Jt - 1M</SelectItem>
                    <SelectItem value="1000000000-3000000000">1M - 3M</SelectItem>
                    <SelectItem value="3000000000-5000000000">3M - 5M</SelectItem>
                    <SelectItem value="5000000000-">&gt; 5 M</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-1">
                <Label className="text-[11px] text-gray-500">Urutkan</Label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-full h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Terbaru</SelectItem>
                    <SelectItem value="price_asc">Harga ↑</SelectItem>
                    <SelectItem value="price_desc">Harga ↓</SelectItem>
                    <SelectItem value="largest">Luas ↓</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear */}
            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={clearFilters} className="w-full text-gray-500 text-xs h-8">
                Reset Filter
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          {properties.length} dari {pagination.total} properti
        </p>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-2.5 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <SearchX className="size-10 text-gray-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Tidak Ada Hasil</h3>
          <p className="text-xs text-gray-500 mb-3">
            Coba ubah filter pencarian Anda
          </p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Reset Filter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setPage(pagination.page - 1)}
            className="h-8 text-xs"
          >
            ←
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const pageNum =
                pagination.totalPages <= 5
                  ? i + 1
                  : Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'h-8 w-8 p-0 text-xs',
                    pageNum === pagination.page && 'bg-emerald-600 hover:bg-emerald-700'
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage(pagination.page + 1)}
            className="h-8 text-xs"
          >
            →
          </Button>
        </div>
      )}
    </div>
  );
}
