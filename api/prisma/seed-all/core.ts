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
  {
    slug: 'transportation-machinery',
    name: 'Transportation machinery',
    children: [
      { slug: 'tractor-trailers', name: 'Tractor trailers' },
      { slug: 'grain-carts', name: 'Grain carts' },
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
  { slug: 'farm-lands-and-buildings', name: 'Farm lands and buildings' },
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

  const brandRows = await Promise.all([
    prisma.brand.create({ data: { name: 'John Deere' } }),
    prisma.brand.create({ data: { name: 'Claas' } }),
    prisma.brand.create({ data: { name: 'Caterpillar' } }),
    prisma.brand.create({ data: { name: 'Komatsu' } }),
    prisma.brand.create({ data: { name: 'MAN' } }),
    prisma.brand.create({ data: { name: 'Mercedes-Benz' } }),
    prisma.brand.create({ data: { name: 'Toyota' } }),
    prisma.brand.create({ data: { name: 'BMW' } }),
  ]);

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

  await linkBrandToCategory('John Deere', 'wheel-tractors');
  await linkBrandToCategory('Claas', 'grain-harvesters');
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

  for (const slug of ALL_LEAF_CATEGORY_SLUGS) {
    const category = categoriesBySlug.get(slug);
    if (!category) continue;

    const isMotorizedCategory = isLikelyMotorizedSlug(slug);
    const blockIds = isMotorizedCategory ? ['engine_block'] : [];

    await prisma.formTemplate.create({
      data: {
        categoryId: category.id,
        version: 1,
        isActive: true,
        blockIds,
        fields: isMotorizedCategory
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
