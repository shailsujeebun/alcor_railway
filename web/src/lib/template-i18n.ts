/**
 * Ukrainian translations for dynamic-form field labels, group names,
 * option labels, and placeholders that originate from the template schema.
 *
 * The keys are the **lowercase** English strings coming from the API.
 * When locale === 'uk' the DynamicForm renders the Ukrainian value;
 * when locale === 'en' the original English string is used as-is.
 */

// ── Section / group names ──────────────────────────────────────────────
export const GROUP_NAMES_UK: Record<string, string> = {
  'basic characteristics': 'Основні характеристики',
  'engine, gearbox': 'Двигун, КПП',
  'axles, brakes': 'Осі, гальма',
  'additional options': 'Додаткові опції',
  'more details': 'Додатково',
  'ad parameters': 'Параметри оголошення',
  'additional details': 'Додаткові деталі',
};

// ── Field labels ───────────────────────────────────────────────────────
export const FIELD_LABELS_UK: Record<string, string> = {
  // Basic characteristics
  'category': 'Категорія',
  'brand': 'Марка',
  'model': 'Модель',
  'mini': 'Міні',
  'right-hand drive': 'Праве кермо',
  'year': 'Рік',
  'month': 'Місяць',
  'year of manufacture': 'Рік виробництва',
  'year of manufacture (year)': 'Рік виробництва (рік)',
  'year of manufacture (month)': 'Рік виробництва (місяць)',
  'first registration': 'Перша реєстрація',
  'first registration (year)': 'Перша реєстрація (рік)',
  'first registration (month)': 'Перша реєстрація (місяць)',
  'technical inspection valid till (year)': 'Техогляд дійсний до (рік)',
  'technical inspection valid till (month)': 'Техогляд дійсний до (місяць)',
  'vin': 'VIN',
  'стан': 'Стан',
  'condition': 'Стан',
  'technical condition': 'Технічний стан',
  'number of previous owners': 'Кількість попередніх власників',
  'mileage': 'Пробіг',
  'body type': 'Тип кузова',
  'colour': 'Колір',
  'running hours': 'Напрацювання',
  'working width': 'Робоча ширина',
  'current frequency': 'Частота струму',
  'voltage': 'Напруга',
  'mowing height': 'Висота зрізу',
  'rotor hours': 'Напрацювання ротора',
  'header width': 'Ширина жатки',
  'threshing width': 'Ширина молотарки',
  'grain tank volume': "Об'єм зернового бункера",
  'wheel configuration': 'Колісна формула',
  'number of rows': 'Кількість рядів',
  'row spacing': 'Міжряддя',
  'capacity (t/h)': 'Продуктивність (т/год)',
  'capacity (ha/hour)': 'Продуктивність (га/год)',
  'capacity': 'Продуктивність',
  'operating speed': 'Робоча швидкість',
  'speed': 'Швидкість',
  'combine header trailer': 'Візок для жатки',
  'vehicle mark': 'Марка візка',
  'vehicle model': 'Модель візка',
  'volume of the tank': "Об'єм бака",
  'overall dimensions length': 'Габаритна довжина',
  'overall dimensions width': 'Габаритна ширина',
  'overall dimensions height': 'Габаритна висота',
  'transport dimensions length': 'Транспортна довжина',
  'transport dimensions width': 'Транспортна ширина',
  'transport dimensions height': 'Транспортна висота',
  'number of doors': 'Кількість дверей',
  'number of seats': 'Кількість місць',
  'net weight': 'Маса нетто',
  'gross weight': 'Повна маса',
  'battery brand': 'Марка акумулятора',
  'battery capacity': 'Ємність акумулятора',
  'cabin heater': 'Обігрів кабіни',
  'central lubrication': 'Центральне змащення',
  'volume': "Об'єм",

  // Engine, gearbox
  'engine mark': 'Марка двигуна',
  'engine model': 'Модель двигуна',
  'turbo': 'Турбо',
  'intercooler': 'Інтеркулер',
  'fuel': 'Паливо',
  'power': 'Потужність',
  'power unit': 'Одиниця потужності',
  'engine type': 'Тип двигуна',
  'engine volume': "Об'єм двигуна",
  'number of cylinders': 'Кількість циліндрів',
  'number of valves': 'Кількість клапанів',
  'emission sticker': 'Екологічний стікер',
  'euro': 'Євро',
  'particulate filter': 'Сажовий фільтр',
  'eev': 'EEV',
  'fuel consumption': 'Витрата палива',
  'fuel consumption unit': 'Одиниця витрати палива',
  'gearbox type': 'Тип КПП',
  'reverse gear': 'Задня передача',
  'number of gears': 'Кількість передач',
  'gearbox brand': 'Марка КПП',
  'gearbox model': 'Модель КПП',
  'drive type': 'Тип приводу',
  'number of fuel tanks': 'Кількість паливних баків',

  // Axles, brakes
  'number of axles': 'Кількість осей',
  'axle brand': 'Марка осі',
  'wheelbase': 'Колісна база',
  'axle configuration': 'Конфігурація осей',
  'tyre size': 'Розмір шин',
  'tyre condition (%)': 'Стан шин (%)',
  'tyre condition (mm)': 'Стан шин (мм)',
  'enter by axles': 'Вводити по осях',

  // Additional options
  'air conditioning': 'Кондиціонер',
  'air conditioning type': 'Тип кондиціонера',
  'powered windows': 'Електросклопідйомники',
  'powered windows scope': 'Обсяг електросклопідйомників',
  'interior material': 'Матеріал салону',
  'interior colour': 'Колір салону',
  'steering wheel adjustment': 'Регулювання керма',
  'power steering': 'Підсилювач керма',
  'spare wheel': 'Запасне колесо',
  'adjustable seats': 'Регулювання сидінь',
  'seat position memory': "Пам'ять положення сидіння",
  'seat heater': 'Підігрів сидінь',
  'cabin and comfort': 'Кабіна та комфорт',
  'multimedia': 'Мультимедіа',
  'safety features': 'Безпека',
  'parking assistance system': 'Система допомоги при паркуванні',
  'headlights': 'Фари',
  'additional equipment': 'Додаткове обладнання',

  // More details
  'more details': 'Додатково',
  'description': 'Опис',

  // Ad parameters
  'advert type': 'Тип оголошення',
  'price': 'Ціна',
  'currency': 'Валюта',
  'vat': 'ПДВ',
  'warranty': 'Гарантія',
  'seller stock id': 'Інвентарний номер продавця',
  'reserved': 'Зарезервовано',
  'leasing is possible': 'Можливий лізинг',
  'purchase on credit is possible': 'Можлива покупка в кредит',
  'purchase by installments is possible': 'Можлива покупка в розстрочку',
};

// ── Option labels ──────────────────────────────────────────────────────
export const OPTION_LABELS_UK: Record<string, string> = {
  // Condition
  'new': 'Новий',
  'used': 'Вживаний',
  'with a defect': 'З дефектом',
  'remanufactured': 'Відновлений',
  'crashed': 'Пошкоджений',
  'demonstration': 'Демонстраційний',
  'not running': 'Не на ходу',
  'for import': 'Під пригон',
  'for parts': 'На запчастини',

  // Technical condition
  'drives': 'На ходу',
  'needs service': 'Потребує ремонту',
  'after accident': 'Після ДТП',
  'fresh import': 'Свіжий пригон',

  // Body types
  'sedan': 'Седан',
  'hatchback': 'Хетчбек',
  'wagon': 'Універсал',
  'coupe': 'Купе',
  'suv': 'Позашляховик',
  'pickup': 'Пікап',
  'van': 'Фургон',
  'other': 'Інше',

  // Colours
  'white': 'Білий',
  'black': 'Чорний',
  'silver': 'Сріблястий',
  'grey': 'Сірий',
  'blue': 'Синій',
  'red': 'Червоний',
  'green': 'Зелений',
  'yellow': 'Жовтий',
  'brown': 'Коричневий',
  'beige': 'Бежевий',
  'light grey': 'Світло-сірий',
  'bright yellow': 'Яскраво-жовтий',
  'turquoise': 'Бірюзовий',
  'sky blue': 'Блакитний',
  'purple': 'Фіолетовий',
  'violet': 'Пурпуровий',
  'dark red': 'Темно-червоний',
  'olive': 'Оливковий',
  'dark grey': 'Темно-сірий',
  'wheeled': 'Колісний',
  'tracked': 'Гусеничний',
  'in-line': 'Рядний',
  'v-type': 'V-подібний',
  'euro 1': 'Євро 1',
  'euro 2': 'Євро 2',
  'euro 3': 'Євро 3',
  'euro 4': 'Євро 4',
  'euro 5': 'Євро 5',
  'euro 6': 'Євро 6',
  'euro 7': 'Євро 7',
  'l/100km': 'л/100км',
  'l/h': 'л/год',

  // Fuel
  'diesel': 'Дизель',
  'petrol': 'Бензин',
  'electric': 'Електро',
  'hybrid': 'Гібрид',
  'lpg': 'Газ (LPG)',
  'cng': 'Газ (CNG)',
  'hydrogen': 'Водень',

  // Gearbox
  'manual': 'Механічна',
  'automatic': 'Автоматична',
  'semi-automatic': 'Напівавтоматична',
  'cvt': 'Варіатор',

  // Drive type
  'all-wheel drive': 'Повний привід',
  'front-wheel drive': 'Передній привід',
  'rear-wheel drive': 'Задній привід',

  // Engine mark
  'oem': 'Оригінал',
  'aftermarket': 'Неоригінал',

  // Emission sticker
  '1 (none)': '1 (немає)',
  '2 (red)': '2 (червоний)',
  '3 (yellow)': '3 (жовтий)',
  '4 (green)': '4 (зелений)',

  // Boolean
  'yes': 'Так',
  'no': 'Ні',
  'not set': 'Не обрано',

  // Air conditioning type
  'climate control': 'Клімат-контроль',
  'dual-zone climate control': 'Двозонний клімат-контроль',
  'multi-zone climate control': 'Багатозонний клімат-контроль',

  // Powered windows
  'front': 'Передні',
  'front and rear': 'Передні та задні',

  // Interior material
  'alcantara': 'Алькантара',
  'combination': 'Комбіноване',
  'fabric': 'Тканина',
  'faux leather': 'Штучна шкіра',
  'leather': 'Шкіра',
  'velour': 'Велюр',

  // Steering
  'by height': 'По висоті',
  'by height and reach': 'По висоті та вильоту',

  // Power steering
  'electrohydraulic': 'Електрогідравлічний',
  'eps': 'EPS',
  'hydraulic': 'Гідравлічний',

  // Spare wheel
  'donut': 'Докатка',
  'full-size': 'Повнорозмірне',

  // Adjustable seats
  'driver seat electric adjustment': 'Водійське сидіння (ел. регулювання)',
  'driver seat manual adjustment': 'Водійське сидіння (ручне регулювання)',
  'front and back seats electric adjustment': 'Передні та задні (ел. регулювання)',
  'front seats electric adjustment': 'Передні сидіння (ел. регулювання)',
  'front seats manual adjustment': 'Передні сидіння (ручне регулювання)',

  // Seat position memory
  'driver seat': 'Водійське сидіння',
  'front seats': 'Передні сидіння',
  'front and back seats': 'Передні та задні сидіння',

  // Cabin and comfort
  'sunroof': 'Люк',
  'heated steering wheel': 'Підігрів керма',
  'rain sensor': 'Датчик дощу',
  'cruise control': 'Круїз-контроль',
  'adaptive cruise control': 'Адаптивний круїз-контроль',
  'keyless entry': 'Безключовий доступ',

  // Multimedia
  'bluetooth': 'Bluetooth',
  'apple carplay': 'Apple CarPlay',
  'android auto': 'Android Auto',
  'usb': 'USB',
  'premium audio': 'Преміум аудіо',
  'navigation': 'Навігація',

  // Safety
  'abs': 'ABS',
  'esp': 'ESP',
  'traction control': 'Система контролю тяги',
  'lane assist': 'Асистент руху смугою',
  'blind spot monitoring': 'Моніторинг сліпих зон',
  'airbags': 'Подушки безпеки',

  // Parking
  'front sensors': 'Передні датчики',
  'rear sensors': 'Задні датчики',
  'rear camera': 'Задня камера',
  '360 camera': 'Камера 360°',
  'automatic parking': 'Автоматичне паркування',

  // Headlights
  'bi-xenon': 'Біксенон',
  'halogen': 'Галоген',
  'laser': 'Лазерні',
  'led': 'LED',
  'matrix': 'Матричні',
  'xenon': 'Ксенон',

  // Additional equipment
  'tow bar': 'Фаркоп',
  'roof rack': 'Багажник на даху',
  'alarm': 'Сигналізація',
  'immobilizer': 'Іммобілайзер',
  'tinted windows': 'Тоновані вікна',

  // Advert type
  'sale': 'Продаж',
  'sale / rent': 'Продаж / Оренда',
  'rent': 'Оренда',
  'hp': 'к.с.',
  'kw': 'кВт',

  // VAT
  'excluding vat': 'без ПДВ',
  'including vat': 'з ПДВ',

  // Warranty
  'no warranty': 'Без гарантії',
  '3 months': '3 місяці',
  '6 months': '6 місяців',
  '12 months': '12 місяців',
  '24 months': '24 місяці',

  // Months
  'january': 'Січень',
  'february': 'Лютий',
  'march': 'Березень',
  'april': 'Квітень',
  'may': 'Травень',
  'june': 'Червень',
  'july': 'Липень',
  'august': 'Серпень',
  'september': 'Вересень',
  'october': 'Жовтень',
  'november': 'Листопад',
  'december': 'Грудень',

  // Car category option
  'car': 'Легковий автомобіль',
};

// ── Placeholder prefixes ───────────────────────────────────────────────
export const PLACEHOLDER_PREFIX_UK: Record<string, string> = {
  'choose': 'Оберіть',
  'new': 'Нова',
};

export const FIELD_TYPE_LABELS_UK: Record<string, string> = {
  'select': 'Список',
  'date': 'Дата',
  'text': 'Текст',
  'radio': 'Вибір',
  'number': 'Число',
  'color': 'Колір',
  'textarea': 'Опис',
  'checkbox': 'Прапорець',
  'month': 'Місяць',
};

// ── Helper ─────────────────────────────────────────────────────────────
export function tLabel(label: string, locale: string): string {
  if (locale !== 'uk') return label;
  return FIELD_LABELS_UK[label.toLowerCase()] ?? label;
}

export function tGroup(group: string, locale: string): string {
  if (locale !== 'uk') return group;
  return GROUP_NAMES_UK[group.toLowerCase()] ?? group;
}

export function tOption(label: string, locale: string): string {
  if (locale !== 'uk') return label;
  return OPTION_LABELS_UK[label.toLowerCase()] ?? label;
}

export function tPlaceholder(text: string, locale: string): string {
  if (locale !== 'uk') return text;

  // "Choose brand" → "Оберіть марка"
  const lower = text.toLowerCase();
  if (lower.startsWith('choose ')) {
    const rest = text.slice(7); // after "Choose "
    const translatedRest = FIELD_LABELS_UK[rest.toLowerCase()] ?? rest;
    return `Оберіть ${translatedRest.toLowerCase()}`;
  }
  if (lower.startsWith('new ')) {
    const rest = text.slice(4);
    const translatedRest = FIELD_LABELS_UK[rest.toLowerCase()] ?? rest;
    return `Нова ${translatedRest.toLowerCase()}...`;
  }

  if (lower === 'year') return 'Рік';
  if (lower === 'month') return 'Місяць';

  // Fallback — try label lookup
  return FIELD_LABELS_UK[lower] ?? text;
}

export function tFieldTypeLabel(type: string, locale: string): string {
  if (locale !== 'uk') return type;
  return FIELD_TYPE_LABELS_UK[type.toLowerCase()] ?? type;
}
