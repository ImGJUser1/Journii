import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  MapPin,
  Calendar,
  Clock,
  Plus,
  Trash2,
  GripVertical,
  Navigation,
  Users,
  Sparkles,
  Save,
  Share2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Hotel,
  Utensils,
  Camera,
  Bus,
  MoreVertical,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

import { useItinerary, useCreateItinerary, useUpdateItinerary, useOptimizeItinerary } from '@/services/api/hooks';
import { useAIItinerarySuggestions } from '@/services/api/hooks';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface ItineraryStop {
  id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  category: 'attraction' | 'food' | 'accommodation' | 'transit' | 'activity';
  duration: number;
  day: number;
  order: number;
  notes?: string;
  bookingUrl?: string;
  priceEstimate?: number;
}

const categoryIcons = {
  attraction: Camera,
  food: Utensils,
  accommodation: Hotel,
  transit: Bus,
  activity: MapPin,
};

const categoryColors = {
  attraction: Colors.primary.gold,
  food: Colors.semantic.error,
  accommodation: Colors.primary.purple,
  transit: Colors.semantic.info,
  activity: Colors.semantic.success,
};

export default function ItineraryBuilderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();

  const [title, setTitle] = useState('My Trip');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
  const [stops, setStops] = useState<ItineraryStop[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [expandedStop, setExpandedStop] = useState<string | null>(null);

  const aiSuggestions = useAIItinerarySuggestions();
  const createItinerary = useCreateItinerary();
  const optimizeItinerary = useOptimizeItinerary('temp');

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const handleAddStop = () => {
    const newStop: ItineraryStop = {
      id: `stop-${Date.now()}`,
      name: 'New Stop',
      location: '',
      coordinates: { lat: 0, lng: 0 },
      category: 'attraction',
      duration: 120,
      day: selectedDay,
      order: stops.filter(s => s.day === selectedDay).length,
    };
    setStops([...stops, newStop]);
  };

  const handleRemoveStop = (stopId: string) => {
    setStops(stops.filter(s => s.id !== stopId));
  };

  const handleUpdateStop = (stopId: string, updates: Partial<ItineraryStop>) => {
    setStops(stops.map(s => s.id === stopId ? { ...s, ...updates } : s));
  };

  const handleReorderStops = (fromIndex: number, toIndex: number) => {
    const dayStops = stops.filter(s => s.day === selectedDay).sort((a, b) => a.order - b.order);
    const reordered = [...dayStops];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    
    // Update orders
    const updated = reordered.map((stop, idx) => ({ ...stop, order: idx }));
    setStops(stops.map(s => {
      const updatedStop = updated.find(u => u.id === s.id);
      return updatedStop || s;
    }));
  };

  const handleGenerateAI = async () => {
    if (!destination) {
      showToast({ type: 'error', message: 'Please enter a destination first' });
      return;
    }

    try {
      const result = await aiSuggestions.mutateAsync({
        destination,
        days: totalDays,
        interests: ['culture', 'food', 'history'],
        budget: '$$',
      });

      // Convert AI suggestions to stops
      const aiStops: ItineraryStop[] = [];
      result.days.forEach((day: any, dayIndex: number) => {
        day.stops.forEach((stop: any, stopIndex: number) => {
          aiStops.push({
            id: `ai-${dayIndex}-${stopIndex}`,
            name: stop.name,
            location: stop.location || destination,
            coordinates: stop.coordinates || { lat: 0, lng: 0 },
            category: stop.category || 'attraction',
            duration: stop.duration_minutes || 120,
            day: dayIndex + 1,
            order: stopIndex,
            notes: stop.local_tips,
            priceEstimate: stop.price_estimate,
          });
        });
      });

      setStops(aiStops);
      showToast({ type: 'success', message: 'AI itinerary generated!' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to generate itinerary' });
    }
  };

  const handleSave = async () => {
    try {
      await createItinerary.mutateAsync({
        title,
        destination,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        stops,
      });
      showToast({ type: 'success', message: 'Itinerary saved!' });
      router.back();
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to save itinerary' });
    }
  };

  const handleOptimize = async () => {
    try {
      await optimizeItinerary.mutateAsync();
      showToast({ type: 'success', message: 'Route optimized!' });
    } catch (error) {
      showToast({ type: 'error', message: 'Optimization failed' });
    }
  };

  const renderHeader = () => (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <ChevronLeft size={28} color={Colors.neutral.white} />
      </TouchableOpacity>
      
      <View style={styles.headerCenter}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Trip Title"
          placeholderTextColor={Colors.neutral.gray400}
        />
        <View style={styles.destinationRow}>
          <MapPin size={14} color={Colors.primary.gold} />
          <TextInput
            style={styles.destinationInput}
            value={destination}
            onChangeText={setDestination}
            placeholder="Destination"
            placeholderTextColor={Colors.neutral.gray400}
          />
        </View>
      </View>
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Save size={24} color={Colors.primary.gold} />
      </TouchableOpacity>
    </MotiView>
  );

  const renderDateSelector = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 100 }}
      style={styles.dateContainer}
    >
      <BlurView intensity={60} style={styles.dateBlur}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Calendar size={20} color={Colors.primary.gold} />
          <Text style={styles.dateText}>
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </Text>
          <Text style={styles.durationText}>({totalDays} days)</Text>
        </TouchableOpacity>
        
        <View style={styles.aiButtonContainer}>
          <TouchableOpacity
            style={styles.aiGenerateButton}
            onPress={handleGenerateAI}
            disabled={aiSuggestions.isPending}
          >
            <Sparkles size={18} color={Colors.neutral.white} />
            <Text style={styles.aiButtonText}>
              {aiSuggestions.isPending ? 'Generating...' : 'AI Generate'}
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </MotiView>
  );

  const renderDaySelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.daySelector}
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
              styles.dayText,
              selectedDay === day && styles.dayTextActive,
            ]}
          >
            Day {day}
          </Text>
          <Text style={styles.dayDate}>
            {new Date(startDate.getTime() + (day - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderMap = () => {
    const dayStops = stops.filter(s => s.day === selectedDay);
    const coordinates = dayStops.map(s => s.coordinates).filter(c => c.lat !== 0);

    return (
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            latitude: coordinates[0]?.lat || 37.7749,
            longitude: coordinates[0]?.lng || -122.4194,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {dayStops.map((stop, index) => (
            <Marker
              key={stop.id}
              coordinate={{
                latitude: stop.coordinates.lat || 37.7749,
                longitude: stop.coordinates.lng || -122.4194,
              }}
              title={stop.name}
            >
              <View style={[styles.mapMarker, { backgroundColor: categoryColors[stop.category] }]}>
                <Text style={styles.mapMarkerText}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
          {coordinates.length > 1 && (
            <Polyline
              coordinates={coordinates}
              strokeColor={Colors.primary.gold}
              strokeWidth={3}
            />
          )}
        </MapView>
        
        <TouchableOpacity style={styles.optimizeButton} onPress={handleOptimize}>
          <Navigation size={16} color={Colors.neutral.white} />
          <Text style={styles.optimizeText}>Optimize Route</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStopCard = ({ item, index }: { item: ItineraryStop; index: number }) => {
    const isExpanded = expandedStop === item.id;
    const CategoryIcon = categoryIcons[item.category];

    return (
      <MotiView
        from={{ opacity: 0, translateX: -50 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ delay: index * 100 }}
      >
        <TouchableOpacity
          style={styles.stopCard}
          onPress={() => setExpandedStop(isExpanded ? null : item.id)}
          activeOpacity={0.9}
        >
          <BlurView intensity={60} style={styles.stopBlur}>
            <LinearGradient
              colors={['rgba(40,40,45,0.95)', 'rgba(30,30,35,0.98)']}
              style={styles.stopGradient}
            >
              {/* Drag Handle & Number */}
              <View style={styles.stopHeader}>
                <View style={styles.dragHandle}>
                  <GripVertical size={20} color={Colors.neutral.gray500} />
                </View>
                <View style={[styles.stopNumber, { backgroundColor: categoryColors[item.category] }]}>
                  <Text style={styles.stopNumberText}>{index + 1}</Text>
                </View>
                
                <View style={styles.stopInfo}>
                  <TextInput
                    style={styles.stopNameInput}
                    value={item.name}
                    onChangeText={(text) => handleUpdateStop(item.id, { name: text })}
                    placeholder="Stop Name"
                    placeholderTextColor={Colors.neutral.gray400}
                  />
                  <View style={styles.stopMeta}>
                    <CategoryIcon size={14} color={categoryColors[item.category]} />
                    <Text style={styles.stopCategory}>{item.category}</Text>
                    <Clock size={14} color={Colors.neutral.gray400} />
                    <Text style={styles.stopDuration}>{item.duration} min</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleRemoveStop(item.id)}
                >
                  <Trash2 size={18} color={Colors.semantic.error} />
                </TouchableOpacity>
              </View>

              {/* Expanded Details */}
              {isExpanded && (
                <View style={styles.stopDetails}>
                  <TextInput
                    style={styles.locationInput}
                    value={item.location}
                    onChangeText={(text) => handleUpdateStop(item.id, { location: text })}
                    placeholder="Location/Address"
                    placeholderTextColor={Colors.neutral.gray400}
                  />
                  
                  <View style={styles.durationSelector}>
                    <Text style={styles.detailLabel}>Duration (minutes)</Text>
                    <View style={styles.durationButtons}>
                      {[30, 60, 90, 120, 180, 240].map((mins) => (
                        <TouchableOpacity
                          key={mins}
                          style={[
                            styles.durationButton,
                            item.duration === mins && styles.durationButtonActive,
                          ]}
                          onPress={() => handleUpdateStop(item.id, { duration: mins })}
                        >
                          <Text
                            style={[
                              styles.durationButtonText,
                              item.duration === mins && styles.durationButtonTextActive,
                            ]}
                          >
                            {mins}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TextInput
                    style={styles.notesInput}
                    value={item.notes || ''}
                    onChangeText={(text) => handleUpdateStop(item.id, { notes: text })}
                    placeholder="Notes (tips, booking info, etc.)"
                    placeholderTextColor={Colors.neutral.gray400}
                    multiline
                    numberOfLines={3}
                  />

                  {item.priceEstimate && (
                    <Text style={styles.priceEstimate}>
                      Est. ${item.priceEstimate}
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.expandIndicator}>
                {isExpanded ? (
                  <ChevronUp size={20} color={Colors.neutral.gray400} />
                ) : (
                  <ChevronDown size={20} color={Colors.neutral.gray400} />
                )}
              </View>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </MotiView>
    );
  };

  const dayStops = stops
    .filter(s => s.day === selectedDay)
    .sort((a, b) => a.order - b.order);

  return (
    <GestureHandlerRootView style={styles.container}>
      <LinearGradient colors={Colors.background.gradient} style={styles.background}>
        {renderHeader()}
        {renderDateSelector()}
        {renderDaySelector()}
        {renderMap()}
        
        <FlatList
          data={dayStops}
          keyExtractor={(item) => item.id}
          renderItem={renderStopCard}
          contentContainerStyle={styles.stopsList}
          ListHeaderComponent={
            <View style={styles.stopsHeader}>
              <Text style={styles.stopsTitle}>
                Day {selectedDay} Stops ({dayStops.length})
              </Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddStop}>
                <Plus size={20} color={Colors.neutral.white} />
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyStops}>
              <MapPin size={48} color={Colors.neutral.gray400} />
              <Text style={styles.emptyTitle}>No stops yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap + to add stops or use AI to generate an itinerary
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
        
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
          <TouchableOpacity style={styles.collaborateButton}>
            <Users size={20} color={Colors.neutral.white} />
            <Text style={styles.collaborateText}>Invite</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton}>
            <Share2 size={20} color={Colors.neutral.white} />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  backButton: { marginRight: Spacing.md },
  headerCenter: { flex: 1 },
  titleInput: {
    ...Typography.h2,
    color: Colors.neutral.white,
    padding: 0,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  destinationInput: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray300,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  saveButton: { padding: Spacing.sm },
  dateContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  dateBlur: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
  },
  durationText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
  },
  aiButtonContainer: { marginLeft: Spacing.md },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.purple,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  aiButtonText: {
    ...Typography.bodySmall,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  daySelector: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  dayButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral.gray800,
    alignItems: 'center',
    minWidth: 70,
  },
  dayButtonActive: {
    backgroundColor: `${Colors.primary.gold}30`,
    borderWidth: 1,
    borderColor: Colors.primary.gold,
  },
  dayText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    fontWeight: '700',
  },
  dayTextActive: { color: Colors.primary.gold },
  dayDate: {
    ...Typography.caption,
    color: Colors.neutral.gray500,
    marginTop: 2,
  },
  mapContainer: {
    marginHorizontal: Spacing.lg,
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  map: { ...StyleSheet.absoluteFillObject },
  mapMarker: {
    width: 28,
    height: 28,
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
  optimizeButton: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.semantic.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  optimizeText: {
    ...Typography.bodySmall,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  stopsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  stopsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stopsTitle: {
    ...Typography.h3,
    color: Colors.neutral.white,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  stopBlur: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  stopGradient: { padding: Spacing.md },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: { marginRight: Spacing.sm },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stopNumberText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    fontWeight: '800',
  },
  stopInfo: { flex: 1 },
  stopNameInput: {
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    padding: 0,
  },
  stopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  stopCategory: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
    textTransform: 'capitalize',
  },
  stopDuration: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  stopDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray800,
  },
  locationInput: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    backgroundColor: Colors.neutral.gray800,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  durationSelector: { marginBottom: Spacing.md },
  detailLabel: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    marginBottom: Spacing.xs,
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  durationButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral.gray800,
  },
  durationButtonActive: {
    backgroundColor: Colors.primary.gold,
  },
  durationButtonText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
  },
  durationButtonTextActive: {
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  notesInput: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    backgroundColor: Colors.neutral.gray800,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    height: 80,
    textAlignVertical: 'top',
  },
  priceEstimate: {
    ...Typography.bodySmall,
    color: Colors.semantic.success,
    marginTop: Spacing.sm,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  emptyStops: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.neutral.white,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(26,26,31,0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray800,
  },
  collaborateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  collaborateText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  shareText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
  },
});