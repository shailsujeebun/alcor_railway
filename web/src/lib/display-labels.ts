const MARKETPLACE_NAMES_UK: Record<string, string> = {
  'auto market': 'Авто маркет',
  'equipment': 'Обладнання',
  'agro market': 'Агро маркет',
};

const CATEGORY_NAMES_UK: Record<string, string> = {
  // ── Auto market ──
  'buses': 'Автобуси',
  'city buses': 'Міські автобуси',
  'school buses': 'Шкільні автобуси',
  'tourist buses': 'Туристичні автобуси',
  'cars': 'Легкові авто',
  'convertibles': 'Кабріолети',
  'coupes': 'Купе',
  'electric cars': 'Електромобілі',
  'hatchbacks': 'Хетчбеки',
  'hybrid cars': 'Гібридні авто',
  'minivans': 'Мінівени',
  'pickups': 'Пікапи',
  'sedans': 'Седани',
  'suv': 'Позашляховики',
  'commercial vehicles': 'Комерційний транспорт',
  'light commercial vans': 'Легкі комерційні фургони',
  'refrigerated vans': 'Рефрижераторні фургони',
  'motorcycles': 'Мотоцикли',
  'municipal vehicles': 'Комунальна техніка',
  'semi-trailers': 'Напівпричепи',
  'curtain semi-trailers': 'Тентовані напівпричепи',
  'lowbed semi-trailers': 'Низькорамні напівпричепи',
  'refrigerated semi-trailers': 'Рефрижераторні напівпричепи',
  'tipper semi-trailers': 'Самоскидні напівпричепи',
  'tank transports': 'Автоцистерни',
  'chemical tankers': 'Хімічні цистерни',
  'food tankers': 'Харчові цистерни',
  'fuel tankers': 'Паливні цистерни',
  'tractor units with semi-trailer': 'Тягачі з напівпричепом',
  'trailers': 'Причепи',
  'container trailers': 'Контейнерні причепи',
  'platform trailers': 'Платформні причепи',
  'tipper trailers': 'Самоскидні причепи',
  'trucks': 'Вантажівки',
  'car carriers': 'Автовози',
  'container carriers': 'Контейнеровози',
  'curtain trucks': 'Тентовані вантажівки',
  'dump trucks': 'Самоскиди',
  'flatbed trucks': 'Бортові вантажівки',
  'refrigerated trucks': 'Рефрижераторні вантажівки',
  'timber trucks': 'Лісовози',
  'vans trucks': 'Фургони вантажівки',
  'trucks with trailer': 'Вантажівки з причепом',
  'truck tractors': 'Сідельні тягачі',
  'vans': 'Фургони',
  'campers': 'Кемпери',

  // ── Agro market ──
  'agricultural products': 'Сільгосппродукція',
  'animal husbandry': 'Тваринництво',
  'combine headers': 'Жатки',
  'corn headers': 'Кукурудзяні жатки',
  'grain headers': 'Зернові жатки',
  'sunflower headers': 'Соняшникові жатки',
  'combines': 'Комбайни',
  'beet harvesters': 'Бурякозбиральні комбайни',
  'forage harvesters': 'Кормозбиральні комбайни',
  'grain harvesters': 'Зернозбиральні комбайни',
  'crop growing': 'Рослинництво',
  'farm lands and buildings': 'Земельні ділянки та будівлі',
  'fertilizer application equipment': 'Техніка для внесення добрив',
  'forestry equipment': 'Лісогосподарська техніка',
  'garden machinery': 'Садова техніка',
  'grain processing equipment': 'Зернопереробне обладнання',
  'hay making equipment': 'Сінозбиральна техніка',
  'balers': 'Прес-підбирачі',
  'mowers': 'Косарки',
  'rakes and tedders': 'Граблі та ворушилки',
  'irrigation equipment': 'Зрошувальне обладнання',
  'livestock equipment': 'Тваринницьке обладнання',
  'feeders': 'Годівниці',
  'feed mixers': 'Кормозмішувачі',
  'grain crushers': 'Зернодробарки',
  'other farm equipment': 'Інша сільгосптехніка',
  'planting equipment': 'Посівна техніка',
  'potato equipment': 'Картоплезбиральна техніка',
  'tillage equipment': 'Ґрунтообробна техніка',
  'tractors': 'Трактори',
  'garden tractors': 'Садові трактори',
  'mini tractors': 'Мінітрактори',
  'tracked tractors': 'Гусеничні трактори',
  'wheel tractors': 'Колісні трактори',
  'transportation machinery': 'Транспортна техніка',
  'grain carts': 'Бункери-перевантажувачі',
  'tractor trailers': 'Тракторні причепи',
  'vineyard equipment': 'Техніка для виноградників',

  // ── Equipment / Machinery market ──
  'construction equipment': 'Будівельна техніка',
  'asphalt plants': 'Асфальтні заводи',
  'concrete plants': 'Бетонні заводи',
  'excavators': 'Екскаватори',
  'mini excavators': 'Міні-екскаватори',
  'tracked excavators': 'Гусеничні екскаватори',
  'wheel excavators': 'Колісні екскаватори',
  'material handling equipment': 'Навантажувальна техніка',
  'forklifts': 'Навантажувачі',
  'skid steer loaders': 'Міні-навантажувачі',
  'telehandlers': 'Телескопічні навантажувачі',
  'wheel loaders': 'Фронтальні навантажувачі',
  'industrial equipment': 'Промислове обладнання',
  'mining equipment': 'Гірничодобувна техніка',
  'railway equipment': 'Залізничне обладнання',

  // ── Shared / cross-marketplace ──
  'containers': 'Контейнери',
  'equipment': 'Обладнання',
  'industrial real estate': 'Промислова нерухомість',
  'packaging and containers': 'Упаковка та тара',
  'raw materials': 'Сировина',
  'services': 'Послуги',
  'spare parts': 'Запчастини',
  'tires and wheels': 'Шини та диски',
  'tools': 'Інструменти',
  'air transport': 'Повітряний транспорт',
  'airport equipment': 'Аеропортове обладнання',
  'alternative energy sources': 'Альтернативні джерела енергії',
  'water transport': 'Водний транспорт',
};

export function getMarketplaceDisplayName(name: string, key?: string, locale?: string): string {
  const normalizedKey = key?.trim().toLowerCase();
  let en = name;
  if (normalizedKey === 'autoline') en = 'Auto market';
  else if (normalizedKey === 'machineryline') en = 'Equipment';
  else if (normalizedKey === 'agroline') en = 'Agro market';
  else {
    const normalizedName = name.trim().toLowerCase();
    if (normalizedName === 'autoline') en = 'Auto market';
    else if (normalizedName === 'machineryline') en = 'Equipment';
    else if (normalizedName === 'agroline') en = 'Agro market';
  }

  if (locale === 'uk') {
    return MARKETPLACE_NAMES_UK[en.toLowerCase()] ?? en;
  }
  return en;
}

export function getCategoryDisplayName(name: string, locale?: string): string {
  const en = name.replace(/industrial equipment/gi, 'equipment');
  if (locale === 'uk') {
    return CATEGORY_NAMES_UK[en.trim().toLowerCase()] ?? en;
  }
  return en;
}

export function shouldHideCategory(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  const hiddenKeywords = [
    'animal husbandry',
    'airport equipment',
    'airport',
    'campers',
    'camper',
    'air transport',
    'crop growing',
    'containers',
    'industrial real estate',
    'water transport',
    'spare part',
    'service',
    'tires and wheels',
    'tyres and wheels',
    'tires & wheels',
    'tyres & wheels',
    'alternative energy sources',
    'raw material',
    'tool',
    'mining equipment',
    'equipment',
    'equipments',
    'industrial equipment',
  ];

  return hiddenKeywords.some((keyword) => normalized.includes(keyword));
}

export function dedupeCategoriesByDisplayName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getCategoryDisplayName(item.name).trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function filterVisibleCategoryTree<T extends { name: string; children?: T[] }>(
  items: T[],
): T[] {
  return dedupeCategoriesByDisplayName(
    items
      .filter((item) => !shouldHideCategory(item.name))
      .map((item) => ({
        ...item,
        children: item.children ? filterVisibleCategoryTree(item.children) : item.children,
      })),
  );
}
