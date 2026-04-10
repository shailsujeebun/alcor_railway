'use client';

import { useState, useEffect } from 'react';
import {
    getAdminMarketplaces,
    createAdminMarketplace,
    updateAdminMarketplace,
    deleteAdminMarketplace,
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
import { Plus, Edit2, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { getMarketplaceDisplayName } from '@/lib/display-labels';

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
            alert('Failed to save marketplace');
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

    async function handleDelete(mp: AdminMarketplace) {
        const confirmed = window.confirm(
            `Delete marketplace "${mp.name}"? This only works when it has no categories and no listings.`,
        );
        if (!confirmed) return;

        try {
            await deleteAdminMarketplace(mp.id);
            loadMarketplaces();
        } catch (error) {
            console.error('Failed to delete marketplace', error);
            alert('Failed to delete marketplace. Remove its categories and listings first.');
        }
    }

    function openEdit(mp: AdminMarketplace) {
        setFormData({ key: mp.key, name: mp.name });
        setEditingId(mp.id);
        setIsDialogOpen(true);
    }

    const activeMarketplaces = marketplaces.filter((mp) => mp.isActive);
    const inactiveMarketplaces = marketplaces.filter((mp) => !mp.isActive);

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="container-main py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manage Marketplaces</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => {
                                setFormData({ key: '', name: '' });
                                setEditingId(null);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Marketplace
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingId ? 'Edit Marketplace' : 'Create New Marketplace'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="key">Key (URL Slug)</Label>
                                <Input
                                    id="key"
                                    value={formData.key}
                                    onChange={(e) =>
                                        setFormData({ ...formData, key: e.target.value })
                                    }
                                    placeholder="e.g., droneline"
                                    disabled={!!editingId} // Key cannot be changed after creation
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Unique identifier. Cannot be changed later.
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="e.g., DroneLine"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                {editingId ? 'Update' : 'Create'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeMarketplaces.map((mp) => (
                    <div
                        key={mp.id}
                        className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <h3 className="text-xl font-semibold mb-1">
                                  {getMarketplaceDisplayName(mp.name, mp.key)}
                                </h3>
                                <code className="text-sm bg-muted px-2 py-1 rounded text-muted-foreground">
                                    {mp.key}
                                </code>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 self-start sm:justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEdit(mp)}
                                >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300"
                                    onClick={() => handleDelete(mp)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
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
                                        <CheckCircle className="w-4 h-4" /> Active
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-4 h-4" /> Inactive
                                    </>
                                )}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleActive(mp.id, mp.isActive)}
                            >
                                {mp.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                        </div>
                    </div>
                ))}

                {activeMarketplaces.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No marketplaces found. Create your first one!
                    </div>
                )}
            </div>

            {inactiveMarketplaces.length > 0 && (
                <div className="mt-10">
                    <h2 className="mb-4 text-xl font-semibold">Inactive marketplaces</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {inactiveMarketplaces.map((mp) => (
                            <div
                                key={mp.id}
                                className="bg-card border rounded-xl p-6 shadow-sm opacity-80"
                            >
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-semibold mb-1">
                                            {getMarketplaceDisplayName(mp.name, mp.key)}
                                        </h3>
                                        <code className="text-sm bg-muted px-2 py-1 rounded text-muted-foreground">
                                            {mp.key}
                                        </code>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 self-start sm:justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEdit(mp)}
                                        >
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-400 hover:text-red-300"
                                            onClick={() => handleDelete(mp)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                    <span className="flex items-center gap-2 text-sm text-gray-400">
                                        <XCircle className="w-4 h-4" /> Inactive
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleActive(mp.id, mp.isActive)}
                                    >
                                        Activate
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
