export type ListingCondition = 'NEW' | 'USED' | 'DEMO';
export type PriceType = 'FIXED' | 'NEGOTIABLE' | 'ON_REQUEST';
export type ListingType = 'SALE' | 'RENT' | 'FROM_MANUFACTURER';
export type MediaKind = 'LOGO' | 'COVER' | 'GALLERY' | 'PHOTO' | 'VIDEO' | 'PDF';
export type ListingStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING_MODERATION' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'REJECTED' | 'REMOVED';
export type DealerLeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PACKAGE_SELECTED' | 'CONVERTED' | 'REJECTED';
export type CategorySubmissionStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface Country {
  id: string;
  iso2: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  countryId: string;
  country?: Country;
}

export interface Brand {
  id: string;
  name: string;
}

export interface CreateBrandPayload {
  name: string;
  categoryId?: string;
}

export interface ActivityType {
  id: string;
  code: string;
  name: string;
}

export interface Marketplace {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  marketplaceId: string;
  slug: string;
  name: string;
  parentId: string | null;
  hasEngine?: boolean;
  submissionStatus?: CategorySubmissionStatus;
  children?: Category[];
}

export interface CompanyPhone {
  id: string;
  label: string | null;
  phoneE164: string;
  isPrimary: boolean;
}

export interface CompanyMedia {
  id: string;
  kind: MediaKind;
  url: string;
  sortOrder: number;
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  countryId: string | null;
  country: Country | null;
  cityId: string | null;
  city: City | null;
  region: string | null;
  addressLine: string | null;
  website: string | null;
  contactPerson: string | null;
  workingHours: string | null;
  languages: string | null;
  yearsOnPlatform: number | null;
  yearsOnMarket: number | null;
  isVerified: boolean;
  isOfficialDealer: boolean;
  isManufacturer: boolean;
  ratingAvg: number;
  reviewsCount: number;
  listingsCount: number;
  ratingSource: string | null;
  photosCount: number;
  createdAt: string;
  updatedAt: string;
  phones?: CompanyPhone[];
  media?: CompanyMedia[];
  activities?: { activityType: ActivityType }[];
  brands?: { brand: Brand }[];
}

export interface CompanyReview {
  id: string;
  companyId: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
}

export interface CreateCompanyPayload {
  name: string;
  slug: string;
  description?: string;
  countryId?: string;
  cityId?: string;
}

export interface ListingMedia {
  id: string;
  url: string;
  sortOrder: number;
  type?: MediaKind;
}

export interface ListingAttribute {
  id: string;
  key: string;
  value: string;
}

export interface Listing {
  id: string;
  companyId: string;
  company?: Company;
  ownerUserId: string | null;
  ownerUser?: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
  title: string;
  description: string | null;
  categoryId: string | null;
  category: Category | null;
  brandId: string | null;
  brand: Brand | null;
  condition: ListingCondition | null;
  year: number | null;
  priceAmount: number | null;
  priceCurrency: string | null;
  priceType: PriceType | null;
  countryId: string | null;
  country: Country | null;
  cityId: string | null;
  city: City | null;
  sellerName: string | null;
  sellerEmail: string | null;
  sellerPhones: string[];
  externalUrl: string | null;
  hoursValue: number | null;
  hoursUnit: string | null;
  listingType: ListingType | null;
  euroClass: string | null;
  status: ListingStatus;
  moderationReason: string | null;
  submittedAt: string | null;
  moderatedAt: string | null;
  expiresAt: string | null;
  isVideo: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  media?: ListingMedia[];
  attributes?: ListingAttribute[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateReviewPayload {
  authorName: string;
  rating: number;
  title?: string;
  body?: string;
}

// ─── Auth Types ──────────────────────────────────────

export type UserRole = 'USER' | 'PRO_SELLER' | 'MANAGER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'RESTRICTED' | 'BLOCKED';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  locale: string;
  emailVerified: boolean;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// ─── Dealer Lead Types ──────────────────────────────

export interface DealerLead {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string | null;
  countryId: string | null;
  country: Country | null;
  cityId: string | null;
  city: City | null;
  activityTypes: string[];
  brands: string[];
  equipmentCount: number | null;
  message: string | null;
  status: DealerLeadStatus;
  assignedToUserId: string | null;
  assignedToUser: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
  notes: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealerLeadPayload {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  countryId?: string;
  cityId?: string;
  activityTypes?: string[];
  brands?: string[];
  equipmentCount?: number;
  message?: string;
}

export interface UpdateDealerLeadPayload {
  status?: DealerLeadStatus;
  assignedToUserId?: string;
  notes?: string;
}

// ─── Listing Payloads ───────────────────────────────

export interface CreateListingPayload {
  companyId: string;
  title: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  condition?: ListingCondition;
  year?: number;
  priceAmount?: number;
  priceCurrency?: string;
  priceType?: PriceType;
  countryId?: string;
  cityId?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhones?: string[];
  externalUrl?: string;
  hoursValue?: number;
  hoursUnit?: string;
  listingType?: ListingType;
  euroClass?: string;
  isVideo?: boolean;
  media?: { url: string; sortOrder?: number }[];
  attributes?: { key: string; value: string }[];
}

export type UpdateListingPayload = Partial<Omit<CreateListingPayload, 'companyId'>>;

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  priceMonthly: number | null;
  priceYearly: number | null;
  currency: string;
  features: string[];
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  plan: Plan;
}

// ─── Favorites & View History ──────────────────────

export interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  listing: Listing;
  createdAt: string;
}

export interface ViewHistoryItem {
  id: string;
  userId: string;
  listingId: string;
  listing: Listing;
  viewedAt: string;
}

// ─── Conversations & Messages ──────────────────────

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface UserBrief {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl?: string | null;
}

export interface Conversation {
  id: string;
  listingId: string;
  listing: {
    id: string;
    title: string;
    media?: ListingMedia[];
  };
  buyerId: string;
  buyer: UserBrief;
  sellerId: string;
  seller: UserBrief;
  lastMessageAt: string | null;
  createdAt: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: UserBrief;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface CreateConversationPayload {
  listingId: string;
  sellerId?: string;
  body: string;
}

export interface SendMessagePayload {
  body: string;
}

// ─── Support Tickets ───────────────────────────────

export interface SupportTicket {
  id: string;
  userId: string;
  user: UserBrief;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedToId: string | null;
  assignedTo: UserBrief | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
  _count?: { messages: number };
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  sender: UserBrief;
  body: string;
  isStaff: boolean;
  createdAt: string;
}

export interface CreateTicketPayload {
  subject: string;
  body: string;
  priority?: TicketPriority;
}

export interface ReplyTicketPayload {
  body: string;
}

export interface UpdateTicketPayload {
  status?: TicketStatus;
  assignedToId?: string;
  priority?: TicketPriority;
}

// ─── Notifications ───────────────────────────────

export type NotificationType = 'LISTING_APPROVED' | 'LISTING_REJECTED' | 'NEW_MESSAGE' | 'TICKET_REPLY' | 'REVIEW_RECEIVED' | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Saved Searches ─────────────────────────────────

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: Record<string, string>;
  createdAt: string;
}

export interface AdminTemplate {
  id: string;
  categoryId: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    marketplace?: { name: string };
  };
  fields?: { id: string }[];
}
