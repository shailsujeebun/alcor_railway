import { Suspense } from 'react';
import { CategoriesPageContent } from '@/components/categories/categories-page';

export const metadata = {
  title: 'Категорії - B2B Маркетплейс',
  description: 'Перегляд категорій обладнання.',
};

export default function CategoriesPage() {
  return (
    <Suspense fallback={null}>
      <CategoriesPageContent />
    </Suspense>
  );
}
