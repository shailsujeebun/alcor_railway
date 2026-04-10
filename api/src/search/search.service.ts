import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListingStatus } from '@prisma/client';

/** Flatten the nested `fact` relation into top-level price / condition / year fields */
function flattenListingFact(listing: any): any {
  if (!listing) return listing;
  const { fact, ...rest } = listing;
  const priceAmount = fact?.priceAmount != null ? Number(fact.priceAmount) : null;
  const priceCurrency = fact?.priceCurrency ?? null;
  const priceType = priceAmount != null ? 'FIXED' : 'ON_REQUEST';
  const condition = fact?.condition ?? null;
  const year = fact?.year ?? null;
  return {
    ...rest,
    priceAmount,
    priceCurrency,
    priceType,
    condition,
    year,
  };
}

export interface SearchQuery {
  q?: string;
  search?: string;
  category?: string;
  marketplaceId?: string;
  categoryId?: string;
  brandId?: string;
  condition?: string;
  priceCurrency?: string;
  countryId?: string;
  cityId?: string;
  minPrice?: number;
  maxPrice?: number;
  yearMin?: number;
  yearMax?: number;
  page?: number;
  limit?: number;
  [key: string]: any; // Dynamic attributes
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchQuery) {
    const {
      q,
      category, // Legacy slug support
      categoryId, // ID support
      marketplaceId, // Add this
      priceMin,
      priceMax,
      priceCurrency,
      yearMin,
      yearMax,
      brandId,
      countryId,
      cityId,
      condition,
      listingType,
      page = 1,
      limit = 20,
      sort,
      ...attributes
    } = query;

    const skip = (page - 1) * limit;

    // Build Where Clause
    const where: any = {
      status: ListingStatus.ACTIVE,
    };

    // Marketplace Filter
    if (marketplaceId) {
      where.marketplaceId = BigInt(marketplaceId);
    }

    // Keyword Search (Title)
    const keyword = q ?? query.search;
    if (keyword) {
      where.title = { contains: keyword, mode: 'insensitive' };
    }

    // Category Filter (ID or Slug)
    if (categoryId) {
      try {
        where.categoryId = BigInt(categoryId);
      } catch (e) {
        // Invalid BigInt
      }
    } else if (category) {
      where.category = { slug: category };
    }

    // Direct Relations
    if (brandId) {
      where.brandId = brandId;
    }

    if (countryId) {
      where.countryId = countryId;
    }

    if (cityId) {
      where.cityId = cityId;
    }

    // Fact Filtering (Price, Year, Condition, etc.)
    const factFilter: any = {};

    if (priceMin !== undefined || priceMax !== undefined || priceCurrency) {
      factFilter.priceAmount = {};
      if (priceMin !== undefined) factFilter.priceAmount.gte = priceMin;
      if (priceMax !== undefined) factFilter.priceAmount.lte = priceMax;

      if (priceCurrency) {
        factFilter.priceCurrency = priceCurrency;
      }
    }

    if (yearMin !== undefined || yearMax !== undefined) {
      factFilter.year = {};
      if (yearMin !== undefined) factFilter.year.gte = yearMin;
      if (yearMax !== undefined) factFilter.year.lte = yearMax;
    }

    if (condition) {
      factFilter.condition = condition;
    }

    // Only attach fact filter if it has keys or if we check empty object?
    // Prisma handles empty objects gracefully usually, but let's be safe.
    if (Object.keys(factFilter).length > 0) {
      where.fact = factFilter;
    }

    // Dynamic Attribute Filtering
    const attrFilters = Object.entries(attributes).filter(
      ([k]) => k !== 'order',
    );

    // If listingType is provided, treat it as an attribute for now since it's not on Listing/ListingFact
    if (listingType) {
      attrFilters.push(['type', listingType]);
    }

    if (attrFilters.length > 0) {
      where.AND = attrFilters.map(([key, value]) => ({
        attribute: {
          data: {
            path: [key],
            equals: isNaN(Number(value)) ? value : Number(value),
          },
        },
      }));
    }

    // Sort Mapping
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'priceAsc') orderBy = { fact: { priceAmount: 'asc' } };
    else if (sort === 'priceDesc') orderBy = { fact: { priceAmount: 'desc' } };
    else if (sort === 'yearAsc') orderBy = { fact: { year: 'asc' } };
    else if (sort === 'yearDesc') orderBy = { fact: { year: 'desc' } };
    else if (sort === 'publishedAt') orderBy = { publishedAt: 'desc' };

    // Execute Query
    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          brand: true,
          country: true,
          city: true,
          company: true,
          media: { take: 1, orderBy: { sortOrder: 'asc' } },
          fact: true,
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    const facets = await this.getFacets(query);

    return {
      data: items.map(flattenListingFact),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      facets,
    };
  }

  async getFacets(query: SearchQuery) {
    // Simple Facets for now
    // TODO: Context-aware facets based on current query
    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      select: { id: true, slug: true, name: true },
    });

    const brands = await this.prisma.brand.findMany({
      select: { id: true, name: true },
    });

    const priceStats = await this.prisma.listingFact.aggregate({
      _min: { priceAmount: true },
      _max: { priceAmount: true },
      where: { listing: { status: ListingStatus.ACTIVE } },
    });

    return {
      categories: JSON.parse(
        JSON.stringify(
          categories,
          (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, // Handle BigInt
        ),
      ),
      brands,
      priceMin: priceStats._min.priceAmount,
      priceMax: priceStats._max.priceAmount,
    };
  }
}
