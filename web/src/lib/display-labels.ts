export function getMarketplaceDisplayName(name: string, key?: string): string {
  const normalizedKey = key?.trim().toLowerCase();
  if (normalizedKey === 'autoline') return 'Auto market';
  if (normalizedKey === 'machineryline') return 'Equipment';
  if (normalizedKey === 'agroline') return 'Agro market';

  const normalizedName = name.trim().toLowerCase();
  if (normalizedName === 'autoline') return 'Auto market';
  if (normalizedName === 'machineryline') return 'Equipment';
  if (normalizedName === 'agroline') return 'Agro market';

  return name;
}

export function getCategoryDisplayName(name: string): string {
  return name.replace(/industrial equipment/gi, 'equipment');
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
