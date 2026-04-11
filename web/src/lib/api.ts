import type {
  ActivityType,
  Brand,
  Category,
  ChatMessage,
  City,
  Company,
  CompanyReview,
  Conversation,
  Country,
  CreateBrandPayload,
  CreateConversationPayload,
  CreateCompanyPayload,
  CreateDealerLeadPayload,
  CreateListingPayload,
  CreateReviewPayload,
  CreateTicketPayload,
  DealerLead,
  Favorite,
  Listing,
  Marketplace,
  PaginatedResponse,
  Subscription,
  ReplyTicketPayload,
  SendMessagePayload,
  SupportTicket,
  TicketMessage,
  UpdateDealerLeadPayload,
  UpdateListingPayload,
  UpdateProfilePayload,
  UpdateTicketPayload,
  User,
  ViewHistoryItem,
} from '@/types/api';
import { useAuthStore } from '@/stores/auth-store';
import { refreshTokens } from '@/lib/auth-api';
import type {
  FieldOption,
  TemplateBlockSchema,
  TemplateFieldSchema,
} from './schemaTypes';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_BASE_NORMALIZED = API_BASE.replace(/\/+$/, '');
type GuestUploadTokenResponse = { token: string; expiresIn: number };
let guestUploadTokenCache: { token: string; expiresAt: number } | null = null;

async function tryRefreshToken(): Promise<string | null> {
  try {
    const result = await refreshTokens();
    useAuthStore.getState().setAuth(result.user, result.accessToken);
    return result.accessToken;
  } catch {
    useAuthStore.getState().logout();
    return null;
  }
}

async function getGuestUploadToken(): Promise<string> {
  const now = Date.now();
  if (guestUploadTokenCache && guestUploadTokenCache.expiresAt > now + 5000) {
    return guestUploadTokenCache.token;
  }

  const res = await fetch(`${API_BASE}/upload/guest-token`, {
    method: 'POST',
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body.message || JSON.stringify(body);
    } catch { /* empty */ }
    throw new Error(detail || `Guest upload token error: ${res.status}`);
  }

  const body = (await res.json()) as Partial<GuestUploadTokenResponse>;
  if (!body.token || typeof body.token !== 'string') {
    throw new Error('Guest upload token response is invalid');
  }

  const expiresIn = typeof body.expiresIn === 'number' ? body.expiresIn : 900;
  guestUploadTokenCache = {
    token: body.token,
    expiresAt: now + Math.max(60, expiresIn) * 1000,
  };
  return body.token;
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  // If 401, try refreshing the token and retry once
  if (res.status === 401) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    }
  }

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body.message || JSON.stringify(body);
    } catch { /* empty */ }
    throw new Error(detail || `API error: ${res.status}`);
  }
  return res.json();
}

function normalizeListingAttributes(rawListing: any) {
  const existing = Array.isArray(rawListing?.attributes) ? rawListing.attributes : [];
  if (existing.length > 0) {
    return existing.map((item: any, index: number) => ({
      id: String(item?.id ?? `${rawListing?.id ?? 'listing'}:${index}`),
      key: String(item?.key ?? ''),
      value: String(item?.value ?? ''),
    }));
  }

  const data = rawListing?.attribute?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return [];
  }

  return Object.entries(data)
    .filter(([key, value]) => key && value !== undefined && value !== null && value !== '')
    .map(([key, value], index) => ({
      id: `${String(rawListing?.id ?? 'listing')}:${index}:${key}`,
      key: String(key),
      value: String(value),
    }));
}

function toApiAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_NORMALIZED}${normalizedPath}`;
}

function normalizeMediaUrl(input: unknown): string {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return '';

  if (raw.startsWith('/upload/files/')) {
    return toApiAbsoluteUrl(raw);
  }

  if (raw.includes('/upload/files/')) {
    try {
      const parsed = new URL(raw);
      const routeMatch = parsed.pathname.match(
        /\/upload\/files\/(images|listings|companies)\/([A-Za-z0-9._-]+)$/,
      );
      if (routeMatch) {
        return toApiAbsoluteUrl(
          `/upload/files/${routeMatch[1]}/${routeMatch[2]}`,
        );
      }
    } catch {
      const routeMatch = raw.match(
        /\/upload\/files\/(images|listings|companies)\/([A-Za-z0-9._-]+)$/,
      );
      if (routeMatch) {
        return toApiAbsoluteUrl(
          `/upload/files/${routeMatch[1]}/${routeMatch[2]}`,
        );
      }
    }
  }

  try {
    const parsed = new URL(raw);
    const match = parsed.pathname.match(
      /^\/[^/]+\/(images|listings|companies)\/([A-Za-z0-9._-]+)$/,
    );
    if (match) {
      const folder = match[1];
      const filename = match[2];
      return `${API_BASE}/upload/files/${folder}/${filename}`;
    }
  } catch {
    return raw;
  }

  return raw;
}

function normalizeListingMedia(rawListing: any) {
  const media = Array.isArray(rawListing?.media) ? rawListing.media : [];
  return media.map((item: any, index: number) => ({
    ...item,
    id: String(item?.id ?? `${rawListing?.id ?? 'listing-media'}:${index}`),
    url: normalizeMediaUrl(item?.url),
  }));
}

function normalizeListing(rawListing: any) {
  if (!rawListing || typeof rawListing !== 'object') return rawListing;
  return {
    ...rawListing,
    media: normalizeListingMedia(rawListing),
    attributes: normalizeListingAttributes(rawListing),
  };
}

// Listings
export const getListings = (params?: URLSearchParams) =>
  fetchApi<PaginatedResponse<Listing>>(`/listings?${params?.toString() ?? ''}`).then((payload: any) => ({
    ...payload,
    data: Array.isArray(payload?.data) ? payload.data.map((item: any) => normalizeListing(item)) : [],
  }));

export const getListingById = (id: string) =>
  fetchApi<Listing>(`/listings/${id}`).then((payload: any) => normalizeListing(payload));

export const getCompanyListings = (companyId: string, params?: URLSearchParams) =>
  fetchApi<PaginatedResponse<Listing>>(`/companies/${companyId}/listings?${params?.toString() ?? ''}`).then((payload: any) => ({
    ...payload,
    data: Array.isArray(payload?.data) ? payload.data.map((item: any) => normalizeListing(item)) : [],
  }));

// Companies
export const getCompanies = (params?: URLSearchParams) =>
  fetchApi<PaginatedResponse<Company>>(`/companies?${params?.toString() ?? ''}`);

export const getCompanyBySlug = (slug: string) =>
  fetchApi<Company>(`/companies/${slug}`);

export const createCompany = (data: CreateCompanyPayload) =>
  fetchApi<Company>('/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getCompanyReviews = (companyId: string, params?: URLSearchParams) =>
  fetchApi<PaginatedResponse<CompanyReview>>(`/companies/${companyId}/reviews?${params?.toString() ?? ''}`);

export const createCompanyReview = (companyId: string, data: CreateReviewPayload) =>
  fetchApi<CompanyReview>(`/companies/${companyId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getMySubscription = () =>
  fetchApi<Subscription | null>('/subscriptions/me');

// Listing status actions
export const submitListing = (id: string) =>
  fetchApi<Listing>(`/listings/${id}/submit`, { method: 'POST' });

export const approveListing = (id: string) =>
  fetchApi<Listing>(`/listings/${id}/approve`, { method: 'POST' });

export const rejectListing = (id: string, moderationReason: string) =>
  fetchApi<Listing>(`/listings/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ status: 'REJECTED', moderationReason }),
  });

export const pauseListing = (id: string) =>
  fetchApi<Listing>(`/listings/${id}/pause`, { method: 'POST' });

export const resumeListing = (id: string) =>
  fetchApi<Listing>(`/listings/${id}/resume`, { method: 'POST' });

export const resubmitListing = (id: string) =>
  fetchApi<Listing>(`/listings/${id}/resubmit`, { method: 'POST' });

// Dealer Leads
export const createDealerLead = (data: CreateDealerLeadPayload) =>
  fetchApi<DealerLead>('/dealer-leads', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getDealerLeads = (params?: URLSearchParams) =>
  fetchApi<PaginatedResponse<DealerLead>>(`/dealer-leads?${params?.toString() ?? ''}`);

export const getDealerLeadById = (id: string) =>
  fetchApi<DealerLead>(`/dealer-leads/${id}`);

export const updateDealerLead = (id: string, data: UpdateDealerLeadPayload) =>
  fetchApi<DealerLead>(`/dealer-leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// Listing CRUD
export const createListing = (data: CreateListingPayload) =>
  fetchApi<Listing>('/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((payload: any) => normalizeListing(payload));

export const updateListing = (id: string, data: UpdateListingPayload) =>
  fetchApi<Listing>(`/listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }).then((payload: any) => normalizeListing(payload));

// File Upload
export async function uploadImages(files: File[]): Promise<{ urls: string[] }> {
  let token = useAuthStore.getState().accessToken;
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers['x-upload-token'] = await getGuestUploadToken();
  }

  let res = await fetch(`${API_BASE}/upload/images`, {
    method: 'POST',
    headers,
    body: formData,
  });

  // If 401, try refreshing the token and retry once
  if (res.status === 401) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      token = newToken;
      const retryFormData = new FormData();
      files.forEach((file) => retryFormData.append('files', file));
      res = await fetch(`${API_BASE}/upload/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: retryFormData,
      });
    } else if (!token) {
      guestUploadTokenCache = null;
      const retryFormData = new FormData();
      files.forEach((file) => retryFormData.append('files', file));
      res = await fetch(`${API_BASE}/upload/images`, {
        method: 'POST',
        headers: { 'x-upload-token': await getGuestUploadToken() },
        body: retryFormData,
      });
    }
  }

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body.message || JSON.stringify(body);
    } catch { /* empty */ }
    throw new Error(detail || `Upload error: ${res.status}`);
  }
  const payload = await res.json().catch(() => ({}));
  const urls = Array.isArray(payload?.urls)
    ? payload.urls
        .map((url: unknown) => normalizeMediaUrl(url))
        .filter((url: string) => Boolean(url))
    : [];

  if (urls.length === 0) {
    throw new Error('Upload succeeded but no usable image URLs were returned.');
  }

  return { urls };
}

// Profile
export const updateProfile = (data: UpdateProfilePayload) =>
  fetchApi<User>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// ─── Favorites ─────────────────────────────────────
export const addFavorite = (listingId: string) =>
  fetchApi<Favorite>(`/favorites/${listingId}`, { method: 'POST' });

export const removeFavorite = (listingId: string) =>
  fetchApi<void>(`/favorites/${listingId}`, { method: 'DELETE' });

export const getFavorites = (params?: URLSearchParams) =>
  fetchApi<PaginatedResponse<Favorite>>(`/favorites?${params?.toString() ?? ''}`);

export const checkFavorite = (listingId: string) =>
  fetchApi<{ isFavorite: boolean }>(`/favorites/check/${listingId}`);

// ─── View History ──────────────────────────────────
export const recordView = (listingId: string) =>
  fetchApi<ViewHistoryItem>(`/view-history/${listingId}`, { method: 'POST' });

export const getViewHistory = (params?: URLSearchParams) =>
  fetchApi<PaginatedResponse<ViewHistoryItem>>(`/view-history?${params?.toString() ?? ''}`);

// ─── Messages ──────────────────────────────────────
export const startConversation = (data: CreateConversationPayload) =>
  fetchApi<Conversation>('/messages/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getConversations = (params?: URLSearchParams) =>
  fetchApi<PaginatedResponse<Conversation>>(`/messages/conversations?${params?.toString() ?? ''}`);

export const getConversation = (id: string) =>
  fetchApi<Conversation>(`/messages/conversations/${id}`);

export const sendMessage = (conversationId: string, data: SendMessagePayload) =>
  fetchApi<ChatMessage>(`/messages/conversations/${conversationId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getUnreadCount = () =>
  fetchApi<{ count: number }>('/messages/unread-count');

// ─── Support ───────────────────────────────────────
export const createTicket = (data: CreateTicketPayload) =>
  fetchApi<SupportTicket>('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getMyTickets = (params?: URLSearchParams) =>
  fetchApi<PaginatedResponse<SupportTicket>>(`/support/tickets?${params?.toString() ?? ''}`);

export const getAllTickets = (params?: URLSearchParams) =>
  fetchApi<PaginatedResponse<SupportTicket>>(`/support/tickets/all?${params?.toString() ?? ''}`);

export const getTicket = (id: string) =>
  fetchApi<SupportTicket>(`/support/tickets/${id}`);

export const replyToTicket = (id: string, data: ReplyTicketPayload) =>
  fetchApi<TicketMessage>(`/support/tickets/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateTicket = (id: string, data: UpdateTicketPayload) =>
  fetchApi<SupportTicket>(`/support/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// ─── Admin ────────────────────────────────────────

export interface AdminStats {
  usersCount: number;
  listingsCount: number;
  companiesCount: number;
  activeTicketsCount: number;
}

export const getAdminStats = () =>
  fetchApi<AdminStats>('/admin/stats');

export const getUsers = (params?: URLSearchParams) =>
  fetchApi<PaginatedResponse<User>>(`/users?${params?.toString() ?? ''}`);

export const updateUser = (userId: string, data: { role?: string; status?: string }) =>
  fetchApi<User>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

// ─── Admin Company Management ─────────────────────

export const verifyCompany = (id: string) =>
  fetchApi<Company>(`/companies/${id}/verify`, { method: 'PATCH' });

export const updateCompanyFlags = (id: string, data: { isOfficialDealer?: boolean; isManufacturer?: boolean }) =>
  fetchApi<Company>(`/companies/${id}/flags`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteCompany = (id: string) =>
  fetchApi<void>(`/companies/${id}`, { method: 'DELETE' });

export const deleteReview = (companyId: string, reviewId: string) =>
  fetchApi<void>(`/companies/${companyId}/reviews/${reviewId}`, { method: 'DELETE' });

export const removeListing = (id: string) =>
  fetchApi<Listing>(`/listings/${id}/remove`, { method: 'POST' });

export const deleteConversation = (id: string) =>
  fetchApi<void>(`/messages/conversations/${id}`, { method: 'DELETE' });

// ─── Admin Messages Oversight ─────────────────────

export const getAllConversations = (params?: URLSearchParams) =>
  fetchApi<PaginatedResponse<Conversation>>(`/messages/conversations/all?${params?.toString() ?? ''}`);

export const getConversationAdmin = (id: string) =>
  fetchApi<Conversation>(`/messages/conversations/${id}/admin`);

// ─── Notifications ────────────────────────────────

export const getNotifications = (params?: URLSearchParams) =>
  fetchApi<PaginatedResponse<import('@/types/api').Notification>>(`/notifications?${params?.toString() ?? ''}`);

export const getNotificationUnreadCount = () =>
  fetchApi<{ count: number }>('/notifications/unread-count');

export const markNotificationRead = (id: string) =>
  fetchApi<void>(`/notifications/${id}/read`, { method: 'PATCH' });

export const markAllNotificationsRead = () =>
  fetchApi<void>('/notifications/read-all', { method: 'POST' });

// ─── Saved Searches ───────────────────────────────

export const getSavedSearches = () =>
  fetchApi<import('@/types/api').SavedSearch[]>('/saved-searches');

export const createSavedSearch = (data: { name: string; filters: Record<string, string> }) =>
  fetchApi<import('@/types/api').SavedSearch>('/saved-searches', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteSavedSearch = (id: string) =>
  fetchApi<void>(`/saved-searches/${id}`, { method: 'DELETE' });

// Reference data
export const getMarketplaces = () => fetchApi<Marketplace[]>('/marketplaces');
export const getCategories = (marketplaceId?: string) =>
  fetchApi<Category[]>(`/categories${marketplaceId ? `?marketplaceId=${marketplaceId}` : ''}`);
export const getBrands = (categoryId?: string) =>
  fetchApi<Brand[]>(`/brands${categoryId ? `?categoryId=${categoryId}` : ''}`);
export const createBrand = (data: CreateBrandPayload) =>
  fetchApi<Brand>('/brands', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const getCountries = () => fetchApi<Country[]>('/countries');
export const getCities = (countryId?: string) =>
  fetchApi<PaginatedResponse<City>>(`/cities${countryId ? `?countryId=${countryId}` : ''}`);
export const getActivityTypes = () => fetchApi<ActivityType[]>('/activity-types');

// ─── Search & Filters ──────────────────────────────

export interface SearchResponse {
  data: Listing[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FacetsResponse {
  categories: Array<{ id: string; name: string; count: number }>;
  brands: Array<{ id: string; name: string; count: number }>;
  priceRange?: { min: number; max: number };
  yearRange?: { min: number; max: number };
}

export const searchListings = (params?: URLSearchParams) =>
  fetchApi<SearchResponse>(`/search?${params?.toString() ?? ''}`);

export const getSearchFacets = (params?: URLSearchParams) =>
  fetchApi<FacetsResponse>(`/search/facets?${params?.toString() ?? ''}`);

// ─── Dynamic Forms ─────────────────────────────────

export interface FormTemplate {
  id: string;
  categoryId: string;
  version: number;
  blockIds?: string[];
  blocks?: TemplateBlockSchema[];
  category?: { id: string; slug: string; hasEngine?: boolean };
  fields: FormField[];
  resolvedFields?: FormField[];
}

export type FormField = TemplateFieldSchema;

export interface ValidateDraftPayload {
  categoryId: string;
  attributes: Record<string, any>;
}

export interface ValidationResponse {
  valid: boolean;
  success?: boolean;
  errors?: Array<{ field: string; message: string }>;
}

export const getCategoryTemplate = (categoryId: string) =>
  fetchApi<FormTemplate>(`/categories/${categoryId}/template`);

export const validateListingDraft = (data: ValidateDraftPayload) =>
  fetchApi<any>('/listings/draft/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((response) => ({
    valid: Boolean(response?.valid ?? response?.success),
    success: Boolean(response?.success ?? response?.valid),
    errors: response?.errors ?? [],
  }));

export const updateListingAttributes = (id: string, attributes: Array<{ key: string; value: string }>) =>
  fetchApi<Listing>(`/listings/${id}/attributes`, {
    method: 'PUT',
    body: JSON.stringify({ attributes }),
  });

// ─── Contact Management ────────────────────────────

export interface ContactPayload {
  name: string;
  email?: string;
  phoneCountry?: string;
  phoneNumber?: string;
}

export const updateListingContact = (id: string, data: ContactPayload) =>
  fetchApi<Listing>(`/listings/${id}/contact`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// ─── Presigned Upload ──────────────────────────────

export interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export const getPresignedUploadUrl = () =>
  fetchApi<PresignedUploadResponse>('/upload/presigned');

export const uploadToS3 = async (presignedUrl: string, file: File): Promise<void> => {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!res.ok) {
    throw new Error(`S3 upload failed: ${res.status}`);
  }
};

// ─── Admin Marketplaces & Categories ────────────────

export interface AdminMarketplace {
  id: number;
  key: string;
  name: string;
  isActive: boolean;
}

export interface AdminCategory {
  id: number;
  marketplaceId: number;
  name: string;
  slug: string;
  parentId?: number | null;
  sortOrder?: number | null;
  hasEngine?: boolean;
  submissionStatus: import('@/types/api').CategorySubmissionStatus;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  suggestedByUser?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  children?: AdminCategory[];
}

export interface CategorySuggestionResult {
  value: string;
  label: string;
  status: import('@/types/api').CategorySubmissionStatus;
}

export interface AdminBrand {
  id: string;
  name: string;
  categories: Array<{
    id: number;
    name: string;
    marketplaceId: number;
    parentId: number | null;
  }>;
  listingsCount: number;
  modelsCount: number;
}

export const getAdminMarketplaces = () =>
  fetchApi<AdminMarketplace[]>('/admin/marketplaces');

export const getAdminBrands = () =>
  fetchApi<AdminBrand[]>('/admin/brands');

export const createAdminMarketplace = (data: { key: string; name: string }) =>
  fetchApi<AdminMarketplace>('/admin/marketplaces', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateAdminMarketplace = (id: number, data: { name?: string; isActive?: boolean }) =>
  fetchApi<AdminMarketplace>(`/admin/marketplaces/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteAdminMarketplace = (id: number) =>
  fetchApi<void>(`/admin/marketplaces/${id}`, {
    method: 'DELETE',
  });

export const createAdminBrand = (data: { name: string; categoryId?: number }) =>
  fetchApi<AdminBrand>('/admin/brands', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateAdminBrand = (
  id: string,
  data: { name?: string; categoryId?: number | null },
) =>
  fetchApi<AdminBrand>(`/admin/brands/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteAdminBrand = (id: string) =>
  fetchApi<void>(`/admin/brands/${id}`, {
    method: 'DELETE',
  });

export const getAdminCategories = () =>
  fetchApi<AdminCategory[]>('/admin/categories');

export const createAdminCategory = (data: {
  marketplaceId: number;
  name: string;
  slug: string;
  parentId?: number;
  sortOrder?: number;
  hasEngine?: boolean;
}) =>
  fetchApi<AdminCategory>('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateAdminCategory = (id: number, data: {
  name?: string;
  slug?: string;
  parentId?: number;
  sortOrder?: number;
  hasEngine?: boolean;
}) =>
  fetchApi<AdminCategory>(`/admin/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteAdminCategory = (id: number) =>
  fetchApi<void>(`/admin/categories/${id}`, { method: 'DELETE' });

export const approveAdminCategory = (id: number) =>
  fetchApi<AdminCategory>(`/admin/categories/${id}/approve`, {
    method: 'PATCH',
  });

export const rejectAdminCategory = (id: number, reason?: string) =>
  fetchApi<AdminCategory>(`/admin/categories/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });

export const getAdminTemplates = () =>
  fetchApi<import('@/types/api').AdminTemplate[]>('/admin/templates');

export const createAdminTemplate = (data: {
  categoryId: number;
  name?: string;
  fields: any[];
  blockIds?: string[];
}) =>
  fetchApi<FormTemplate>('/admin/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateAdminTemplate = (
  id: number,
  data: { fields: any[]; blockIds?: string[] },
) =>
  fetchApi<FormTemplate>(`/admin/templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const getAdminTemplate = (id: number) =>
  fetchApi<FormTemplate>(`/admin/templates/${id}`);

export const deleteAdminTemplate = (id: number) =>
  fetchApi<void>(`/admin/templates/${id}`, { method: 'DELETE' });

export const updateAdminTemplateStatus = (id: number, isActive: boolean) =>
  fetchApi<import('@/types/api').AdminTemplate>(`/admin/templates/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });

export const getCategoryTemplateByCategory = (categoryId: number) =>
  fetchApi<FormTemplate | null>(`/categories/${categoryId}/template`).catch(() => null);

export const getTemplateBlocks = () =>
  fetchApi<TemplateBlockSchema[]>('/admin/blocks');

export const createTemplateBlock = (data: { name: string; fields: TemplateFieldSchema[] }) =>
  fetchApi<TemplateBlockSchema>('/admin/blocks', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateTemplateBlock = (
  id: string,
  data: { name?: string; fields?: TemplateFieldSchema[] },
) =>
  fetchApi<TemplateBlockSchema>(`/admin/blocks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteTemplateBlock = (id: string) =>
  fetchApi<{ ok: boolean }>(`/admin/blocks/${id}`, { method: 'DELETE' });

export const getBrandOptions = (categoryId?: string) =>
  fetchApi<FieldOption[]>(`/options/brands${categoryId ? `?categoryId=${categoryId}` : ''}`);

export const getModelOptions = (brandId?: string) =>
  fetchApi<FieldOption[]>(`/options/models${brandId ? `?brandId=${brandId}` : ''}`);

export const resolveDbOptions = (payload: {
  optionsQuery?: Record<string, any>;
  depends?: Record<string, any>;
}) =>
  fetchApi<FieldOption[]>('/options/resolve', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const createBrandOption = (payload: { name: string; categoryId?: string }) =>
  fetchApi<FieldOption>('/options/brands', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const createModelOption = (payload: {
  name: string;
  brandId?: string;
  categoryId?: string;
}) =>
  fetchApi<FieldOption>('/options/models', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const createCategoryOption = (payload: {
  name: string;
  marketplaceId: string;
  parentId?: string;
}) =>
  fetchApi<CategorySuggestionResult>('/options/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const createCountryOption = (payload: { name: string; iso2?: string }) =>
  fetchApi<FieldOption>('/options/countries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const createCityOption = (payload: { name: string; countryId: string }) =>
  fetchApi<FieldOption>('/options/cities', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
