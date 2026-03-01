import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

type DemoOption = {
  value: string;
  label: string;
};

type DemoField = {
  key: string;
  label: string;
  type:
  | 'TEXT'
  | 'NUMBER'
  | 'SELECT'
  | 'MULTISELECT'
  | 'BOOLEAN'
  | 'RADIO'
  | 'CHECKBOX_GROUP'
  | 'DATE'
  | 'YEAR_RANGE'
  | 'COLOR'
  | 'LOCATION'
  | 'MEDIA'
  | 'RICHTEXT'
  | 'PRICE';
  required?: boolean;
  section: string;
  validations?: Prisma.InputJsonValue;
  options?: DemoOption[];
};

const focusByMarketplace: Record<string, DemoOption[]> = {
  agriculture: [
    { value: 'crop_production', label: 'Crop production' },
    { value: 'livestock', label: 'Livestock' },
    { value: 'mixed_farm', label: 'Mixed farm' },
    { value: 'contracting', label: 'Contracting services' },
  ],
  industrial: [
    { value: 'earthworks', label: 'Earthworks' },
    { value: 'road_building', label: 'Road construction' },
    { value: 'material_handling', label: 'Material handling' },
    { value: 'demolition', label: 'Demolition projects' },
  ],
  commercial: [
    { value: 'long_haul', label: 'Long-haul logistics' },
    { value: 'regional_delivery', label: 'Regional delivery' },
    { value: 'construction_transport', label: 'Construction transport' },
    { value: 'urban_distribution', label: 'Urban distribution' },
  ],
  cars: [
    { value: 'city_use', label: 'City use' },
    { value: 'family_use', label: 'Family use' },
    { value: 'fleet', label: 'Fleet use' },
    { value: 'premium_private', label: 'Premium private use' },
  ],
};

const driveOptionsByMarketplace: Record<string, DemoOption[]> = {
  agriculture: [
    { value: '4x4', label: '4x4' },
    { value: '2x4', label: '2x4' },
    { value: 'tracked', label: 'Tracked' },
  ],
  industrial: [
    { value: 'tracked', label: 'Tracked' },
    { value: 'wheeled', label: 'Wheeled' },
    { value: 'stabilized', label: 'Stabilized chassis' },
  ],
  commercial: [
    { value: '4x2', label: '4x2' },
    { value: '6x2', label: '6x2' },
    { value: '6x4', label: '6x4' },
    { value: '8x4', label: '8x4' },
  ],
  cars: [
    { value: 'fwd', label: 'Front wheel drive' },
    { value: 'rwd', label: 'Rear wheel drive' },
    { value: 'awd', label: 'All wheel drive' },
  ],
};

const colorPalette: DemoOption[] = [
  { value: '#111827', label: 'Graphite' },
  { value: '#2563EB', label: 'Blue' },
  { value: '#059669', label: 'Green' },
  { value: '#DC2626', label: 'Red' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#E5E7EB', label: 'Silver' },
  { value: '#FFFFFF', label: 'White' },
];

const addonSets: DemoOption[][] = [
  [
    { value: 'gps', label: 'GPS module' },
    { value: 'camera', label: 'Rear camera' },
    { value: 'climate', label: 'Climate package' },
    { value: 'telematics', label: 'Telematics' },
  ],
  [
    { value: 'quick_coupler', label: 'Quick coupler' },
    { value: 'work_lights', label: 'Work lights' },
    { value: 'hammer_line', label: 'Hydraulic hammer line' },
    { value: 'comfort_seat', label: 'Comfort seat' },
  ],
  [
    { value: 'lane_assist', label: 'Lane assist' },
    { value: 'cruise', label: 'Adaptive cruise' },
    { value: 'parking_sensors', label: 'Parking sensors' },
    { value: 'heated_seats', label: 'Heated seats' },
  ],
];

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function dedupeOptions(options: DemoOption[]): DemoOption[] {
  const seen = new Set<string>();
  const deduped: DemoOption[] = [];

  for (const option of options) {
    if (!option.value || seen.has(option.value)) continue;
    seen.add(option.value);
    deduped.push(option);
  }

  return deduped;
}

function categoryDerivedOptions(categoryName: string): DemoOption[] {
  const parts = categoryName
    .split(/[\s/(),-]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 2)
    .slice(0, 4);

  if (parts.length === 0) {
    return dedupeOptions([
      { value: 'standard', label: 'Standard package' },
      { value: 'extended', label: 'Extended package' },
      { value: 'custom', label: 'Custom package' },
    ]);
  }

  const derived = parts.map((part) => ({
    value: normalizeKey(part),
    label: `${part} package`,
  }));

  const deduped = dedupeOptions(derived);
  if (deduped.length > 0) return deduped;

  return [
    { value: 'standard', label: 'Standard package' },
    { value: 'extended', label: 'Extended package' },
  ];
}

function buildFields(params: {
  categoryName: string;
  marketplaceKey: string;
  index: number;
}): DemoField[] {
  const { categoryName, marketplaceKey, index } = params;

  // Base fields shown for ALL categories
  const baseFields: DemoField[] = [
    {
      key: 'price_amount',
      label: 'Price',
      type: 'NUMBER',
      required: true,
      section: 'Ad parameters',
    },
    {
      key: 'price_currency',
      label: 'Currency',
      type: 'SELECT',
      section: 'Ad parameters',
      options: [
        { value: 'USD', label: '$ - USD' },
        { value: 'EUR', label: '€ - EUR' },
        { value: 'UAH', label: '₴ - UAH' },
      ],
    },
    {
      key: 'vat_mode',
      label: 'VAT Mode',
      type: 'RADIO',
      section: 'Ad parameters',
      options: [
        { value: 'excluding', label: 'excluding VAT' },
        { value: 'including', label: 'including VAT' },
      ],
    },
    {
      key: 'condition',
      label: 'Condition',
      type: 'RADIO',
      required: true,
      section: 'Basic characteristics',
      options: [
        { value: 'new', label: 'New' },
        { value: 'used', label: 'Used' },
        { value: 'defect', label: 'With defect' },
        { value: 'remanufactured', label: 'Remanufactured' },
        { value: 'parts', label: 'For parts' },
      ],
    },
    {
      key: 'color',
      label: 'Colour',
      type: 'COLOR',
      section: 'Basic characteristics',
      options: colorPalette, // Assumes colorPalette exists (from previous lines)
    },
  ];

  // Engine & Gearbox fields (conditional logic applied at UI rendering time based on category.hasEngine, 
  // but we add them to the template now and set visibility_if rule)

  const engineFields: DemoField[] = [
    {
      key: 'fuel_type',
      label: 'Fuel type',
      type: 'SELECT',
      section: 'Engine & Gearbox',
      validations: { hint: 'Specify the fuel type used' },
      options: [
        { value: 'petrol', label: 'Petrol' },
        { value: 'diesel', label: 'Diesel' },
        { value: 'electric', label: 'Electric' },
        { value: 'hybrid', label: 'Hybrid' },
      ],
    },
    {
      key: 'power',
      label: 'Power',
      type: 'NUMBER',
      section: 'Engine & Gearbox',
      validations: { unit: 'HP' },
    },
    {
      key: 'engine_volume',
      label: 'Engine volume',
      type: 'NUMBER',
      section: 'Engine & Gearbox',
      validations: { unit: 'cm³' },
    },
    {
      key: 'gearbox_type',
      label: 'Gearbox type',
      type: 'SELECT',
      section: 'Engine & Gearbox',
      options: [
        { value: 'manual', label: 'Manual' },
        { value: 'automatic', label: 'Automatic' },
        { value: 'semi-auto', label: 'Semi-automatic' },
      ],
    },
    {
      key: 'drive_type',
      label: 'Drive type',
      type: 'RADIO',
      section: 'Engine & Gearbox',
      options: [
        { value: 'fwd', label: 'FWD' },
        { value: 'rwd', label: 'RWD' },
        { value: 'awd', label: 'AWD' },
      ],
    },
  ];

  // Additional options blocks

  const comfortOptions: DemoField[] = [
    {
      key: 'cabin_comfort',
      label: 'Cabin and comfort',
      type: 'CHECKBOX_GROUP',
      section: 'Additional options',
      options: [
        { value: 'board_computer', label: 'Board computer' },
        { value: 'keyless', label: 'Keyless entry' },
        { value: 'start_stop', label: 'Start-stop' },
        { value: 'cruise', label: 'Cruise control' },
        { value: 'adaptive_cruise', label: 'Adaptive cruise' },
        { value: 'heated_steering', label: 'Heated steering wheel' },
        { value: 'rain_sensor', label: 'Rain sensor' },
        { value: 'panoramic_roof', label: 'Panoramic roof' },
      ],
    }
  ];

  const safetyOptions: DemoField[] = [
    {
      key: 'safety_features',
      label: 'Safety features',
      type: 'CHECKBOX_GROUP',
      section: 'Additional options',
      options: [
        { value: 'airbag', label: 'Airbag' },
        { value: 'lane_departure', label: 'Lane departure warning' },
        { value: 'alarm', label: 'Alarm system' },
        { value: 'immobiliser', label: 'Immobiliser' },
        { value: 'isofix', label: 'Isofix' },
        { value: 'abs', label: 'ABS' },
        { value: 'esp', label: 'ESP' },
      ],
    }
  ];

  return [...baseFields, ...engineFields, ...comfortOptions, ...safetyOptions];
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Generating demo templates for every leaf subcategory...');

    const leafCategories = await prisma.category.findMany({
      where: {
        children: {
          none: {},
        },
      },
      include: {
        marketplace: true,
        parent: true,
      },
      orderBy: [{ marketplaceId: 'asc' }, { name: 'asc' }],
    });

    if (leafCategories.length === 0) {
      console.warn('No leaf categories found. Seed categories first.');
      return;
    }

    let createdCount = 0;
    let fieldCount = 0;

    for (const [index, category] of leafCategories.entries()) {
      const fields = buildFields({
        categoryName: category.name,
        marketplaceKey: category.marketplace.key,
        index,
      });

      await prisma.formTemplate.deleteMany({
        where: { categoryId: category.id },
      });

      const template = await prisma.formTemplate.create({
        data: {
          categoryId: category.id,
          version: 1,
          isActive: true,
          fields: {
            create: fields.map((field, sortOrder) => ({
              fieldKey: field.key,
              label: field.label,
              fieldType: field.type,
              required: field.required ?? false,
              sortOrder,
              section: field.section,
              validations: field.validations ?? {},
              options: field.options
                ? {
                  create: field.options.map((option, optionSort) => ({
                    value: option.value,
                    label: option.label,
                    sortOrder: optionSort,
                  })),
                }
                : undefined,
            })),
          },
        },
      });

      createdCount += 1;
      fieldCount += fields.length;

      console.log(
        `Template created: ${category.marketplace.name} / ${category.parent?.name ?? '-'} / ${category.name} (template ${template.id.toString()})`,
      );
    }

    console.log(
      `Done. Created ${createdCount} templates with ${fieldCount} total fields across all leaf subcategories.`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Demo template seeding failed:', error);
  process.exit(1);
});
