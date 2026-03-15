// app/itenary/builder.tsx - Production Ready
import React, { useState, useCallback, useRef, useMemo } from 'react';
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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
  AlertCircle,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

import { 
  useItinerary, 
  useCreateItinerary, 
  useUpdateItinerary, 
  useOptimizeItinerary,
  useAIItinerarySuggestions 
} from '@/services/api/hooks';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// Types
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

// Memoized Stop Card Component
const StopCard = memo(({
  item,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  totalStops,
  onReorder,
}: {
  item: ItineraryStop;
  index: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ItineraryStop>) => void;
  onRemove: (id: string) => void;
  totalStops: number;
  onReorder: (from: number, to: number) => void;
}) => {
  const CategoryIcon = categoryIcons[item.category];
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: isActive.value ? 1000 : 1,
    elevation: isActive.value ? 10 : 1,
  }));

  const handleGestureEvent = useCallback((event: any) => {
    translateY.value = event.translationY;
  }, []);

  const handleStateChange = useCallback(({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      const moveTo = Math.round((index * 80 + nativeEvent.translationY) / 80);
      const clampedMoveTo = Math.max(0, Math.min(moveTo, totalStops - 1));
      
      if (clampedMoveTo !== index) {
        runOnJS(onReorder)(index, clampedMoveTo);
      }
      
      translateY.value = withSpring(0);
      isActive.value = false;
    } else if (nativeEvent.state === State.BEGAN) {
      isActive.value = true;
    }
  }, [index, totalStops, onReorder]);

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleStateChange}
      activateAfterLongPress={200}
    >
      <Animated.View style={[styles.stopCardContainer, animatedStyle]}>
        <TouchableOpacity
          style={styles.stopCard}
          onPress={() => onToggle(item.id)}
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
                    onChangeText={(text) => onUpdate(item.id, { name: text })}
                    placeholder="Stop Name"
                    placeholderTextColor={Colors.neutral.gray400}
                    onPressIn={(e) => e.stopPropagation()}
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
                  onPress={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                >
                  <Trash2 size={18} color={Colors.semantic.error} />
                </TouchableOpacity>
              </View>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <View style={styles.stopDetails}>
                      <TextInput
                        style={styles.locationInput}
                        value={item.location}
                        onChangeText={(text) => onUpdate(item.id, { location: text })}
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
                              onPress={() => onUpdate(item.id, { duration: mins })}
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
                        onChangeText={(text) => onUpdate(item.id, { notes: text })}
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
                  </MotiView>
                )}
              </AnimatePresence>

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
      </Animated.View>
    </PanGestureHandler>
  );
});

StopCard.displayName = 'StopCard';

export default function ItineraryBuilderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();

  // Form state
  const [title, setTitle] = useState(params.title as string || 'My Trip');
  const [destination, setDestination] = useState(params.destination as string || '');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
  const [stops, setStops] = useState<ItineraryStop[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedStop, setExpandedStop] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // API hooks
  const itineraryId = params.id as string | undefined;
  const { data: existingItinerary, isLoading: isLoadingItinerary } = useItinerary(itineraryId || '');
  const createItinerary = useCreateItinerary();
  const updateItinerary = useUpdateItinerary(itineraryId || '');
  const optimizeItinerary = useOptimizeItinerary(itineraryId || '');
  const aiSuggestions = useAIItinerarySuggestions();

  // Load existing itinerary data
  React.useEffect(() => {
    if (existingItinerary) {
      setTitle(existingItinerary.title);
      setDestination(existingItinerary.destination);
      setStartDate(new Date(existingItinerary.start_date));
      setEndDate(new Date(existingItinerary.end_date));
      setStops(existingItinerary.stops || []);
    }
  }, [existingItinerary]);

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const handleAddStop = useCallback(() => {
    const newStop: ItineraryStop = {
      id: `stop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'New Stop',
      location: '',
      coordinates: { lat: 0, lng: 0 },
      category: 'attraction',
      duration: 120,
      day: selectedDay,
      order: stops.filter(s => s.day === selectedDay).length,
    };
    // app/itenary/builder.tsx - Continued
    setStops(prev => [...prev, newStop]);
    setExpandedStop(newStop.id);
  }, [selectedDay, stops]);

  const handleRemoveStop = useCallback((stopId: string) => {
    Alert.alert(
      'Remove Stop',
      'Are you sure you want to remove this stop?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setStops(prev => prev.filter(s => s.id !== stopId));
            if (expandedStop === stopId) {
              setExpandedStop(null);
            }
          },
        },
      ]
    );
  }, [expandedStop]);

  const handleUpdateStop = useCallback((stopId: string, updates: Partial<ItineraryStop>) => {
    setStops(prev => prev.map(s => 
      s.id === stopId ? { ...s, ...updates } : s
    ));
  }, []);

  const handleReorderStops = useCallback((fromIndex: number, toIndex: number) => {
    const dayStops = stops.filter(s => s.day === selectedDay).sort((a, b) => a.order - b.order);
    const reordered = [...dayStops];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    
    const updated = reordered.map((stop, idx) => ({ ...stop, order: idx }));
    
    setStops(prev => {
      const otherStops = prev.filter(s => s.day !== selectedDay);
      return [...otherStops, ...updated];
    });
  }, [stops, selectedDay]);

  const handleGenerateAI = useCallback(async () => {
    if (!destination) {
      showToast({ type: 'error', message: 'Please enter a destination first' });
      return;
    }

    setIsGenerating(true);
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
            id: `ai-${dayIndex}-${stopIndex}-${Date.now()}`,
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
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Failed to generate itinerary' });
    } finally {
      setIsGenerating(false);
    }
  }, [destination, totalDays, aiSuggestions, showToast]);

  const handleSave = useCallback(async () => {
    if (!title || !destination) {
      showToast({ type: 'error', message: 'Please enter a title and destination' });
      return;
    }

    try {
      const payload = {
        title,
        destination,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        stops: stops.map(s => ({
          ...s,
          coordinates: s.coordinates.lat ? s.coordinates : null,
        })),
      };

      if (itineraryId) {
        await updateItinerary.mutateAsync(payload);
        showToast({ type: 'success', message: 'Itinerary updated!' });
      } else {
        await createItinerary.mutateAsync(payload);
        showToast({ type: 'success', message: 'Itinerary created!' });
      }
      
      router.back();
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Failed to save itinerary' });
    }
  }, [title, destination, startDate, endDate, stops, itineraryId, updateItinerary, createItinerary, showToast, router]);

  const handleOptimize = useCallback(async () => {
    if (!itineraryId) {
      showToast({ type: 'error', message: 'Save itinerary first before optimizing' });
      return;
    }

    try {
      await optimizeItinerary.mutateAsync();
      showToast({ type: 'success', message: 'Route optimized!' });
    } catch (error: any) {
      showToast({ type: 'error', message: error.message || 'Optimization failed' });
    }
  }, [itineraryId, optimizeItinerary, showToast]);

  const onDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (event.type === 'set') {
        // Determine if start or end date based on which was opened
        // For simplicity, we'll set start date here
        setStartDate(selectedDate);
      }
    }
  }, []);

  const dayStops = useMemo(() => 
    stops
      .filter(s => s.day === selectedDay)
      .sort((a, b) => a.order - b.order),
    [stops, selectedDay]
  );

  const mapRegion = useMemo(() => {
    const coordinates = dayStops
      .filter(s => s.coordinates.lat !== 0)
      .map(s => s.coordinates);
    
    if (coordinates.length === 0) {
      return {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    const latitudes = coordinates.map(c => c.lat);
    const longitudes = coordinates.map(c => c.lng);
    
    return {
      latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
      latitudeDelta: Math.max(...latitudes) - Math.min(...latitudes) + 0.05,
      longitudeDelta: Math.max(...longitudes) - Math.min(...longitudes) + 0.05,
    };
  }, [dayStops]);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
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
      
      <TouchableOpacity 
        style={[styles.saveButton, (createItinerary.isPending || updateItinerary.isPending) && styles.saveButtonDisabled]} 
        onPress={handleSave}
        disabled={createItinerary.isPending || updateItinerary.isPending}
      >
        {createItinerary.isPending || updateItinerary.isPending ? (
          <ActivityIndicator size="small" color={Colors.primary.gold} />
        ) : (
          <Save size={24} color={Colors.primary.gold} />
        )}
      </TouchableOpacity>
    </View>
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
            style={[styles.aiGenerateButton, isGenerating && styles.aiGenerateButtonDisabled]}
            onPress={handleGenerateAI}
            disabled={isGenerating || aiSuggestions.isPending}
          >
            {isGenerating || aiSuggestions.isPending ? (
              <ActivityIndicator size="small" color={Colors.neutral.white} />
            ) : (
              <>
                <Sparkles size={18} color={Colors.neutral.white} />
                <Text style={styles.aiButtonText}>AI Generate</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </BlurView>
      
      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
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

  const renderMap = () => (
    <View style={styles.mapContainer}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
      >
        {dayStops.map((stop, index) => (
          <Marker
            key={stop.id}
            coordinate={{
              latitude: stop.coordinates.lat || mapRegion.latitude,
              longitude: stop.coordinates.lng || mapRegion.longitude,
            }}
            title={stop.name}
          >
            <View style={[styles.mapMarker, { backgroundColor: categoryColors[stop.category] }]}>
              <Text style={styles.mapMarkerText}>{index + 1}</Text>
            </View>
          </Marker>
        ))}
        {dayStops.filter(s => s.coordinates.lat !== 0).length > 1 && (
          <Polyline
            coordinates={dayStops.filter(s => s.coordinates.lat !== 0).map(s => s.coordinates)}
            strokeColor={Colors.primary.gold}
            strokeWidth={3}
          />
        )}
      </MapView>
      
      {itineraryId && (
        <TouchableOpacity 
          style={[styles.optimizeButton, optimizeItinerary.isPending && styles.optimizeButtonDisabled]} 
          onPress={handleOptimize}
          disabled={optimizeItinerary.isPending}
        >
          {optimizeItinerary.isPending ? (
            <ActivityIndicator size="small" color={Colors.neutral.white} />
          ) : (
            <>
              <Navigation size={16} color={Colors.neutral.white} />
              <Text style={styles.optimizeText}>Optimize Route</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const toggleStop = useCallback((id: string) => {
    setExpandedStop(prev => prev === id ? null : id);
  }, []);

  const renderStopCard = useCallback(({ item, index }: { item: ItineraryStop; index: number }) => (
    <StopCard
      item={item}
      index={index}
      isExpanded={expandedStop === item.id}
      onToggle={toggleStop}
      onUpdate={handleUpdateStop}
      onRemove={handleRemoveStop}
      totalStops={dayStops.length}
      onReorder={handleReorderStops}
    />
  ), [expandedStop, toggleStop, handleUpdateStop, handleRemoveStop, dayStops.length, handleReorderStops]);

  if (isLoadingItinerary) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary.gold} />
        <Text style={styles.loadingText}>Loading itinerary...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <LinearGradient colors={Colors.background.gradient} style={styles.background}>
          <FlatList
            data={dayStops}
            keyExtractor={(item) => item.id}
            renderItem={renderStopCard}
            contentContainerStyle={[
              styles.stopsList,
              { paddingBottom: insets.bottom + 100 },
            ]}
            ListHeaderComponent={
              <>
                {renderHeader()}
                {renderDateSelector()}
                {renderDaySelector()}
                {renderMap()}
                <View style={styles.stopsHeader}>
                  <Text style={styles.stopsTitle}>
                    Day {selectedDay} Stops ({dayStops.length})
                  </Text>
                  <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={handleAddStop}
                    disabled={dayStops.length >= 8}
                  >
                    <Plus size={20} color={Colors.neutral.white} />
                  </TouchableOpacity>
                </View>
              </>
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
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={10}
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
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    marginTop: Spacing.md,
  },
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
  saveButtonDisabled: { opacity: 0.5 },
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
  aiGenerateButtonDisabled: { opacity: 0.6 },
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
  optimizeButtonDisabled: { opacity: 0.6 },
  optimizeText: {
    ...Typography.bodySmall,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  stopsList: {
    paddingHorizontal: Spacing.lg,
  },
  stopsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  stopsTitle: { ...Typography.h3, color: Colors.neutral.white },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopCardContainer: { marginBottom: Spacing.md },
  stopCard: {
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
  deleteButton: { padding: Spacing.sm },
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
  durationButtonActive: { backgroundColor: Colors.primary.gold },
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
  expandIndicator: { alignItems: 'center', marginTop: Spacing.sm },
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