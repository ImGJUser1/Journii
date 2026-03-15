// app/(tabs)/marketplace/index.tsx
import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Search,
  Filter,
  Star,
  MapPin,
  ChevronRight,
  Heart,
  Share2,
  Calendar,
  Phone,
  Globe,
  Clock,
  WifiOff,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useBusinesses } from '@/services/api/hooks';
import { useLocationStore } from '@/stores/location-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CARD_HEIGHT = 320;

const categories = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'hotel', name: 'Hotels', icon: '🏨' },
  { id: 'restaurant', name: 'Dining', icon: '🍽️' },
  { id: 'tour', name: 'Tours', icon: '🎯' },
  { id: 'activity', name: 'Activities', icon: '🎭' },
  { id: 'transport', name: 'Transport', icon: '🚗' },
  { id: 'guide', name: 'Guides', icon: '🧭' },
];

// Memoized Business Card
const BusinessCard = memo(({
  item,
  index,
  onPress,
}: {
  item: any;
  index: number;
  onPress: (item: any) => void;
}) => {
  const handlePress = useCallback(() => onPress(item), [item, onPress]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: Math.min(index * 100, 500), type: 'spring', damping: 15 }}
    >
      <Pressable
        style={styles.businessCard}
        onPress={handlePress}
        android_ripple={{ color: 'rgba(201,169,110,0.2)' }}
      >
        <BlurView intensity={60} style={styles.cardBlur}>
          <LinearGradient
            colors={['rgba(40,40,45,0.95)', 'rgba(30,30,35,0.98)']}
            style={styles.cardGradient}
          >
            <Image 
              source={{ uri: item.cover_image || 'https://via.placeholder.com/400x200' }} 
              style={styles.businessImage}
              resizeMode="cover"
            />
            
            <View style={styles.businessContent}>
              <View style={styles.businessHeader}>
                <View style={styles.businessTitleSection}>
                  <Text style={styles.businessName} numberOfLines={1}>
                    {item.business_name}
                  </Text>
                  <View style={styles.businessTypeRow}>
                    <Text style={styles.businessType}>{item.business_type}</Text>
                    {item.is_verified && (
                      <View style={styles.verifiedBadge}>
                        <Star size={10} color={Colors.neutral.white} fill={Colors.neutral.white} />
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.ratingBadge}>
                  <Star size={14} color={Colors.primary.gold} fill={Colors.primary.gold} />
                  <Text style={styles.ratingText}>
                    {item.avg_rating ? item.avg_rating.toFixed(1) : 'New'}
                  </Text>
                </View>
              </View>

              <View style={styles.businessMeta}>
                <MapPin size={14} color={Colors.neutral.gray400} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.city}, {item.country}
                </Text>
              </View>

              <Text style={styles.businessDescription} numberOfLines={2}>
                {item.short_description || item.description}
              </Text>

              <View style={styles.businessFooter}>
                <View style={styles.servicesPreview}>
                  <Text style={styles.servicesText}>
                    {item.services_count || 0} services available
                  </Text>
                </View>
                <TouchableOpacity style={styles.bookButton} activeOpacity={0.8}>
                  <Text style={styles.bookButtonText}>View</Text>
                  <ChevronRight size={16} color={Colors.neutral.white} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Pressable>
    </MotiView>
  );
});

BusinessCard.displayName = 'BusinessCard';

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentLocation } = useLocationStore();
  const { isAuthenticated } = useAuthStore();
  const { showToast, isOnline } = useUIStore();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Real API hook
  const {
    data: businessesData,
    isLoading,
    error,
    refetch,
  } = useBusinesses({
    location: currentLocation?.city,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    query: searchQuery,
    lat: currentLocation?.latitude,
    lng: currentLocation?.longitude,
    radius: 50,
  });

  const businesses = businessesData?.businesses || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleBusinessPress = useCallback((business: any) => {
    router.push({
      pathname: '/marketplace/business/[id]',
      params: { id: business.id },
    });
  }, [router]);

  const renderHeader = useCallback(() => (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
      <View>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Book experiences & services</Text>
      </View>
    </View>
  ), [insets.top]);

  const renderSearch = useCallback(() => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Search size={20} color={Colors.neutral.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search hotels, tours, restaurants..."
          placeholderTextColor={Colors.neutral.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={18} color={Colors.primary.gold} />
        </TouchableOpacity>
      </View>
    </View>
  ), [searchQuery]);

  const renderCategories = useCallback(() => (
    <View style={styles.categoriesContainer}>
      {categories.map((cat, index) => (
        <MotiView
          key={cat.id}
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 50 }}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.categoryName,
                selectedCategory === cat.id && styles.categoryNameActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        </MotiView>
      ))}
    </View>
  ), [selectedCategory]);

  const renderBusinessCard = useCallback(({ item, index }: { item: any; index: number }) => (
    <BusinessCard item={item} index={index} onPress={handleBusinessPress} />
  ), [handleBusinessPress]);

  const ListEmptyComponent = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonImage} />
              <View style={styles.skeletonContent} />
            </View>
          ))}
        </View>
      );
    }

    if (error) {
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
        <Search size={48} color={Colors.neutral.gray400} />
        <Text style={styles.emptyTitle}>No businesses found</Text>
        <Text style={styles.emptySubtitle}>
          Try adjusting your search or filters
        </Text>
      </View>
    );
  }, [isLoading, error, isOnline, onRefresh]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.background.gradient} style={styles.background}>
        <FlatList
          data={businesses}
          keyExtractor={(item) => item.id}
          renderItem={renderBusinessCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          ListHeaderComponent={
            <>
              {renderHeader()}
              {renderSearch()}
              {renderCategories()}
              <Text style={styles.sectionTitle}>Featured Businesses</Text>
            </>
          }
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
          initialNumToRender={4}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({
            length: CARD_HEIGHT,
            offset: CARD_HEIGHT * index,
            index,
          })}
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
    marginBottom: Spacing.md,
  },
  title: { ...Typography.h1, color: Colors.neutral.white },
  subtitle: { ...Typography.bodyMedium, color: Colors.neutral.gray400, marginTop: Spacing.xs },
  searchContainer: {
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    marginLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
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
    flexWrap: 'wrap',
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.gray800,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: `${Colors.primary.gold}30`,
    borderWidth: 1,
    borderColor: Colors.primary.gold,
  },
  categoryIcon: { fontSize: 16 },
  categoryName: { ...Typography.bodySmall, color: Colors.neutral.gray400 },
  categoryNameActive: { color: Colors.primary.gold, fontWeight: '700' },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral.white,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  businessCard: {
    height: CARD_HEIGHT,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  cardBlur: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  cardGradient: { flex: 1 },
  businessImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  businessContent: { padding: Spacing.md },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  businessTitleSection: { flex: 1, marginRight: Spacing.sm },
  businessName: { ...Typography.h4, color: Colors.neutral.white },
  businessTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  businessType: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
    textTransform: 'capitalize',
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.gold,
    justifyContent: 'center',
    alignItems: 'center',
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
    ...Typography.bodySmall,
    color: Colors.primary.gold,
    fontWeight: '700',
  },
  businessMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  metaText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    flex: 1,
  },
  businessDescription: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray300,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  businessFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray800,
  },
  servicesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicesText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  bookButtonText: {
    ...Typography.bodySmall,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  loadingContainer: { gap: Spacing.lg },
  skeletonCard: {
    height: CARD_HEIGHT,
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  skeletonImage: {
    height: 160,
    backgroundColor: Colors.neutral.gray700,
  },
  skeletonContent: {
    flex: 1,
    margin: Spacing.md,
    backgroundColor: Colors.neutral.gray700,
    borderRadius: BorderRadius.md,
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