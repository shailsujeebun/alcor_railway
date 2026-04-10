import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { daysAgo, daysFromNow, type SeedCatalog, type SeedGeo, type SeedPlans, type SeedUsers } from './shared';
import { DEFAULT_MOTORIZED_BLOCK_FIELDS } from '../../src/templates/template-schema';

type CategorySeedNode = {
  slug: string;
  name: string;
  hasEngine?: boolean;
  children?: CategorySeedNode[];
};

type TemplateFieldSeed = {
  fieldKey: string;
  label: string;
  fieldType: string;
  required?: boolean;
  sortOrder: number;
  section: string;
  validations?: Prisma.InputJsonValue;
  options?: Array<{
    value: string;
    label: string;
    sortOrder: number;
  }>;
};

const MARKETPLACE_DEFINITIONS = [
  { key: 'agroline', name: 'Agroline', isActive: true },
  { key: 'autoline', name: 'Autoline', isActive: true },
  { key: 'machineryline', name: 'Machineryline', isActive: true },
  { key: 'agriculture', name: 'Agriculture (legacy)', isActive: false },
  { key: 'commercial', name: 'Commercial transport (legacy)', isActive: false },
  { key: 'industrial', name: 'Industrial equipment (legacy)', isActive: false },
  { key: 'cars', name: 'Passenger cars (legacy)', isActive: false },
] as const;

const AGROLINE_TREE: CategorySeedNode[] = [
  {
    slug: 'tractors',
    name: 'Tractors',
    children: [
      { slug: 'wheel-tractors', name: 'Wheel tractors' },
      { slug: 'tracked-tractors', name: 'Tracked tractors' },
      { slug: 'mini-tractors', name: 'Mini tractors' },
      { slug: 'garden-tractors', name: 'Garden tractors' },
    ],
  },
  {
    slug: 'combines',
    name: 'Combines',
    children: [
      { slug: 'grain-harvesters', name: 'Grain harvesters' },
      { slug: 'forage-harvesters', name: 'Forage harvesters' },
      { slug: 'beet-harvesters', name: 'Beet harvesters' },
    ],
  },
  {
    slug: 'combine-headers',
    name: 'Combine headers',
    hasEngine: false,
    children: [
      { slug: 'grain-headers', name: 'Grain headers' },
      { slug: 'corn-headers', name: 'Corn headers' },
      { slug: 'sunflower-headers', name: 'Sunflower headers' },
    ],
  },
  { slug: 'tillage-equipment', name: 'Tillage equipment' },
  { slug: 'planting-equipment', name: 'Planting equipment' },
  { slug: 'irrigation-equipment', name: 'Irrigation equipment' },
  { slug: 'fertilizer-application-equipment', name: 'Fertilizer application equipment' },
  { slug: 'grain-processing-equipment', name: 'Grain processing equipment' },
  {
    slug: 'hay-making-equipment',
    name: 'Hay making equipment',
    children: [
      { slug: 'mowers', name: 'Mowers' },
      { slug: 'balers', name: 'Balers' },
      { slug: 'rakes-tedders', name: 'Rakes and tedders' },
    ],
  },
  {
    slug: 'livestock-equipment',
    name: 'Livestock equipment',
    children: [
      { slug: 'feed-mixers', name: 'Feed mixers' },
      { slug: 'grain-crushers', name: 'Grain crushers' },
      { slug: 'feeders', name: 'Feeders' },
    ],
  },
  { slug: 'forestry-equipment', name: 'Forestry equipment' },
  { slug: 'garden-machinery', name: 'Garden machinery' },
  { slug: 'vineyard-equipment', name: 'Vineyard equipment' },
  { slug: 'potato-equipment', name: 'Potato equipment' },
  { slug: 'crop-growing', name: 'Crop growing' },
  { slug: 'animal-husbandry', name: 'Animal husbandry' },
  { slug: 'agricultural-products', name: 'Agricultural products' },
  { slug: 'packaging-and-containers', name: 'Packaging and containers' },
  { slug: 'other-farm-equipment', name: 'Other farm equipment' },
  { slug: 'agroline-spare-parts', name: 'Spare parts', hasEngine: false },
  { slug: 'agroline-equipment', name: 'Equipment', hasEngine: false },
  { slug: 'agroline-tires-and-wheels', name: 'Tires and wheels', hasEngine: false },
  { slug: 'agroline-services', name: 'Services', hasEngine: false },
];

const AUTOLINE_TREE: CategorySeedNode[] = [
  {
    slug: 'trucks',
    name: 'Trucks',
    children: [
      { slug: 'flatbed-trucks', name: 'Flatbed trucks' },
      { slug: 'curtain-trucks', name: 'Curtain trucks' },
      { slug: 'vans-trucks', name: 'Vans trucks' },
      { slug: 'refrigerated-trucks', name: 'Refrigerated trucks' },
      { slug: 'dump-trucks', name: 'Dump trucks' },
      { slug: 'car-carriers', name: 'Car carriers' },
      { slug: 'container-carriers', name: 'Container carriers' },
      { slug: 'timber-trucks', name: 'Timber trucks' },
    ],
  },
  { slug: 'trucks-with-trailer', name: 'Trucks with trailer' },
  { slug: 'truck-tractors', name: 'Truck tractors' },
  { slug: 'tractor-units-with-semi-trailer', name: 'Tractor units with semi-trailer' },
  {
    slug: 'commercial-vehicles',
    name: 'Commercial vehicles',
    children: [
      { slug: 'light-commercial-vans', name: 'Light commercial vans' },
      { slug: 'refrigerated-vans', name: 'Refrigerated vans' },
    ],
  },
  { slug: 'vans', name: 'Vans' },
  {
    slug: 'semi-trailers',
    name: 'Semi-trailers',
    children: [
      { slug: 'curtain-semi-trailers', name: 'Curtain semi-trailers' },
      { slug: 'refrigerated-semi-trailers', name: 'Refrigerated semi-trailers' },
      { slug: 'tipper-semi-trailers', name: 'Tipper semi-trailers' },
      { slug: 'lowbed-semi-trailers', name: 'Lowbed semi-trailers' },
    ],
  },
  {
    slug: 'trailers',
    name: 'Trailers',
    children: [
      { slug: 'tipper-trailers', name: 'Tipper trailers' },
      { slug: 'platform-trailers', name: 'Platform trailers' },
      { slug: 'container-trailers', name: 'Container trailers' },
    ],
  },
  {
    slug: 'tank-transports',
    name: 'Tank transports',
    children: [
      { slug: 'fuel-tankers', name: 'Fuel tankers' },
      { slug: 'food-tankers', name: 'Food tankers' },
      { slug: 'chemical-tankers', name: 'Chemical tankers' },
    ],
  },
  {
    slug: 'buses',
    name: 'Buses',
    children: [
      { slug: 'city-buses', name: 'City buses' },
      { slug: 'tourist-buses', name: 'Tourist buses' },
      { slug: 'school-buses', name: 'School buses' },
    ],
  },
  { slug: 'municipal-vehicles', name: 'Municipal vehicles' },
  { slug: 'airport-equipment', name: 'Airport equipment' },
  { slug: 'railway-equipment', name: 'Railway equipment' },
  { slug: 'containers', name: 'Containers' },
  {
    slug: 'transportation-machinery',
    name: 'Transportation machinery',
    children: [
      { slug: 'tractor-trailers', name: 'Tractor trailers' },
      { slug: 'grain-carts', name: 'Grain carts' },
    ],
  },
  {
    slug: 'cars',
    name: 'Cars',
    children: [
      { slug: 'sedans', name: 'Sedans' },
      { slug: 'hatchbacks', name: 'Hatchbacks' },
      { slug: 'suv', name: 'SUV' },
      { slug: 'coupes', name: 'Coupes' },
      { slug: 'convertibles', name: 'Convertibles' },
      { slug: 'pickups', name: 'Pickups' },
      { slug: 'minivans', name: 'Minivans' },
      { slug: 'electric-cars', name: 'Electric cars' },
      { slug: 'hybrid-cars', name: 'Hybrid cars' },
    ],
  },
  { slug: 'campers', name: 'Campers' },
  { slug: 'motorcycles', name: 'Motorcycles' },
  { slug: 'water-transport', name: 'Water transport' },
  { slug: 'air-transport', name: 'Air transport' },
  { slug: 'autoline-equipment', name: 'Equipment', hasEngine: false },
  { slug: 'autoline-tires-and-wheels', name: 'Tires and wheels', hasEngine: false },
  { slug: 'autoline-spare-parts', name: 'Spare parts', hasEngine: false },
  { slug: 'autoline-services', name: 'Services', hasEngine: false },
];

const MACHINERYLINE_TREE: CategorySeedNode[] = [
  {
    slug: 'construction-equipment',
    name: 'Construction equipment',
    children: [
      { slug: 'excavators', name: 'Excavators' },
      { slug: 'mini-excavators', name: 'Mini excavators' },
      { slug: 'tracked-excavators', name: 'Tracked excavators' },
      { slug: 'wheel-excavators', name: 'Wheel excavators' },
      { slug: 'concrete-plants', name: 'Concrete plants' },
      { slug: 'asphalt-plants', name: 'Asphalt plants' },
    ],
  },
  {
    slug: 'material-handling-equipment',
    name: 'Material handling equipment',
    children: [
      { slug: 'wheel-loaders', name: 'Wheel loaders' },
      { slug: 'telehandlers', name: 'Telehandlers' },
      { slug: 'skid-steer-loaders', name: 'Skid steer loaders' },
      { slug: 'forklifts', name: 'Forklifts' },
    ],
  },
  { slug: 'industrial-equipment', name: 'Industrial equipment' },
  { slug: 'mining-equipment', name: 'Mining equipment' },
  { slug: 'machineryline-equipment', name: 'Equipment', hasEngine: false },
  { slug: 'alternative-energy-sources', name: 'Alternative energy sources' },
  { slug: 'tools', name: 'Tools' },
  { slug: 'raw-materials', name: 'Raw materials' },
  { slug: 'industrial-real-estate', name: 'Industrial real estate' },
  { slug: 'machineryline-tires-and-wheels', name: 'Tires and wheels', hasEngine: false },
  { slug: 'machineryline-spare-parts', name: 'Spare parts', hasEngine: false },
  { slug: 'machineryline-services', name: 'Services', hasEngine: false },
];

const MARKETPLACE_TAXONOMY = [
  AGROLINE_TREE,
  AUTOLINE_TREE,
  MACHINERYLINE_TREE,
] as const;

const AGRO_WORKBOOK_BRANDS = [
  'John Deere',
  'Case IH',
  'New Holland',
  'Claas',
  'Massey Ferguson',
  'Fendt',
  'Deutz-Fahr',
  'Kubota',
  'Valtra',
  'SAME',
  'Steyr',
  'Zetor',
  'Versatile',
  'Lovol',
  'Mahindra',
  'Ростсельмаш',
  'Horsch',
  'Vaderstad',
  'Amazone',
  'Lemken',
  'Kuhn',
  'Great Plains',
  'Kverneland',
  'Bednar',
  'Pottinger',
  'Gaspardo',
  'Berthoud',
  'Hardi',
  'Krone',
  'Херсонський машинобудівний завод',
  'Уманьферммаш',
  'Лозівські машини',
  'Ельворті',
  'Богуславська с/г техніка',
  'БілоцерківМАЗ',
  'Оріхівсільмаш',
  'Восход',
  'JCB',
  'Manitou',
  'Dieci',
  'Merlo',
  'Weidemann',
  'Schaffer',
  'YTO',
  'Zoomlion',
  'Dongfeng',
  'Foton',
  'ArmaTrac',
  'Basak',
  'Deutz',
  'Yanmar',
  'Perkins',
  'Cummins',
] as const;

const NON_AGRO_BRANDS = [
  'Caterpillar',
  'Komatsu',
  'MAN',
  'Mercedes-Benz',
  'Toyota',
  'BMW',
] as const;

function collectLeafSlugs(nodes: readonly CategorySeedNode[]): string[] {
  const leaves: string[] = [];
  for (const node of nodes) {
    if (!node.children || node.children.length === 0) {
      leaves.push(node.slug);
      continue;
    }
    leaves.push(...collectLeafSlugs(node.children));
  }
  return leaves;
}

const ALL_LEAF_CATEGORY_SLUGS = MARKETPLACE_TAXONOMY.flatMap((tree) =>
  collectLeafSlugs(tree),
);

const COMBINE_HEADER_TEMPLATE_TARGET_SLUGS = [
  'combine-headers',
  'combines',
  ...ALL_LEAF_CATEGORY_SLUGS,
];

const COMBINE_HEADER_TEMPLATE_SLUGS = new Set([
  'combine-headers',
  'grain-headers',
  'corn-headers',
  'sunflower-headers',
]);

const GARDEN_MACHINERY_TEMPLATE_SLUGS = new Set(['garden-machinery']);
const COMBINES_TEMPLATE_SLUGS = new Set([
  'combines',
  'grain-harvesters',
  'forage-harvesters',
  'beet-harvesters',
]);

const TEMPLATE_MONTH_OPTIONS = [
  { value: '01', label: 'January', sortOrder: 1 },
  { value: '02', label: 'February', sortOrder: 2 },
  { value: '03', label: 'March', sortOrder: 3 },
  { value: '04', label: 'April', sortOrder: 4 },
  { value: '05', label: 'May', sortOrder: 5 },
  { value: '06', label: 'June', sortOrder: 6 },
  { value: '07', label: 'July', sortOrder: 7 },
  { value: '08', label: 'August', sortOrder: 8 },
  { value: '09', label: 'September', sortOrder: 9 },
  { value: '10', label: 'October', sortOrder: 10 },
  { value: '11', label: 'November', sortOrder: 11 },
  { value: '12', label: 'December', sortOrder: 12 },
];

function createYearOptions() {
  const currentYear = new Date().getUTCFullYear();
  return Array.from({ length: 80 }, (_, index) => {
    const year = currentYear - index;
    return {
      value: String(year),
      label: String(year),
      sortOrder: index + 1,
    };
  });
}

const TEMPLATE_YEAR_OPTIONS = createYearOptions();

const COMBINE_HEADER_TEMPLATE_FIELDS: TemplateFieldSeed[] = [
  { fieldKey: 'brand', label: 'Brand', fieldType: 'SELECT', required: true, sortOrder: 10, section: 'Basic characteristics' },
  { fieldKey: 'model', label: 'Model', fieldType: 'SELECT', sortOrder: 20, section: 'Basic characteristics' },
  { fieldKey: 'year_of_manufacture_year', label: 'Year of manufacture (year)', fieldType: 'SELECT', sortOrder: 30, section: 'Basic characteristics', options: TEMPLATE_YEAR_OPTIONS },
  { fieldKey: 'year_of_manufacture_month', label: 'Year of manufacture (month)', fieldType: 'SELECT', sortOrder: 40, section: 'Basic characteristics', options: TEMPLATE_MONTH_OPTIONS },
  { fieldKey: 'first_registration_year', label: 'First registration (year)', fieldType: 'SELECT', sortOrder: 50, section: 'Basic characteristics', options: TEMPLATE_YEAR_OPTIONS },
  { fieldKey: 'first_registration_month', label: 'First registration (month)', fieldType: 'SELECT', sortOrder: 60, section: 'Basic characteristics', options: TEMPLATE_MONTH_OPTIONS },
  { fieldKey: 'vin', label: 'VIN', fieldType: 'TEXT', sortOrder: 70, section: 'Basic characteristics', validations: { minLength: 17, maxLength: 17 } as Prisma.InputJsonValue },
  {
    fieldKey: 'condition',
    label: 'Condition',
    fieldType: 'RADIO',
    required: true,
    sortOrder: 80,
    section: 'Basic characteristics',
    options: [
      { value: 'NEW', label: 'New', sortOrder: 1 },
      { value: 'USED', label: 'Used', sortOrder: 2 },
      { value: 'WITH_DEFECT', label: 'With a defect', sortOrder: 3 },
      { value: 'REMANUFACTURED', label: 'Remanufactured', sortOrder: 4 },
      { value: 'CRASHED', label: 'Crashed', sortOrder: 5 },
      { value: 'DEMO', label: 'Demonstration', sortOrder: 6 },
      { value: 'FOR_PARTS', label: 'For parts', sortOrder: 7 },
    ],
  },
  { fieldKey: 'running_hours', label: 'Running hours', fieldType: 'NUMBER', sortOrder: 90, section: 'Basic characteristics', validations: { min: 0, max: 200000, unit: 'm/h' } as Prisma.InputJsonValue },
  {
    fieldKey: 'colour',
    label: 'Colour',
    fieldType: 'COLOR',
    sortOrder: 100,
    section: 'Basic characteristics',
    options: [
      { value: '#FFFFFF', label: 'White', sortOrder: 1 },
      { value: '#F5F5DC', label: 'Beige', sortOrder: 2 },
      { value: '#D1D5DB', label: 'Light grey', sortOrder: 3 },
      { value: '#9CA3AF', label: 'Grey', sortOrder: 4 },
      { value: '#A16207', label: 'Brown', sortOrder: 5 },
      { value: '#F97316', label: 'Orange', sortOrder: 6 },
      { value: '#FACC15', label: 'Yellow', sortOrder: 7 },
      { value: '#FFEA00', label: 'Bright yellow', sortOrder: 8 },
      { value: '#15803D', label: 'Green', sortOrder: 9 },
      { value: '#38CFCF', label: 'Turquoise', sortOrder: 10 },
      { value: '#0EA5E9', label: 'Sky blue', sortOrder: 11 },
      { value: '#1D4ED8', label: 'Blue', sortOrder: 12 },
      { value: '#C084FC', label: 'Purple', sortOrder: 13 },
      { value: '#7C3AED', label: 'Violet', sortOrder: 14 },
      { value: '#B91C1C', label: 'Dark red', sortOrder: 15 },
      { value: '#FF0000', label: 'Red', sortOrder: 16 },
      { value: '#57534E', label: 'Olive', sortOrder: 17 },
      { value: '#1F2937', label: 'Black', sortOrder: 18 },
    ],
  },
  { fieldKey: 'working_width', label: 'Working width', fieldType: 'NUMBER', sortOrder: 110, section: 'Basic characteristics', validations: { min: 0, max: 50, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'mowing_height', label: 'Mowing height', fieldType: 'NUMBER', sortOrder: 120, section: 'Basic characteristics', validations: { min: 0, max: 5000, unit: 'mm' } as Prisma.InputJsonValue },
  { fieldKey: 'number_of_rows', label: 'Number of rows', fieldType: 'NUMBER', sortOrder: 130, section: 'Basic characteristics', validations: { min: 0, max: 64 } as Prisma.InputJsonValue },
  { fieldKey: 'row_spacing', label: 'Row spacing', fieldType: 'NUMBER', sortOrder: 140, section: 'Basic characteristics', validations: { min: 0, max: 5000, unit: 'mm' } as Prisma.InputJsonValue },
  { fieldKey: 'capacity_tph', label: 'Capacity (t/h)', fieldType: 'NUMBER', sortOrder: 150, section: 'Basic characteristics', validations: { min: 0, max: 500 } as Prisma.InputJsonValue },
  { fieldKey: 'capacity_ha_hour', label: 'Capacity (ha/hour)', fieldType: 'NUMBER', sortOrder: 160, section: 'Basic characteristics', validations: { min: 0, max: 500 } as Prisma.InputJsonValue },
  { fieldKey: 'operating_speed', label: 'Operating speed', fieldType: 'NUMBER', sortOrder: 170, section: 'Basic characteristics', validations: { min: 0, max: 120, unit: 'km/h' } as Prisma.InputJsonValue },
  { fieldKey: 'combine_header_trailer', label: 'Combine header trailer', fieldType: 'BOOLEAN', sortOrder: 180, section: 'Basic characteristics' },
  { fieldKey: 'vehicle_mark', label: 'Vehicle mark', fieldType: 'TEXT', sortOrder: 190, section: 'Basic characteristics' },
  { fieldKey: 'vehicle_model', label: 'Vehicle model', fieldType: 'TEXT', sortOrder: 200, section: 'Basic characteristics' },
  { fieldKey: 'overall_length', label: 'Overall dimensions length', fieldType: 'NUMBER', sortOrder: 210, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'overall_width', label: 'Overall dimensions width', fieldType: 'NUMBER', sortOrder: 220, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'overall_height', label: 'Overall dimensions height', fieldType: 'NUMBER', sortOrder: 230, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'transport_length', label: 'Transport dimensions length', fieldType: 'NUMBER', sortOrder: 240, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'transport_width', label: 'Transport dimensions width', fieldType: 'NUMBER', sortOrder: 250, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'transport_height', label: 'Transport dimensions height', fieldType: 'NUMBER', sortOrder: 260, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'net_weight', label: 'Net weight', fieldType: 'NUMBER', sortOrder: 270, section: 'Basic characteristics', validations: { min: 0, max: 200000, unit: 'kg' } as Prisma.InputJsonValue },
  {
    fieldKey: 'more_details',
    label: 'Description',
    fieldType: 'RICHTEXT',
    sortOrder: 300,
    section: 'More details',
    validations: {
      placeholder:
        'Indicate additional characteristics or special features of your combine header.',
    } as Prisma.InputJsonValue,
  },
  {
    fieldKey: 'advert_type',
    label: 'Advert type',
    fieldType: 'RADIO',
    sortOrder: 400,
    section: 'Ad parameters',
    options: [
      { value: 'SALE', label: 'Sale', sortOrder: 1 },
      { value: 'RENT', label: 'Rent', sortOrder: 2 },
      { value: 'SALE_RENT', label: 'Sale / Rent', sortOrder: 3 },
    ],
  },
  { fieldKey: 'price', label: 'Price', fieldType: 'NUMBER', sortOrder: 410, section: 'Ad parameters', validations: { min: 0, max: 1000000000 } as Prisma.InputJsonValue },
  {
    fieldKey: 'currency',
    label: 'Currency',
    fieldType: 'SELECT',
    sortOrder: 420,
    section: 'Ad parameters',
    options: [
      { value: 'EUR', label: 'EUR', sortOrder: 1 },
      { value: 'USD', label: 'USD', sortOrder: 2 },
      { value: 'GBP', label: 'GBP', sortOrder: 3 },
      { value: 'UAH', label: 'UAH', sortOrder: 4 },
    ],
  },
  {
    fieldKey: 'vat_type',
    label: 'VAT',
    fieldType: 'RADIO',
    sortOrder: 430,
    section: 'Ad parameters',
    options: [
      { value: 'EXCLUDING', label: 'excluding VAT', sortOrder: 1 },
      { value: 'INCLUDING', label: 'including VAT', sortOrder: 2 },
    ],
  },
  { fieldKey: 'reserved', label: 'Reserved', fieldType: 'BOOLEAN', sortOrder: 440, section: 'Ad parameters' },
  { fieldKey: 'leasing_possible', label: 'Leasing is possible', fieldType: 'BOOLEAN', sortOrder: 450, section: 'Ad parameters' },
  { fieldKey: 'purchase_on_credit_possible', label: 'Purchase on credit is possible', fieldType: 'BOOLEAN', sortOrder: 460, section: 'Ad parameters' },
  { fieldKey: 'purchase_by_installments_possible', label: 'Purchase by installments is possible', fieldType: 'BOOLEAN', sortOrder: 470, section: 'Ad parameters' },
  {
    fieldKey: 'warranty',
    label: 'Warranty',
    fieldType: 'SELECT',
    sortOrder: 480,
    section: 'Ad parameters',
    options: [
      { value: 'NONE', label: 'No warranty', sortOrder: 1 },
      { value: '3_MONTHS', label: '3 months', sortOrder: 2 },
      { value: '6_MONTHS', label: '6 months', sortOrder: 3 },
      { value: '12_MONTHS', label: '12 months', sortOrder: 4 },
      { value: '24_MONTHS', label: '24 months', sortOrder: 5 },
    ],
  },
  { fieldKey: 'seller_stock_id', label: 'Seller stock ID', fieldType: 'TEXT', sortOrder: 490, section: 'Ad parameters' },
];

const GARDEN_MACHINERY_TEMPLATE_FIELDS: TemplateFieldSeed[] = [
  { fieldKey: 'brand', label: 'Brand', fieldType: 'SELECT', required: true, sortOrder: 10, section: 'Basic characteristics' },
  { fieldKey: 'model', label: 'Model', fieldType: 'SELECT', sortOrder: 20, section: 'Basic characteristics' },
  { fieldKey: 'year_of_manufacture_year', label: 'Year of manufacture (year)', fieldType: 'SELECT', sortOrder: 30, section: 'Basic characteristics', options: TEMPLATE_YEAR_OPTIONS },
  { fieldKey: 'year_of_manufacture_month', label: 'Year of manufacture (month)', fieldType: 'SELECT', sortOrder: 40, section: 'Basic characteristics', options: TEMPLATE_MONTH_OPTIONS },
  { fieldKey: 'first_registration_year', label: 'First registration (year)', fieldType: 'SELECT', sortOrder: 50, section: 'Basic characteristics', options: TEMPLATE_YEAR_OPTIONS },
  { fieldKey: 'first_registration_month', label: 'First registration (month)', fieldType: 'SELECT', sortOrder: 60, section: 'Basic characteristics', options: TEMPLATE_MONTH_OPTIONS },
  {
    fieldKey: 'condition',
    label: 'Condition',
    fieldType: 'RADIO',
    required: true,
    sortOrder: 70,
    section: 'Basic characteristics',
    options: [
      { value: 'NEW', label: 'New', sortOrder: 1 },
      { value: 'USED', label: 'Used', sortOrder: 2 },
      { value: 'WITH_DEFECT', label: 'With a defect', sortOrder: 3 },
      { value: 'REMANUFACTURED', label: 'Remanufactured', sortOrder: 4 },
      { value: 'CRASHED', label: 'Crashed', sortOrder: 5 },
      { value: 'DEMO', label: 'Demonstration', sortOrder: 6 },
      { value: 'FOR_PARTS', label: 'For parts', sortOrder: 7 },
    ],
  },
  {
    fieldKey: 'colour',
    label: 'Colour',
    fieldType: 'COLOR',
    sortOrder: 80,
    section: 'Basic characteristics',
    options: [
      { value: '#FFFFFF', label: 'White', sortOrder: 1 },
      { value: '#F5F5DC', label: 'Beige', sortOrder: 2 },
      { value: '#D1D5DB', label: 'Light grey', sortOrder: 3 },
      { value: '#9CA3AF', label: 'Grey', sortOrder: 4 },
      { value: '#A16207', label: 'Brown', sortOrder: 5 },
      { value: '#F97316', label: 'Orange', sortOrder: 6 },
      { value: '#FACC15', label: 'Yellow', sortOrder: 7 },
      { value: '#FFEA00', label: 'Bright yellow', sortOrder: 8 },
      { value: '#15803D', label: 'Green', sortOrder: 9 },
      { value: '#38CFCF', label: 'Turquoise', sortOrder: 10 },
      { value: '#0EA5E9', label: 'Sky blue', sortOrder: 11 },
      { value: '#1D4ED8', label: 'Blue', sortOrder: 12 },
      { value: '#C084FC', label: 'Purple', sortOrder: 13 },
      { value: '#7C3AED', label: 'Violet', sortOrder: 14 },
      { value: '#B91C1C', label: 'Dark red', sortOrder: 15 },
      { value: '#FF0000', label: 'Red', sortOrder: 16 },
      { value: '#57534E', label: 'Olive', sortOrder: 17 },
      { value: '#1F2937', label: 'Black', sortOrder: 18 },
    ],
  },
  { fieldKey: 'running_hours', label: 'Running hours', fieldType: 'NUMBER', sortOrder: 90, section: 'Basic characteristics', validations: { min: 0, max: 200000, unit: 'm/h' } as Prisma.InputJsonValue },
  { fieldKey: 'working_width', label: 'Working width', fieldType: 'NUMBER', sortOrder: 100, section: 'Basic characteristics', validations: { min: 0, max: 20000, unit: 'mm' } as Prisma.InputJsonValue },
  { fieldKey: 'current_frequency', label: 'Current frequency', fieldType: 'NUMBER', sortOrder: 110, section: 'Basic characteristics', validations: { min: 0, max: 1000, unit: 'Hz' } as Prisma.InputJsonValue },
  {
    fieldKey: 'voltage',
    label: 'Voltage',
    fieldType: 'SELECT',
    sortOrder: 120,
    section: 'Basic characteristics',
    options: [
      { value: '12V', label: '12 V', sortOrder: 1 },
      { value: '24V', label: '24 V', sortOrder: 2 },
      { value: '48V', label: '48 V', sortOrder: 3 },
      { value: '110V', label: '110 V', sortOrder: 4 },
      { value: '220V', label: '220 V', sortOrder: 5 },
      { value: '230V', label: '230 V', sortOrder: 6 },
      { value: '380V', label: '380 V', sortOrder: 7 },
      { value: '400V', label: '400 V', sortOrder: 8 },
    ],
  },
  { fieldKey: 'overall_length', label: 'Overall dimensions length', fieldType: 'NUMBER', sortOrder: 130, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'overall_width', label: 'Overall dimensions width', fieldType: 'NUMBER', sortOrder: 140, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'overall_height', label: 'Overall dimensions height', fieldType: 'NUMBER', sortOrder: 150, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'net_weight', label: 'Net weight', fieldType: 'NUMBER', sortOrder: 160, section: 'Basic characteristics', validations: { min: 0, max: 200000, unit: 'kg' } as Prisma.InputJsonValue },
  { fieldKey: 'power', label: 'Power', fieldType: 'NUMBER', sortOrder: 200, section: 'Engine, gearbox', validations: { min: 0, max: 10000 } as Prisma.InputJsonValue },
  {
    fieldKey: 'power_unit',
    label: 'Power unit',
    fieldType: 'RADIO',
    sortOrder: 210,
    section: 'Engine, gearbox',
    options: [
      { value: 'HP', label: 'HP', sortOrder: 1 },
      { value: 'KW', label: 'kW', sortOrder: 2 },
    ],
  },
  {
    fieldKey: 'battery_brand',
    label: 'Battery brand',
    fieldType: 'RADIO',
    sortOrder: 220,
    section: 'Engine, gearbox',
    options: [
      { value: 'ALTEK', label: 'Altek', sortOrder: 1 },
      { value: 'SOLARX', label: 'SolarX', sortOrder: 2 },
      { value: 'BB_BATTERY', label: 'B.B. Battery', sortOrder: 3 },
      { value: 'SUNLIGHT', label: 'Sunlight', sortOrder: 4 },
      { value: 'CHALLENGER', label: 'Challenger', sortOrder: 5 },
      { value: 'TAB', label: 'TAB', sortOrder: 6 },
      { value: 'MERLION', label: 'Merlion', sortOrder: 7 },
      { value: 'VENTURA', label: 'Ventura', sortOrder: 8 },
      { value: 'ORBUS', label: 'Orbus', sortOrder: 9 },
      { value: 'YUASA', label: 'Yuasa', sortOrder: 10 },
    ],
  },
  { fieldKey: 'battery_capacity', label: 'Battery capacity', fieldType: 'NUMBER', sortOrder: 230, section: 'Engine, gearbox', validations: { min: 0, max: 100000, unit: 'kW·h' } as Prisma.InputJsonValue },
  {
    fieldKey: 'more_details',
    label: 'Description',
    fieldType: 'RICHTEXT',
    sortOrder: 300,
    section: 'More details',
    validations: {
      placeholder:
        'Indicate additional characteristics or special features of your garden machinery.',
    } as Prisma.InputJsonValue,
  },
  {
    fieldKey: 'advert_type',
    label: 'Advert type',
    fieldType: 'RADIO',
    sortOrder: 400,
    section: 'Ad parameters',
    options: [
      { value: 'SALE', label: 'Sale', sortOrder: 1 },
      { value: 'RENT', label: 'Rent', sortOrder: 2 },
      { value: 'SALE_RENT', label: 'Sale / Rent', sortOrder: 3 },
    ],
  },
  { fieldKey: 'price', label: 'Price', fieldType: 'NUMBER', sortOrder: 410, section: 'Ad parameters', validations: { min: 0, max: 1000000000 } as Prisma.InputJsonValue },
  {
    fieldKey: 'currency',
    label: 'Currency',
    fieldType: 'SELECT',
    sortOrder: 420,
    section: 'Ad parameters',
    options: [
      { value: 'EUR', label: 'EUR', sortOrder: 1 },
      { value: 'USD', label: 'USD', sortOrder: 2 },
      { value: 'GBP', label: 'GBP', sortOrder: 3 },
      { value: 'UAH', label: 'UAH', sortOrder: 4 },
    ],
  },
  {
    fieldKey: 'vat_type',
    label: 'VAT',
    fieldType: 'RADIO',
    sortOrder: 430,
    section: 'Ad parameters',
    options: [
      { value: 'EXCLUDING', label: 'excluding VAT', sortOrder: 1 },
      { value: 'INCLUDING', label: 'including VAT', sortOrder: 2 },
    ],
  },
  { fieldKey: 'reserved', label: 'Reserved', fieldType: 'BOOLEAN', sortOrder: 440, section: 'Ad parameters' },
  { fieldKey: 'leasing_possible', label: 'Leasing is possible', fieldType: 'BOOLEAN', sortOrder: 450, section: 'Ad parameters' },
  { fieldKey: 'purchase_on_credit_possible', label: 'Purchase on credit is possible', fieldType: 'BOOLEAN', sortOrder: 460, section: 'Ad parameters' },
  { fieldKey: 'purchase_by_installments_possible', label: 'Purchase by installments is possible', fieldType: 'BOOLEAN', sortOrder: 470, section: 'Ad parameters' },
  {
    fieldKey: 'warranty',
    label: 'Warranty',
    fieldType: 'SELECT',
    sortOrder: 480,
    section: 'Ad parameters',
    options: [
      { value: 'NONE', label: 'No warranty', sortOrder: 1 },
      { value: '3_MONTHS', label: '3 months', sortOrder: 2 },
      { value: '6_MONTHS', label: '6 months', sortOrder: 3 },
      { value: '12_MONTHS', label: '12 months', sortOrder: 4 },
      { value: '24_MONTHS', label: '24 months', sortOrder: 5 },
    ],
  },
  { fieldKey: 'seller_stock_id', label: 'Seller stock ID', fieldType: 'TEXT', sortOrder: 490, section: 'Ad parameters' },
];

const COMBINES_TEMPLATE_FIELDS: TemplateFieldSeed[] = [
  { fieldKey: 'brand', label: 'Brand', fieldType: 'SELECT', required: true, sortOrder: 10, section: 'Basic characteristics' },
  { fieldKey: 'model', label: 'Model', fieldType: 'SELECT', sortOrder: 20, section: 'Basic characteristics' },
  { fieldKey: 'mini', label: 'Mini', fieldType: 'BOOLEAN', sortOrder: 25, section: 'Basic characteristics' },
  { fieldKey: 'year_of_manufacture_year', label: 'Year of manufacture (year)', fieldType: 'SELECT', sortOrder: 30, section: 'Basic characteristics', options: TEMPLATE_YEAR_OPTIONS },
  { fieldKey: 'year_of_manufacture_month', label: 'Year of manufacture (month)', fieldType: 'SELECT', sortOrder: 40, section: 'Basic characteristics', options: TEMPLATE_MONTH_OPTIONS },
  { fieldKey: 'first_registration_year', label: 'First registration (year)', fieldType: 'SELECT', sortOrder: 50, section: 'Basic characteristics', options: TEMPLATE_YEAR_OPTIONS },
  { fieldKey: 'first_registration_month', label: 'First registration (month)', fieldType: 'SELECT', sortOrder: 60, section: 'Basic characteristics', options: TEMPLATE_MONTH_OPTIONS },
  { fieldKey: 'vin', label: 'VIN', fieldType: 'TEXT', sortOrder: 70, section: 'Basic characteristics', validations: { minLength: 17, maxLength: 17 } as Prisma.InputJsonValue },
  {
    fieldKey: 'condition',
    label: 'Condition',
    fieldType: 'RADIO',
    required: true,
    sortOrder: 80,
    section: 'Basic characteristics',
    options: [
      { value: 'NEW', label: 'New', sortOrder: 1 },
      { value: 'USED', label: 'Used', sortOrder: 2 },
      { value: 'WITH_DEFECT', label: 'With a defect', sortOrder: 3 },
      { value: 'REMANUFACTURED', label: 'Remanufactured', sortOrder: 4 },
      { value: 'CRASHED', label: 'Crashed', sortOrder: 5 },
      { value: 'DEMO', label: 'Demonstration', sortOrder: 6 },
      { value: 'FOR_PARTS', label: 'For parts', sortOrder: 7 },
    ],
  },
  { fieldKey: 'running_hours', label: 'Running hours', fieldType: 'NUMBER', sortOrder: 90, section: 'Basic characteristics', validations: { min: 0, max: 200000, unit: 'm/h' } as Prisma.InputJsonValue },
  { fieldKey: 'colour', label: 'Colour', fieldType: 'COLOR', sortOrder: 100, section: 'Basic characteristics', options: [
      { value: '#15803D', label: 'Green', sortOrder: 1 },
      { value: '#FF0000', label: 'Red', sortOrder: 2 },
      { value: '#FACC15', label: 'Yellow', sortOrder: 3 },
      { value: '#FFFFFF', label: 'White', sortOrder: 4 },
      { value: '#1D4ED8', label: 'Blue', sortOrder: 5 },
      { value: '#1F2937', label: 'Black', sortOrder: 6 },
    ] },
  { fieldKey: 'working_width', label: 'Working width', fieldType: 'NUMBER', sortOrder: 110, section: 'Basic characteristics', validations: { min: 0, max: 50, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'number_of_rows', label: 'Number of rows', fieldType: 'NUMBER', sortOrder: 120, section: 'Basic characteristics', validations: { min: 0, max: 64 } as Prisma.InputJsonValue },
  { fieldKey: 'row_spacing', label: 'Row spacing', fieldType: 'NUMBER', sortOrder: 130, section: 'Basic characteristics', validations: { min: 0, max: 5000, unit: 'mm' } as Prisma.InputJsonValue },
  { fieldKey: 'volume_of_the_tank', label: 'Volume of the tank', fieldType: 'NUMBER', sortOrder: 140, section: 'Basic characteristics', validations: { min: 0, max: 1000, unit: 'm3' } as Prisma.InputJsonValue },
  { fieldKey: 'capacity_tph', label: 'Capacity', fieldType: 'NUMBER', sortOrder: 150, section: 'Basic characteristics', validations: { min: 0, max: 500, unit: 't/h' } as Prisma.InputJsonValue },
  { fieldKey: 'operating_speed', label: 'Operating speed', fieldType: 'NUMBER', sortOrder: 160, section: 'Basic characteristics', validations: { min: 0, max: 120, unit: 'km/h' } as Prisma.InputJsonValue },
  { fieldKey: 'speed', label: 'Speed', fieldType: 'NUMBER', sortOrder: 170, section: 'Basic characteristics', validations: { min: 0, max: 120, unit: 'km/h' } as Prisma.InputJsonValue },
  { fieldKey: 'cabin_heater', label: 'Cabin heater', fieldType: 'BOOLEAN', sortOrder: 180, section: 'Basic characteristics' },
  { fieldKey: 'overall_length', label: 'Overall dimensions length', fieldType: 'NUMBER', sortOrder: 190, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'overall_width', label: 'Overall dimensions width', fieldType: 'NUMBER', sortOrder: 200, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'overall_height', label: 'Overall dimensions height', fieldType: 'NUMBER', sortOrder: 210, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'transport_length', label: 'Transport dimensions length', fieldType: 'NUMBER', sortOrder: 220, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'transport_width', label: 'Transport dimensions width', fieldType: 'NUMBER', sortOrder: 230, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'transport_height', label: 'Transport dimensions height', fieldType: 'NUMBER', sortOrder: 240, section: 'Basic characteristics', validations: { min: 0, max: 100, unit: 'm' } as Prisma.InputJsonValue },
  { fieldKey: 'net_weight', label: 'Net weight', fieldType: 'NUMBER', sortOrder: 250, section: 'Basic characteristics', validations: { min: 0, max: 200000, unit: 'kg' } as Prisma.InputJsonValue },
  { fieldKey: 'gross_weight', label: 'Gross weight', fieldType: 'NUMBER', sortOrder: 260, section: 'Basic characteristics', validations: { min: 0, max: 200000, unit: 'kg' } as Prisma.InputJsonValue },
  { fieldKey: 'central_lubrication', label: 'Central lubrication', fieldType: 'BOOLEAN', sortOrder: 270, section: 'Basic characteristics' },
  {
    fieldKey: 'engine_mark',
    label: 'Engine mark',
    fieldType: 'SELECT',
    sortOrder: 300,
    section: 'Engine, gearbox',
    options: [
      { value: 'Cummins', label: 'Cummins', sortOrder: 1 },
      { value: 'Deutz', label: 'Deutz', sortOrder: 2 },
      { value: 'John Deere', label: 'John Deere', sortOrder: 3 },
      { value: 'Mercedes-Benz', label: 'Mercedes-Benz', sortOrder: 4 },
      { value: 'Perkins', label: 'Perkins', sortOrder: 5 },
      { value: 'Volvo', label: 'Volvo', sortOrder: 6 },
    ],
  },
  { fieldKey: 'engine_model', label: 'Engine model', fieldType: 'TEXT', sortOrder: 310, section: 'Engine, gearbox' },
  {
    fieldKey: 'fuel',
    label: 'Fuel',
    fieldType: 'SELECT',
    sortOrder: 320,
    section: 'Engine, gearbox',
    options: [
      { value: 'DIESEL', label: 'Diesel', sortOrder: 1 },
      { value: 'PETROL', label: 'Petrol', sortOrder: 2 },
      { value: 'HYBRID', label: 'Hybrid', sortOrder: 3 },
      { value: 'ELECTRIC', label: 'Electric', sortOrder: 4 },
    ],
  },
  { fieldKey: 'turbo', label: 'Turbo', fieldType: 'BOOLEAN', sortOrder: 330, section: 'Engine, gearbox' },
  { fieldKey: 'intercooler', label: 'Intercooler', fieldType: 'BOOLEAN', sortOrder: 340, section: 'Engine, gearbox' },
  { fieldKey: 'power', label: 'Power', fieldType: 'NUMBER', sortOrder: 350, section: 'Engine, gearbox', validations: { min: 0, max: 2000 } as Prisma.InputJsonValue },
  {
    fieldKey: 'power_unit',
    label: 'Power unit',
    fieldType: 'RADIO',
    sortOrder: 360,
    section: 'Engine, gearbox',
    options: [
      { value: 'HP', label: 'HP', sortOrder: 1 },
      { value: 'KW', label: 'kW', sortOrder: 2 },
    ],
  },
  {
    fieldKey: 'engine_type',
    label: 'Engine type',
    fieldType: 'RADIO',
    sortOrder: 370,
    section: 'Engine, gearbox',
    options: [
      { value: 'IN_LINE', label: 'In-line', sortOrder: 1 },
      { value: 'V_TYPE', label: 'V-type', sortOrder: 2 },
    ],
  },
  { fieldKey: 'engine_volume', label: 'Engine volume', fieldType: 'NUMBER', sortOrder: 380, section: 'Engine, gearbox', validations: { min: 0, max: 50000, unit: 'cm3' } as Prisma.InputJsonValue },
  {
    fieldKey: 'number_of_cylinders',
    label: 'Number of cylinders',
    fieldType: 'SELECT',
    sortOrder: 390,
    section: 'Engine, gearbox',
    options: [
      { value: '3', label: '3', sortOrder: 1 },
      { value: '4', label: '4', sortOrder: 2 },
      { value: '5', label: '5', sortOrder: 3 },
      { value: '6', label: '6', sortOrder: 4 },
      { value: '8', label: '8', sortOrder: 5 },
      { value: '12', label: '12', sortOrder: 6 },
    ],
  },
  { fieldKey: 'number_of_valves', label: 'Number of valves', fieldType: 'NUMBER', sortOrder: 400, section: 'Engine, gearbox', validations: { min: 0, max: 64 } as Prisma.InputJsonValue },
  {
    fieldKey: 'euro',
    label: 'Euro',
    fieldType: 'RADIO',
    sortOrder: 410,
    section: 'Engine, gearbox',
    options: [
      { value: 'EURO_1', label: 'Euro 1', sortOrder: 1 },
      { value: 'EURO_2', label: 'Euro 2', sortOrder: 2 },
      { value: 'EURO_3', label: 'Euro 3', sortOrder: 3 },
      { value: 'EURO_4', label: 'Euro 4', sortOrder: 4 },
      { value: 'EURO_5', label: 'Euro 5', sortOrder: 5 },
      { value: 'EURO_6', label: 'Euro 6', sortOrder: 6 },
      { value: 'EURO_7', label: 'Euro 7', sortOrder: 7 },
    ],
  },
  { fieldKey: 'particulate_filter', label: 'Particulate filter', fieldType: 'BOOLEAN', sortOrder: 420, section: 'Engine, gearbox' },
  { fieldKey: 'eev', label: 'EEV', fieldType: 'BOOLEAN', sortOrder: 430, section: 'Engine, gearbox' },
  { fieldKey: 'fuel_consumption', label: 'Fuel consumption', fieldType: 'NUMBER', sortOrder: 440, section: 'Engine, gearbox', validations: { min: 0, max: 500 } as Prisma.InputJsonValue },
  {
    fieldKey: 'fuel_consumption_unit',
    label: 'Fuel consumption unit',
    fieldType: 'RADIO',
    sortOrder: 450,
    section: 'Engine, gearbox',
    options: [
      { value: 'L_100KM', label: 'l/100km', sortOrder: 1 },
      { value: 'L_H', label: 'l/h', sortOrder: 2 },
    ],
  },
  {
    fieldKey: 'gearbox_type',
    label: 'Gearbox type',
    fieldType: 'SELECT',
    sortOrder: 460,
    section: 'Engine, gearbox',
    options: [
      { value: 'MANUAL', label: 'Manual', sortOrder: 1 },
      { value: 'AUTOMATIC', label: 'Automatic', sortOrder: 2 },
      { value: 'SEMI_AUTOMATIC', label: 'Semi-automatic', sortOrder: 3 },
      { value: 'CVT', label: 'CVT', sortOrder: 4 },
    ],
  },
  { fieldKey: 'reverse_gear', label: 'Reverse gear', fieldType: 'BOOLEAN', sortOrder: 470, section: 'Engine, gearbox' },
  {
    fieldKey: 'number_of_gears',
    label: 'Number of gears',
    fieldType: 'SELECT',
    sortOrder: 480,
    section: 'Engine, gearbox',
    options: [
      { value: '4', label: '4', sortOrder: 1 },
      { value: '5', label: '5', sortOrder: 2 },
      { value: '6', label: '6', sortOrder: 3 },
      { value: '8', label: '8', sortOrder: 4 },
      { value: '12', label: '12', sortOrder: 5 },
      { value: '16', label: '16', sortOrder: 6 },
    ],
  },
  {
    fieldKey: 'gearbox_brand',
    label: 'Gearbox brand',
    fieldType: 'SELECT',
    sortOrder: 490,
    section: 'Engine, gearbox',
    options: [
      { value: 'ZF', label: 'ZF', sortOrder: 1 },
      { value: 'Allison', label: 'Allison', sortOrder: 2 },
      { value: 'Voith', label: 'Voith', sortOrder: 3 },
      { value: 'Dana', label: 'Dana', sortOrder: 4 },
    ],
  },
  { fieldKey: 'gearbox_model', label: 'Gearbox model', fieldType: 'TEXT', sortOrder: 500, section: 'Engine, gearbox' },
  {
    fieldKey: 'number_of_fuel_tanks',
    label: 'Number of fuel tanks',
    fieldType: 'RADIO',
    sortOrder: 510,
    section: 'Engine, gearbox',
    options: [
      { value: '1', label: '1', sortOrder: 1 },
      { value: '2', label: '2', sortOrder: 2 },
      { value: '3', label: '3', sortOrder: 3 },
    ],
  },
  { fieldKey: 'fuel_tank_volume', label: 'Volume', fieldType: 'NUMBER', sortOrder: 520, section: 'Engine, gearbox', validations: { min: 0, max: 5000, unit: 'l' } as Prisma.InputJsonValue },
  {
    fieldKey: 'number_of_axles',
    label: 'Number of axles',
    fieldType: 'SELECT',
    sortOrder: 600,
    section: 'Axles, brakes',
    options: [
      { value: '1', label: '1', sortOrder: 1 },
      { value: '2', label: '2', sortOrder: 2 },
      { value: '3', label: '3', sortOrder: 3 },
      { value: '4', label: '4', sortOrder: 4 },
      { value: '5', label: '5', sortOrder: 5 },
      { value: '6', label: '6', sortOrder: 6 },
    ],
  },
  {
    fieldKey: 'axle_brand',
    label: 'Axle brand',
    fieldType: 'SELECT',
    sortOrder: 610,
    section: 'Axles, brakes',
    options: [
      { value: 'BPW', label: 'BPW', sortOrder: 1 },
      { value: 'SAF', label: 'SAF', sortOrder: 2 },
      { value: 'ROR', label: 'ROR', sortOrder: 3 },
      { value: 'Gigant', label: 'Gigant', sortOrder: 4 },
      { value: 'ADR', label: 'ADR', sortOrder: 5 },
    ],
  },
  { fieldKey: 'wheelbase', label: 'Wheelbase', fieldType: 'NUMBER', sortOrder: 620, section: 'Axles, brakes', validations: { min: 0, max: 10000, unit: 'mm' } as Prisma.InputJsonValue },
  { fieldKey: 'tyre_size', label: 'Tyre size', fieldType: 'TEXT', sortOrder: 630, section: 'Axles, brakes' },
  { fieldKey: 'tyre_condition_percent', label: 'Tyre condition (%)', fieldType: 'NUMBER', sortOrder: 640, section: 'Axles, brakes', validations: { min: 0, max: 100, unit: '%' } as Prisma.InputJsonValue },
  { fieldKey: 'tyre_condition_mm', label: 'Tyre condition (mm)', fieldType: 'NUMBER', sortOrder: 650, section: 'Axles, brakes', validations: { min: 0, max: 1000, unit: 'mm' } as Prisma.InputJsonValue },
  { fieldKey: 'enter_by_axles', label: 'Enter by axles', fieldType: 'BOOLEAN', sortOrder: 660, section: 'Axles, brakes' },
  { fieldKey: 'air_conditioning', label: 'Air conditioning', fieldType: 'BOOLEAN', sortOrder: 700, section: 'Additional options' },
  {
    fieldKey: 'air_conditioning_type',
    label: 'Air conditioning type',
    fieldType: 'RADIO',
    sortOrder: 710,
    section: 'Additional options',
    options: [
      { value: 'CLIMATE_CONTROL', label: 'Climate control', sortOrder: 1 },
      { value: 'MULTI_ZONE_CLIMATE_CONTROL', label: 'Multi-zone climate control', sortOrder: 2 },
      { value: 'DUAL_ZONE_CLIMATE_CONTROL', label: 'Dual-zone climate control', sortOrder: 3 },
    ],
  },
  { fieldKey: 'powered_windows', label: 'Powered windows', fieldType: 'BOOLEAN', sortOrder: 720, section: 'Additional options' },
  {
    fieldKey: 'powered_windows_scope',
    label: 'Powered windows',
    fieldType: 'RADIO',
    sortOrder: 730,
    section: 'Additional options',
    options: [
      { value: 'FRONT', label: 'Front', sortOrder: 1 },
      { value: 'FRONT_AND_REAR', label: 'Front and rear', sortOrder: 2 },
    ],
  },
  {
    fieldKey: 'interior_material',
    label: 'Interior material',
    fieldType: 'RADIO',
    sortOrder: 740,
    section: 'Additional options',
    options: [
      { value: 'ALCANTARA', label: 'Alcantara', sortOrder: 1 },
      { value: 'FAUX_LEATHER', label: 'Faux leather', sortOrder: 2 },
    ],
  },
  {
    fieldKey: 'more_details',
    label: 'Description',
    fieldType: 'RICHTEXT',
    sortOrder: 800,
    section: 'More details',
    validations: {
      placeholder:
        'Indicate additional characteristics or special features of your combine.',
    } as Prisma.InputJsonValue,
  },
  {
    fieldKey: 'advert_type',
    label: 'Advert type',
    fieldType: 'RADIO',
    sortOrder: 900,
    section: 'Ad parameters',
    options: [
      { value: 'SALE', label: 'Sale', sortOrder: 1 },
      { value: 'RENT', label: 'Rent', sortOrder: 2 },
      { value: 'SALE_RENT', label: 'Sale / Rent', sortOrder: 3 },
    ],
  },
  { fieldKey: 'price', label: 'Price', fieldType: 'NUMBER', sortOrder: 910, section: 'Ad parameters', validations: { min: 0, max: 1000000000 } as Prisma.InputJsonValue },
  {
    fieldKey: 'currency',
    label: 'Currency',
    fieldType: 'SELECT',
    sortOrder: 920,
    section: 'Ad parameters',
    options: [
      { value: 'EUR', label: 'EUR', sortOrder: 1 },
      { value: 'USD', label: 'USD', sortOrder: 2 },
      { value: 'GBP', label: 'GBP', sortOrder: 3 },
      { value: 'UAH', label: 'UAH', sortOrder: 4 },
    ],
  },
  {
    fieldKey: 'vat_type',
    label: 'VAT',
    fieldType: 'RADIO',
    sortOrder: 930,
    section: 'Ad parameters',
    options: [
      { value: 'EXCLUDING', label: 'excluding VAT', sortOrder: 1 },
      { value: 'INCLUDING', label: 'including VAT', sortOrder: 2 },
    ],
  },
  { fieldKey: 'reserved', label: 'Reserved', fieldType: 'BOOLEAN', sortOrder: 940, section: 'Ad parameters' },
  { fieldKey: 'leasing_possible', label: 'Leasing is possible', fieldType: 'BOOLEAN', sortOrder: 950, section: 'Ad parameters' },
  { fieldKey: 'purchase_on_credit_possible', label: 'Purchase on credit is possible', fieldType: 'BOOLEAN', sortOrder: 960, section: 'Ad parameters' },
  { fieldKey: 'purchase_by_installments_possible', label: 'Purchase by installments is possible', fieldType: 'BOOLEAN', sortOrder: 970, section: 'Ad parameters' },
  {
    fieldKey: 'warranty',
    label: 'Warranty',
    fieldType: 'SELECT',
    sortOrder: 980,
    section: 'Ad parameters',
    options: [
      { value: 'NONE', label: 'No warranty', sortOrder: 1 },
      { value: '3_MONTHS', label: '3 months', sortOrder: 2 },
      { value: '6_MONTHS', label: '6 months', sortOrder: 3 },
      { value: '12_MONTHS', label: '12 months', sortOrder: 4 },
      { value: '24_MONTHS', label: '24 months', sortOrder: 5 },
    ],
  },
  { fieldKey: 'seller_stock_id', label: 'Seller stock ID', fieldType: 'TEXT', sortOrder: 990, section: 'Ad parameters' },
];

export type CoreSeedData = {
  users: SeedUsers;
  geo: SeedGeo;
  catalog: SeedCatalog;
  plans: SeedPlans;
};

export async function seedCore(prisma: PrismaClient): Promise<CoreSeedData> {
  const isLikelyMotorizedSlug = (slug: string) => {
    const value = slug.toLowerCase();
    const excludedTokens = ['trailer', 'semi-trailer', 'parts', 'tires', 'wheels', 'service', 'services'];
    if (excludedTokens.some((token) => value.includes(token))) {
      return false;
    }

    const motorizedTokens = [
      'tractor',
      'harvester',
      'combine',
      'excavator',
      'loader',
      'forklift',
      'telehandler',
      'truck',
      'bus',
      'car',
      'sedan',
      'suv',
      'hatchback',
      'coupe',
      'convertible',
      'pickup',
      'minivan',
      'electric',
      'hybrid',
      'motorcycle',
      'van',
    ];

    return motorizedTokens.some((token) => value.includes(token));
  };

  const buildGardenMachineryTemplateCreate = () => ({
    create: GARDEN_MACHINERY_TEMPLATE_FIELDS.map((field) => ({
      fieldKey: field.fieldKey,
      label: field.label,
      fieldType: field.fieldType,
      required: field.required ?? false,
      sortOrder: field.sortOrder,
      section: field.section,
      validations: field.validations ?? {},
      options: field.options
        ? {
            create: field.options.map((option) => ({
              value: option.value,
              label: option.label,
              sortOrder: option.sortOrder,
            })),
          }
        : undefined,
    })),
  });

  const buildCombinesTemplateCreate = () => ({
    create: COMBINES_TEMPLATE_FIELDS.map((field) => ({
      fieldKey: field.fieldKey,
      label: field.label,
      fieldType: field.fieldType,
      required: field.required ?? false,
      sortOrder: field.sortOrder,
      section: field.section,
      validations: field.validations ?? {},
      options: field.options
        ? {
            create: field.options.map((option) => ({
              value: option.value,
              label: option.label,
              sortOrder: option.sortOrder,
            })),
          }
        : undefined,
    })),
  });

  const passwordHash = await bcrypt.hash('test1234', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@alcor.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      locale: 'uk',
      emailVerified: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@alcor.com',
      passwordHash,
      firstName: 'Maria',
      lastName: 'Manager',
      role: 'MANAGER',
      status: 'ACTIVE',
      locale: 'uk',
      emailVerified: true,
    },
  });

  const proSeller = await prisma.user.create({
    data: {
      email: 'proseller@alcor.com',
      passwordHash,
      firstName: 'Petro',
      lastName: 'Seller',
      role: 'PRO_SELLER',
      status: 'ACTIVE',
      locale: 'uk',
      emailVerified: true,
    },
  });

  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@alcor.com',
      passwordHash,
      firstName: 'Iryna',
      lastName: 'Buyer',
      role: 'USER',
      status: 'ACTIVE',
      locale: 'uk',
      emailVerified: true,
    },
  });

  const restrictedUser = await prisma.user.create({
    data: {
      email: 'restricted@alcor.com',
      passwordHash,
      firstName: 'Restricted',
      lastName: 'User',
      role: 'USER',
      status: 'RESTRICTED',
      locale: 'uk',
      emailVerified: false,
    },
  });

  await prisma.oAuthAccount.create({
    data: {
      userId: buyer.id,
      provider: 'google',
      providerId: 'google-buyer-001',
    },
  });

  await prisma.session.create({
    data: {
      userId: admin.id,
      refreshTokenHash: 'seed-refresh-admin',
      expiresAt: daysFromNow(30),
      userAgent: 'seed-script',
      ipAddress: '127.0.0.1',
    },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: restrictedUser.id,
      tokenHash: 'seed-reset-token-restricted',
      expiresAt: daysFromNow(1),
    },
  });

  await prisma.emailVerificationCode.create({
    data: {
      userId: restrictedUser.id,
      codeHash: 'seed-email-code-restricted',
      expiresAt: daysFromNow(1),
    },
  });

  const users: SeedUsers = {
    adminId: admin.id,
    managerId: manager.id,
    proSellerId: proSeller.id,
    buyerId: buyer.id,
    restrictedUserId: restrictedUser.id,
  };

  const ua = await prisma.country.create({ data: { iso2: 'UA', name: 'Ukraine' } });
  const de = await prisma.country.create({ data: { iso2: 'DE', name: 'Germany' } });
  const pl = await prisma.country.create({ data: { iso2: 'PL', name: 'Poland' } });

  const kyiv = await prisma.city.create({ data: { name: 'Kyiv', countryId: ua.id } });
  const dnipro = await prisma.city.create({ data: { name: 'Dnipro', countryId: ua.id } });
  const berlin = await prisma.city.create({ data: { name: 'Berlin', countryId: de.id } });
  await prisma.city.create({ data: { name: 'Munich', countryId: de.id } });
  const warsaw = await prisma.city.create({ data: { name: 'Warsaw', countryId: pl.id } });

  const geo: SeedGeo = {
    uaId: ua.id,
    deId: de.id,
    plId: pl.id,
    kyivId: kyiv.id,
    dniproId: dnipro.id,
    berlinId: berlin.id,
    warsawId: warsaw.id,
  };

  const activityTypes = await Promise.all([
    prisma.activityType.create({ data: { code: 'FARM_EQUIPMENT_SALES', name: 'Farm equipment sellers' } }),
    prisma.activityType.create({
      data: { code: 'COMMERCIAL_VEHICLE_SALES', name: 'Commercial vehicle sellers' },
    }),
    prisma.activityType.create({
      data: { code: 'INDUSTRIAL_EQUIPMENT_SALES', name: 'Industrial equipment sellers' },
    }),
    prisma.activityType.create({ data: { code: 'AUTO_SERVICE', name: 'Auto service' } }),
  ]);

  const marketplaceRows = await Promise.all(
    MARKETPLACE_DEFINITIONS.map((marketplace) =>
      prisma.marketplace.create({
        data: {
          key: marketplace.key,
          name: marketplace.name,
          isActive: marketplace.isActive,
        },
      }),
    ),
  );

  const marketplaceMap = new Map<string, bigint>(marketplaceRows.map((row) => [row.key, row.id]));
  const categoriesBySlug = new Map<string, { id: bigint; marketplaceId: bigint }>();

  let sortOrder = 1;
  async function insertNode(params: {
    marketplaceKey: string;
    node: CategorySeedNode;
    parentId?: bigint;
  }) {
    const marketplaceId = marketplaceMap.get(params.marketplaceKey);
    if (!marketplaceId) {
      throw new Error(`Unknown marketplace key: ${params.marketplaceKey}`);
    }

    const row = await prisma.category.create({
      data: {
        marketplaceId,
        slug: params.node.slug,
        name: params.node.name,
        parentId: params.parentId,
        sortOrder: sortOrder++,
        hasEngine:
          params.node.hasEngine === undefined
            ? isLikelyMotorizedSlug(params.node.slug)
            : params.node.hasEngine,
      },
    });

    categoriesBySlug.set(params.node.slug, { id: row.id, marketplaceId });

    for (const child of params.node.children ?? []) {
      await insertNode({
        marketplaceKey: params.marketplaceKey,
        node: child,
        parentId: row.id,
      });
    }
  }

  for (const node of AGROLINE_TREE) {
    await insertNode({ marketplaceKey: 'agroline', node });
  }
  for (const node of AUTOLINE_TREE) {
    await insertNode({ marketplaceKey: 'autoline', node });
  }
  for (const node of MACHINERYLINE_TREE) {
    await insertNode({ marketplaceKey: 'machineryline', node });
  }

  const allBrandNames = Array.from(
    new Set([...AGRO_WORKBOOK_BRANDS, ...NON_AGRO_BRANDS]),
  ).sort((a, b) => a.localeCompare(b));

  const brandRows = await Promise.all(
    allBrandNames.map((name) => prisma.brand.create({ data: { name } })),
  );

  const brandMap = new Map<string, string>(brandRows.map((brand) => [brand.name, brand.id]));

  async function linkBrandToCategory(brandName: string, categorySlug: string) {
    const brandId = brandMap.get(brandName);
    const category = categoriesBySlug.get(categorySlug);
    if (!brandId || !category) return;

    await prisma.brandCategory.create({
      data: {
        brandId,
        categoryId: category.id,
      },
    });
  }

  async function linkBrandToMarketplaceCategories(
    brandName: string,
    marketplaceKey: string,
  ) {
    const brandId = brandMap.get(brandName);
    const marketplaceId = marketplaceMap.get(marketplaceKey);
    if (!brandId || !marketplaceId) return;

    for (const category of categoriesBySlug.values()) {
      if (category.marketplaceId !== marketplaceId) continue;
      await prisma.brandCategory.create({
        data: {
          brandId,
          categoryId: category.id,
        },
      });
    }
  }

  for (const brandName of AGRO_WORKBOOK_BRANDS) {
    await linkBrandToMarketplaceCategories(brandName, 'agroline');
  }

  await linkBrandToCategory('Caterpillar', 'tracked-excavators');
  await linkBrandToCategory('Komatsu', 'wheel-loaders');
  await linkBrandToCategory('MAN', 'truck-tractors');
  await linkBrandToCategory('Mercedes-Benz', 'dump-trucks');
  await linkBrandToCategory('Toyota', 'sedans');
  await linkBrandToCategory('BMW', 'suv');

  await prisma.formBlock.upsert({
    where: { id: 'engine_block' },
    create: {
      id: 'engine_block',
      name: 'Motorized Vehicle Block',
      isSystem: true,
      fields: DEFAULT_MOTORIZED_BLOCK_FIELDS as unknown as Prisma.InputJsonValue,
    },
    update: {
      name: 'Motorized Vehicle Block',
      isSystem: true,
      fields: DEFAULT_MOTORIZED_BLOCK_FIELDS as unknown as Prisma.InputJsonValue,
    },
  });

  for (const slug of COMBINE_HEADER_TEMPLATE_TARGET_SLUGS) {
    const category = categoriesBySlug.get(slug);
    if (!category) continue;

    const isCombineHeaderTemplate = COMBINE_HEADER_TEMPLATE_SLUGS.has(slug);
    const isCombinesTemplate = COMBINES_TEMPLATE_SLUGS.has(slug);
    const isGardenMachineryTemplate = GARDEN_MACHINERY_TEMPLATE_SLUGS.has(slug);
    const isMotorizedCategory =
      !isCombineHeaderTemplate &&
      !isCombinesTemplate &&
      !isGardenMachineryTemplate &&
      isLikelyMotorizedSlug(slug);
    const blockIds = isMotorizedCategory ? ['engine_block'] : [];

    await prisma.formTemplate.create({
      data: {
        categoryId: category.id,
        version: 1,
        isActive: true,
        blockIds,
        fields: isCombineHeaderTemplate || isCombinesTemplate
          ? buildCombinesTemplateCreate()
          : isGardenMachineryTemplate
          ? buildGardenMachineryTemplateCreate()
          : isMotorizedCategory
          ? undefined
          : {
              create: [
                {
                  fieldKey: 'year',
                  label: 'Year',
                  fieldType: 'NUMBER',
                  required: true,
                  sortOrder: 1,
                  section: 'General',
                  validations: { min: 1990, max: 2030 },
                },
                {
                  fieldKey: 'condition',
                  label: 'Condition',
                  fieldType: 'SELECT',
                  required: true,
                  sortOrder: 2,
                  section: 'General',
                  validations: {},
                  options: {
                    create: [
                      { value: 'NEW', label: 'New', sortOrder: 1 },
                      { value: 'USED', label: 'Used', sortOrder: 2 },
                      { value: 'DEMO', label: 'Demo', sortOrder: 3 },
                    ],
                  },
                },
                {
                  fieldKey: 'hours',
                  label: 'Engine hours',
                  fieldType: 'NUMBER',
                  required: false,
                  sortOrder: 3,
                  section: 'Technical',
                  validations: { min: 0, max: 200000, unit: 'h' },
                },
              ],
            },
      },
    });
  }

  const basicPlan = await prisma.plan.create({
    data: {
      slug: 'basic',
      name: 'Basic',
      description: 'Starter plan',
      priceAmount: new Prisma.Decimal('0'),
      priceCurrency: 'UAH',
      interval: 'MONTHLY',
      features: { support: 'email' },
      limits: { listings: 5 },
      isActive: true,
      sortOrder: 1,
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      slug: 'pro',
      name: 'Pro',
      description: 'Growing business plan',
      priceAmount: new Prisma.Decimal('1499'),
      priceCurrency: 'UAH',
      interval: 'MONTHLY',
      features: { support: 'priority' },
      limits: { listings: 100 },
      isActive: true,
      sortOrder: 2,
    },
  });

  const enterprisePlan = await prisma.plan.create({
    data: {
      slug: 'enterprise',
      name: 'Enterprise',
      description: 'Unlimited enterprise plan',
      priceAmount: new Prisma.Decimal('4999'),
      priceCurrency: 'UAH',
      interval: 'MONTHLY',
      features: { support: 'dedicated' },
      limits: { listings: 1000 },
      isActive: true,
      sortOrder: 3,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: proSeller.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      startDate: daysAgo(20),
      endDate: daysFromNow(10),
    },
  });

  await prisma.subscription.create({
    data: {
      userId: buyer.id,
      planId: basicPlan.id,
      status: 'PAUSED',
      startDate: daysAgo(90),
      endDate: daysAgo(30),
    },
  });

  await prisma.subscription.create({
    data: {
      userId: admin.id,
      planId: enterprisePlan.id,
      status: 'CANCELLED',
      startDate: daysAgo(180),
      endDate: daysAgo(60),
    },
  });

  const catalog: SeedCatalog = {
    activityTypeIds: activityTypes.map((item) => item.id),
    marketplaceMap,
    categoriesBySlug,
    brandMap,
  };

  const plans: SeedPlans = {
    basicPlanId: basicPlan.id,
    proPlanId: proPlan.id,
    enterprisePlanId: enterprisePlan.id,
  };

  return {
    users,
    geo,
    catalog,
    plans,
  };
}
