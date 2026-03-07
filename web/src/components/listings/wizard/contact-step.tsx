'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { useWizard } from './wizard-context';
import { useAuthStore } from '@/stores/auth-store';
import { useCompanies, useCreateCompany, useCreateListing, useUpdateListing } from '@/lib/queries';
import { validateListingDraft } from '@/lib/api';
import type { CreateListingPayload, Listing } from '@/types/api';

const UA_TRANSLIT: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye',
    ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l',
    м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '',
    ю: 'yu', я: 'ya',
};

function slugifyCompany(input: string): string {
    const lower = input.toLowerCase().trim();
    let out = '';
    for (const ch of lower) {
        if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) {
            out += ch;
            continue;
        }
        if (UA_TRANSLIT[ch]) {
            out += UA_TRANSLIT[ch];
            continue;
        }
        if (ch === ' ' || ch === '-' || ch === '_') {
            out += '-';
            continue;
        }
        if (ch === '\'' || ch === '’' || ch === 'ʼ') {
            continue;
        }
        out += '-';
    }
    const slug = out.replace(/-+/g, '-').replace(/^-|-$/g, '');
    return slug || 'company';
}

export function ContactStep() {
    const {
        form, setForm,
        media,
        setCurrentStep,
        isSubmitting, setIsSubmitting,
        error, setError,
        success, setSuccess,
        listing // if editing
    } = useWizard();

    const router = useRouter();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    const isEditing = !!listing;

    const { data: companiesData } = useCompanies({ limit: '100' });
    const companies = companiesData?.data ?? [];

    const createCompanyMutation = useCreateCompany();
    const [showCreateCompany, setShowCreateCompany] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newCompanySlug, setNewCompanySlug] = useState('');

    const createMutation = useCreateListing();
    const updateMutation = useUpdateListing();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, companyId: e.target.value }));
    };

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newCompanyName.trim();
        if (!name) return;
        const slug = (newCompanySlug || slugifyCompany(name)).toLowerCase();
        try {
            const created = await createCompanyMutation.mutateAsync({ name, slug });
            setForm((prev) => ({ ...prev, companyId: created.id }));
            setNewCompanyName('');
            setNewCompanySlug('');
            setShowCreateCompany(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Помилка створення компанії: ${message}`);
        }
    };

    const handleBack = () => {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            if (user && !isEditing && !form.companyId) {
                setError('Оберіть компанію або створіть нову.');
                return;
            }
            const hasEmail = Boolean(form.sellerEmail?.trim());
            const hasPhone = Boolean(
              form.sellerPhones
                ?.split(',')
                .map((entry) => entry.trim())
                .filter(Boolean).length,
            );
            if (!hasEmail && !hasPhone) {
                setError('Provide at least one contact method: phone or email.');
                return;
            }
            const mediaPayload = media.map((m, i) => ({
                url: m.url,
                key: m.key,
                type: m.type ?? 'PHOTO',
                sortOrder: i,
            }));

            const attributesArray = Object.entries(form.dynamicAttributes)
                .filter(([key, value]) => key && value !== undefined && value !== null && String(value) !== '')
                .map(([key, value]) => ({ key, value: String(value) }));

            const dynamicBrandId = typeof form.dynamicAttributes.brand === 'string'
                ? form.dynamicAttributes.brand
                : '';
            const dynamicCurrency = typeof form.dynamicAttributes.currency === 'string'
                ? form.dynamicAttributes.currency
                : '';
            const dynamicEuro = typeof form.dynamicAttributes.euro === 'string'
                ? form.dynamicAttributes.euro
                : '';
            const dynamicAdvertType = typeof form.dynamicAttributes.advert_type === 'string'
                ? form.dynamicAttributes.advert_type
                : '';
            const dynamicCondition = typeof form.dynamicAttributes.condition === 'string'
                ? form.dynamicAttributes.condition
                : '';
            const dynamicPriceRaw = Number(form.dynamicAttributes.price);
            const dynamicPrice = Number.isFinite(dynamicPriceRaw) ? dynamicPriceRaw : undefined;
            const dynamicYearRaw = Number(form.dynamicAttributes.year_of_manufacture_year);
            const dynamicYear = Number.isFinite(dynamicYearRaw) ? dynamicYearRaw : undefined;

            const normalizedCondition = (form.condition || dynamicCondition).toLowerCase();
            const mappedCondition =
                normalizedCondition === 'new'
                    ? 'NEW'
                    : normalizedCondition === 'used'
                        ? 'USED'
                        : normalizedCondition === 'demo' || normalizedCondition === 'demonstration'
                            ? 'DEMO'
                            : undefined;

            const normalizedAdvertType = dynamicAdvertType.toLowerCase();
            const mappedListingType =
                normalizedAdvertType === 'rent'
                    ? 'RENT'
                    : normalizedAdvertType === 'sale' || normalizedAdvertType === 'sale_rent'
                        ? 'SALE'
                        : undefined;

            if (form.categoryId) {
                const validation = await validateListingDraft({
                    categoryId: form.categoryId,
                    attributes: form.dynamicAttributes,
                });
                if (!validation.valid) {
                    const message =
                        validation.errors?.map((entry: { field: string; message: string }) => `${entry.field}: ${entry.message}`).join(' | ') ||
                        'Validation failed';
                    setError(`Dynamic attributes validation failed: ${message}`);
                    return;
                }
            }

            const payload: CreateListingPayload = {
                companyId: form.companyId,
                title: form.title,
                description: form.description || undefined,
                categoryId: form.categoryId || undefined,
                brandId: form.brandId || dynamicBrandId || undefined,
                condition: mappedCondition as any,
                year: form.year ? parseInt(form.year) : dynamicYear,
                priceAmount: form.priceAmount ? parseFloat(form.priceAmount) : dynamicPrice,
                priceCurrency: form.priceCurrency || dynamicCurrency || undefined,
                priceType: (form.priceType as any) || undefined,
                countryId: form.countryId || undefined,
                cityId: form.cityId || undefined,
                sellerName: form.sellerName || undefined,
                sellerEmail: form.sellerEmail || undefined,
                sellerPhones: form.sellerPhones ? form.sellerPhones.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
                listingType: (form.listingType as any) || (mappedListingType as any) || undefined,
                euroClass: form.euroClass || dynamicEuro || undefined,
                hoursValue: form.hoursValue ? parseInt(form.hoursValue) : undefined,
                hoursUnit: form.hoursUnit || undefined,
                externalUrl: form.externalUrl || undefined,
                media: mediaPayload.length > 0 ? mediaPayload : undefined,
                attributes: attributesArray.length > 0 ? attributesArray : undefined,
            };

            // GUEST FLOW
            if (!user) {
                const draftState = {
                    form,
                    media,
                    timestamp: Date.now()
                };
                localStorage.setItem('listing_draft', JSON.stringify(draftState));
                router.push('/register?redirect=/ad-placement/details&action=create_listing');
                return;
            }

            // AUTHENTICATED FLOW
            if (isEditing && listing) {
                const { companyId, ...updateData } = payload;
                await updateMutation.mutateAsync({ id: listing.id, data: updateData });
            } else {
                await createMutation.mutateAsync(payload);
            }

            setSuccess('Оголошення успішно збережено!');
            localStorage.removeItem('listing_draft');

            const redirectTo = isAdmin ? '/admin/moderation' : '/cabinet/listings';
            setTimeout(() => router.push(redirectTo), 1500);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Помилка: ${message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = 'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors';
    const labelClass = 'block text-sm font-medium text-[var(--text-secondary)] mb-1.5';
    const selectClass = `${inputClass} appearance-none`;

    return (
        <div className="space-y-6">
            {!user && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">Вже зареєстровані?</h3>
                    <p className="text-[var(--text-secondary)] mb-4">Увійдіть, щоб ваші дані заповнились автоматично</p>
                    <button
                        onClick={() => router.push('/login?redirect=/ad-placement/details')}
                        className="px-6 py-2 rounded-full bg-blue-bright text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        Увійти
                    </button>
                </div>
            )}

            <div className="glass-card p-6 sm:p-8 space-y-5">
                <h2 className="text-xl font-heading font-bold text-[var(--text-primary)] mb-4">Контактна інформація</h2>

                {user && !isEditing && (
                    <div>
                        <label className={labelClass}>Компанія (Від кого розміщуємо)</label>
                        <select name="companyId" value={form.companyId} onChange={handleCompanyChange} className={selectClass}>
                            <option value="">Оберіть компанію</option>
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <div className="mt-3 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCreateCompany((prev) => !prev)}
                                className="text-sm text-blue-bright hover:text-blue-light transition-colors"
                            >
                                {showCreateCompany ? 'Скасувати' : 'Додати компанію'}
                            </button>
                            {companies.length === 0 && (
                                <span className="text-xs text-[var(--text-secondary)]">
                                    Компаній немає — додайте нову.
                                </span>
                            )}
                        </div>

                        {showCreateCompany && (
                            <form onSubmit={handleCreateCompany} className="mt-4 space-y-3">
                                <div>
                                    <label className={labelClass}>Назва компанії</label>
                                    <input
                                        type="text"
                                        value={newCompanyName}
                                        onChange={(e) => setNewCompanyName(e.target.value)}
                                        className={inputClass}
                                        placeholder="Наприклад: AgroTech LLC"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Slug (URL)</label>
                                    <input
                                        type="text"
                                        value={newCompanySlug}
                                        onChange={(e) => setNewCompanySlug(e.target.value)}
                                        className={inputClass}
                                        placeholder={slugifyCompany(newCompanyName || 'company')}
                                    />
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                                        Якщо порожньо — створимо автоматично.
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={createCompanyMutation.isPending}
                                    className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] hover:border-blue-bright/50 transition-colors text-sm"
                                >
                                    {createCompanyMutation.isPending ? 'Створення...' : 'Створити компанію'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Ім&apos;я контактної особи</label>
                        <input type="text" name="sellerName" value={form.sellerName} onChange={handleChange} className={inputClass} placeholder="Ваше ім'я" />
                    </div>
                    <div>
                        <label className={labelClass}>Email</label>
                        <input type="email" name="sellerEmail" value={form.sellerEmail} onChange={handleChange} className={inputClass} placeholder="email@example.com" />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Телефон</label>
                    <input type="text" name="sellerPhones" value={form.sellerPhones} onChange={handleChange} className={inputClass} placeholder="+380..." />
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
                    <Check size={18} />
                    {success}
                </div>
            )}

            <div className="flex justify-between pt-6">
                <button
                    onClick={handleBack}
                    className="px-6 py-2.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    ← Назад
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-lg gradient-cta text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                    {!isSubmitting && <Check size={18} />}
                    <span>
                        {isSubmitting ? 'Публікація...' : !user ? 'Продовжити та зареєструватись' : 'Опублікувати'}
                    </span>
                </button>
            </div>
        </div>
    );
}
