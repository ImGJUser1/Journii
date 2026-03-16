// app/experience/[id].tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Clock,
  Star,
  Calendar,
  Phone,
  Globe,
  ChevronRight,
  Plus,
  Check,
  AlertCircle,
  Sparkles,
  Navigation,
  Wallet,
  Users,
  Camera,
  Utensils,
  Music,
  Palette,
  History,
} from 'lucide-react-native';

import { useExperienceDetail, useExperienceReviews, useCreateBooking } from '@/services/api/hooks';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useLocationStore } from '@/stores/location-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';

const { width, height } = Dimensions.get('window');

const categoryIcons: Record<string, any> = {
  food: Utensils,
  art: Palette,
  music: Music,
  history: History,
  photography: Camera,
  workshop: Palette,
  default: Sparkles,
};

export default function ExperienceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();
  const { currentLocation } = useLocationStore();
  const { mediumImpact } = useHaptics();
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const {
    data: experience,
    isLoading,
    error,
    refetch,
  } = useExperienceDetail(id);

  const {
    data: reviewsData,
    fetchNextPage,
    hasNextPage,
  } = useExperienceReviews(id, { limit: 5 });

  const createBooking = useCreateBooking();

  const reviews = reviewsData?.pages.flatMap((page) => page.reviews) || [];

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: experience?.title,
        message: `Check out ${experience?.title} on Journii! ${experience?.short_description}`,
        url: `https://journii.app/experience/${id}`,
      });
    } catch (error) {
      // User cancelled share
    }
  }, [experience, id]);

  const handleLike = useCallback(() => {
    mediumImpact();
    setIsLiked(!isLiked);
    // API call to toggle like
  }, [isLiked, mediumImpact]);

  const handleAddToItinerary = useCallback(() => {
    if (!isAuthenticated) {
      showToast({ type: 'info', message: 'Sign in to add to itinerary' });
      return;
    }
    
    router.push({
      pathname: '/itenary/builder',
      params: { 
        addExperience: id,
        experienceName: experience?.title,
      },
    });
  }, [isAuthenticated, id, experience, router, showToast]);

  const handleBookNow = useCallback(() => {
    if (!isAuthenticated) {
      showToast({ type: 'info', message: 'Sign in to book this experience' });
      return;
    }
    setShowBookingModal(true);
  }, [isAuthenticated, showToast]);

  const handleGetDirections = useCallback(() => {
    if (!experience?.coordinates) return;
    
    const { lat, lng } = experience.coordinates;
    const url = Platform.select({
      ios: `maps://?daddr=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}`,
    });
    
    Linking.openURL(url);
  }, [experience]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary.gold} />
      </View>
    );
  }

  if (error || !experience) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <AlertCircle size={48} color={Colors.semantic.error} />
        <Text style={styles.errorText}>Failed to load experience</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const CategoryIcon = categoryIcons[experience.category] || categoryIcons.default;
  const distance = currentLocation && experience.coordinates
    ? calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        experience.coordinates.lat,
        experience.coordinates.lng
      )
    : null;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          <FlatList
            data={experience.photos || [experience.cover_image]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(index);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.galleryImage} />
            )}
            keyExtractor={(item, index) => index.toString()}
          />
          
          {/* Gallery Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
            style={styles.galleryOverlay}
          >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color={Colors.neutral.white} />
              </TouchableOpacity>
              
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerButton} onPress={handleLike}>
                  <Heart
                    size={24}
                    color={isLiked ? Colors.semantic.error : Colors.neutral.white}
                    fill={isLiked ? Colors.semantic.error : 'transparent'}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                  <Share2 size={24} color={Colors.neutral.white} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Image Indicators */}
            <View style={styles.indicators}>
              {(experience.photos || [experience.cover_image]).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === activeImageIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Category & Price */}
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <CategoryIcon size={16} color={Colors.primary.gold} />
              <Text style={styles.categoryText}>
                {experience.category.charAt(0).toUpperCase() + experience.category.slice(1)}
              </Text>
            </View>
            <Text style={styles.priceText}>{experience.price_range || '$$'}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{experience.title}</Text>

          {/* Rating & Reviews */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Star size={16} color={Colors.primary.gold} fill={Colors.primary.gold} />
              <Text style={styles.ratingText}>
                {experience.avg_rating?.toFixed(1) || 'New'}
              </Text>
            </View>
            <Text style={styles.reviewCount}>
              {experience.total_reviews || 0} reviews
            </Text>
            {experience.is_verified && (
              <View style={styles.verifiedBadge}>
                <Check size={12} color={Colors.neutral.white} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          {/* AI Badge */}
          {experience.ai_recommended && (
            <View style={styles.aiBadge}>
              <Sparkles size={16} color={Colors.primary.gold} />
              <Text style={styles.aiText}>AI Recommended for you</Text>
            </View>
          )}

          {/* Quick Info */}
          <View style={styles.quickInfo}>
            {experience.duration_minutes && (
              <View style={styles.infoItem}>
                <Clock size={20} color={Colors.primary.gold} />
                <Text style={styles.infoText}>
                  {Math.floor(experience.duration_minutes / 60)}h{' '}
                  {experience.duration_minutes % 60}m
                </Text>
              </View>
            )}
            {distance && (
              <View style={styles.infoItem}>
                <Navigation size={20} color={Colors.primary.gold} />
                <Text style={styles.infoText}>{distance} km away</Text>
              </View>
            )}
            {experience.group_size && (
              <View style={styles.infoItem}>
                <Users size={20} color={Colors.primary.gold} />
                <Text style={styles.infoText}>Up to {experience.group_size} people</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{experience.description}</Text>
          </View>

          {/* Cultural Significance */}
          {experience.cultural_significance && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cultural Significance</Text>
              <View style={styles.culturalCard}>
                <History size={24} color={Colors.primary.gold} />
                <Text style={styles.culturalText}>
                  {experience.cultural_significance}
                </Text>
              </View>
            </View>
          )}

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationCard}>
              <MapPin size={24} color={Colors.primary.gold} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>
                  {experience.location_specifics || experience.location}
                </Text>
                <Text style={styles.locationAddress}>{experience.address}</Text>
              </View>
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={handleGetDirections}
              >
                <Navigation size={20} color={Colors.neutral.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Best Time to Visit */}
          {experience.best_time && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Best Time to Visit</Text>
              <View style={styles.bestTimeCard}>
                <Calendar size={20} color={Colors.primary.gold} />
                <Text style={styles.bestTimeText}>{experience.best_time}</Text>
              </View>
            </View>
          )}

          {/* Local Tips */}
          {experience.local_tips && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Local Tips</Text>
              <View style={styles.tipsCard}>
                <AlertCircle size={20} color={Colors.semantic.warning} />
                <Text style={styles.tipsText}>{experience.local_tips}</Text>
              </View>
            </View>
          )}

          {/* Reviews Preview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            
            {reviews.length > 0 ? (
              reviews.slice(0, 2).map((review, index) => (
                <MotiView
                  key={review.id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: index * 100 }}
                  style={styles.reviewCard}
                >
                  <View style={styles.reviewHeader}>
                    <Image
                      source={{ uri: review.author.avatar_url }}
                      style={styles.reviewAvatar}
                    />
                    <View>
                      <Text style={styles.reviewName}>{review.author.full_name}</Text>
                      <View style={styles.reviewRating}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            color={i < review.rating ? Colors.primary.gold : Colors.neutral.gray600}
                            fill={i < review.rating ? Colors.primary.gold : 'transparent'}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>
                      {formatDistanceToNow(new Date(review.created_at))} ago
                    </Text>
                  </View>
                  <Text style={styles.reviewText} numberOfLines={3}>
                    {review.content}
                  </Text>
                </MotiView>
              ))
            ) : (
              // app/experience/[id].tsx (continued)
              <Text style={styles.noReviewsText}>No reviews yet. Be the first to experience this!</Text>
            )}
          </View>

          {/* Provider Info */}
          {experience.provider && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experience Provider</Text>
              <TouchableOpacity style={styles.providerCard}>
                <Image
                  source={{ uri: experience.provider.logo_url }}
                  style={styles.providerLogo}
                />
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{experience.provider.name}</Text>
                  <Text style={styles.providerMeta}>
                    {experience.provider.total_experiences} experiences • {experience.provider.avg_rating?.toFixed(1)}★
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.neutral.gray400} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <BlurView intensity={80} style={styles.bottomBarBlur}>
          <View style={styles.bottomBarContent}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>From</Text>
              <Text style={styles.priceValue}>{experience.price_display || '$45'}</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddToItinerary}
              >
                <Plus size={24} color={Colors.primary.gold} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.bookButton}
                onPress={handleBookNow}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primary.gold, Colors.primary.purple]}
                  style={styles.bookGradient}
                >
                  <Text style={styles.bookText}>Book Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
          >
            <BlurView intensity={80} style={styles.modalBlur}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Book Experience</Text>
                
                <View style={styles.bookingOptions}>
                  <TouchableOpacity style={styles.bookingOption}>
                    <Calendar size={24} color={Colors.primary.gold} />
                    <Text style={styles.bookingOptionText}>Select Date</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.bookingOption}>
                    <Users size={24} color={Colors.primary.gold} />
                    <Text style={styles.bookingOptionText}>Group Size</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => setShowBookingModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.modalConfirm}
                    onPress={() => {
                      setShowBookingModal(false);
                      router.push({
                        pathname: '/booking/checkout',
                        params: { experienceId: id },
                      });
                    }}
                  >
                    <Text style={styles.modalConfirmText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}

// Utility function for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

import { formatDistanceToNow } from 'date-fns';
import { Linking, Platform } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.bodyLarge,
    color: Colors.semantic.error,
    marginTop: Spacing.md,
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
  galleryContainer: {
    height: height * 0.45,
    position: 'relative',
  },
  galleryImage: {
    width: width,
    height: height * 0.45,
    resizeMode: 'cover',
  },
  galleryOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  indicatorActive: {
    backgroundColor: Colors.primary.gold,
    width: 24,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary.gold}20`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  categoryText: {
    ...Typography.bodySmall,
    color: Colors.primary.gold,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  priceText: {
    ...Typography.h3,
    color: Colors.neutral.white,
  },
  title: {
    ...Typography.h1,
    color: Colors.neutral.white,
    marginBottom: Spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary.gold}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  ratingText: {
    ...Typography.bodyMedium,
    color: Colors.primary.gold,
    fontWeight: '700',
  },
  reviewCount: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.semantic.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  verifiedText: {
    ...Typography.caption,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary.purple}20`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  aiText: {
    ...Typography.bodyMedium,
    color: Colors.primary.purpleLight,
  },
  quickInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray300,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral.white,
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.bodyLarge,
    color: Colors.neutral.gray300,
    lineHeight: 24,
  },
  culturalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.neutral.gray800,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  culturalText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray300,
    flex: 1,
    lineHeight: 20,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.gray800,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  locationAddress: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    marginTop: 2,
  },
  directionsButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bestTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.semantic.success}15`,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  bestTimeText: {
    ...Typography.bodyMedium,
    color: Colors.semantic.success,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${Colors.semantic.warning}15`,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  tipsText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray300,
    flex: 1,
    lineHeight: 20,
  },
  seeAllText: {
    ...Typography.bodyMedium,
    color: Colors.primary.gold,
  },
  reviewCard: {
    backgroundColor: Colors.neutral.gray800,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
  },
  reviewName: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewDate: {
    ...Typography.caption,
    color: Colors.neutral.gray500,
    marginLeft: 'auto',
  },
  reviewText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray300,
    lineHeight: 20,
  },
  noReviewsText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    fontStyle: 'italic',
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.gray800,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  providerLogo: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  providerMeta: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBarBlur: {
    backgroundColor: 'rgba(26,26,31,0.95)',
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
  },
  priceValue: {
    ...Typography.h2,
    color: Colors.neutral.white,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral.gray800,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary.gold,
  },
  bookButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  bookGradient: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  bookText: {
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalBlur: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.neutral.gray900,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.neutral.white,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  bookingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  bookingOption: {
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.lg,
    minWidth: 120,
  },
  bookingOptionText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.md,
  },
  modalCancelText: {
    ...Typography.bodyLarge,
    color: Colors.neutral.gray400,
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.primary.gold,
    borderRadius: BorderRadius.md,
  },
  modalConfirmText: {
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
});