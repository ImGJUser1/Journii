import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  Navigation,
  MapPin,
  Clock,
  Zap,
  Users,
  Shield,
  ArrowRight,
  Bus,
  Train,
  Car,
  Bike,
  Walk,
  ChevronDown,
  ChevronUp,
  Star,
  AlertCircle,
  Sparkles,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useTransitRoutes } from '@/services/api/hooks';
import { useLocationStore } from '@/stores/location-store';
import { useUIStore } from '@/stores/ui-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface Route {
  route_id: string;
  provider: string;
  summary: string;
  total_distance: string;
  total_duration: string;
  total_distance_meters: number;
  total_duration_seconds: number;
  ai_score: number;
  ai_reason: string;
  steps: RouteStep[];
  highlights: string[];
  warnings: string[];
  local_tips: string;
  crowd_forecast: string;
  polyline?: string;
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  mode: string;
  line_name?: string;
  line_color?: string;
  vehicle_type?: string;
  departure_stop?: string;
  arrival_stop?: string;
  departure_time?: string;
  arrival_time?: string;
  num_stops?: number;
}

export default function RoutesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentLocation } = useLocationStore();
  const { showToast } = useUIStore();

  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [preferences, setPreferences] = useState({
    priority: 'balanced',
    avoid_crowds: false,
    accessibility_needs: false,
  });

  // Default coordinates (will use current location)
  const [fromCoords, setFromCoords] = useState({
    lat: currentLocation?.latitude || 37.7749,
    lng: currentLocation?.longitude || -122.4194,
  });
  const [toCoords, setToCoords] = useState({
    lat: 37.7849,
    lng: -122.4094,
  });

  const {
    data: routes,
    isLoading,
    error,
    refetch,
  } = useTransitRoutes({
    from: fromCoords,
    to: toCoords,
    preferences,
  });

  const handleFindRoutes = useCallback(() => {
    if (!fromLocation || !toLocation) {
      showToast({ type: 'error', message: 'Please enter both locations' });
      return;
    }
    refetch();
  }, [fromLocation, toLocation, preferences, refetch]);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'bus': return Bus;
      case 'subway': return Train;
      case 'train': return Train;
      case 'car': return Car;
      case 'bike': return Bike;
      case 'walk': return Walk;
      case 'transit': return Navigation;
      default: return Navigation;
    }
  };

  const getCrowdColor = (level: string) => {
    switch (level) {
      case 'low': return Colors.semantic.success;
      case 'medium': return Colors.semantic.warning;
      case 'high': return Colors.semantic.error;
      default: return Colors.neutral.gray400;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'fastest': return Zap;
      case 'safest': return Shield;
      case 'eco': return Bike;
      case 'scenic': require('lucide-react-native').Camera;
      default: return Sparkles;
    }
  };

  const renderHeader = () => (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
    >
      <Text style={styles.title}>Smart Routes</Text>
      <Text style={styles.subtitle}>AI-optimized transit planning</Text>
    </MotiView>
  );

  const renderSearchCard = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 100 }}
      style={styles.searchContainer}
    >
      <BlurView intensity={60} style={styles.searchCard}>
        <View style={styles.inputContainer}>
          <View style={[styles.dot, { backgroundColor: Colors.semantic.success }]} />
          <TextInput
            style={styles.input}
            placeholder="From location"
            placeholderTextColor={Colors.neutral.gray400}
            value={fromLocation}
            onChangeText={setFromLocation}
          />
          <TouchableOpacity style={styles.currentLocationBtn}>
            <MapPin size={16} color={Colors.primary.gold} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.inputContainer}>
          <View style={[styles.dot, { backgroundColor: Colors.semantic.error }]} />
          <TextInput
            style={styles.input}
            placeholder="To destination"
            placeholderTextColor={Colors.neutral.gray400}
            value={toLocation}
            onChangeText={setToLocation}
          />
        </View>

        {/* Quick Preferences */}
        <View style={styles.preferencesRow}>
          {['fastest', 'balanced', 'eco', 'scenic'].map((pref) => (
            <TouchableOpacity
              key={pref}
              style={[
                styles.prefButton,
                preferences.priority === pref && styles.prefButtonActive,
              ]}
              onPress={() => setPreferences({ ...preferences, priority: pref })}
            >
              <Text
                style={[
                  styles.prefText,
                  preferences.priority === pref && styles.prefTextActive,
                ]}
              >
                {pref.charAt(0).toUpperCase() + pref.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleFindRoutes}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primary.gold, Colors.primary.purple]}
            style={styles.searchButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.neutral.white} />
            ) : (
              <>
                <Navigation size={20} color={Colors.neutral.white} />
                <Text style={styles.searchButtonText}>Find Routes</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>
    </MotiView>
  );

  const renderMap = () => {
    if (!showMap) return null;

    return (
      <MotiView
        from={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 200 }}
        style={styles.mapContainer}
      >
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: (fromCoords.lat + toCoords.lat) / 2,
            longitude: (fromCoords.lng + toCoords.lng) / 2,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker coordinate={{ latitude: fromCoords.lat, longitude: fromCoords.lng }}>
            <View style={[styles.mapMarker, { backgroundColor: Colors.semantic.success }]} />
          </Marker>
          <Marker coordinate={{ latitude: toCoords.lat, longitude: toCoords.lng }}>
            <View style={[styles.mapMarker, { backgroundColor: Colors.semantic.error }]} />
          </Marker>
          {selectedRoute && routes?.find(r => r.route_id === selectedRoute)?.polyline && (
            <Polyline
              coordinates={decodePolyline(routes.find(r => r.route_id === selectedRoute)!.polyline!)}
              strokeColor={Colors.primary.gold}
              strokeWidth={4}
            />
          )}
        </MapView>
        
        <TouchableOpacity
          style={styles.mapToggle}
          onPress={() => setShowMap(false)}
        >
          <ChevronUp size={20} color={Colors.neutral.white} />
        </TouchableOpacity>
      </MotiView>
    );
  };

  const renderRouteCard = ({ item, index }: { item: Route; index: number }) => {
    const isSelected = selectedRoute === item.route_id;
    const ModeIcon = getModeIcon(item.steps[0]?.mode || 'transit');

    return (
      <MotiView
        from={{ opacity: 0, translateX: -50 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ delay: index * 100 }}
      >
        <TouchableOpacity
          style={[
            styles.routeCard,
            isSelected && styles.routeCardSelected,
          ]}
          onPress={() => setSelectedRoute(isSelected ? null : item.route_id)}
          activeOpacity={0.9}
        >
          <BlurView intensity={60} style={styles.routeCardBlur}>
            <LinearGradient
              colors={
                isSelected
                  ? ['rgba(201,169,110,0.15)', 'rgba(139,134,128,0.1)']
                  : ['rgba(40,40,45,0.9)', 'rgba(30,30,35,0.95)']
              }
              style={styles.routeCardGradient}
            >
              {/* Route Header */}
              <View style={styles.routeHeader}>
                <View style={styles.routeMainInfo}>
                  <Text style={styles.routeDuration}>{item.total_duration}</Text>
                  <Text style={styles.routeDistance}>{item.total_distance}</Text>
                </View>
                
                <View style={styles.routeBadges}>
                  {item.ai_score > 80 && (
                    <View style={styles.aiBadge}>
                      <Sparkles size={12} color={Colors.primary.gold} />
                      <Text style={styles.aiBadgeText}>AI Pick</Text>
                    </View>
                  )}
                  <View style={styles.scoreBadge}>
                    <Star size={12} color={Colors.primary.gold} fill={Colors.primary.gold} />
                    <Text style={styles.scoreText}>{item.ai_score}</Text>
                  </View>
                </View>
              </View>

              {/* AI Reason */}
              {item.ai_reason && (
                <Text style={styles.aiReason} numberOfLines={2}>
                  {item.ai_reason}
                </Text>
              )}

              {/* Mode Icons */}
              <View style={styles.modesContainer}>
                {item.steps.map((step, i) => {
                  const StepIcon = getModeIcon(step.mode);
                  return (
                    <View key={i} style={styles.modeStep}>
                      <View style={styles.modeIcon}>
                        <StepIcon size={16} color={Colors.primary.gold} />
                      </View>
                      {i < item.steps.length - 1 && (
                        <View style={styles.modeConnector} />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Route Details */}
              <View style={styles.routeDetails}>
                <View style={styles.detailItem}>
                  <Users size={14} color={getCrowdColor(item.crowd_forecast)} />
                  <Text style={[styles.detailText, { color: getCrowdColor(item.crowd_forecast) }]}>
                    {item.crowd_forecast} crowds
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Shield size={14} color={Colors.semantic.success} />
                  <Text style={styles.detailText}>Safe route</Text>
                </View>
              </View>

              {/* Expanded Details */}
              <AnimatePresence>
                {isSelected && (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <View style={styles.expandedContent}>
                      {/* Highlights */}
                      {item.highlights.length > 0 && (
                        <View style={styles.section}>
                          <Text style={styles.sectionTitle}>Highlights</Text>
                          {item.highlights.map((highlight, i) => (
                            <View key={i} style={styles.bulletItem}>
                              <Star size={12} color={Colors.primary.gold} />
                              <Text style={styles.bulletText}>{highlight}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Warnings */}
                      {item.warnings.length > 0 && (
                        <View style={styles.section}>
                          <Text style={[styles.sectionTitle, { color: Colors.semantic.warning }]}>
                            Warnings
                          </Text>
                          {item.warnings.map((warning, i) => (
                            <View key={i} style={styles.bulletItem}>
                              <AlertCircle size={12} color={Colors.semantic.warning} />
                              <Text style={styles.bulletText}>{warning}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Local Tips */}
                      {item.local_tips && (
                        <View style={styles.section}>
                          <Text style={styles.sectionTitle}>Local Tips</Text>
                          <Text style={styles.tipsText}>{item.local_tips}</Text>
                        </View>
                      )}

                      {/* Step by Step */}
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Step by Step</Text>
                        {item.steps.map((step, i) => (
                          <View key={i} style={styles.stepItem}>
                            <View style={styles.stepNumber}>
                              <Text style={styles.stepNumberText}>{i + 1}</Text>
                            </View>
                            <View style={styles.stepContent}>
                              <Text style={styles.stepInstruction}>{step.instruction}</Text>
                              <View style={styles.stepMeta}>
                                <Text style={styles.stepMetaText}>{step.duration}</Text>
                                <Text style={styles.stepMetaText}>•</Text>
                                <Text style={styles.stepMetaText}>{step.distance}</Text>
                                {step.line_name && (
                                  <View style={styles.lineBadge}>
                                    <Text style={styles.lineText}>{step.line_name}</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.startButton}>
                          <Navigation size={18} color={Colors.neutral.white} />
                          <Text style={styles.startButtonText}>Start Navigation</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton}>
                          <Star size={18} color={Colors.primary.gold} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </MotiView>
                )}
              </AnimatePresence>

              {/* Expand Indicator */}
              <View style={styles.expandIndicator}>
                {isSelected ? (
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.background.gradient} style={styles.background}>
        <FlatList
          data={routes || []}
          keyExtractor={(item) => item.route_id}
          renderItem={renderRouteCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          ListHeaderComponent={
            <>
              {renderHeader()}
              {renderSearchCard()}
              {renderMap()}
              <Text style={styles.resultsTitle}>
                {routes ? `${routes.length} routes found` : 'Enter locations to find routes'}
              </Text>
            </>
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary.gold} />
                <Text style={styles.loadingText}>Finding best routes...</Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
    </View>
  );
}

// Polyline decoder for Google Maps
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg },
  header: { marginBottom: Spacing.lg },
  title: { ...Typography.h1, color: Colors.neutral.white },
  subtitle: { ...Typography.bodyMedium, color: Colors.neutral.gray400, marginTop: Spacing.xs },
  searchContainer: { marginBottom: Spacing.lg },
  searchCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    padding: Spacing.md,
    backgroundColor: 'rgba(40,40,45,0.6)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  dot: { width: 12, height: 12, borderRadius: BorderRadius.full, marginRight: Spacing.md },
  input: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
  },
  currentLocationBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral.gray700,
    marginLeft: 28,
  },
  preferencesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  prefButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral.gray800,
  },
  prefButtonActive: { backgroundColor: `${Colors.primary.gold}30` },
  prefText: { ...Typography.bodySmall, color: Colors.neutral.gray400 },
  prefTextActive: { color: Colors.primary.gold, fontWeight: '700' },
  searchButton: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchButtonText: {
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  mapContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  map: { width: width - Spacing.lg * 2, height: 200 },
  mapMarker: {
    width: 16,
    height: 16,
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderColor: Colors.neutral.white,
  },
  mapToggle: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsTitle: {
    ...Typography.h3,
    color: Colors.neutral.white,
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    marginTop: Spacing.md,
  },
  routeCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  routeCardSelected: {
    ...Shadows.large,
  },
  routeCardBlur: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  routeCardGradient: { padding: Spacing.md },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  routeMainInfo: { flex: 1 },
  routeDuration: { ...Typography.h2, color: Colors.neutral.white },
  routeDistance: { ...Typography.bodyMedium, color: Colors.neutral.gray400 },
  routeBadges: { flexDirection: 'row', gap: Spacing.xs },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary.gold}30`,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  aiBadgeText: { ...Typography.caption, color: Colors.primary.gold, fontWeight: '700' },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.gray800,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  scoreText: { ...Typography.caption, color: Colors.neutral.white, fontWeight: '700' },
  aiReason: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray300,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  modesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modeStep: { flexDirection: 'row', alignItems: 'center' },
  modeIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeConnector: {
    width: 20,
    height: 2,
    backgroundColor: Colors.neutral.gray600,
    marginHorizontal: 4,
  },
  routeDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  detailText: { ...Typography.bodySmall },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray700,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  section: { marginBottom: Spacing.md },
  sectionTitle: {
    ...Typography.bodySmall,
    color: Colors.neutral.white,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  bulletItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  bulletText: { ...Typography.bodySmall, color: Colors.neutral.gray300, flex: 1 },
  tipsText: { ...Typography.bodySmall, color: Colors.neutral.gray300, fontStyle: 'italic' },
  stepItem: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  stepNumberText: {
    ...Typography.caption,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  stepContent: { flex: 1 },
  stepInstruction: { ...Typography.bodyMedium, color: Colors.neutral.white },
  stepMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  stepMetaText: { ...Typography.caption, color: Colors.neutral.gray400 },
  lineBadge: {
    backgroundColor: Colors.primary.purple,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  lineText: { ...Typography.caption, color: Colors.neutral.white, fontWeight: '700' },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.semantic.success,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  startButtonText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  saveButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral.gray800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
});