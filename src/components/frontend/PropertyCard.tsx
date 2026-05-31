'use client';

import { Property } from '@/lib/types';
import { useRouter } from '@/hooks/use-router';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  className?: string;
  variant?: 'default' | 'horizontal';
}

function formatPrice(price: number): string {
  if (price >= 1_000_000_000_000) {
    return `Rp ${(price / 1_000_000_000_000).toFixed(1)}T`;
  }
  if (price >= 1_000_000_000) {
    return `Rp ${(price / 1_000_000_000).toFixed(1)}M`;
  }
  if (price >= 1_000_000) {
    return `Rp ${(price / 1_000_000).toFixed(0)}Jt`;
  }
  return `Rp ${price.toLocaleString('id-ID')}`;
}

export default function PropertyCard({
  property,
  className,
  variant = 'default',
}: PropertyCardProps) {
  const { navigate } = useRouter();
  const imageUrl = property.mainImage || (property.images?.[0]?.url) || '/placeholder-property.jpg';

  const handleClick = () => {
    navigate({ page: 'property-detail', slug: property.slug });
  };

  const statusBadge = () => {
    if (property.status === 'terjual') {
      return (
        <Badge className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded">
          Terjual
        </Badge>
      );
    }
    if (property.status === 'tersewa') {
      return (
        <Badge className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded">
          Tersewa
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded">
        {property.status === 'dijual' ? 'Dijual' : 'Disewa'}
      </Badge>
    );
  };

  if (variant === 'horizontal') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'flex flex-row gap-2.5 bg-white rounded-xl border overflow-hidden cursor-pointer',
          'hover:shadow-md transition-shadow duration-200',
          className
        )}
      >
        <div className="relative w-28 shrink-0">
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
            {statusBadge()}
            {property.isFeatured && (
              <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded">
                Featured
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-between py-2 pr-3 min-w-0">
          <div>
            <p className="text-base font-bold text-emerald-700">
              {property.priceDisplay || formatPrice(property.price)}
            </p>
            <h3 className="font-semibold text-xs text-gray-900 line-clamp-1 mt-0.5">
              {property.title}
            </h3>
            <p className="text-[11px] text-gray-500 flex items-center gap-0.5 mt-0.5">
              <MapPin className="size-2.5" />
              {[property.district?.name, property.city?.name].filter(Boolean).join(', ')}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1.5">
            <span className="flex items-center gap-0.5">
              <Maximize className="size-2.5" /> {property.landArea} m²
            </span>
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-0.5">
                <Bed className="size-2.5" /> {property.bedrooms} KT
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-0.5">
                <Bath className="size-2.5" /> {property.bathrooms} KM
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex flex-col bg-white rounded-xl border overflow-hidden cursor-pointer group',
        'hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
          {statusBadge()}
          {property.isFeatured && (
            <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded">
              Featured
            </Badge>
          )}
          {property.isNew && (
            <Badge className="bg-sky-500 text-white text-[9px] px-1.5 py-0.5 rounded">
              Baru
            </Badge>
          )}
          {property.isNego && (
            <Badge className="bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded">
              Nego
            </Badge>
          )}
        </div>
        {property.propertyType && (
          <div className="absolute bottom-1.5 left-1.5">
            <Badge className="bg-black/60 text-white text-[9px] px-1.5 py-0.5 backdrop-blur-sm rounded">
              {property.propertyType.name}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        {/* Price */}
        <p className="text-sm font-bold text-emerald-700 leading-tight">
          {property.priceDisplay || formatPrice(property.price)}
        </p>

        {/* Title */}
        <h3 className="font-medium text-xs text-gray-900 line-clamp-2 leading-snug">
          {property.title}
        </h3>

        {/* Location */}
        <p className="text-[11px] text-gray-500 flex items-center gap-0.5">
          <MapPin className="size-2.5 shrink-0" />
          <span className="line-clamp-1">
            {[property.district?.name, property.city?.name].filter(Boolean).join(', ')}
          </span>
        </p>

        {/* Specs */}
        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-auto pt-1.5 border-t border-gray-100">
          <span className="flex items-center gap-0.5">
            <Maximize className="size-2.5" />
            <span>{property.landArea} m²</span>
          </span>
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-0.5">
              <Bed className="size-2.5" />
              <span>{property.bedrooms} KT</span>
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-0.5">
              <Bath className="size-2.5" />
              <span>{property.bathrooms} KM</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
