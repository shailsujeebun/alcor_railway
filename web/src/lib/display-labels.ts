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
