// app/marketplace/business/[id].tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Linking,
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
  Star,
  Phone,
  Globe,
  Clock,
  ChevronRight,
  Check,
  Shield,
  Calendar,
  Users,
  Wallet,
  MessageCircle,
  Bookmark,
  Navigation,
} from 'lucide-react-native';

import { useBusinessDetail, useBusinessServices } from '@/services/api/hooks';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useLocationStore } from '@/stores/location-store';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';

const { width } = Dimensions.get('window');

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();
  const { currentLocation } = useLocationStore();
  const { mediumImpact } = useHaptics();
  
  const [activeTab, setActiveTab] = useState<'services' | 'reviews' | 'about'>('services');
  const [isLiked, setIsLiked] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const {
    data: business,
    isLoading: businessLoading,
    error: businessError,
  } = useBusinessDetail(id);

  const {
    data: servicesData,
    isLoading: servicesLoading,
  } = useBusinessServices(id);

  const services = servicesData?.services || [];

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: business?.business_name,
        message: `Check out ${business?.business_name} on Journii!`,
        url: `https://journii.app/business/${id}`,
      });
    } catch (error) {
      // Cancelled
    }
  }, [business, id]);

  const handleLike = useCallback(() => {
    mediumImpact();
    setIsLiked(!isLiked);
  }, [isLiked, mediumImpact]);

  const handleCall = useCallback(() => {
    if (business?.phone) {
      Linking.openURL(`tel:${business.phone}`);
    }
  }, [business]);

  const handleWebsite = useCallback(() => {
    if (business?.website) {
      Linking.openURL(business.website);
    }
  }, [business]);

  const handleGetDirections = useCallback(() => {
    if (!business?.latitude || !business?.longitude) return;
    
    const url = Platform.select({
      ios: `maps://?daddr=${business.latitude},${business.longitude}`,
      android: `geo:${business.latitude},${business.longitude}?q=${business.latitude},${business.longitude}`,
    });
    
    Linking.openURL(url);
  }, [business]);

  const handleBookService = useCallback((service: any) => {
    if (!isAuthenticated) {
      showToast({ type: 'info', message: 'Sign in to book services' });
      return;
    }
    setSelectedService(service);
    setShowBookingModal(true);
  }, [isAuthenticated, showToast]);

  const handleMessageBusiness = useCallback(() => {
    if (!isAuthenticated) {
      showToast({ type: 'info', message: 'Sign in to message' });
      return;
    }
    router.push({
      pathname: '/chat/new',
      params: { 
        businessId: id,
        businessName: business?.business_name,
      },
    });
  }, [isAuthenticated, id, business, router, showToast]);

  if (businessLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary.gold} />
      </View>
    );
  }

  if (businessError || !business) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load business</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const distance = currentLocation && business.latitude && business.longitude
    ? calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        business.latitude,
        business.longitude
      )
    : null;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: business.cover_image || business.logo_url }}
            style={styles.coverImage}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
            style={styles.coverOverlay}
          >
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
                <TouchableOpacity style={styles.headerButton} onPress={handleMessageBusiness}>
                  <MessageCircle size={24} color={Colors.neutral.white} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Business Info */}
        <View style={styles.content}>
          {/* Logo & Name */}
          <View style={styles.businessHeader}>
            <Image
              source={{ uri: business.logo_url }}
              style={styles.logo}
            />
            <View style={styles.businessHeaderInfo}>
              <View style={styles.typeRow}>
                <Text style={styles.businessType}>{business.business_type}</Text>
                {business.is_verified && (
                  <View style={styles.verifiedBadge}>
                    <Check size={12} color={Colors.neutral.white} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.businessName}>{business.business_name}</Text>
              
              <View style={styles.ratingRow}>
                <View style={styles.ratingBadge}>
                  <Star size={16} color={Colors.primary.gold} fill={Colors.primary.gold} />
                  <Text style={styles.ratingText}>
                    {business.avg_rating?.toFixed(1) || 'New'}
                  </Text>
                </View>
                <Text style={styles.reviewCount}>
                  ({business.total_reviews || 0} reviews)
                </Text>
                {distance && (
                  <Text style={styles.distanceText}>• {distance} away</Text>
                )}
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={handleCall}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.semantic.success}20` }]}>
                <Phone size={20} color={Colors.semantic.success} />
              </View>
              <Text style={styles.quickActionText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={handleWebsite}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.primary.purple}20` }]}>
                <Globe size={20} color={Colors.primary.purple} />
              </View>
              <Text style={styles.quickActionText}>Website</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction} onPress={handleGetDirections}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.primary.gold}20` }]}>
                <Navigation size={20} color={Colors.primary.gold} />
              </View>
              <Text style={styles.quickActionText}>Directions</Text>
            </TouchableOpacity>
          </View>

          {/* Location & Hours */}
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <MapPin size={20} color={Colors.primary.gold} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{business.full_address}</Text>
              </View>
            </View>
            
            {business.opening_hours && (
              <View style={styles.infoItem}>
                <Clock size={20} color={Colors.primary.gold} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Opening Hours</Text>
                  <Text style={[styles.infoValue, styles.openStatus]}>
                    {business.is_open_now ? 'Open now' : 'Closed'}
                  </Text>
                  <Text style={styles.hoursText}>{business.opening_hours}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            {['services', 'reviews', 'about'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab as any)}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'services' && (
              <MotiView
                key="services"
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -20 }}
                style={styles.tabContent}
              >
                {servicesLoading ? (
                  <ActivityIndicator color={Colors.primary.gold} />
                ) : services.length > 0 ? (
                  services.map((service, index) => (
                    <MotiView
                      key={service.id}
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: index * 50 }}
                    >
                      <TouchableOpacity
                        style={styles.serviceCard}
                        onPress={() => handleBookService(service)}
                        activeOpacity={0.9}
                      >
                        <View style={styles.serviceInfo}>
                          <Text style={styles.serviceName}>{service.name}</Text>
                          <Text style={styles.serviceDescription} numberOfLines={2}>
                            {service.description}
                          </Text>
                          <View style={styles.serviceMeta}>
                            <Clock size={14} color={Colors.neutral.gray400} />
                            <Text style={styles.serviceMetaText}>
                              {service.duration_minutes} min
                            </Text>
                            <Users size={14} color={Colors.neutral.gray400} />
                            <Text style={styles.serviceMetaText}>
                              Up to {service.max_participants}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.servicePricing}>
                          <Text style={styles.servicePrice}>
                            ${service.price}
                          </Text>
                          <View style={styles.bookServiceButton}>
                            <Text style={styles.bookServiceText}>Book</Text>
                            <ChevronRight size={16} color={Colors.neutral.white} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    </MotiView>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No services available</Text>
                )}
              </MotiView>
            )}

            {activeTab === 'reviews' && (
              <MotiView
                key="reviews"
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -20 }}
                style={styles.tabContent}
              >
                {/* Reviews content - similar to experience detail */}
                <Text style={styles.emptyText}>Reviews coming soon</Text>
              </MotiView>
            )}

            {activeTab === 'about' && (
              <MotiView
                key="about"
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -20 }}
                style={styles.tabContent}
              >
                <Text style={styles.aboutText}>{business.description}</Text>
                
                {business.amenities && (
                  <View style={styles.amenitiesSection}>
                    <Text style={styles.sectionTitle}>Amenities</Text>
                    <View style={styles.amenitiesGrid}>
                      {business.amenities.map((amenity: string, index: number) => (
                        <View key={index} style={styles.amenityTag}>
                          <Check size={14} color={Colors.primary.gold} />
                          <Text style={styles.amenityText}>{amenity}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </MotiView>
            )}
          </AnimatePresence>
        </View>
      </ScrollView>

      {/* Service Booking Modal */}
      <AnimatePresence>
        {showBookingModal && selectedService && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
          >
            <BlurView intensity={80} style={styles.modalBlur}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{selectedService.name}</Text>
                <Text style={styles.modalPrice}>${selectedService.price}</Text>
                
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetail}>
                    <Clock size={20} color={Colors.primary.gold} />
                    <Text style={styles.bookingDetailText}>
                      {selectedService.duration_minutes} minutes
                    </Text>
                  </View>
                  <View style={styles.bookingDetail}>
                    <Users size={20} color={Colors.primary.gold} />
                    <Text style={styles.bookingDetailText}>
                      Up to {selectedService.max_participants} people
                    </Text>
                  </View>
                  <View style={styles.bookingDetail}>
                    <Shield size={20} color={Colors.semantic.success} />
                    <Text style={styles.bookingDetailText}>Instant confirmation</Text>
                  </View>
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
                        params: { 
                          serviceId: selectedService.id,
                          businessId: id,
                        },
                      });
                    }}
                  >
                    <Text style={styles.modalConfirmText}>Continue to Book</Text>
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  
  if (d < 1) return `${(d * 1000).toFixed(0)} m`;
  return `${d.toFixed(1)} km`;
}

import { Share, Platform } from 'react-native';

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background.dark 
  },
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
  coverContainer: {
    height: 250,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverOverlay: {
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
  content: {
    padding: Spacing.lg,
    paddingTop: 0,
    marginTop: -30,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    borderWidth: 3,
    borderColor: Colors.primary.gold,
    marginRight: Spacing.md,
  },
  businessHeaderInfo: {
    flex: 1,
    paddingTop: Spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  businessType: {
    ...Typography.caption,
    color: Colors.primary.gold,
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.semantic.success,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  verifiedText: {
    ...Typography.caption,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  businessName: {
    ...Typography.h2,
    color: Colors.neutral.white,
    marginBottom: Spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
  },
  distanceText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    ...Typography.bodySmall,
    color: Colors.neutral.white,
  },
  infoSection: {
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
  },
  openStatus: {
    color: Colors.semantic.success,
  },
  hoursText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: `${Colors.primary.gold}25`,
  },
  tabText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.primary.gold,
  },
  tabContent: {
    minHeight: 200,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  serviceDescription: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    marginBottom: Spacing.sm,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  serviceMetaText: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
    marginRight: Spacing.sm,
  },
  servicePricing: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: Spacing.md,
  },
  servicePrice: {
    ...Typography.h3,
    color: Colors.primary.gold,
  },
  bookServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  bookServiceText: {
    ...Typography.bodySmall,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  aboutText: {
    ...Typography.bodyLarge,
    color: Colors.neutral.gray300,
    lineHeight: 24,
  },
  amenitiesSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.neutral.white,
    marginBottom: Spacing.md,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary.gold}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  amenityText: {
    ...Typography.bodySmall,
    color: Colors.primary.gold,
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
    marginBottom: Spacing.xs,
  },
  modalPrice: {
    ...Typography.h1,
    color: Colors.primary.gold,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  bookingDetails: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bookingDetailText: {
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