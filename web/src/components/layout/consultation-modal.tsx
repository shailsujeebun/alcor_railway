'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ConsultationModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConsultationModal({ open, onClose }: ConsultationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = useCallback(() => {
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setSubmitting(false);
    setSubmitted(false);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Send consultation request via mailto as fallback
      const subject = encodeURIComponent('Запит на консультацію');
      const body = encodeURIComponent(
        `Ім'я: ${name}\nЕлектронна пошта: ${email}\nТелефон: ${phone}\n\nПовідомлення:\n${message}`
      );
      window.open(`mailto:alkorfk@gmail.com?subject=${subject}&body=${body}`, '_self');
      setSubmitted(true);
    } catch {
      // fallback
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center transition-all duration-300"
      style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-[90%] max-w-[600px] rounded-3xl border border-[var(--border-color)] p-[50px] transition-transform duration-300"
        style={{ background: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-[var(--text-primary)] transition-colors hover:text-blue-light"
          aria-label="Закрити"
        >
          <X size={28} strokeWidth={2} />
        </button>

        {submitted ? (
          <div className="py-8 text-center">
            <h2 className="mb-4 font-heading text-2xl font-extrabold text-[var(--text-primary)]">
              Дякуємо!
            </h2>
            <p className="text-[var(--text-secondary)]">
              Ваш запит відправлено. Ми зв&apos;яжемося з вами найближчим часом.
            </p>
          </div>
        ) : (
          <>
            <h2 className="mb-[30px] font-heading text-[32px] font-extrabold leading-tight text-[var(--text-primary)]">
              Отримати консультацію
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div className="mb-[25px]">
                <label className="mb-[10px] block text-sm font-semibold text-[var(--text-primary)]">
                  Ім&apos;я
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше ім'я"
                  required
                  className="w-full rounded-xl border border-[var(--border-color)] px-5 py-[15px] text-[15px] text-[var(--text-primary)] transition-colors focus:border-blue-light focus:outline-none"
                  style={{ background: 'var(--bg-primary)', fontFamily: "'Inter', sans-serif" }}
                />
              </div>

              {/* Email */}
              <div className="mb-[25px]">
                <label className="mb-[10px] block text-sm font-semibold text-[var(--text-primary)]">
                  Електронна пошта
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full rounded-xl border border-[var(--border-color)] px-5 py-[15px] text-[15px] text-[var(--text-primary)] transition-colors focus:border-blue-light focus:outline-none"
                  style={{ background: 'var(--bg-primary)', fontFamily: "'Inter', sans-serif" }}
                />
              </div>

              {/* Phone */}
              <div className="mb-[25px]">
                <label className="mb-[10px] block text-sm font-semibold text-[var(--text-primary)]">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+38 (___) ___-__-__"
                  required
                  className="w-full rounded-xl border border-[var(--border-color)] px-5 py-[15px] text-[15px] text-[var(--text-primary)] transition-colors focus:border-blue-light focus:outline-none"
                  style={{ background: 'var(--bg-primary)', fontFamily: "'Inter', sans-serif" }}
                />
              </div>

              {/* Message */}
              <div className="mb-[25px]">
                <label className="mb-[10px] block text-sm font-semibold text-[var(--text-primary)]">
                  Повідомлення
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Коротко опишіть ваш запит..."
                  required
                  className="w-full resize-y rounded-xl border border-[var(--border-color)] px-5 py-[15px] text-[15px] text-[var(--text-primary)] transition-colors focus:border-blue-light focus:outline-none"
                  style={{
                    background: 'var(--bg-primary)',
                    fontFamily: "'Inter', sans-serif",
                    minHeight: '120px',
                  }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl px-5 py-[18px] text-base font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  boxShadow: '0 10px 30px rgba(249, 115, 22, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(249, 115, 22, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(249, 115, 22, 0.3)';
                }}
              >
                {submitting ? 'Надсилання...' : 'Надіслати заявку'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
