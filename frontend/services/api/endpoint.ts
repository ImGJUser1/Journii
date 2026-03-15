export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    UPDATE_PROFILE: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Cultural Explorer
  CULTURAL: {
    RECOMMENDATIONS: '/cultural/recommendations',
    EXPERIENCES: '/cultural/experiences',
    EXPERIENCE_DETAIL: (id: string) => `/cultural/experiences/${id}`,
    NEARBY: '/cultural/nearby',
    CATEGORIES: '/cultural/categories',
  },

  // Transit Planner
  TRANSIT: {
    ROUTES: '/transit/routes',
    ROUTE_DETAIL: (id: string) => `/transit/routes/${id}`,
    REALTIME: '/transit/realtime',
    NEARBY_STOPS: '/transit/nearby-stops',
  },

  // Social
  SOCIAL: {
    COMPANIONS: '/social/companions',
    COMPANION_DETAIL: (id: string) => `/social/companions/${id}`,
    CONNECT: (id: string) => `/social/companions/${id}/connect`,
  },

  // Community
  COMMUNITY: {
    FEED: '/community/feed',
    POSTS: '/community/posts',
    POST_DETAIL: (id: string) => `/community/posts/${id}`,
    LIKE: (id: string) => `/community/posts/${id}/like`,
    COMMENT: (id: string) => `/community/posts/${id}/comment`,
    CREATE_POST: '/community/posts',
    UPLOAD_MEDIA: '/community/upload',
  },

  // Itinerary
  ITINERARY: {
    LIST: '/itinerary',
    CREATE: '/itinerary',
    DETAIL: (id: string) => `/itinerary/${id}`,
    UPDATE: (id: string) => `/itinerary/${id}`,
    DELETE: (id: string) => `/itinerary/${id}`,
    STOPS: (id: string) => `/itinerary/${id}/stops`,
    COLLABORATORS: (id: string) => `/itinerary/${id}/collaborators`,
    OPTIMIZE: (id: string) => `/itinerary/${id}/optimize`,
  },

  // Marketplace
  MARKETPLACE: {
    BUSINESSES: '/marketplace/businesses',
    BUSINESS_DETAIL: (id: string) => `/marketplace/businesses/${id}`,
    SERVICES: (businessId: string) => `/marketplace/businesses/${businessId}/services`,
    SEARCH: '/marketplace/search',
    CATEGORIES: '/marketplace/categories',
  },

  // Bookings
  BOOKING: {
    LIST: '/bookings',
    CREATE: '/bookings',
    DETAIL: (id: string) => `/bookings/${id}`,
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
    PAYMENT_INTENT: '/bookings/payment-intent',
  },

  // Gamification
  GAMIFICATION: {
    PROFILE: '/gamification/profile',
    LEADERBOARD: '/gamification/leaderboard',
    ACHIEVEMENTS: '/gamification/achievements',
    CLAIM_REWARD: '/gamification/claim',
  },

  // Messaging
  MESSAGING: {
    CONVERSATIONS: '/messaging/conversations',
    CONVERSATION_DETAIL: (id: string) => `/messaging/conversations/${id}`,
    MESSAGES: (conversationId: string) => `/messaging/conversations/${conversationId}/messages`,
    SEND_MESSAGE: (conversationId: string) => `/messaging/conversations/${conversationId}/messages`,
    CREATE_CONVERSATION: '/messaging/conversations',
  },

  // AI
  AI: {
    CHAT: '/ai/chat',
    RECOMMENDATIONS: '/ai/recommendations',
    ITINERARY_SUGGESTIONS: '/ai/itinerary-suggestions',
  },
} as const;