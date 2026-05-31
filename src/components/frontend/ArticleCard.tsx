'use client';

import { Article } from '@/lib/types';
import { useRouter } from '@/hooks/use-router';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  className?: string;
  variant?: 'default' | 'compact' | 'horizontal';
}

export default function ArticleCard({
  article,
  className,
  variant = 'default',
}: ArticleCardProps) {
  const { navigate } = useRouter();

  const handleClick = () => {
    navigate({ page: 'article-detail', slug: article.slug });
  };

  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'flex gap-2.5 bg-white rounded-lg border p-2 cursor-pointer',
          'hover:shadow-md transition-shadow duration-200',
          className
        )}
      >
        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
          <img
            src={article.featuredImage || '/placeholder-article.jpg'}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-between min-w-0 py-0.5">
          <h3 className="font-medium text-xs text-gray-900 line-clamp-2">
            {article.title}
          </h3>
          <p className="text-[10px] text-gray-400">{formattedDate}</p>
        </div>
      </div>
    );
  }

  // Horizontal card (used in list pages)
  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex gap-3 bg-white rounded-xl border overflow-hidden cursor-pointer',
        'hover:shadow-sm transition-shadow duration-200',
        className
      )}
    >
      {/* Image */}
      <div className="relative w-28 shrink-0 bg-gray-100">
        <img
          src={article.featuredImage || '/placeholder-article.jpg'}
          alt={article.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between py-2.5 pr-3 min-w-0">
        {/* Date */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <Calendar className="size-3" />
          {formattedDate}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug">
          {article.title}
        </h3>

        {/* Author */}
        {article.author && (
          <p className="text-[11px] text-gray-400">
            Oleh {article.author.name}
          </p>
        )}
      </div>
    </div>
  );
}
