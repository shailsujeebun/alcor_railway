'use client';

import { useState, useEffect } from 'react';
import {
    createAdminCategory,
    updateAdminCategory,
    deleteAdminCategory,
} from '@/lib/api';
import { useMarketplaces, useCategories } from '@/lib/queries';
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
import { Plus, Edit2, Trash2, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

// Recursive Category Item Component
function CategoryItem({
    category,
    depth = 0,
    onEdit,
    onDelete,
    onAddSub,
}: {
    category: any;
    depth?: number;
    onEdit: (cat: any) => void;
    onDelete: (id: number) => void;
    onAddSub: (parentId: number) => void;
}) {
    const [isOpen, setIsOpen] = useState(true); // Default open for better visibility
    const hasChildren = category.children && category.children.length > 0;

    return (
        <div className="select-none">
            <div
                className={`
                    flex items-center gap-3 p-3 rounded-lg border border-transparent
                    hover:bg-white/5 hover:border-white/10 transition-all duration-200 group
                    ${depth === 0 ? 'mb-1' : ''}
                `}
                style={{ marginLeft: `${depth * 24}px` }}
            >
                {/* Expand Toggle */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className={`
                        w-6 h-6 flex items-center justify-center rounded-md
                        text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors
                        ${!hasChildren ? 'opacity-20 pointer-events-none' : ''}
                    `}
                >
                    {hasChildren && (
                        <ChevronRight
                            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                        />
                    )}
                </button>

                {/* Icon */}
                <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    ${depth === 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-white/5 text-muted-foreground'}
                `}>
                    <Folder className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center gap-3">
                    <span className={`font-medium ${depth === 0 ? 'text-base' : 'text-sm'}`}>
                        {category.name}
                    </span>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                        {category.slug}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-500"
                        onClick={() => onAddSub(Number(category.id))}
                        title="Додати підкатегорію"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-yellow-500/10 hover:text-yellow-500"
                        onClick={() => onEdit(category)}
                        title="Редагувати"
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500"
                        onClick={() => onDelete(Number(category.id))}
                        title="Видалити"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Children with guide line */}
            {isOpen && hasChildren && (
                <div className="relative">
                    {/* Vertical Guide Line */}
                    <div
                        className="absolute w-px bg-white/10 bottom-4 top-0"
                        style={{ left: `${(depth * 24) + 11}px` }}
                    />
                    {category.children.map((child: any) => (
                        <CategoryItem
                            key={child.id}
                            category={child}
                            depth={depth + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddSub={onAddSub}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminCategoriesPage() {
    const { data: marketplaces, isLoading: isMarketplacesLoading } = useMarketplaces();
    const { data: categories, isLoading: isCategoriesLoading } = useCategories();
    const queryClient = useQueryClient();

    const [selectedMarketplace, setSelectedMarketplace] = useState<string>('');

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        parentId: undefined as number | undefined,
        hasEngine: false,
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            router.push('/');
            return;
        }
    }, [user, router]);

    // Set initial selected marketplace
    useEffect(() => {
        if (marketplaces && marketplaces.length > 0 && !selectedMarketplace) {
            setSelectedMarketplace(marketplaces[0].id);
        }
    }, [marketplaces, selectedMarketplace]);

    // ... handle submit functions ...
    // Note: Re-using existing handler logic, just updating the UI part so keeping logic here
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedMarketplace && !editingId) return;

        try {
            const payload = {
                marketplaceId: Number(selectedMarketplace),
                name: formData.name,
                slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
                parentId: formData.parentId,
                hasEngine: formData.hasEngine,
            };

            if (editingId) {
                await updateAdminCategory(editingId, payload);
            } else {
                await createAdminCategory(payload);
            }
            setIsDialogOpen(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        } catch (error) {
            console.error('Failed to save category', error);
            alert('Не вдалося зберегти категорію');
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('Ви впевнені? Категорія та всі підкатегорії будуть видалені.')) return;
        try {
            await deleteAdminCategory(id);
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        } catch (error) {
            console.error(error);
            alert('Не вдалося видалити категорію. Можливо, у ній є оголошення.');
        }
    }

    function resetForm() {
        setFormData({ name: '', slug: '', parentId: undefined, hasEngine: false });
        setEditingId(null);
    }

    function findCategoryById(tree: any[], id: number): any | null {
        for (const node of tree) {
            if (Number(node.id) === id) return node;
            const child = findCategoryById(node.children || [], id);
            if (child) return child;
        }
        return null;
    }

    function openCreate(parentId?: number) {
        resetForm();
        const parentCategory = parentId && categories
            ? findCategoryById(categories as any[], parentId)
            : null;
        setFormData(prev => ({
            ...prev,
            parentId,
            hasEngine: Boolean(parentCategory?.hasEngine),
        }));
        setIsDialogOpen(true);
    }

    function openEdit(cat: any) {
        setFormData({
            name: cat.name,
            slug: cat.slug,
            parentId: Number(cat.parentId) || undefined,
            hasEngine: Boolean(cat.hasEngine),
        });
        setEditingId(Number(cat.id));
        setIsDialogOpen(true);
    }

    const isLoading = isMarketplacesLoading || isCategoriesLoading;

    // Filter categories by selected marketplace
    const filteredCategories = categories?.filter(cat =>
        cat.marketplaceId === selectedMarketplace
    ) || [];

    if (isLoading && !marketplaces) return <div className="p-8 text-center">Завантаження категорій...</div>;

    return (
        <div className="container-main pt-20 pb-12">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white mb-2">Керування категоріями</h1>
                    <p className="text-muted-foreground">Організуйте структуру маркетплейсу</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => openCreate()}
                            disabled={!selectedMarketplace}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Додати категорію
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingId ? 'Редагувати категорію' : 'Створити нову категорію'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Назва</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="напр., Трактори"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="slug">Слаг (URL)</Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) =>
                                        setFormData({ ...formData, slug: e.target.value })
                                    }
                                    placeholder="напр., tractors"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Залиште порожнім для автогенерації з назви.</p>
                            </div>
                            <div className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2">
                                <input
                                    id="hasEngine"
                                    type="checkbox"
                                    checked={formData.hasEngine}
                                    onChange={(e) =>
                                        setFormData({ ...formData, hasEngine: e.target.checked })
                                    }
                                />
                                <Label htmlFor="hasEngine" className="cursor-pointer">
                                    Має двигун (використовує fallback-шаблон для моторизованої техніки)
                                </Label>
                            </div>
                            {formData.parentId && (
                                <div className="text-sm text-muted-foreground">
                                    Створюється підкатегорія під ID: {formData.parentId}
                                </div>
                            )}
                            <Button type="submit" className="w-full">
                                {editingId ? 'Оновити' : 'Створити'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Marketplace Tabs */}
            {marketplaces && marketplaces.length > 0 && (
                <div className="w-full overflow-x-auto mb-8">
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-max border border-white/5">
                        {marketplaces.map((mp) => (
                            <button
                                key={mp.id}
                                onClick={() => setSelectedMarketplace(mp.id)}
                                className={`
                                    px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
                                    ${selectedMarketplace === mp.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                    }
                                `}
                            >
                                {mp.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="glass-card rounded-xl p-6 border border-white/10 min-h-[400px]">
                {filteredCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Folder className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">
                            {selectedMarketplace
                                ? 'Категорій поки немає'
                                : 'Оберіть маркетплейс'}
                        </h3>
                        {selectedMarketplace && (
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Для цього маркетплейсу ще не налаштовано категорії. Додайте першу кореневу категорію.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredCategories.map((cat) => (
                            <CategoryItem
                                key={cat.id}
                                category={cat}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                                onAddSub={openCreate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
