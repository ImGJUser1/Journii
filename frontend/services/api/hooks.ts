// services/api/hooks.ts
import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery,
  UseQueryOptions,
  QueryKey 
} from '@tanstack/react-query';
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

// Query configuration constants
const STALE_TIME = {
  SHORT: 1000 * 60 * 2,    // 2 minutes
  MEDIUM: 1000 * 60 * 15,  // 15 minutes
  LONG: 1000 * 60 * 60,    // 1 hour
};

const CACHE_TIME = {
  SHORT: 1000 * 60 * 10,   // 10 minutes
  MEDIUM: 1000 * 60 * 30,  // 30 minutes
  LONG: 1000 * 60 * 60 * 24, // 24 hours
};

// ============================================================================
// AUTH HOOKS
// ============================================================================

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.data.user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { email: string; password: string; first_name: string; last_name: string; phone?: string }) =>
      apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.data.user);
    },
  });
};

export const useCurrentUser = (options?: UseQueryOptions) => {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
      return response.data;
    },
    staleTime: STALE_TIME.MEDIUM,
    ...options,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.patch(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['user', 'me'], data.data);
    },
  });
};

// ============================================================================
// CULTURAL EXPLORER HOOKS
// ============================================================================

interface CulturalRecommendationsParams {
  location: string;
  interests?: string[];
  budget?: string;
  groupSize?: number;
  travelStyle?: string;
  durationDays?: number;
  lat?: number;
  lng?: number;
}

export const useCulturalRecommendations = (params: CulturalRecommendationsParams) => {
  return useQuery({
    queryKey: ['cultural', 'recommendations', params],
    queryFn: async () => {
      const response = await apiClient.post(
        API_ENDPOINTS.CULTURAL.RECOMMENDATIONS, 
        params
      );
      return response.data;
    },
    enabled: !!params.location,
    staleTime: STALE_TIME.MEDIUM,
    gcTime: CACHE_TIME.MEDIUM,
  });
};

interface NearbyExperiencesParams {
  lat: number;
  lng: number;
  radius?: number;
  category?: string;
  limit?: number;
}

export const useNearbyExperiences = (params: NearbyExperiencesParams) => {
  return useQuery({
    queryKey: ['cultural', 'nearby', params],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.CULTURAL.NEARBY, {
        params: {
          lat: params.lat,
          lng: params.lng,
          radius: params.radius || 10,
          category: params.category,
          limit: params.limit || 20,
        },
      });
      return response.data;
    },
    enabled: !!params.lat && !!params.lng,
    staleTime: STALE_TIME.SHORT,
  });
};

export const useExperienceDetail = (id: string) => {
  return useQuery({
    queryKey: ['cultural', 'experience', id],
    queryFn: async () => {
      const response = await apiClient.get(
        API_ENDPOINTS.CULTURAL.EXPERIENCE_DETAIL(id)
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: STALE_TIME.MEDIUM,
  });
};

// ============================================================================
// TRANSIT PLANNER HOOKS
// ============================================================================

interface TransitRoutesParams {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  preferences?: {
    priority?: string;
    avoid_crowds?: boolean;
    accessibility_needs?: boolean;
    preferred_modes?: string[];
  };
}

export const useTransitRoutes = (params: TransitRoutesParams) => {
  return useQuery({
    queryKey: ['transit', 'routes', params],
    queryFn: async () => {
      const response = await apiClient.post(API_ENDPOINTS.TRANSIT.ROUTES, params);
      return response.data;
    },
    enabled: !!params.from && !!params.to,
    staleTime: STALE_TIME.SHORT, // Real-time data updates frequently
    refetchInterval: 60000, // Refetch every minute for real-time updates
  });
};

// ============================================================================
// COMMUNITY / SOCIAL HOOKS
// ============================================================================

export const useCommunityFeed = (params?: {
  location?: string;
  category?: string;
  cursor?: string;
}) => {
  return useInfiniteQuery({
    queryKey: ['community', 'feed', params],
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(API_ENDPOINTS.COMMUNITY.FEED, {
        params: {
          ...params,
          cursor: pageParam,
          limit: 20,
        },
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    initialPageParam: undefined as string | undefined,
    staleTime: STALE_TIME.SHORT,
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
    mutationFn: (postId: string) => 
      apiClient.post(API_ENDPOINTS.COMMUNITY.LIKE(postId), {}),
    onMutate: async (postId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['community', 'feed'] });
      const previousData = queryClient.getQueryData(['community', 'feed']);
      
      queryClient.setQueryData(['community', 'feed'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: any) => 
              post.id === postId 
                ? { ...post, is_liked: !post.is_liked, likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1 }
                : post
            ),
          })),
        };
      });
      
      return { previousData };
    },
    onError: (err, postId, context) => {
      queryClient.setQueryData(['community', 'feed'], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'feed'] });
    },
  });
};

// ============================================================================
// ITINERARY HOOKS
// ============================================================================

export const useItineraries = () => {
  return useQuery({
    queryKey: ['itineraries'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ITINERARY.LIST);
      return response.data;
    },
    staleTime: STALE_TIME.SHORT,
  });
};

export const useItinerary = (id: string) => {
  return useQuery({
    queryKey: ['itinerary', id],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ITINERARY.DETAIL(id));
      return response.data;
    },
    enabled: !!id,
    staleTime: STALE_TIME.SHORT,
  });
};

export const useCreateItinerary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => 
      apiClient.post(API_ENDPOINTS.ITINERARY.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
    },
  });
};

export const useUpdateItinerary = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => 
      apiClient.patch(API_ENDPOINTS.ITINERARY.UPDATE(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', id] });
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
    },
  });
};

export const useOptimizeItinerary = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => 
      apiClient.post(API_ENDPOINTS.ITINERARY.OPTIMIZE(id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', id] });
    },
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

// ============================================================================
// MARKETPLACE HOOKS
// ============================================================================

export const useBusinesses = (params?: {
  location?: string;
  category?: string;
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}) => {
  return useQuery({
    queryKey: ['marketplace', 'businesses', params],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.MARKETPLACE.BUSINESSES, {
        params: {
          ...params,
          limit: 50,
        },
      });
      return response.data;
    },
    staleTime: STALE_TIME.MEDIUM,
    gcTime: CACHE_TIME.MEDIUM,
  });
};

export const useBusiness = (id: string) => {
  return useQuery({
    queryKey: ['marketplace', 'business', id],
    queryFn: async () => {
      const response = await apiClient.get(
        API_ENDPOINTS.MARKETPLACE.BUSINESS_DETAIL(id)
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: STALE_TIME.MEDIUM,
  });
};

// ============================================================================
// BOOKING HOOKS
// ============================================================================

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => 
      apiClient.post(API_ENDPOINTS.BOOKING.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

export const useBookings = () => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.BOOKING.LIST);
      return response.data;
    },
    staleTime: STALE_TIME.SHORT,
  });
};

// ============================================================================
// GAMIFICATION HOOKS
// ============================================================================

export const useGamificationProfile = () => {
  return useQuery({
    queryKey: ['gamification', 'profile'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.GAMIFICATION.PROFILE);
      return response.data;
    },
    staleTime: STALE_TIME.SHORT,
  });
};

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ['gamification', 'leaderboard'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.GAMIFICATION.LEADERBOARD);
      return response.data;
    },
    staleTime: STALE_TIME.SHORT,
  });
};

// ============================================================================
// AI CHAT HOOKS
// ============================================================================

export const useAIChat = () => {
  return useMutation({
    mutationFn: (messages: any[]) => 
      apiClient.post(API_ENDPOINTS.AI.CHAT, { messages }),
  });
};

// ============================================================================
// MESSAGING HOOKS
// ============================================================================

export const useConversations = () => {
  return useQuery({
    queryKey: ['messaging', 'conversations'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.MESSAGING.CONVERSATIONS);
      return response.data;
    },
    staleTime: STALE_TIME.SHORT,
  });
};

export const useMessages = (conversationId: string) => {
  return useQuery({
    queryKey: ['messaging', 'messages', conversationId],
    queryFn: async () => {
      const response = await apiClient.get(
        API_ENDPOINTS.MESSAGING.MESSAGES(conversationId)
      );
      return response.data;
    },
    enabled: !!conversationId,
    staleTime: STALE_TIME.SHORT,
    refetchInterval: 5000, // Poll every 5 seconds for real-time feel
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      apiClient.post(API_ENDPOINTS.MESSAGING.SEND_MESSAGE(conversationId), { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['messaging', 'messages', variables.conversationId] 
      });
    },
  });
};