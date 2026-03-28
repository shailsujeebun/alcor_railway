'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useAuthStore } from '@/stores/auth-store';
import { useStartConversation } from '@/lib/queries';

export function ContactSellerButton({
  listingId,
  listingOwnerId,
  label = 'Написати адміну Alcor',
  className,
}: {
  listingId: string;
  listingOwnerId?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const startConversation = useStartConversation();
  const [message, setMessage] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (listingOwnerId && listingOwnerId === user?.id) return null;

  const handleSend = () => {
    if (!message.trim() || startConversation.isPending) return;
    setSubmitError(null);
    startConversation.mutate(
      { listingId, body: message.trim() },
      {
        onSuccess: (conv) => {
          setShowComposer(false);
          setMessage('');
          router.push(`/cabinet/messages/${conv.id}`);
        },
        onError: (error) => {
          setSubmitError(error instanceof Error ? error.message : 'Не вдалося надіслати повідомлення.');
        },
      },
    );
  };

  return (
    <>
      <div className="mt-3">
        <button
          onClick={() => {
            setSubmitError(null);
            setShowComposer(true);
          }}
          className={
            className ??
            'block w-full text-center border border-blue-bright text-blue-bright py-3 rounded-xl font-semibold text-sm hover:bg-blue-bright/10 transition-colors'
          }
        >
          <MessageSquare size={14} className="inline mr-2" />
          {label}
        </button>
      </div>

      <Modal
        open={showComposer}
        onClose={() => {
          if (startConversation.isPending) return;
          setShowComposer(false);
        }}
        title="Повідомлення для Alcor"
      >
        {isAuthenticated ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Повідомлення буде надіслано адміну Alcor. Компанія не отримує його напряму.
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Напишіть ваше повідомлення для Alcor..."
              rows={5}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-blue-bright resize-none"
            />

            {submitError && (
              <p className="text-sm text-red-300">{submitError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSend}
                disabled={!message.trim() || startConversation.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-blue-bright py-3 text-sm font-semibold text-blue-bright transition-colors hover:bg-blue-bright/10 disabled:opacity-50"
              >
                <MessageSquare size={14} />
                {startConversation.isPending ? 'Відправка...' : 'Надіслати адміну'}
              </button>
              <button
                onClick={() => {
                  setShowComposer(false);
                  setSubmitError(null);
                }}
                disabled={startConversation.isPending}
                className="rounded-xl border border-[var(--border-color)] px-4 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
              >
                Скасувати
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Щоб написати адміну Alcor, увійдіть або створіть акаунт. Повідомлення все одно піде тільки в Alcor.
            </p>
            <div className="flex gap-2">
              <Link
                href="/login"
                className="flex-1 rounded-xl border border-blue-bright py-3 text-center text-sm font-semibold text-blue-bright transition-colors hover:bg-blue-bright/10"
              >
                Увійти
              </Link>
              <Link
                href="/register"
                className="flex-1 rounded-xl border border-[var(--border-color)] py-3 text-center text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Реєстрація
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
