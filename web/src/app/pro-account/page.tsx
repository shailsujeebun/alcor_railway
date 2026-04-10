import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'PRO Акаунт — АЛЬКОР',
};

export default function ProAccountPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center py-12">
            <div className="container-main max-w-2xl text-center">
                <div className="glass-card p-12">
                    <div className="text-8xl mb-6">🚧</div>
                    <h1 className="text-4xl font-heading font-bold text-[var(--text-primary)] mb-4">
                        Сайт в розробці
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] mb-8">
                        PRO акаунт для професійних продавців техніки та обладнання наразі в розробці.
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mb-8">
                        Незабаром ви зможете отримати доступ до розширених можливостей для бізнесу.
                    </p>
                    <Link
                        href="/ad-placement"
                        className="inline-block gradient-cta text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
                    >
                        Повернутися назад
                    </Link>
                </div>
            </div>
        </div>
    );
}
