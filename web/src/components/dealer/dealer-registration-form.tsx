'use client';

import { useState } from 'react';
import { Building2, CheckCircle } from 'lucide-react';
import { useCreateDealerLead } from '@/lib/queries';
import { useCountries, useCities } from '@/lib/queries';

export function DealerRegistrationForm() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    countryId: '',
    cityId: '',
    activityTypes: '',
    brands: '',
    equipmentCount: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const createMutation = useCreateDealerLead();
  const { data: countries } = useCountries();
  const { data: citiesData } = useCities(formData.countryId || undefined);
  const cities = citiesData?.data ?? [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'countryId') {
      setFormData((prev) => ({ ...prev, cityId: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        website: formData.website || undefined,
        countryId: formData.countryId || undefined,
        cityId: formData.cityId || undefined,
        activityTypes: formData.activityTypes
          ? formData.activityTypes.split(',').map((s) => s.trim())
          : undefined,
        brands: formData.brands
          ? formData.brands.split(',').map((s) => s.trim())
          : undefined,
        equipmentCount: formData.equipmentCount
          ? parseInt(formData.equipmentCount, 10)
          : undefined,
        message: formData.message || undefined,
      },
      { onSuccess: () => setSubmitted(true) },
    );
  };

  if (submitted) {
    return (
      <div className="container-main py-16 max-w-2xl mx-auto text-center">
        <div className="glass-card p-12">
          <CheckCircle size={64} className="mx-auto mb-6 text-green-400" />
          <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)] mb-4">
            Заявку надіслано!
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Дякуємо за вашу заявку. Наш менеджер зв&apos;яжеться з вами
            найближчим часом для обговорення умов співпраці.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main py-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Building2 size={48} className="mx-auto mb-4 text-blue-bright" />
        <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)] mb-2">
          Стати дилером
        </h1>
        <p className="text-[var(--text-secondary)]">
          Заповніть форму нижче, щоб подати заявку на партнерство з АЛЬКОР
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
        {/* Company Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Назва компанії *
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Контактна особа *
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Електронна пошта *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Телефон *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Веб-сайт
          </label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://"
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors"
          />
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Країна
            </label>
            <select
              name="countryId"
              value={formData.countryId}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors"
            >
              <option value="">Оберіть країну</option>
              {countries?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Місто
            </label>
            <select
              name="cityId"
              value={formData.cityId}
              onChange={handleChange}
              disabled={!formData.countryId}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors disabled:opacity-50"
            >
              <option value="">Оберіть місто</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Business details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Види діяльності
            </label>
            <input
              type="text"
              name="activityTypes"
              value={formData.activityTypes}
              onChange={handleChange}
              placeholder="Продаж, Оренда, Сервіс"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">Через кому</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Бренди
            </label>
            <input
              type="text"
              name="brands"
              value={formData.brands}
              onChange={handleChange}
              placeholder="CAT, Volvo, Komatsu"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">Через кому</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Кількість одиниць техніки
          </label>
          <input
            type="number"
            name="equipmentCount"
            value={formData.equipmentCount}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Повідомлення
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            placeholder="Розкажіть більше про вашу компанію та очікування від співпраці..."
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors resize-none"
          />
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-400">
            Помилка при відправці заявки. Спробуйте ще раз.
          </p>
        )}

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full gradient-cta text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {createMutation.isPending ? 'Надсилання...' : 'Подати заявку'}
        </button>
      </form>
    </div>
  );
}
