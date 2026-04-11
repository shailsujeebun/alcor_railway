'use client';

import { useTranslation } from '@/components/providers/translation-provider';
import { Button } from '@/components/ui/button';
import { getCategoryDisplayName, getMarketplaceDisplayName } from '@/lib/display-labels';
import {
  useAdminTemplates,
  useDeleteAdminTemplate,
  useUpdateAdminTemplateStatus,
} from '@/lib/queries';
import { formatDate } from '@/lib/utils';
import {
  CheckCircle,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Power,
  Trash2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function AdminTemplatesPage() {
  const { locale } = useTranslation();
  const { data: templates, isLoading, error } = useAdminTemplates();
  const deleteMutation = useDeleteAdminTemplate();
  const updateStatusMutation = useUpdateAdminTemplateStatus();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей шаблон? Ця дія незворотна.')) {
      return;
    }

    setProcessingId(id);
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      alert('Помилка видалення шаблону');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    if (
      newStatus &&
      !window.confirm(
        'Активувати цей шаблон? Інші активні шаблони цієї категорії будуть деактивовані.',
      )
    ) {
      return;
    }

    setProcessingId(id);
    try {
      await updateStatusMutation.mutateAsync({ id, isActive: newStatus });
    } catch {
      alert('Помилка зміни статусу');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-bright" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-400 bg-red-900/10 border border-red-900/20 rounded-lg">
        Помилка завантаження шаблонів
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">
            Шаблони форм
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Керування шаблонами оголошень для категорій
          </p>
        </div>
        <Link href="/admin/templates/builder">
          <Button className="gradient-cta text-white gap-2">
            <Plus size={18} />
            Створити шаблон
          </Button>
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] text-sm">
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Категорія</th>
                <th className="p-4 font-medium">Версія</th>
                <th className="p-4 font-medium">Статус</th>
                <th className="p-4 font-medium">Полів</th>
                <th className="p-4 font-medium">Створено</th>
                <th className="p-4 font-medium text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
              {templates?.map((template) => {
                const templateId = Number(template.id);
                const isProcessing = processingId === templateId;

                return (
                  <tr key={template.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="p-4 text-sm font-mono text-[var(--text-secondary)]">#{template.id}</td>
                    <td className="p-4">
                      <div className="font-medium">
                        {template.category?.name
                          ? getCategoryDisplayName(template.category.name, locale)
                          : 'Невідома категорія'}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {template.category?.marketplace?.name
                          ? getMarketplaceDisplayName(
                              template.category.marketplace.name,
                              template.category.marketplace.key,
                              locale,
                            )
                          : 'Невідомий маркетплейс'}{' '}
                        • {template.category?.slug}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-mono">
                        v{template.version}
                      </span>
                    </td>
                    <td className="p-4">
                      {template.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle size={12} />
                          Активний
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle size={12} />
                          Неактивний
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {template.fields?.length || 0}
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {formatDate(template.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={
                            template.isActive
                              ? 'text-green-400 hover:text-green-300'
                              : 'text-[var(--text-secondary)] hover:text-green-400'
                          }
                          onClick={() => handleToggleStatus(templateId, template.isActive)}
                          disabled={isProcessing}
                          title={template.isActive ? 'Деактивувати' : 'Активувати'}
                        >
                          {isProcessing ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Power size={16} />
                          )}
                        </Button>

                        <Link href={`/admin/templates/builder?templateId=${template.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:text-blue-400"
                            title="Редагувати"
                          >
                            <Pencil size={16} />
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDelete(templateId)}
                          disabled={isProcessing}
                          title="Видалити"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {(!templates || templates.length === 0) && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-secondary)]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                        <FileText className="w-6 h-6 opacity-50" />
                      </div>
                      <p>Шаблонів ще немає</p>
                      <Link href="/admin/templates/builder">
                        <Button variant="outline" size="sm" className="mt-2">
                          Створити перший
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
