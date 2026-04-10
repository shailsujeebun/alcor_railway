'use client';

import { useState } from 'react';
import { Phone, Mail } from 'lucide-react';
import { ConsultationModal } from './consultation-modal';
import { useTranslation } from '../providers/translation-provider';

export function TopBar() {
  const [modalOpen, setModalOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <div className="border-b border-[var(--border-color)]" style={{ background: 'var(--bg-secondary)' }}>
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-end gap-4 px-4 py-2 text-sm sm:gap-6 sm:px-6 lg:px-10">
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="tel:+380683199800" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-blue-bright transition-colors">
              <Phone size={14} />
              <span>+38 (068) 319-98-00</span>
            </a>
            <a href="mailto:alkorfk@gmail.com" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-blue-bright transition-colors">
              <Mail size={14} />
              <span className="hidden sm:inline">alkorfk@gmail.com</span>
            </a>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(249,115,22,0.26)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(249,115,22,0.34)] sm:px-6 sm:text-sm"
            >
              {t('topBar.consultationCta')}
            </button>
          </div>
        </div>
      </div>

      <ConsultationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
