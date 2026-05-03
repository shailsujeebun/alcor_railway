'use client';

import Image from 'next/image';
import { useTranslation } from '../providers/translation-provider';
import { MAIN_LANDING_URL } from '@/lib/landing';

export function Footer() {
  const { t } = useTranslation();
  const homeLogoHref = MAIN_LANDING_URL;
  const landingBaseUrl = (
    MAIN_LANDING_URL && MAIN_LANDING_URL !== '/'
      ? MAIN_LANDING_URL
      : 'https://landingpagealcor.netlify.app/'
  ).replace(/\/$/, '');
  const address = t('footer.address');
  const phone = '+38 (068) 319-98-00';
  const email = 'alkorfk@gmail.com';
  const serviceLinks = [
    { href: `${landingBaseUrl}/pages/leasing-details.html`, label: t('footer.autoLeasing') },
    { href: `${landingBaseUrl}/pages/credit.html`, label: t('footer.businessLoans') },
    { href: `${landingBaseUrl}/pages/factoring.html`, label: t('footer.factoring') },
  ];
  const companyHref = `${landingBaseUrl}/pages/about.html`;

  return (
    <footer className="mt-auto w-full border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-0 py-20 pb-10">
      <div className="container-main w-full">
        <div className="grid grid-cols-1 gap-[60px] md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <a href={homeLogoHref} className="mb-5 inline-flex items-center gap-3.5 no-underline">
              <Image
                src="/alcor-logo.png"
                alt={t('brand.logoAlt')}
                width={54}
                height={54}
                className="h-auto w-[54px] shrink-0 transition-transform duration-300 ease-out hover:-translate-y-0.5"
              />
              <span className="font-heading text-[32px] font-black tracking-[-1px] text-transparent [background:linear-gradient(135deg,var(--blue-light)_0%,var(--orange)_100%)] [-webkit-background-clip:text] [background-clip:text]">
                АЛЬКОР
              </span>
            </a>
            <p className="mb-[30px] max-w-[34rem] text-base leading-[1.7] text-[var(--text-secondary)]">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h4 className="mb-[25px] font-heading text-lg font-bold text-[var(--text-primary)]">
              {t('footer.servicesTitle')}
            </h4>
            <ul className="list-none p-0">
              {serviceLinks.map((link) => (
                <li key={link.href} className="mb-[15px] last:mb-0">
                  <a
                    href={link.href}
                    className="inline-flex items-center gap-1.5 text-[15px] leading-[1.35] text-[var(--text-secondary)] no-underline transition-colors hover:text-[var(--blue-light)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-[25px] font-heading text-lg font-bold text-[var(--text-primary)]">
              {t('footer.companyTitle')}
            </h4>
            <ul className="list-none p-0">
              <li className="mb-[15px] last:mb-0">
                <a
                  href={companyHref}
                  className="inline-flex items-center gap-1.5 text-[15px] leading-[1.35] text-[var(--text-secondary)] no-underline transition-colors hover:text-[var(--blue-light)]"
                >
                  {t('footer.about')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-[25px] font-heading text-lg font-bold text-[var(--text-primary)]">
              {t('footer.contactsTitle')}
            </h4>
            <ul className="list-none p-0">
              <li className="mb-[15px] last:mb-0">
                <a
                  href="tel:+380683199800"
                  className="inline-flex items-center gap-1.5 text-[15px] leading-[1.35] text-[var(--text-secondary)] no-underline transition-colors hover:text-[var(--blue-light)]"
                >
                  {phone}
                </a>
              </li>
              <li className="mb-[15px] last:mb-0">
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-1.5 text-[15px] leading-[1.35] text-[var(--text-secondary)] no-underline transition-colors hover:text-[var(--blue-light)]"
                >
                  {email}
                </a>
              </li>
              <li className="mb-[15px] text-[15px] leading-[1.35] text-[var(--text-secondary)] last:mb-0">
                {address}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
