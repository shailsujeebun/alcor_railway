'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { ConsultationModal } from '@/components/layout/consultation-modal';
import { useAuthStore } from '@/stores/auth-store';

export function ContactSellerButton({
  listingId,
  listingOwnerId,
  label = 'Зв\'язатися з Alcor',
  className,
}: {
  listingId: string;
  listingOwnerId?: string;
  label?: string;
  className?: string;
}) {
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);

  // Hide button if the listing owner is viewing their own listing
  if (listingOwnerId && listingOwnerId === user?.id) return null;

  return (
    <>
      <div className="mt-3">
        <button
          onClick={() => setModalOpen(true)}
          className={
            className ??
            'block w-full text-center border border-blue-bright text-blue-bright py-3 rounded-xl font-semibold text-sm hover:bg-blue-bright/10 transition-colors'
          }
        >
          <MessageSquare size={14} className="inline mr-2" />
          {label}
        </button>
      </div>

      <ConsultationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
