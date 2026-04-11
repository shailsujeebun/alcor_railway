'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Tags, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  createAdminBrand,
  deleteAdminBrand,
  updateAdminBrand,
} from '@/lib/api';
import { useAdminBrands, useAdminCategories, useMarketplaces } from '@/lib/queries';
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

export default function AdminBrandsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { t, locale } = useTranslation();
  const { data: marketplaces = [] } = useMarketplaces();
  const { data: categories = [] } = useAdminCategories();
  const { data: brands = [], isLoading } = useAdminBrands();

  const [selectedMarketplace, setSelectedMarketplace] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
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

  const selectableCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          String(category.marketplaceId) === selectedMarketplace &&
          category.submissionStatus === 'APPROVED',
      ),
    [categories, selectedMarketplace],
  );

  const visibleBrands = useMemo(
    () =>
      brands.filter((brand) => {
        if (!selectedMarketplace) return true;
        if (brand.categories.length === 0) return true;
        return brand.categories.some(
          (category) => String(category.marketplaceId) === selectedMarketplace,
        );
      }),
    [brands, selectedMarketplace],
  );

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
    await queryClient.invalidateQueries({ queryKey: ['brands'] });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', categoryId: '' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      if (editingId) {
        await updateAdminBrand(editingId, {
          name: formData.name,
          categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        });
      } else {
        await createAdminBrand({
          name: formData.name,
          categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
        });
      }
      setIsDialogOpen(false);
      resetForm();
      await refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : t('admin.taxonomy.saveBrandError'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.taxonomy.confirmDeleteBrand'))) return;
    try {
      await deleteAdminBrand(id);
      await refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : t('admin.taxonomy.deleteBrandError'));
    }
  };

  const openEdit = (brand: (typeof brands)[number]) => {
    setEditingId(brand.id);
    setFormData({
      name: brand.name,
      categoryId: brand.categories[0] ? String(brand.categories[0].id) : '',
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="container-main pt-20 pb-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">{t('admin.sidebar.brands')}</h1>
          <p className="text-muted-foreground">{t('admin.taxonomy.brandsDescription')}</p>
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('admin.taxonomy.addBrand')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? t('admin.taxonomy.editBrand') : t('admin.taxonomy.createBrand')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="brand-name">{t('admin.taxonomy.brandName')}</Label>
                <Input
                  id="brand-name"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="brand-category">{t('admin.taxonomy.categoryOrSubcategory')}</Label>
                <select
                  id="brand-category"
                  value={formData.categoryId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, categoryId: event.target.value }))}
                  className="w-full rounded-md border border-white/10 bg-[var(--bg-primary)] px-3 py-2"
                >
                  <option value="">{t('admin.taxonomy.noCategoryBinding')}</option>
                  {selectableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getCategoryDisplayName(category.name, locale)}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full">
                {editingId ? t('admin.taxonomy.updateBrand') : t('admin.taxonomy.createBrand')}
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
          <div className="py-16 text-center text-muted-foreground">{t('admin.taxonomy.loadingBrands')}</div>
        ) : visibleBrands.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">{t('admin.taxonomy.noBrands')}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleBrands.map((brand) => (
              <div key={brand.id} className="flex h-full flex-col rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="shrink-0 rounded-lg bg-blue-500/10 p-2 text-blue-400">
                      <Tags className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="break-words font-semibold leading-5 text-white">{brand.name}</p>
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {brand.categories[0]
                          ? getCategoryDisplayName(brand.categories[0].name, locale)
                          : t('admin.taxonomy.globalBrand')}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(brand)}
                      className="h-8 w-8 hover:bg-yellow-500/10 hover:text-yellow-400"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(brand.id)}
                      className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>{t('admin.taxonomy.modelsCount', { count: String(brand.modelsCount) })}</span>
                  <span className="shrink-0">{t('admin.taxonomy.listingsCount', { count: String(brand.listingsCount) })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
