'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Trash2, Check, X, FolderTree } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  approveAdminCategory,
  createAdminCategory,
  deleteAdminCategory,
  rejectAdminCategory,
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

type FlatSubcategory = {
  id: number;
  marketplaceId: number;
  parentId: number;
  parentName: string;
  name: string;
  slug: string;
  hasEngine?: boolean;
  submissionStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  suggestedByUser?: { email: string } | null;
};

export default function AdminSubcategoriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { t, locale } = useTranslation();
  const { data: marketplaces = [] } = useMarketplaces();
  const { data: categories = [], isLoading } = useAdminCategories();

  const [selectedMarketplace, setSelectedMarketplace] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentId: '',
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

  const flatSubcategories = useMemo(() => {
    const items: FlatSubcategory[] = [];

    const collectChildren = (
      parentName: string,
      nodes: (typeof categories)[number]['children'] = [],
    ) => {
      for (const node of nodes) {
        items.push({
          id: node.id,
          marketplaceId: node.marketplaceId,
          parentId: node.parentId ?? 0,
          parentName,
          name: node.name,
          slug: node.slug,
          hasEngine: node.hasEngine,
          submissionStatus: node.submissionStatus,
          suggestedByUser: node.suggestedByUser,
        });

        if (node.children?.length) {
          collectChildren(node.name, node.children);
        }
      }
    };

    for (const category of categories) {
      if (category.children?.length) {
        collectChildren(category.name, category.children);
      }
    }

    return items.filter((item) => String(item.marketplaceId) === selectedMarketplace);
  }, [categories, selectedMarketplace]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    await queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      slug: '',
      parentId: '',
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMarketplace || !formData.parentId) return;

    const payload = {
      marketplaceId: Number(selectedMarketplace),
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().trim().replace(/\s+/g, '-'),
      parentId: Number(formData.parentId),
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
      alert(error instanceof Error ? error.message : t('admin.taxonomy.saveSubcategoryError'));
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveAdminCategory(id);
      await refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : t('admin.taxonomy.approveSubcategoryError'));
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt(t('admin.taxonomy.rejectReasonPrompt')) ?? undefined;
    try {
      await rejectAdminCategory(id, reason);
      await refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : t('admin.taxonomy.rejectSubcategoryError'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.taxonomy.confirmDeleteSubcategory'))) return;
    try {
      await deleteAdminCategory(id);
      await refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : t('admin.taxonomy.deleteSubcategoryError'));
    }
  };

  const openEdit = (subcategory: FlatSubcategory) => {
    setEditingId(subcategory.id);
    setFormData({
      name: subcategory.name,
      slug: subcategory.slug,
      parentId: String(subcategory.parentId),
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="container-main pt-20 pb-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">
            {t('admin.sidebar.subcategories')}
          </h1>
          <p className="text-muted-foreground">{t('admin.taxonomy.subcategoriesDescription')}</p>
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
              {t('admin.taxonomy.addSubcategory')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? t('admin.taxonomy.editSubcategory') : t('admin.taxonomy.createSubcategory')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="parent-category">{t('admin.taxonomy.parentCategory')}</Label>
                <select
                  id="parent-category"
                  value={formData.parentId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, parentId: event.target.value }))}
                  className="w-full rounded-md border border-white/10 bg-[var(--bg-primary)] px-3 py-2"
                  required
                >
                  <option value="">{t('admin.taxonomy.selectParentCategory')}</option>
                  {rootCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getCategoryDisplayName(category.name, locale)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="subcategory-name">{t('admin.taxonomy.name')}</Label>
                <Input
                  id="subcategory-name"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="subcategory-slug">{t('admin.taxonomy.slug')}</Label>
                <Input
                  id="subcategory-slug"
                  value={formData.slug}
                  onChange={(event) => setFormData((prev) => ({ ...prev, slug: event.target.value }))}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? t('admin.taxonomy.updateSubcategory') : t('admin.taxonomy.createSubcategory')}
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
          <div className="py-16 text-center text-muted-foreground">{t('admin.taxonomy.loadingSubcategories')}</div>
        ) : flatSubcategories.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">{t('admin.taxonomy.noSubcategories')}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {flatSubcategories.map((subcategory) => (
              <div
                key={subcategory.id}
                className="flex h-full flex-col rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="shrink-0 rounded-lg bg-blue-500/10 p-2 text-blue-400">
                      <FolderTree className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="break-words font-semibold leading-5 text-white">
                        {getCategoryDisplayName(subcategory.name, locale)}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {subcategory.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    {subcategory.submissionStatus === 'PENDING' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleApprove(subcategory.id)}
                          className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-400"
                          title={t('admin.taxonomy.approve')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReject(subcategory.id)}
                          className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
                          title={t('admin.taxonomy.reject')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(subcategory)}
                      className="h-8 w-8 hover:bg-yellow-500/10 hover:text-yellow-400"
                      title={t('admin.taxonomy.editSubcategory')}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(subcategory.id)}
                      className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
                      title={t('admin.taxonomy.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-auto space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <span>{t('admin.taxonomy.parentCategory')}</span>
                    <span className="text-right text-white">
                      {getCategoryDisplayName(subcategory.parentName, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>{t('admin.taxonomy.status')}</span>
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      subcategory.submissionStatus === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : subcategory.submissionStatus === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-red-500/10 text-red-300'
                    }`}>
                      {t(`admin.taxonomy.status${subcategory.submissionStatus}`)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>{t('admin.taxonomy.suggestedBy')}</span>
                    <span className="text-right text-white">
                      {subcategory.suggestedByUser?.email ?? t('admin.taxonomy.adminUser')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
