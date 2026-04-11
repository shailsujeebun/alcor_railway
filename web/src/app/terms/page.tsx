export const metadata = {
  title: 'Умови використання | Marketplace',
  description: 'Умови використання платформи',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container-main">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-16" data-aos="fade-up">
            <h1 className="gradient-text text-5xl md:text-6xl font-heading font-bold mb-6">
              Умови використання
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Оновлено: Лютий 2026
            </p>
          </div>

          {/* Content */}
          <div className="glass-card p-8 md:p-12 space-y-8">
            {/* Section 1 */}
            <section data-aos="fade-up">
              <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
                1. Загальні положення
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Ці Умови використання регулюють доступ та використання платформи АЛЬКОР Marketplace
                (далі — "Платформа"). Використовуючи Платформу, ви погоджуєтесь з цими умовами
                в повному обсязі.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Якщо ви не погоджуєтесь з будь-якою частиною цих умов, ви не маєте права
                використовувати Платформу.
              </p>
            </section>

            {/* Section 2 */}
            <section data-aos="fade-up">
              <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
                2. Реєстрація та облікові записи
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Для розміщення оголошень та доступу до певних функцій Платформи вам необхідно
                створити обліковий запис.
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] leading-relaxed space-y-2">
                <li>Ви зобов'язані надати достовірну та актуальну інформацію під час реєстрації</li>
                <li>Ви несете відповідальність за збереження конфіденційності вашого пароля</li>
                <li>Ви несете відповідальність за всю діяльність у вашому обліковому записі</li>
                <li>Вам має виповнитися 18 років або ви повинні мати право діяти від імені юридичної особи</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section data-aos="fade-up">
              <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
                3. Використання платформи
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Ви зобов'язуєтесь використовувати Платформу лише в законних цілях та відповідно
                до цих Умов. Забороняється:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] leading-relaxed space-y-2">
                <li>Порушувати будь-які застосовні закони або нормативні акти</li>
                <li>Розміщувати неправдиву, оманливу або неточну інформацію</li>
                <li>Порушувати права інтелектуальної власності інших осіб</li>
                <li>Передавати шкідливе програмне забезпечення, віруси або інший шкідливий код</li>
                <li>Втручатися в роботу Платформи або серверів</li>
                <li>Використовувати автоматизовані системи для збору даних без дозволу</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section data-aos="fade-up">
              <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
                4. Розміщення оголошень
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                При розміщенні оголошень про продаж або оренду техніки ви гарантуєте:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] leading-relaxed space-y-2">
                <li>Що маєте законне право продавати або здавати в оренду зазначене обладнання</li>
                <li>Що всі фотографії та опис відповідають дійсності</li>
                <li>Що ціни та умови вказані точно та актуальні</li>
                <li>Що обладнання відповідає всім застосовним стандартам та нормам безпеки</li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                Ми залишаємо за собою право видаляти оголошення, які порушують ці Умови або
                застосовне законодавство.
              </p>
            </section>

            {/* Section 5 */}
            <section data-aos="fade-up">
              <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
                5. Інтелектуальна власність
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Вся інтелектуальна власність на Платформі, включаючи дизайн, логотипи, текст,
                графіку та програмне забезпечення, належить АЛЬКОР або її ліцензіарам.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Розміщуючи контент на Платформі, ви надаєте нам неексклюзивну, безоплатну,
                всесвітню ліцензію на використання, відтворення та розповсюдження цього
                контенту в межах Платформи.
              </p>
            </section>

            {/* Section 6 */}
            <section data-aos="fade-up">
              <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
                6. Обмеження відповідальності
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                АЛЬКОР виступає лише посередником між покупцями та продавцями. Ми не несемо
                відповідальності за:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] leading-relaxed space-y-2">
                <li>Якість, безпечність або законність запропонованої техніки</li>
                <li>Точність інформації, наданої продавцями</li>
                <li>Здатність продавців завершити транзакцію</li>
                <li>Здатність покупців оплатити придбання</li>
              </ul>
              <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
                Платформа надається "як є" без будь-яких гарантій. Ми не несемо відповідальності
                за прямі, непрямі, випадкові або наслідкові збитки.
              </p>
            </section>

            {/* Section 7 */}
            <section data-aos="fade-up">
              <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
                7. Зміни до умов
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Ми залишаємо за собою право змінювати ці Умови використання в будь-який час.
                Зміни набувають чинності після публікації на Платформі. Продовження використання
                Платформи після внесення змін означає вашу згоду з оновленими умовами. Ми
                рекомендуємо регулярно переглядати цю сторінку.
              </p>
            </section>

            {/* Section 8 */}
            <section data-aos="fade-up">
              <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
                8. Контактна інформація
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Якщо у вас виникли питання щодо цих Умов використання, будь ласка, зв'яжіться
                з нами:
              </p>
              <div className="text-[var(--text-secondary)] leading-relaxed">
                <p className="mb-2">
                  Електронна пошта: <a href="mailto:alkorfk@gmail.com" className="text-blue-bright hover:underline">
                    alkorfk@gmail.com
                  </a>
                </p>
                <p className="mb-2">Телефон: +38 (068) 319-98-00</p>
                <p>Адреса: 49044, м. Дніпро, вул. Івана Шулика, 2, офіс 302</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
