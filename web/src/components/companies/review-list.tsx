'use client';

import { StarRating } from '@/components/ui/star-rating';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from '@/components/providers/translation-provider';
import type { CompanyReview } from '@/types/api';

interface ReviewListProps {
  reviews: CompanyReview[];
  isLoading: boolean;
}

export function ReviewList({ reviews, isLoading }: ReviewListProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageSquare size={40} className="mx-auto text-blue-bright/20 mb-3" />
        <p className="text-[var(--text-secondary)]">{t('companies.noReviews')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="glass-card p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-bright/10 flex items-center justify-center text-blue-bright font-bold text-sm">
                {review.authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-heading font-bold text-sm text-[var(--text-primary)]">{review.authorName}</p>
                <p className="text-xs text-[var(--text-secondary)]">{formatDate(review.createdAt)}</p>
              </div>
            </div>
            <StarRating rating={review.rating} size={14} />
          </div>
          {review.title && (
            <h4 className="font-heading font-bold text-sm text-[var(--text-primary)] mb-1">{review.title}</h4>
          )}
          {review.body && (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{review.body}</p>
          )}
        </div>
      ))}
    </div>
  );
}
