import { cn } from '@/lib/utils';

export default function PrivacyPage() {
  return (
    <div className="container-main section-padding">
      <div className="max-w-4xl mx-auto">
        <h1
          className="text-4xl md:text-5xl font-heading font-bold gradient-text mb-8 text-center"
          data-aos="fade-up"
        >
          Політика конфіденційності
        </h1>

        <div className="glass-card p-8 md:p-12 space-y-12">
          {/* Section 1: Збір інформації */}
          <section data-aos="fade-up" data-aos-delay="50">
            <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
              1. Збір інформації
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Ми збираємо інформацію, яку ви надаєте нам безпосередньо при реєстрації, створенні оголошень або використанні наших сервісів:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-[var(--text-secondary)]">
              <li>Контактні дані (ім'я, email, телефон)</li>
              <li>Інформація про компанію (назва, адреса, опис діяльності)</li>
              <li>Дані про техніку та обладнання в оголошеннях</li>
              <li>Історія взаємодії з платформою (перегляди, пошукові запити)</li>
              <li>IP-адреса та технічна інформація про пристрій</li>
            </ul>
          </section>

          {/* Section 2: Використання інформації */}
          <section data-aos="fade-up" data-aos-delay="100">
            <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
              2. Використання інформації
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Зібрана інформація використовується для наступних цілей:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-[var(--text-secondary)]">
              <li>Надання та покращення наших сервісів</li>
              <li>Обробка та публікація оголошень про техніку</li>
              <li>Зв'язок з вами щодо вашого акаунту та оголошень</li>
              <li>Персоналізація вашого досвіду на платформі</li>
              <li>Аналіз та покращення функціональності маркетплейсу</li>
              <li>Запобігання шахрайству та порушенням безпеки</li>
            </ul>
          </section>

          {/* Section 3: Розкриття інформації */}
          <section data-aos="fade-up" data-aos-delay="150">
            <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
              3. Розкриття інформації третім сторонам
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Ми не продаємо вашу персональну інформацію третім сторонам. Ми можемо передавати дані лише у таких випадках:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-[var(--text-secondary)]">
              <li>За вашою явною згодою</li>
              <li>Сервісним провайдерам для технічної підтримки платформи</li>
              <li>При виконанні законодавчих вимог або судових розпоряджень</li>
              <li>Для захисту прав та безпеки нашої платформи та користувачів</li>
            </ul>
          </section>

          {/* Section 4: Cookies */}
          <section data-aos="fade-up" data-aos-delay="200">
            <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
              4. Cookies та технології відстеження
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Ми використовуємо cookies та подібні технології для покращення роботи сайту:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-[var(--text-secondary)]">
              <li>Збереження ваших налаштувань та уподобань</li>
              <li>Аналіз відвідуваності та поведінки користувачів</li>
              <li>Персоналізація контенту та рекомендацій</li>
              <li>Забезпечення безпеки та запобігання шахрайству</li>
            </ul>
            <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
              Ви можете налаштувати використання cookies у своєму браузері, але це може вплинути на функціональність сайту.
            </p>
          </section>

          {/* Section 5: Захист даних */}
          <section data-aos="fade-up" data-aos-delay="250">
            <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
              5. Захист даних
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Ми вживаємо розумних технічних та організаційних заходів для захисту вашої інформації:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-[var(--text-secondary)]">
              <li>Шифрування даних при передачі (SSL/TLS)</li>
              <li>Регулярні перевірки безпеки системи</li>
              <li>Обмеження доступу до персональних даних</li>
              <li>Резервне копіювання даних</li>
            </ul>
            <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
              Незважаючи на наші зусилля, жоден метод передачі через Інтернет не є абсолютно безпечним. Ми не можемо гарантувати повну безпеку переданої інформації.
            </p>
          </section>

          {/* Section 6: Ваші права */}
          <section data-aos="fade-up" data-aos-delay="300">
            <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
              6. Ваші права
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Відповідно до законодавства про захист персональних даних, ви маєте наступні права:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-[var(--text-secondary)]">
              <li>Доступ до своїх персональних даних</li>
              <li>Виправлення неточних або неповних даних</li>
              <li>Видалення ваших даних (право на забуття)</li>
              <li>Обмеження обробки ваших даних</li>
              <li>Переносимість даних</li>
              <li>Відкликання згоди на обробку даних</li>
            </ul>
            <p className="text-[var(--text-secondary)] leading-relaxed mt-4">
              Для реалізації цих прав, будь ласка, зверніться до нас за контактами, вказаними нижче.
            </p>
          </section>

          {/* Section 7: Збереження даних */}
          <section data-aos="fade-up" data-aos-delay="350">
            <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
              7. Збереження даних
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Ми зберігаємо вашу персональну інформацію стільки часу, скільки це необхідно для надання наших сервісів, виконання законодавчих зобов'язань, вирішення спорів та дотримання наших угод. Після видалення акаунту ваші персональні дані будуть видалені протягом 30 днів, за винятком інформації, яку ми зобов'язані зберігати відповідно до законодавства.
            </p>
          </section>

          {/* Section 8: Діти */}
          <section data-aos="fade-up" data-aos-delay="400">
            <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
              8. Діти
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Наші сервіси призначені для осіб віком від 18 років. Ми свідомо не збираємо персональну інформацію від дітей віком до 18 років. Якщо ви є батьком або опікуном і знаєте, що ваша дитина надала нам персональні дані, будь ласка, зв'яжіться з нами для видалення цієї інформації.
            </p>
          </section>

          {/* Section 9: Зміни до політики */}
          <section data-aos="fade-up" data-aos-delay="450">
            <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
              9. Зміни до політики
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Ми можемо періодично оновлювати цю Політику конфіденційності. Про суттєві зміни ми повідомимо вас через email або повідомлення на сайті. Дата останнього оновлення політики вказана у верхній частині сторінки. Ми рекомендуємо періодично переглядати цю сторінку для ознайомлення з актуальною інформацією про наші практики захисту конфіденційності.
            </p>
          </section>

          {/* Section 10: Контакти */}
          <section data-aos="fade-up" data-aos-delay="500">
            <h2 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-4">
              10. Контакти
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Якщо у вас є питання щодо цієї Політики конфіденційності або обробки ваших персональних даних, будь ласка, зв'яжіться з нами:
            </p>
            <div className="text-[var(--text-secondary)] leading-relaxed space-y-2">
              <p>
                <span className="text-blue-bright font-semibold">Електронна пошта:</span>{' '}
                <a
                  href="mailto:alkorfk@gmail.com"
                  className="text-blue-bright hover:underline transition-all"
                >
                  alkorfk@gmail.com
                </a>
              </p>
              <p>
                <span className="text-blue-bright font-semibold">Телефон:</span>{' '}
                +38 (068) 319-98-00
              </p>
              <p>
                <span className="text-blue-bright font-semibold">Адреса:</span>{' '}
                49044, м. Дніпро, вул. Івана Шулика, 2, офіс 302
              </p>
              <p className="text-sm mt-4 pt-4 border-t border-[var(--border-color)]">
                Остання дата оновлення: {new Date().toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
