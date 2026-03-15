import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
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
  Phone,
  Globe,
  Clock,
  ChevronRight,
  Heart,
  Share2,
  Calendar,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useBusinesses } from '@/services/api/hooks';
import { useLocationStore } from '@/stores/location-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const categories = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'hotel', name: 'Hotels', icon: '🏨' },
  { id: 'restaurant', name: 'Dining', icon: '🍽️' },
  { id: 'tour', name: 'Tours', icon: '🎯' },
  { id: 'activity', name: 'Activities', icon: '🎭' },
  { id: 'transport', name: 'Transport', icon: '🚗' },
  { id: 'guide', name: 'Guides', icon: '🧭' },
];

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentLocation } = useLocationStore();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: businesses, isLoading } = useBusinesses({
    location: currentLocation?.city,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    query: searchQuery,
  });

  const renderHeader = () => (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
    >
      <View>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Book experiences & services</Text>
      </View>
    </MotiView>
  );

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Search size={20} color={Colors.neutral.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search hotels, tours, restaurants..."
          placeholderTextColor={Colors.neutral.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={18} color={Colors.primary.gold} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContainer}
    >
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
    </ScrollView>
  );

  const renderBusinessCard = ({ item, index }: { item: any; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100 }}
    >
      <TouchableOpacity
        style={styles.businessCard}
        onPress={() => router.push(`/marketplace/business/${item.id}`)}
      >
        <BlurView intensity={60} style={styles.cardBlur}>
          <LinearGradient
            colors={['rgba(40,40,45,0.95)', 'rgba(30,30,35,0.98)']}
            style={styles.cardGradient}
          >
            <Image source={{ uri: item.cover_image }} style={styles.businessImage} />
            
            <View style={styles.businessContent}>
              <View style={styles.businessHeader}>
                <View>
                  <Text style={styles.businessName}>{item.business_name}</Text>
                  <View style={styles.businessTypeRow}>
                    <Text style={styles.businessType}>{item.business_type}</Text>
                    {item.is_verified && (
                      <View style={styles.verifiedBadge}>
                        <Star size={12} color={Colors.neutral.white} fill={Colors.neutral.white} />
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.ratingBadge}>
                  <Star size={14} color={Colors.primary.gold} fill={Colors.primary.gold} />
                  <Text style={styles.ratingText}>{item.avg_rating.toFixed(1)}</Text>
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
                    {item.services?.length || 0} services available
                  </Text>
                </View>
                <TouchableOpacity style={styles.bookButton}>
                  <Text style={styles.bookButtonText}>View</Text>
                  <ChevronRight size={16} color={Colors.neutral.white} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.background.gradient} style={styles.background}>
        <FlatList
          data={businesses || []}
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
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: { ...Typography.h1, color: Colors.neutral.white },
  subtitle: { ...Typography.bodyMedium, color: Colors.neutral.gray400, marginTop: Spacing.xs },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
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
    paddingHorizontal: Spacing.lg,
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
  listContent: { paddingHorizontal: Spacing.lg },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral.white,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  businessCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardBlur: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  cardGradient: {},
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
});