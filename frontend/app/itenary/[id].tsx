// app/itenary/[id].tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  ArrowLeft,
  Share2,
  Users,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Edit3,
  Download,
  MoreVertical,
  Navigation,
  Camera,
  Utensils,
  Hotel,
  Bus,
  Star,
} from 'lucide-react-native';
import { format, formatDistanceToNow } from 'date-fns';

import { useItinerary } from '@/services/api/hooks';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

const categoryIcons: Record<string, any> = {
  attraction: Camera,
  food: Utensils,
  accommodation: Hotel,
  transit: Bus,
  activity: Star,
};

const categoryColors: Record<string, string> = {
  attraction: Colors.primary.gold,
  food: Colors.semantic.error,
  accommodation: Colors.primary.purple,
  transit: Colors.semantic.info,
  activity: Colors.semantic.success,
};

export default function ItineraryViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  
  const [selectedDay, setSelectedDay] = useState(1);
  const [showMap, setShowMap] = useState(true);

  const {
    data: itinerary,
    isLoading,
    error,
  } = useItinerary(id);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: itinerary?.title,
        message: `Check out my trip to ${itinerary?.destination}!`,
        url: `https://journii.app/itinerary/${id}`,
      });
    } catch (error) {
      // Cancelled
    }
  }, [itinerary, id]);

  const handleEdit = useCallback(() => {
    router.push({
      pathname: '/itenary/builder',
      params: { id },
    });
  }, [router, id]);

  const isCollaborator = itinerary?.collaborators?.some(
    (c: any) => c.user_id === user?.id
  );

  const isOwner = itinerary?.owner_id === user?.id;

  const dayStops = itinerary?.stops?.filter((s: any) => s.day === selectedDay) || [];
  const totalDays = itinerary?.total_days || 1;

  const mapRegion = {
    latitude: dayStops[0]?.coordinates?.lat || 37.7749,
    longitude: dayStops[0]?.coordinates?.lng || -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary.gold} />
      </View>
    );
  }

  if (error || !itinerary) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load itinerary</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.background.gradient} style={styles.background}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
            <BlurView intensity={60} style={styles.headerBlur}>
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft size={24} color={Colors.neutral.white} />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle} numberOfLines={1}>
                {itinerary.title}
              </Text>
              
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={handleShare}>
                  <Share2 size={22} color={Colors.neutral.white} />
                </TouchableOpacity>
                {(isOwner || isCollaborator) && (
                  <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                    <Edit3 size={22} color={Colors.primary.gold} />
                  </TouchableOpacity>
                )}
              </View>
            </BlurView>
          </View>

          {/* Hero Section */}
          <View style={styles.hero}>
            <Image
              source={{ 
                uri: itinerary.cover_image || 
                  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400'
              }}
              style={styles.heroImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(26,26,31,0.9)']}
              style={styles.heroOverlay}
            >
              <View style={styles.heroContent}>
                <View style={styles.destinationRow}>
                  <MapPin size={16} color={Colors.primary.gold} />
                  <Text style={styles.destination}>{itinerary.destination}</Text>
                </View>
                
                <View style={styles.dateRow}>
                  <Calendar size={14} color={Colors.neutral.gray400} />
                  <Text style={styles.dateText}>
                    {format(new Date(itinerary.start_date), 'MMM d')} -{' '}
                    {format(new Date(itinerary.end_date), 'MMM d, yyyy')}
                  </Text>
                </View>

                {itinerary.collaborators?.length > 0 && (
                  <View style={styles.collaborators}>
                    <Users size={14} color={Colors.neutral.gray400} />
                    <View style={styles.avatarStack}>
                      {itinerary.collaborators.slice(0, 3).map((c: any, i: number) => (
                        <Image
                          key={c.user_id}
                          source={{ uri: c.avatar_url }}
                          
                          style={[
                            styles.collabAvatar,
                            { marginLeft: i > 0 ? -12 : 0, zIndex: 3 - i },
                          ]}
                        />
                      ))}
                      {itinerary.collaborators.length > 3 && (
                        <View style={[styles.collabAvatar, styles.collabAvatarMore]}>
                          <Text style={styles.collabAvatarMoreText}>
                            +{itinerary.collaborators.length - 3}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.collabText}>
                      {itinerary.collaborators.length} travelers
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* Day Selector */}
          <View style={styles.daySelector}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daySelectorContent}
            >
              {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    selectedDay === day && styles.dayButtonActive,
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      selectedDay === day && styles.dayNumberActive,
                    ]}
                  >
                    Day {day}
                  </Text>
                  <Text style={styles.dayDate}>
                    {format(
                      new Date(new Date(itinerary.start_date).getTime() + (day - 1) * 24 * 60 * 60 * 1000),
                      'EEE, MMM d'
                    )}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Map */}
          {showMap && dayStops.length > 0 && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 200 }}
              style={styles.mapContainer}
            >
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={mapRegion}
              >
                {dayStops.map((stop: any, index: number) => (
                  stop.coordinates?.lat && (
                    <Marker
                      key={stop.id}
                      coordinate={{
                        latitude: stop.coordinates.lat,
                        longitude: stop.coordinates.lng,
                      }}
                      title={stop.name}
                    >
                      <View style={[
                        styles.mapMarker,
                        { backgroundColor: categoryColors[stop.category] || Colors.primary.gold }
                      ]}>
                        <Text style={styles.mapMarkerText}>{index + 1}</Text>
                      </View>
                    </Marker>
                  )
                ))}
                {dayStops.filter((s: any) => s.coordinates?.lat).length > 1 && (
                  <Polyline
                    coordinates={dayStops
                      .filter((s: any) => s.coordinates?.lat)
                      .map((s: any) => s.coordinates)}
                    strokeColor={Colors.primary.gold}
                    strokeWidth={3}
                  />
                )}
              </MapView>
            </MotiView>
          )}

          {/* Stops List */}
          <View style={styles.stopsSection}>
            <Text style={styles.stopsTitle}>
              Day {selectedDay} Itinerary ({dayStops.length} stops)
            </Text>
            
            {dayStops.length > 0 ? (
              dayStops
                .sort((a: any, b: any) => a.order - b.order)
                .map((stop: any, index: number) => {
                  const CategoryIcon = categoryIcons[stop.category] || Star;
                  
                  return (
                    <MotiView
                      key={stop.id}
                      from={{ opacity: 0, translateX: -30 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: index * 100 }}
                      style={styles.stopCard}
                    >
                      <View style={styles.stopTimeline}>
                        <View style={[
                          styles.stopNumber,
                          { backgroundColor: categoryColors[stop.category] || Colors.primary.gold }
                        ]}>
                          <Text style={styles.stopNumberText}>{index + 1}</Text>
                        </View>
                        {index < dayStops.length - 1 && (
                          <View style={styles.timelineLine} />
                        )}
                      </View>
                      
                      <View style={styles.stopContent}>
                        <BlurView intensity={40} style={styles.stopBlur}>
                          <View style={styles.stopHeader}>
                            <CategoryIcon
                              size={18}
                              color={categoryColors[stop.category] || Colors.primary.gold}
                            />
                            <Text style={styles.stopCategory}>
                              {stop.category.charAt(0).toUpperCase() + stop.category.slice(1)}
                            </Text>
                            <Clock size={14} color={Colors.neutral.gray400} />
                            <Text style={styles.stopDuration}>
                              {Math.floor(stop.duration / 60)}h {stop.duration % 60}m
                            </Text>
                          </View>
                          
                          <Text style={styles.stopName}>{stop.name}</Text>
                          
                          {stop.location && (
                            <View style={styles.stopLocation}>
                              <MapPin size={14} color={Colors.neutral.gray400} />
                              <Text style={styles.stopLocationText} numberOfLines={1}>
                                {stop.location}
                              </Text>
                            </View>
                          )}
                          
                          {stop.notes && (
                            <Text style={styles.stopNotes}>{stop.notes}</Text>
                          )}
                          
                          {stop.booking_url && (
                            <TouchableOpacity
                              style={styles.bookingButton}
                              onPress={() => {
                                // Open booking URL
                              }}
                            >
                              <Text style={styles.bookingButtonText}>
                                View Booking Options
                              </Text>
                              <ChevronRight size={16} color={Colors.primary.gold} />
                            </TouchableOpacity>
                          )}
                        </BlurView>
                      </View>
                    </MotiView>
                  );
                })
            ) : (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayText}>No stops planned for this day</Text>
              </View>
            )}
          </View>

          {/* Trip Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Trip Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Clock size={24} color={Colors.primary.gold} />
                <Text style={styles.statValue}>
                  {Math.round(dayStops.reduce((acc: number, s: any) => acc + s.duration, 0) / 60)}h
                </Text>
                <Text style={styles.statLabel}>Total Duration</Text>
              </View>
              <View style={styles.statCard}>
                <MapPin size={24} color={Colors.primary.gold} />
                <Text style={styles.statValue}>{itinerary.stops?.length || 0}</Text>
                <Text style={styles.statLabel}>Total Stops</Text>
              </View>
              <View style={styles.statCard}>
                <Navigation size={24} color={Colors.primary.gold} />
                <Text style={styles.statValue}>
                  {itinerary.total_distance ? `${itinerary.total_distance} km` : '—'}
                </Text>
                <Text style={styles.statLabel}>Total Distance</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.bodyLarge,
    color: Colors.semantic.error,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(26,26,31,0.9)',
  },
  headerTitle: {
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: Spacing.md,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  editButton: {
    padding: Spacing.xs,
  },
  hero: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  heroContent: {
    gap: Spacing.sm,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  destination: {
    ...Typography.h2,
    color: Colors.neutral.white,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dateText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray300,
  },
  collaborators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collabAvatar: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.neutral.gray900,
  },
  collabAvatarMore: {
    backgroundColor: Colors.neutral.gray700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collabAvatarMoreText: {
    ...Typography.caption,
    color: Colors.neutral.white,
    fontSize: 10,
  },
  collabText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
  },
  daySelector: {
    marginTop: -30,
    paddingHorizontal: Spacing.lg,
  },
  daySelectorContent: {
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  dayButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral.gray800,
    minWidth: 100,
  },
  dayButtonActive: {
    backgroundColor: `${Colors.primary.gold}30`,
    borderWidth: 1,
    borderColor: Colors.primary.gold,
  },
  dayNumber: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    fontWeight: '700',
  },
  dayNumberActive: {
    color: Colors.primary.gold,
  },
  dayDate: {
    ...Typography.caption,
    color: Colors.neutral.gray500,
    marginTop: 2,
  },
  mapContainer: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  map: {
    width: '100%',
    height: 200,
  },
  mapMarker: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  mapMarkerText: {
    ...Typography.caption,
    color: Colors.neutral.white,
    fontWeight: '800',
  },
  stopsSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  stopsTitle: {
    ...Typography.h3,
    color: Colors.neutral.white,
    marginBottom: Spacing.md,
  },
  stopCard: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  stopTimeline: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stopNumber: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stopNumberText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    fontWeight: '800',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.neutral.gray700,
    marginTop: -4,
    marginBottom: -4,
  },
  stopContent: {
    flex: 1,
  },
  stopBlur: {
    backgroundColor: 'rgba(40,40,45,0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  stopCategory: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
    textTransform: 'capitalize',
    flex: 1,
  },
  stopDuration: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
  },
  stopName: {
    ...Typography.h4,
    color: Colors.neutral.white,
    marginBottom: Spacing.xs,
  },
  stopLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  stopLocationText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    flex: 1,
  },
  stopNotes: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray300,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  bookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray700,
  },
  bookingButtonText: {
    ...Typography.bodySmall,
    color: Colors.primary.gold,
    flex: 1,
  },
  emptyDay: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyDayText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    fontStyle: 'italic',
  },
  statsSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  statsTitle: {
    ...Typography.h3,
    color: Colors.neutral.white,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h3,
    color: Colors.primary.gold,
    marginTop: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
    marginTop: Spacing.xs,
  },
});
