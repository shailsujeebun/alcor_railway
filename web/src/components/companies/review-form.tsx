'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useCreateReview } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/translation-provider';

interface ReviewFormProps {
  companyId: string;
  onSuccess: () => void;
}

export function ReviewForm({ companyId, onSuccess }: ReviewFormProps) {
  const { t } = useTranslation();
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { mutate, isPending } = useCreateReview(companyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || rating === 0) return;

    mutate(
      {
        authorName: authorName.trim(),
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      },
      { onSuccess },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('companies.reviewForm.nameLabel')}</label>
        <input
          type="text"
          required
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-gray-dim focus:outline-none focus:ring-2 focus:ring-blue-bright/40"
          placeholder={t('companies.reviewForm.namePlaceholder')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('companies.reviewForm.ratingLabel')}</label>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i + 1)}
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1"
            >
              <Star
                size={24}
                className={cn(
                  'transition-colors',
                  i < (hoverRating || rating)
                    ? 'fill-orange text-orange'
                    : 'fill-transparent text-gray-dim',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('companies.reviewForm.titleLabel')}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-gray-dim focus:outline-none focus:ring-2 focus:ring-blue-bright/40"
          placeholder={t('companies.reviewForm.titlePlaceholder')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{t('companies.reviewForm.bodyLabel')}</label>
        <textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-gray-dim focus:outline-none focus:ring-2 focus:ring-blue-bright/40 resize-none"
          placeholder={t('companies.reviewForm.bodyPlaceholder')}
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !authorName.trim() || rating === 0}
        className="w-full gradient-cta text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isPending ? t('companies.reviewForm.submitting') : t('companies.reviewForm.submit')}
      </button>
    </form>
  );
}
