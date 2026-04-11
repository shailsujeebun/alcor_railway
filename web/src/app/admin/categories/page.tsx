'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Folder } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  createAdminCategory,
  deleteAdminCategory,
  updateAdminCategory,
} from '@/lib/api';
import { useAdminCategories, useMarketplaces } from '@/lib/queries';
import { useAuthStore } from '@/stores/auth-store';
import { getCategoryDisplayName, getMarketplaceDisplayName } from '@/lib/display-labels';
import { useTranslation } from '@/components/providers/translation-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { t, locale } = useTranslation();
  const { data: marketplaces = [], isLoading: loadingMarketplaces } = useMarketplaces();
  const { data: categories = [], isLoading: loadingCategories } = useAdminCategories();

  const [selectedMarketplace, setSelectedMarketplace] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    hasEngine: false,
  });

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [router, user]);

  useEffect(() => {
    if (!selectedMarketplace && marketplaces.length > 0) {
      setSelectedMarketplace(marketplaces[0].id);
    }
  }, [marketplaces, selectedMarketplace]);

  const rootCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          String(category.marketplaceId) === selectedMarketplace && !category.parentId,
      ),
    [categories, selectedMarketplace],
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', slug: '', hasEngine: false });
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    await queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMarketplace) return;

    const payload = {
      marketplaceId: Number(selectedMarketplace),
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().trim().replace(/\s+/g, '-'),
      hasEngine: formData.hasEngine,
    };

    try {
      if (editingId) {
        await updateAdminCategory(editingId, payload);
      } else {
        await createAdminCategory(payload);
      }
      setIsDialogOpen(false);
      resetForm();
      await refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : t('admin.taxonomy.saveCategoryError'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.taxonomy.confirmDeleteCategory'))) return;
    try {
      await deleteAdminCategory(id);
      await refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : t('admin.taxonomy.deleteCategoryError'));
    }
  };

  const openEdit = (category: (typeof rootCategories)[number]) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      hasEngine: Boolean(category.hasEngine),
    });
    setIsDialogOpen(true);
  };

  const isLoading = loadingMarketplaces || loadingCategories;

  return (
    <div className="container-main pt-20 pb-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">
            {t('admin.sidebar.categories')}
          </h1>
          <p className="text-muted-foreground">{t('admin.taxonomy.categoriesDescription')}</p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              disabled={!selectedMarketplace}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('admin.taxonomy.addCategory')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? t('admin.taxonomy.editCategory') : t('admin.taxonomy.createCategory')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category-name">{t('admin.taxonomy.name')}</Label>
                <Input
                  id="category-name"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category-slug">{t('admin.taxonomy.slug')}</Label>
                <Input
                  id="category-slug"
                  value={formData.slug}
                  onChange={(event) => setFormData((prev) => ({ ...prev, slug: event.target.value }))}
                  placeholder={t('admin.taxonomy.slugPlaceholder')}
                />
              </div>
              <label className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.hasEngine}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, hasEngine: event.target.checked }))
                  }
                />
                {t('admin.taxonomy.hasEngine')}
              </label>
              <Button type="submit" className="w-full">
                {editingId ? t('admin.taxonomy.updateCategory') : t('admin.taxonomy.createCategory')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto">
        {marketplaces.map((marketplace) => (
          <button
            key={marketplace.id}
            onClick={() => setSelectedMarketplace(marketplace.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedMarketplace === marketplace.id
                ? 'bg-blue-600 text-white'
                : 'glass-card text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            {getMarketplaceDisplayName(marketplace.name, marketplace.key)}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-xl border border-white/10 p-6">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">{t('admin.taxonomy.loadingCategories')}</div>
        ) : rootCategories.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            {t('admin.taxonomy.noCategories')}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rootCategories.map((category) => (
              <div
                key={category.id}
                className="flex h-full flex-col rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="shrink-0 rounded-lg bg-blue-500/10 p-2 text-blue-400">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="break-words font-semibold leading-5 text-white">
                        {getCategoryDisplayName(category.name, locale)}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {category.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(category)}
                      className="h-8 w-8 hover:bg-yellow-500/10 hover:text-yellow-400"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                      className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>
                    {category.hasEngine ? t('admin.taxonomy.motorized') : t('admin.taxonomy.standard')}
                  </span>
                  <span className="shrink-0">
                    {t('admin.taxonomy.subcategoriesCount', { count: String(category.children?.length ?? 0) })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
