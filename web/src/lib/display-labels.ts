export function getMarketplaceDisplayName(name: string, key?: string): string {
  const normalizedKey = key?.trim().toLowerCase();
  if (normalizedKey === 'autoline') return 'automarket';
  if (normalizedKey === 'machineryline') return 'industrial machinery';
  if (normalizedKey === 'agroline') return 'agromarket';

  const normalizedName = name.trim().toLowerCase();
  if (normalizedName === 'autoline') return 'automarket';
  if (normalizedName === 'machineryline') return 'industrial machinery';
  if (normalizedName === 'agroline') return 'agromarket';

  return name;
}

export function getCategoryDisplayName(name: string): string {
  return name.replace(/industrial equipment/gi, 'equipment');
}
