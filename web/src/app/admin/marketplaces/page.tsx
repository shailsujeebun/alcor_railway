'use client';

import { useState, useEffect } from 'react';
import {
    getAdminMarketplaces,
    createAdminMarketplace,
    updateAdminMarketplace,
    AdminMarketplace,
} from '@/lib/api';
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
import { Plus, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

export default function AdminMarketplacesPage() {
    const [marketplaces, setMarketplaces] = useState<AdminMarketplace[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ key: '', name: '' });
    const [editingId, setEditingId] = useState<number | null>(null);

    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            router.push('/');
            return;
        }
        loadMarketplaces();
    }, [user, router]);

    async function loadMarketplaces() {
        try {
            const data = await getAdminMarketplaces();
            setMarketplaces(data);
        } catch (error) {
            console.error('Failed to load marketplaces', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (editingId) {
                await updateAdminMarketplace(editingId, { name: formData.name });
            } else {
                await createAdminMarketplace(formData);
            }
            setIsDialogOpen(false);
            setFormData({ key: '', name: '' });
            setEditingId(null);
            loadMarketplaces();
        } catch (error) {
            console.error('Failed to save marketplace', error);
            alert('Не вдалося зберегти маркетплейс');
        }
    }

    async function toggleActive(id: number, currentStatus: boolean) {
        try {
            await updateAdminMarketplace(id, { isActive: !currentStatus });
            loadMarketplaces();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    }

    function openEdit(mp: AdminMarketplace) {
        setFormData({ key: mp.key, name: mp.name });
        setEditingId(mp.id);
        setIsDialogOpen(true);
    }

    if (isLoading) return <div className="p-8">Завантаження...</div>;

    return (
        <div className="container-main py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Керування маркетплейсами</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => {
                                setFormData({ key: '', name: '' });
                                setEditingId(null);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Додати маркетплейс
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingId ? 'Редагувати маркетплейс' : 'Створити новий маркетплейс'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="key">Ключ (URL-слаг)</Label>
                                <Input
                                    id="key"
                                    value={formData.key}
                                    onChange={(e) =>
                                        setFormData({ ...formData, key: e.target.value })
                                    }
                                    placeholder="напр., droneline"
                                    disabled={!!editingId} // Key cannot be changed after creation
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Унікальний ідентифікатор. Після створення змінити не можна.
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="name">Назва для відображення</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="напр., DroneLine"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                {editingId ? 'Оновити' : 'Створити'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaces.map((mp) => (
                    <div
                        key={mp.id}
                        className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold mb-1">{mp.name}</h3>
                                <code className="text-sm bg-muted px-2 py-1 rounded text-muted-foreground">
                                    {mp.key}
                                </code>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEdit(mp)}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                            <span
                                className={`flex items-center gap-2 text-sm ${mp.isActive ? 'text-green-500' : 'text-gray-400'
                                    }`}
                            >
                                {mp.isActive ? (
                                    <>
                                        <CheckCircle className="w-4 h-4" /> Активний
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-4 h-4" /> Неактивний
                                    </>
                                )}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleActive(mp.id, mp.isActive)}
                            >
                                {mp.isActive ? 'Деактивувати' : 'Активувати'}
                            </Button>
                        </div>
                    </div>
                ))}

                {marketplaces.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        Маркетплейси не знайдено. Створіть перший.
                    </div>
                )}
            </div>
        </div>
    );
}
