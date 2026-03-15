import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

// Auth Hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
    onSuccess: (data) => {
      // Store tokens handled by client interceptor
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { email: string; password: string; first_name: string; last_name: string; phone?: string }) =>
      apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useCurrentUser = (options?: UseQueryOptions) => {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => apiClient.get(API_ENDPOINTS.AUTH.ME),
    ...options,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.patch(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

// Cultural Explorer Hooks
export const useCulturalRecommendations = (params: {
  location: string;
  interests?: string[];
  budget?: string;
  groupSize?: number;
}) => {
  return useQuery({
    queryKey: ['cultural', 'recommendations', params],
    queryFn: () => apiClient.post(API_ENDPOINTS.CULTURAL.RECOMMENDATIONS, params),
    enabled: !!params.location,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useNearbyExperiences = (params: {
  lat: number;
  lng: number;
  radius?: number;
  category?: string;
}) => {
  return useQuery({
    queryKey: ['cultural', 'nearby', params],
    queryFn: () => apiClient.get(API_ENDPOINTS.CULTURAL.NEARBY, params),
    enabled: !!params.lat && !!params.lng,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Transit Hooks
export const useTransitRoutes = (params: {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  preferences?: any;
}) => {
  return useQuery({
    queryKey: ['transit', 'routes', params],
    queryFn: () => apiClient.post(API_ENDPOINTS.TRANSIT.ROUTES, params),
    enabled: !!params.from && !!params.to,
    staleTime: 1000 * 60 * 2, // 2 minutes for real-time data
  });
};

// Community Hooks (continued)
export const useCommunityFeed = (params?: {
  location?: string;
  category?: string;
  cursor?: string;
}) => {
  return useInfiniteQuery({
    queryKey: ['community', 'feed', params],
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(API_ENDPOINTS.COMMUNITY.FEED, {
        ...params,
        cursor: pageParam,
        limit: 20,
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: FormData | any) => {
      if (data instanceof FormData) {
        return apiClient.uploadFile(API_ENDPOINTS.COMMUNITY.CREATE_POST, data);
      }
      return apiClient.post(API_ENDPOINTS.COMMUNITY.CREATE_POST, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'feed'] });
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (postId: string) => apiClient.post(API_ENDPOINTS.COMMUNITY.LIKE(postId), {}),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'post', postId] });
    },
  });
};

// Itinerary Hooks
export const useItineraries = () => {
  return useQuery({
    queryKey: ['itineraries'],
    queryFn: () => apiClient.get(API_ENDPOINTS.ITINERARY.LIST),
  });
};

export const useItinerary = (id: string) => {
  return useQuery({
    queryKey: ['itinerary', id],
    queryFn: () => apiClient.get(API_ENDPOINTS.ITINERARY.DETAIL(id)),
    enabled: !!id,
  });
};

export const useCreateItinerary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.post(API_ENDPOINTS.ITINERARY.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
    },
  });
};

export const useUpdateItinerary = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.patch(API_ENDPOINTS.ITINERARY.UPDATE(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', id] });
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
    },
  });
};

export const useOptimizeItinerary = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.post(API_ENDPOINTS.ITINERARY.OPTIMIZE(id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', id] });
    },
  });
};

// Marketplace Hooks
export const useBusinesses = (params?: {
  location?: string;
  category?: string;
  query?: string;
}) => {
  return useQuery({
    queryKey: ['marketplace', 'businesses', params],
    queryFn: () => apiClient.get(API_ENDPOINTS.MARKETPLACE.BUSINESSES, params),
    staleTime: 1000 * 60 * 10,
  });
};

export const useBusiness = (id: string) => {
  return useQuery({
    queryKey: ['marketplace', 'business', id],
    queryFn: () => apiClient.get(API_ENDPOINTS.MARKETPLACE.BUSINESS_DETAIL(id)),
    enabled: !!id,
  });
};

// Booking Hooks
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.post(API_ENDPOINTS.BOOKING.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

// Gamification Hooks
export const useGamificationProfile = () => {
  return useQuery({
    queryKey: ['gamification', 'profile'],
    queryFn: () => apiClient.get(API_ENDPOINTS.GAMIFICATION.PROFILE),
  });
};

// AI Hooks
export const useAIChat = () => {
  return useMutation({
    mutationFn: (messages: any[]) => apiClient.post(API_ENDPOINTS.AI.CHAT, { messages }),
  });
};

export const useAIItinerarySuggestions = () => {
  return useMutation({
    mutationFn: (params: {
      destination: string;
      days: number;
      interests: string[];
      budget?: string;
    }) => apiClient.post(API_ENDPOINTS.AI.ITINERARY_SUGGESTIONS, params),
  });
};