import { Prisma, PrismaClient } from '@prisma/client';
import { daysAgo, type SeedCompanies, type SeedListings } from './shared';
import { type CoreSeedInput } from './types';

export type CompaniesAndListingsSeedData = {
  companies: SeedCompanies;
  listings: SeedListings;
};

type ListingParams = {
  title: string;
  description: string;
  categorySlug: string;
  companyId: string;
  ownerUserId: string;
  brandName: string;
  countryId: string;
  cityId: string;
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'PENDING_MODERATION'
    | 'ACTIVE'
    | 'PAUSED'
    | 'EXPIRED'
    | 'REJECTED'
    | 'REMOVED';
  price: string;
  year: number;
  mileage: number;
  condition: string;
  publishedOffsetDays?: number;
};

export async function seedCompaniesAndListings(
  prisma: PrismaClient,
  input: CoreSeedInput,
): Promise<CompaniesAndListingsSeedData> {
  const companyAgro = await prisma.company.create({
    data: {
      slug: 'agro-tech',
      name: 'Agro Tech',
      description: 'Dealer of agriculture machinery',
      countryId: input.geo.uaId,
      cityId: input.geo.kyivId,
      region: 'Kyiv',
      addressLine: 'Business St 10',
      website: 'https://agro-tech.example.com',
      contactPerson: 'Petro Seller',
      languages: 'uk,en',
      yearsOnPlatform: 4,
      yearsOnMarket: 12,
      isVerified: true,
      isOfficialDealer: true,
      isManufacturer: false,
      ratingAvg: 4.7,
      reviewsCount: 12,
      listingsCount: 5,
    },
  });

  const companyHeavy = await prisma.company.create({
    data: {
      slug: 'heavy-industrial',
      name: 'Heavy Industrial GmbH',
      description: 'Industrial and construction equipment reseller',
      countryId: input.geo.deId,
      cityId: input.geo.berlinId,
      region: 'Berlin',
      addressLine: 'Industrial Ring 1',
      website: 'https://heavy-industrial.example.com',
      contactPerson: 'Hans Driver',
      languages: 'de,en',
      yearsOnPlatform: 6,
      yearsOnMarket: 20,
      isVerified: true,
      isOfficialDealer: false,
      isManufacturer: true,
      ratingAvg: 4.5,
      reviewsCount: 21,
      listingsCount: 8,
    },
  });

  const companyFleet = await prisma.company.create({
    data: {
      slug: 'fleet-poland',
      name: 'Fleet Poland',
      description: 'Commercial trucks and trailers',
      countryId: input.geo.plId,
      cityId: input.geo.warsawId,
      region: 'Mazowieckie',
      addressLine: 'Transport Ave 7',
      website: 'https://fleet-poland.example.com',
      contactPerson: 'Jan Fleet',
      languages: 'pl,en',
      yearsOnPlatform: 2,
      yearsOnMarket: 9,
      isVerified: false,
      isOfficialDealer: false,
      isManufacturer: false,
      ratingAvg: 4.1,
      reviewsCount: 7,
      listingsCount: 4,
    },
  });

  await prisma.companyPhone.createMany({
    data: [
      { companyId: companyAgro.id, label: 'Sales', phoneE164: '+380671112233', isPrimary: true },
      { companyId: companyHeavy.id, label: 'Main', phoneE164: '+493012345678', isPrimary: true },
      { companyId: companyFleet.id, label: 'Office', phoneE164: '+48221234567', isPrimary: true },
    ],
  });

  await prisma.companyMedia.createMany({
    data: [
      { companyId: companyAgro.id, kind: 'LOGO', url: 'https://placehold.co/200x200?text=Agro', sortOrder: 1 },
      { companyId: companyHeavy.id, kind: 'LOGO', url: 'https://placehold.co/200x200?text=Heavy', sortOrder: 1 },
      { companyId: companyFleet.id, kind: 'LOGO', url: 'https://placehold.co/200x200?text=Fleet', sortOrder: 1 },
    ],
  });

  await prisma.companyActivityType.createMany({
    data: [
      { companyId: companyAgro.id, activityTypeId: input.catalog.activityTypeIds[0] },
      { companyId: companyHeavy.id, activityTypeId: input.catalog.activityTypeIds[2] },
      { companyId: companyFleet.id, activityTypeId: input.catalog.activityTypeIds[1] },
    ],
  });

  await prisma.companyBrand.createMany({
    data: [
      { companyId: companyAgro.id, brandId: requireBrandId(input.catalog.brandMap, 'John Deere') },
      { companyId: companyAgro.id, brandId: requireBrandId(input.catalog.brandMap, 'Claas') },
      { companyId: companyHeavy.id, brandId: requireBrandId(input.catalog.brandMap, 'Caterpillar') },
      { companyId: companyHeavy.id, brandId: requireBrandId(input.catalog.brandMap, 'Komatsu') },
      { companyId: companyFleet.id, brandId: requireBrandId(input.catalog.brandMap, 'MAN') },
      { companyId: companyFleet.id, brandId: requireBrandId(input.catalog.brandMap, 'Mercedes-Benz') },
    ],
  });

  await prisma.companyUser.createMany({
    data: [
      { companyId: companyAgro.id, userId: input.users.proSellerId, role: 'OWNER' },
      { companyId: companyAgro.id, userId: input.users.adminId, role: 'ADMIN' },
      { companyId: companyHeavy.id, userId: input.users.managerId, role: 'OWNER' },
      { companyId: companyFleet.id, userId: input.users.buyerId, role: 'EDITOR' },
    ],
  });

  async function createListing(params: ListingParams) {
    const category = input.catalog.categoriesBySlug.get(params.categorySlug);
    const brandId = input.catalog.brandMap.get(params.brandName);
    if (!category || !brandId) {
      throw new Error(`Missing category or brand for ${params.title}`);
    }

    const listing = await prisma.listing.create({
      data: {
        marketplaceId: category.marketplaceId,
        categoryId: category.id,
        companyId: params.companyId,
        ownerUserId: params.ownerUserId,
        title: params.title,
        description: params.description,
        descriptionLang: 'uk',
        status: params.status,
        countryId: params.countryId,
        cityId: params.cityId,
        brandId,
        publishedAt:
          params.publishedOffsetDays !== undefined
            ? daysAgo(params.publishedOffsetDays)
            : null,
        attribute: {
          create: {
            data: {
              customFieldA: 'value-a',
              customFieldB: 'value-b',
            },
          },
        },
        fact: {
          create: {
            priceAmount: new Prisma.Decimal(params.price),
            priceCurrency: 'EUR',
            vatType: 'with_vat',
            year: params.year,
            mileageKm: params.mileage,
            condition: params.condition,
            country: params.countryId === input.geo.uaId ? 'Ukraine' : params.countryId === input.geo.deId ? 'Germany' : 'Poland',
            city: params.cityId === input.geo.kyivId ? 'Kyiv' : params.cityId === input.geo.berlinId ? 'Berlin' : 'Warsaw',
            lat: new Prisma.Decimal('50.4501'),
            lng: new Prisma.Decimal('30.5234'),
          },
        },
        media: {
          create: [
            {
              type: 'PHOTO',
              url: `https://placehold.co/1200x800?text=${encodeURIComponent(params.title)}`,
              sortOrder: 1,
              meta: {},
            },
            {
              type: 'GALLERY',
              url: `https://placehold.co/1200x800?text=${encodeURIComponent(`${params.title}-2`)}`,
              sortOrder: 2,
              meta: {},
            },
          ],
        },
      },
    });

    const sellerContact = await prisma.sellerContact.create({
      data: {
        email: `${params.ownerUserId.slice(0, 8)}@seed.local`,
        name: 'Seed Seller Contact',
        phoneCountry: 'UA',
        phoneNumber: '+380500001111',
        privacyConsent: true,
        termsConsent: true,
      },
    });

    await prisma.listingSeller.create({
      data: {
        listingId: listing.id,
        sellerContactId: sellerContact.id,
      },
    });

    await prisma.listingWizardState.create({
      data: {
        listingId: listing.id,
        step: params.status === 'DRAFT' ? 2 : 3,
        completedSteps: params.status === 'DRAFT' ? [1] : [1, 2, 3],
        lastSeenAt: daysAgo(1),
      },
    });

    return listing.id;
  }

  const listing1Id = await createListing({
    title: 'John Deere 6155R',
    description: 'Well maintained tractor, ready for field work.',
    categorySlug: 'wheel-tractors',
    companyId: companyAgro.id,
    ownerUserId: input.users.proSellerId,
    brandName: 'John Deere',
    countryId: input.geo.uaId,
    cityId: input.geo.kyivId,
    status: 'ACTIVE',
    price: '95000',
    year: 2020,
    mileage: 4200,
    condition: 'USED',
    publishedOffsetDays: 3,
  });

  const listing2Id = await createListing({
    title: 'Caterpillar 320 GC',
    description: 'Tracked excavator with full service history.',
    categorySlug: 'tracked-excavators',
    companyId: companyHeavy.id,
    ownerUserId: input.users.managerId,
    brandName: 'Caterpillar',
    countryId: input.geo.deId,
    cityId: input.geo.berlinId,
    status: 'ACTIVE',
    price: '145000',
    year: 2021,
    mileage: 6200,
    condition: 'USED',
    publishedOffsetDays: 5,
  });

  const listing3Id = await createListing({
    title: 'MAN TGX 18.510',
    description: 'Fleet-maintained truck tractor with ADR package.',
    categorySlug: 'truck-tractors',
    companyId: companyFleet.id,
    ownerUserId: input.users.buyerId,
    brandName: 'MAN',
    countryId: input.geo.plId,
    cityId: input.geo.warsawId,
    status: 'ACTIVE',
    price: '52000',
    year: 2019,
    mileage: 720000,
    condition: 'USED',
    publishedOffsetDays: 1,
  });

  const listing4Id = await createListing({
    title: 'BMW X5 xDrive30d',
    description: 'Premium SUV in excellent condition.',
    categorySlug: 'suv',
    companyId: companyFleet.id,
    ownerUserId: input.users.buyerId,
    brandName: 'BMW',
    countryId: input.geo.plId,
    cityId: input.geo.warsawId,
    status: 'ACTIVE',
    price: '62000',
    year: 2022,
    mileage: 48000,
    condition: 'USED',
    publishedOffsetDays: 2,
  });

  return {
    companies: {
      agroId: companyAgro.id,
      heavyId: companyHeavy.id,
      fleetId: companyFleet.id,
    },
    listings: {
      listing1Id,
      listing2Id,
      listing3Id,
      listing4Id,
    },
  };
}

function requireBrandId(map: Map<string, string>, key: string): string {
  const id = map.get(key);
  if (!id) throw new Error(`Missing brand id for ${key}`);
  return id;
}
