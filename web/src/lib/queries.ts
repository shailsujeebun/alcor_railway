'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import type {
  CreateConversationPayload,
  CreateCompanyPayload,
  CreateDealerLeadPayload,
  CreateListingPayload,
  CreateReviewPayload,
  CreateTicketPayload,
  ReplyTicketPayload,
  SendMessagePayload,
  UpdateDealerLeadPayload,
  UpdateListingPayload,
  UpdateProfilePayload,
  UpdateTicketPayload,
} from '@/types/api';

export function useListings(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return useQuery({
    queryKey: ['listings', params],
    queryFn: () => api.getListings(searchParams),
  });
}

export function useListingDetail(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.getListingById(id),
    enabled: !!id,
  });
}

export function useCompanies(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => api.getCompanies(searchParams),
  });
}

export function useMyCompanies() {
  return useQuery({
    queryKey: ['my-companies'],
    queryFn: api.getMyCompanies,
  });
}

export function useCompanyDetail(slug: string) {
  return useQuery({
    queryKey: ['company', slug],
    queryFn: () => api.getCompanyBySlug(slug),
    enabled: !!slug,
  });
}

export function useCompanyReviews(companyId: string, page: number = 1) {
  const params = new URLSearchParams({ page: String(page), limit: '10' });
  return useQuery({
    queryKey: ['company-reviews', companyId, page],
    queryFn: () => api.getCompanyReviews(companyId, params),
    enabled: !!companyId,
  });
}

export function useCompanyListings(companyId: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return useQuery({
    queryKey: ['company-listings', companyId, params],
    queryFn: () => api.getCompanyListings(companyId, searchParams),
    enabled: !!companyId,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompanyPayload) => api.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useMarketplaces() {
  return useQuery({
    queryKey: ['marketplaces'],
    queryFn: api.getMarketplaces,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories(marketplaceId?: string) {
  return useQuery({
    queryKey: ['categories', marketplaceId ?? 'all'],
    queryFn: () => api.getCategories(marketplaceId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBrands(categoryId?: string) {
  return useQuery({
    queryKey: ['brands', categoryId ?? 'all'],
    queryFn: () => api.getBrands(categoryId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; categoryId?: string }) => api.createBrand(data),
    onSuccess: (_brand, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      if (variables.categoryId) {
        queryClient.invalidateQueries({ queryKey: ['brands', variables.categoryId] });
      }
    },
  });
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: api.getCountries,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCities(countryId?: string) {
  return useQuery({
    queryKey: ['cities', countryId],
    queryFn: () => api.getCities(countryId),
    enabled: !!countryId,
  });
}

export function useActivityTypes() {
  return useQuery({
    queryKey: ['activity-types'],
    queryFn: api.getActivityTypes,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateReview(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReviewPayload) => api.createCompanyReview(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-reviews', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
  });
}

// ─── Listing Status Mutations ────────────────────────

export function useSubmitListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.submitListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useApproveListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.approveListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useRejectListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.rejectListing(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function usePauseListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.pauseListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useResumeListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.resumeListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useResubmitListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.resubmitListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useImportListingsCsv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { csvContent: string; defaultCompanyId?: string }) =>
      api.importListingsCsv(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// ─── Dealer Leads ───────────────────────────────────

export function useDealerLeads(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return useQuery({
    queryKey: ['dealer-leads', params],
    queryFn: () => api.getDealerLeads(searchParams),
  });
}

export function useDealerLeadDetail(id: string) {
  return useQuery({
    queryKey: ['dealer-lead', id],
    queryFn: () => api.getDealerLeadById(id),
    enabled: !!id,
  });
}

export function useCreateDealerLead() {
  return useMutation({
    mutationFn: (data: CreateDealerLeadPayload) => api.createDealerLead(data),
  });
}

export function useUpdateDealerLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDealerLeadPayload }) =>
      api.updateDealerLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer-leads'] });
    },
  });
}

// ─── Admin ────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: api.getAdminStats,
  });
}

export function useAdminTemplates() {
  return useQuery({
    queryKey: ['admin-templates'],
    queryFn: api.getAdminTemplates,
  });
}

export function useDeleteAdminTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteAdminTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
    },
  });
}

export function useUpdateAdminTemplateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.updateAdminTemplateStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
    },
  });
}

export function useUsers(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => api.getUsers(searchParams),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { role?: string; status?: string } }) =>
      api.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

// ─── Admin Company Management ─────────────────────

export function useVerifyCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.verifyCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useUpdateCompanyFlags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isOfficialDealer?: boolean; isManufacturer?: boolean } }) =>
      api.updateCompanyFlags(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, reviewId }: { companyId: string; reviewId: string }) =>
      api.deleteReview(companyId, reviewId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company-reviews', variables.companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useRemoveListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// ─── Admin Messages Oversight ─────────────────────

export function useAllConversations(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return useQuery({
    queryKey: ['all-conversations', params],
    queryFn: () => api.getAllConversations(searchParams),
  });
}

export function useConversationAdmin(id: string) {
  return useQuery({
    queryKey: ['conversation-admin', id],
    queryFn: () => api.getConversationAdmin(id),
    enabled: !!id,
  });
}

// ─── Listing CRUD Mutations ─────────────────────────

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListingPayload) => api.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateListingPayload }) =>
      api.updateListing(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// ─── Profile ────────────────────────────────────────

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}

// ─── Favorites ─────────────────────────────────────

export function useFavorites(page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  return useQuery({
    queryKey: ['favorites', page],
    queryFn: () => api.getFavorites(params),
  });
}

export function useCheckFavorite(listingId: string, enabled = true) {
  return useQuery({
    queryKey: ['favorite-check', listingId],
    queryFn: () => api.checkFavorite(listingId),
    enabled: !!listingId && enabled,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) => api.addFavorite(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-check'] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) => api.removeFavorite(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-check'] });
    },
  });
}

// ─── View History ──────────────────────────────────

export function useViewHistory(page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  return useQuery({
    queryKey: ['view-history', page],
    queryFn: () => api.getViewHistory(params),
  });
}

export function useRecordView() {
  return useMutation({
    mutationFn: (listingId: string) => api.recordView(listingId),
  });
}

// ─── Messages ──────────────────────────────────────

export function useConversations(page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  return useQuery({
    queryKey: ['conversations', page],
    queryFn: () => api.getConversations(params),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => api.getConversation(id),
    enabled: !!id,
    refetchInterval: 10000,
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConversationPayload) => api.startConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessagePayload) => api.sendMessage(conversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: api.getUnreadCount,
    refetchInterval: 30000,
  });
}

// ─── Support Tickets ───────────────────────────────

export function useMyTickets(page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  return useQuery({
    queryKey: ['my-tickets', page],
    queryFn: () => api.getMyTickets(params),
  });
}

export function useAllTickets(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return useQuery({
    queryKey: ['all-tickets', params],
    queryFn: () => api.getAllTickets(searchParams),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => api.getTicket(id),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketPayload) => api.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    },
  });
}

export function useReplyToTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReplyTicketPayload) => api.replyToTicket(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketPayload }) =>
      api.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket'] });
    },
  });
}

// ─── Notifications ────────────────────────────────

export function useNotifications(page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  return useQuery({
    queryKey: ['notifications', page],
    queryFn: () => api.getNotifications(params),
  });
}

export function useNotificationUnreadCount() {
  return useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: api.getNotificationUnreadCount,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });
}

// ─── Saved Searches ───────────────────────────────

export function useSavedSearches() {
  return useQuery({
    queryKey: ['saved-searches'],
    queryFn: api.getSavedSearches,
  });
}

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; filters: Record<string, string> }) =>
      api.createSavedSearch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteSavedSearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });
}

// ─── Plans & Subscriptions ─────────────────────────



export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: api.getPlans,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMySubscription() {
  return useQuery({
    queryKey: ['my-subscription'],
    queryFn: api.getMySubscription,
  });
}

// ─── Search & Filters ──────────────────────────────

export function useSearchListings(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => api.searchListings(searchParams),
  });
}

export function useSearchFacets(params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams(params);
  return useQuery({
    queryKey: ['search-facets', params],
    queryFn: () => api.getSearchFacets(searchParams),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ─── Dynamic Forms ─────────────────────────────────

export function useCategoryTemplate(categoryId: string) {
  return useQuery({
    queryKey: ['category-template', categoryId],
    queryFn: () => api.getCategoryTemplate(categoryId),
    enabled: !!categoryId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useValidateListingDraft() {
  return useMutation({
    mutationFn: (data: api.ValidateDraftPayload) => api.validateListingDraft(data),
  });
}

export function useUpdateListingAttributes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, attributes }: { id: string; attributes: Array<{ key: string; value: string }> }) =>
      api.updateListingAttributes(id, attributes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] });
    },
  });
}

// ─── Contact Management ────────────────────────────

export function useUpdateListingContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: api.ContactPayload }) =>
      api.updateListingContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing'] });
    },
  });
}

// ─── Presigned Upload ──────────────────────────────

export function usePresignedUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, key, publicUrl } = await api.getPresignedUploadUrl();
      await api.uploadToS3(uploadUrl, file);
      return { key, url: publicUrl };
    },
  });
}

export function useUploadImages() {
  return useMutation({
    mutationFn: (files: File[]) => api.uploadImages(files),
  });
}
