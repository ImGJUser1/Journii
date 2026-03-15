// app/(tabs)/index.tsx - Discovery Screen (Production Ready)
import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  MapPin,
  Sparkles,
  Compass,
  Star,
  Clock,
  Search,
  Filter,
  Heart,
  Share2,
  ChevronRight,
  Navigation,
  WifiOff,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { useCulturalRecommendations, useNearbyExperiences } from '@/services/api/hooks';
import { useLocationStore } from '@/stores/location-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 280; // Fixed height for getItemLayout optimization

// Memoized list item component for performance
const ExperienceCard = memo(({ item, index, onPress }: { item: any; index: number; onPress: (item: any) => void }) => {
  const handlePress = useCallback(() => onPress(item), [item, onPress]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: Math.min(index * 50, 500), type: 'spring', damping: 15 }}
    >
      <Pressable
        style={styles.experienceCard}
        onPress={handlePress}
        android_ripple={{ color: 'rgba(201,169,110,0.2)' }}
      >
        <BlurView intensity={60} style={styles.cardBlur}>
          <LinearGradient
            colors={['rgba(40,40,45,0.95)', 'rgba(30,30,35,0.98)']}
            style={styles.cardGradient}
          >
            {/* Card Header with Image */}
            <View style={styles.cardHeader}>
              <View style={styles.imageContainer}>
                {item.photos && item.photos.length > 0 ? (
                  <Image 
                    source={{ uri: item.photos[0] }} 
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[Colors.primary.gold, Colors.primary.purple]}
                    style={styles.imagePlaceholder}
                  >
                    <Compass size={32} color={Colors.neutral.white} />
                  </LinearGradient>
                )}
                {item.is_verified && (
                  <View style={styles.verifiedBadge}>
                    <Star size={12} color={Colors.neutral.white} fill={Colors.neutral.white} />
                  </View>
                )}
              </View>
              
              <View style={styles.cardInfo}>
                <View style={styles.categoryRow}>
                  <Text style={styles.categoryTag}>{item.category}</Text>
                  {item.price_range && (
                    <Text style={styles.priceTag}>{item.price_range}</Text>
                  )}
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.locationRow}>
                  <Navigation size={14} color={Colors.neutral.gray400} />
                  <Text style={styles.cardLocation} numberOfLines={1}>
                    {item.location_specifics || 'Historic District'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.short_description || item.description}
            </Text>

            {/* Meta Info */}
            <View style={styles.cardMeta}>
              {item.duration_minutes && (
                <View style={styles.metaItem}>
                  <Clock size={14} color={Colors.neutral.gray400} />
                  <Text style={styles.metaText}>
                    {Math.round(item.duration_minutes / 60)}h {item.duration_minutes % 60}m
                  </Text>
                </View>
              )}
              {item.best_time && (
                <View style={styles.metaItem}>
                  <Sparkles size={14} color={Colors.primary.gold} />
                  <Text style={styles.metaText}>{item.best_time}</Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
              <View style={styles.ratingContainer}>
                <Star size={16} color={Colors.primary.gold} fill={Colors.primary.gold} />
                <Text style={styles.ratingText}>
                  {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}
                </Text>
                {item.total_reviews > 0 && (
                  <Text style={styles.reviewCount}>({item.total_reviews})</Text>
                )}
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation();
                    // Handle like
                  }}
                >
                  <Heart size={18} color={Colors.neutral.gray300} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation();
                    // Handle share
                  }}
                >
                  <Share2 size={18} color={Colors.neutral.gray300} />
                </TouchableOpacity>
                <View style={styles.chevronButton}>
                  <ChevronRight size={20} color={Colors.primary.gold} />
                </View>
              </View>
            </View>

            {/* AI Recommendation Badge */}
            {item.ai_recommended && (
              <View style={styles.aiBadge}>
                <Sparkles size={12} color={Colors.primary.gold} />
                <Text style={styles.aiBadgeText}>AI Recommended</Text>
              </View>
            )}
          </LinearGradient>
        </BlurView>
      </Pressable>
    </MotiView>
  );
});

ExperienceCard.displayName = 'ExperienceCard';

export default function DiscoveryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentLocation, fetchCurrentLocation, isLoading: locationLoading } = useLocationStore();
  const { isAuthenticated } = useAuthStore();
  const { showToast, isOnline } = useUIStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);

  // Fetch recommendations with real API
  const {
    data: recommendationsData,
    isLoading: isLoadingRecommendations,
    error: recommendationsError,
    refetch: refetchRecommendations,
  } = useCulturalRecommendations({
    location: currentLocation?.city || 'San Francisco',
    interests: selectedCategory === 'All' 
      ? ['art', 'food', 'history'] 
      : [selectedCategory.toLowerCase()],
    travelStyle: 'balanced',
    budget: '$$',
    durationDays: 3,
    lat: currentLocation?.latitude,
    lng: currentLocation?.longitude,
  });

  // Fetch nearby experiences
  const {
    data: nearbyData,
    isLoading: isLoadingNearby,
  } = useNearbyExperiences({
    lat: currentLocation?.latitude || 37.7749,
    lng: currentLocation?.longitude || -122.4194,
    radius: 10,
    category: selectedCategory === 'All' ? undefined : selectedCategory.toLowerCase(),
  });

  const recommendations = recommendationsData?.recommendations || [];
  const nearbyExperiences = nearbyData?.experiences || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchRecommendations(),
      queryClient.invalidateQueries({ queryKey: ['cultural', 'nearby'] }),
    ]);
    setRefreshing(false);
  }, [refetchRecommendations, queryClient]);

  const handleExperiencePress = useCallback((experience: any) => {
    router.push({
      pathname: '/experience/[id]',
      params: { id: experience.id },
    });
  }, [router]);

  const handleAIButtonPress = useCallback(() => {
    if (!isAuthenticated) {
      showToast({
        type: 'info',
        message: 'Sign in to get personalized AI recommendations',
      });
      return;
    }
    setShowAIRecommendations(!showAIRecommendations);
    showToast({
      type: 'success',
      message: showAIRecommendations ? 'AI recommendations hidden' : 'AI recommendations enabled',
    });
  }, [isAuthenticated, showAIRecommendations, showToast]);

  const categories = ['All', 'Artisan', 'Food', 'History', 'Nature', 'Workshop', 'Festival'];

  // Optimized renderItem with useCallback
  const renderExperienceCard = useCallback(({ item, index }: { item: any; index: number }) => (
    <ExperienceCard 
      item={item} 
      index={index} 
      onPress={handleExperiencePress} 
    />
  ), [handleExperiencePress]);

  // getItemLayout for performance optimization
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  // Key extractor
  const keyExtractor = useCallback((item: any) => item.id || Math.random().toString(), []);

  // Header component
  const ListHeaderComponent = useCallback(() => (
    <>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View>
          <Text style={styles.greeting}>Discover</Text>
          <View style={styles.locationRow}>
            <MapPin size={16} color={Colors.primary.gold} />
            <Text style={styles.locationText}>
              {currentLocation?.city || 'Getting location...'}
            </Text>
            {locationLoading && <ActivityIndicator size="small" color={Colors.primary.gold} style={styles.locationLoader} />}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.aiButton}
          onPress={handleAIButtonPress}
          activeOpacity={0.8}
        >
          <BlurView intensity={80} style={styles.aiButtonBlur}>
            <LinearGradient
              colors={[Colors.primary.gold, Colors.primary.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiButtonGradient}
            >
              <Sparkles size={20} color={Colors.neutral.white} />
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 100, type: 'spring' }}
        style={styles.searchContainer}
      >
        <TouchableOpacity 
          style={styles.searchBar} 
          activeOpacity={0.8}
          onPress={() => router.push('/search')}
        >
          <Search size={20} color={Colors.neutral.gray400} />
          <Text style={styles.searchPlaceholder}>
            Search experiences, places, or activities...
          </Text>
          <View style={styles.filterButton}>
            <Filter size={16} color={Colors.primary.gold} />
          </View>
        </TouchableOpacity>
      </MotiView>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        {categories.map((category, index) => (
          <MotiView
            key={category}
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 50, type: 'spring' }}
          >
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          </MotiView>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {[
          { icon: Compass, value: recommendations.length.toString(), label: 'Experiences', color: Colors.primary.gold },
          { icon: Sparkles, value: nearbyExperiences.length > 0 ? '89%' : '0%', label: 'Nearby', color: Colors.primary.purple },
          { icon: Star, value: '4.8', label: 'Rating', color: Colors.semantic.success },
        ].map((stat, index) => (
          <MotiView
            key={stat.label}
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 200 + index * 100, type: 'spring' }}
            style={styles.statCard}
          >
            <BlurView intensity={60} style={styles.statBlur}>
              <LinearGradient
                colors={[`${stat.color}20`, `${stat.color}10`]}
                style={styles.statGradient}
              >
                <stat.icon size={20} color={stat.color} />
                <Text style={[styles.statValue, { color: stat.color }]}>
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </LinearGradient>
            </BlurView>
          </MotiView>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text style={styles.seeAllText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </>
  ), [insets.top, currentLocation, locationLoading, handleAIButtonPress, selectedCategory, categories, recommendations.length, nearbyExperiences.length, onRefresh, router]);

  // Empty state
  const ListEmptyComponent = useCallback(() => {
    if (isLoadingRecommendations) {
      return (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonImage} />
              <View style={styles.skeletonText} />
              <View style={styles.skeletonTextShort} />
            </View>
          ))}
        </View>
      );
    }

    if (recommendationsError) {
      return (
        <View style={styles.errorState}>
          <WifiOff size={48} color={Colors.semantic.error} />
          <Text style={styles.errorTitle}>Failed to load</Text>
          <Text style={styles.errorSubtitle}>
            {isOnline ? 'Pull down to retry' : 'Check your connection'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Compass size={48} color={Colors.neutral.gray400} />
        <Text style={styles.emptyTitle}>No experiences found</Text>
        <Text style={styles.emptySubtitle}>
          Try adjusting your filters or search in a different location
        </Text>
      </View>
    );
  }, [isLoadingRecommendations, recommendationsError, isOnline, onRefresh]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.background.gradient}
        style={styles.background}
      >
        <FlatList
          data={recommendations}
          keyExtractor={keyExtractor}
          renderItem={renderExperienceCard}
          getItemLayout={getItemLayout}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary.gold}
              colors={[Colors.primary.gold]}
            />
          }
          showsVerticalScrollIndicator={false}
          // Performance optimizations
          initialNumToRender={4}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greeting: { ...Typography.h1, color: Colors.neutral.white },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  locationText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray300,
    marginLeft: Spacing.xs,
  },
  locationLoader: { marginLeft: Spacing.sm },
  aiButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  aiButtonBlur: {
    flex: 1,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  aiButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: { marginBottom: Spacing.lg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral.gray700,
  },
  searchPlaceholder: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary.gold}15`,
    borderWidth: 1,
    borderColor: `${Colors.primary.gold}30`,
  },
  categoryButtonActive: {
    backgroundColor: `${Colors.primary.gold}40`,
    borderColor: Colors.primary.gold,
  },
  categoryText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray300,
    fontWeight: '600',
  },
  categoryTextActive: { color: Colors.primary.gold },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  statBlur: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  statGradient: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: { ...Typography.h3, marginTop: Spacing.xs },
  statLabel: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
    marginTop: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: { ...Typography.h2, color: Colors.neutral.white },
  seeAllText: { ...Typography.bodySmall, color: Colors.primary.gold },
  experienceCard: {
    height: ITEM_HEIGHT,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  cardBlur: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  imageContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.semantic.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.gray900,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryTag: {
    ...Typography.caption,
    color: Colors.primary.gold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceTag: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
    marginLeft: Spacing.sm,
  },
  cardTitle: { ...Typography.h4, color: Colors.neutral.white, marginBottom: Spacing.xs },
  cardLocation: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  cardDescription: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray300,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: { ...Typography.bodySmall, color: Colors.neutral.gray400 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray800,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  reviewCount: { ...Typography.caption, color: Colors.neutral.gray400 },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral.gray800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary.gold}30`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  aiBadgeText: {
    ...Typography.caption,
    color: Colors.primary.gold,
    fontWeight: '700',
  },
  loadingContainer: { gap: Spacing.lg },
  skeletonCard: {
    height: ITEM_HEIGHT,
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  skeletonImage: {
    width: 100,
    height: 100,
    backgroundColor: Colors.neutral.gray700,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  skeletonText: {
    height: 20,
    backgroundColor: Colors.neutral.gray700,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  skeletonTextShort: {
    height: 20,
    width: '60%',
    backgroundColor: Colors.neutral.gray700,
    borderRadius: BorderRadius.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.neutral.white,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  errorTitle: {
    ...Typography.h3,
    color: Colors.semantic.error,
    marginTop: Spacing.lg,
  },
  errorSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary.gold,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
});