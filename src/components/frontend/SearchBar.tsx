'use client';

import { useState, useCallback } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from '@/hooks/use-router';
import { City } from '@/lib/types';

interface SearchBarProps {
  initialKeyword?: string;
  initialCityId?: string;
  cities?: City[];
  onSearch?: (keyword: string, cityId?: string) => void;
  variant?: 'hero' | 'compact';
  className?: string;
}

export default function SearchBar({
  initialKeyword = '',
  initialCityId = '',
  cities = [],
  onSearch,
  variant = 'compact',
  className = '',
}: SearchBarProps) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [cityId, setCityId] = useState(initialCityId);
  const { navigate } = useRouter();

  const handleSearch = useCallback(() => {
    if (onSearch) {
      onSearch(keyword, cityId || undefined);
    } else {
      const params: Record<string, string> = {};
      if (keyword) params.keyword = keyword;
      if (cityId) params.cityId = cityId;
      navigate({ page: 'properties', params });
    }
  }, [keyword, cityId, onSearch, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch]
  );

  if (variant === 'hero') {
    return (
      <div className={`w-full max-w-2xl mx-auto ${className}`}>
        <div className="flex flex-col gap-2 bg-white rounded-xl p-2.5 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Cari properti, lokasi..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-8 h-10 text-sm border-0 shadow-none focus-visible:ring-0 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white px-5 font-semibold text-sm shrink-0"
            >
              <Search className="size-4" />
            </Button>
          </div>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none z-10" />
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger className="h-9 w-full border-gray-200 pl-8 text-sm text-gray-900">
                <SelectValue placeholder="Semua Kabupaten/Kota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kabupaten/Kota</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder="Cari properti..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9"
        />
      </div>
      <div className="w-full sm:w-48">
        <Select value={cityId} onValueChange={setCityId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Semua Kabupaten/Kota" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kabupaten/Kota</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={handleSearch}
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <Search className="size-4" />
      </Button>
    </div>
  );
}
