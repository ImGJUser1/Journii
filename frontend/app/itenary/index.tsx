// app/itenary/index.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Plus,
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  MoreVertical,
  Share2,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  Circle,
  Plane,
} from 'lucide-react-native';
import { format, isPast, isFuture, isToday, differenceInDays } from 'date-fns';

import { useItineraryList, useDeleteItinerary } from '@/services/api/hooks';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'upcoming' | 'ongoing' | 'past';

export default function ItineraryListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const {
    data: itinerariesData,
    isLoading,
    refetch,
  } = useItineraryList();

  const deleteItinerary = useDeleteItinerary();

  const itineraries = itinerariesData?.itineraries || [];

  const filteredItineraries = itineraries.filter((itinerary: any) => {
    if (filter === 'all') return true;
    
    const startDate = new Date(itinerary.start_date);
    const endDate = new Date(itinerary.end_date);
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return isFuture(startDate) || isToday(startDate);
      case 'ongoing':
        return (isPast(startDate) || isToday(startDate)) && (isFuture(endDate) || isToday(endDate));
      case 'past':
        return isPast(endDate);
      default:
        return true;
    }
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreateItinerary = useCallback(() => {
    router.push('/itenary/builder');
  }, [router]);

  const handleEditItinerary = useCallback((id: string) => {
    setMenuOpen(null);
    router.push({
      pathname: '/itenary/builder',
      params: { id },
    });
  }, [router]);

  const handleViewItinerary = useCallback((id: string) => {
    router.push({
      pathname: '/itenary/[id]',
      params: { id },
    });
  }, [router]);

  const handleShareItinerary = useCallback((itinerary: any) => {
    setMenuOpen(null);
    // Share functionality
    showToast({ type: 'success', message: 'Share link copied!' });
  }, [showToast]);

  const handleDeleteItinerary = useCallback((id: string) => {
    setMenuOpen(null);
    Alert.alert(
      'Delete Itinerary',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItinerary.mutateAsync(id);
              showToast({ type: 'success', message: 'Itinerary deleted' });
            } catch (error) {
              showToast({ type: 'error', message: 'Failed to delete' });
            }
          },
        },
      ]
    );
  }, [deleteItinerary, showToast]);

  const getStatusColor = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if ((isPast(start) || isToday(start)) && (isFuture(end) || isToday(end))) {
      return Colors.semantic.success; // Ongoing
    } else if (isFuture(start)) {
      return Colors.primary.gold; // Upcoming
    } else {
      return Colors.neutral.gray500; // Past
    }
  };

  const getStatusText = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (isToday(start)) return 'Starts today';
    if (isToday(end)) return 'Ends today';
    if ((isPast(start) || isToday(start)) && (isFuture(end) || isToday(end))) {
      return 'Ongoing';
    } else if (isFuture(start)) {
      const days = differenceInDays(start, now);
      return days === 1 ? 'Tomorrow' : `In ${days} days`;
    } else {
      return 'Completed';
    }
  };

  const renderItineraryCard = ({ item, index }: { item: any; index: number }) => {
    const statusColor = getStatusColor(item.start_date, item.end_date);
    const statusText = getStatusText(item.start_date, item.end_date);
    const isMenuOpen = menuOpen === item.id;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 100 }}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleViewItinerary(item.id)}
          activeOpacity={0.9}
        >
          <BlurView intensity={60} style={styles.cardBlur}>
            <LinearGradient
              colors={['rgba(40,40,45,0.95)', 'rgba(30,30,35,0.98)']}
              style={styles.cardGradient}
            >
              {/* Header Image */}
              <Image
                source={{ 
                  uri: item.cover_image || 
                    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400' 
                }}
                style={styles.cardImage}
              />
              
              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{statusText}</Text>
              </View>

              {/* Menu Button */}
              <TouchableOpacity
                style={styles.menuButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setMenuOpen(isMenuOpen ? null : item.id);
                }}
              >
                <MoreVertical size={20} color={Colors.neutral.white} />
              </TouchableOpacity>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={styles.dropdownMenu}
                >
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditItinerary(item.id);
                    }}
                  >
                    <Edit3 size={16} color={Colors.neutral.white} />
                    <Text style={styles.menuItemText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleShareItinerary(item);
                    }}
                  >
                    <Share2 size={16} color={Colors.neutral.white} />
                    <Text style={styles.menuItemText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuItem, styles.menuItemDanger]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteItinerary(item.id);
                    }}
                  >
                    <Trash2 size={16} color={Colors.semantic.error} />
                    <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </MotiView>
              )}

              {/* Content */}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                
                <View style={styles.cardMeta}>
                  <MapPin size={14} color={Colors.primary.gold} />
                  <Text style={styles.cardMetaText} numberOfLines={1}>
                    {item.destination}
                  </Text>
                </View>

                <View style={styles.cardDates}>
                  <Calendar size={14} color={Colors.neutral.gray400} />
                  <Text style={styles.cardDatesText}>
                    {format(new Date(item.start_date), 'MMM d')} -{' '}
                    {format(new Date(item.end_date), 'MMM d, yyyy')}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.cardStats}>
                    <View style={styles.cardStat}>
                      <Clock size={14} color={Colors.neutral.gray400} />
                      <Text style={styles.cardStatText}>
                        {item.stops_count || 0} stops
                      </Text>
                    </View>
                    {item.collaborators_count > 0 && (
                      <View style={styles.cardStat}>
                        <Users size={14} color={Colors.neutral.gray400} />
                        <Text style={styles.cardStatText}>
                          {item.collaborators_count} travelers
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.cardArrow}>
                    <ChevronRight size={20} color={Colors.primary.gold} />
                  </View>
                </View>

                {/* Progress Bar for ongoing trips */}
                {(isPast(new Date(item.start_date)) || isToday(new Date(item.start_date))) && 
                 (isFuture(new Date(item.end_date)) || isToday(new Date(item.end_date))) && (
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${calculateProgress(item.start_date, item.end_date)}%`,
                          backgroundColor: statusColor,
                        }
                      ]} 
                    />
                  </View>
                )}
              </View>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.background.gradient} style={styles.background}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <View>
            <Text style={styles.title}>My Trips</Text>
            <Text style={styles.subtitle}>
              {itineraries.length} {itineraries.length === 1 ? 'itinerary' : 'itineraries'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateItinerary}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary.gold, Colors.primary.purple]}
              style={styles.createGradient}
            >
              <Plus size={24} color={Colors.neutral.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'upcoming', 'ongoing', 'past'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === f && styles.filterTabTextActive,
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <FlatList
          data={filteredItineraries}
          keyExtractor={(item) => item.id}
          renderItem={renderItineraryCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary.gold}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Plane size={64} color={Colors.neutral.gray600} />
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all' 
                  ? "Start planning your next adventure!" 
                  : `No ${filter} trips found.`}
              </Text>
              {filter === 'all' && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={handleCreateItinerary}
                >
                  <Text style={styles.emptyButtonText}>Plan a Trip</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
    </View>
  );
}

function calculateProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  
  if (now >= end) return 100;
  if (now <= start) return 0;
  
  return ((now - start) / (end - start)) * 100;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: { ...Typography.h1, color: Colors.neutral.white },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    marginTop: Spacing.xs,
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  createGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral.gray800,
  },
  filterTabActive: {
    backgroundColor: `${Colors.primary.gold}30`,
  },
  filterTabText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: Colors.primary.gold,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  cardBlur: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  menuButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    right: Spacing.md,
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    ...Shadows.large,
    zIndex: 100,
    minWidth: 150,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  menuItemDanger: {
    backgroundColor: `${Colors.semantic.error}10`,
  },
  menuItemText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
  },
  menuItemTextDanger: {
    color: Colors.semantic.error,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.neutral.white,
    marginBottom: Spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  cardMetaText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray300,
    flex: 1,
  },
  cardDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  cardDatesText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardStatText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
  },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.neutral.gray700,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
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
  emptyButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary.gold,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
});