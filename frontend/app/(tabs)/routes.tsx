import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Route {
  id: string;
  from: string;
  to: string;
  duration: string;
  cost: string;
  modes: string[];
  crowdLevel: 'low' | 'medium' | 'high';
  safetyScore: number;
  companions: number;
  steps: RouteStep[];
}

interface RouteStep {
  mode: string;
  instruction: string;
  duration: string;
  line?: string;
}

const mockRoutes: Route[] = [
  {
    id: '1',
    from: 'Downtown Station',
    to: 'Cultural District',
    duration: '23 min',
    cost: '$3.50',
    modes: ['bus', 'walk'],
    crowdLevel: 'low',
    safetyScore: 9.2,
    companions: 3,
    steps: [
      { mode: 'walk', instruction: 'Walk to Bus Stop A', duration: '3 min' },
      { mode: 'bus', instruction: 'Take Bus Line 42', duration: '15 min', line: '42' },
      { mode: 'walk', instruction: 'Walk to destination', duration: '5 min' },
    ],
  },
  {
    id: '2',
    from: 'Downtown Station',
    to: 'Cultural District',
    duration: '18 min',
    cost: '$4.25',
    modes: ['metro', 'walk'],
    crowdLevel: 'medium',
    safetyScore: 8.8,
    companions: 7,
    steps: [
      { mode: 'walk', instruction: 'Walk to Metro Station', duration: '2 min' },
      { mode: 'metro', instruction: 'Take Blue Line', duration: '12 min', line: 'Blue' },
      { mode: 'walk', instruction: 'Walk to destination', duration: '4 min' },
    ],
  },
];

export default function RoutesScreen() {
  const insets = useSafeAreaInsets();
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'bus': return <Bus size={16} color="#c9a96e" />;
      case 'metro': return <Train size={16} color="#c9a96e" />;
      case 'car': return <Car size={16} color="#c9a96e" />;
      case 'bike': return <Bike size={16} color="#c9a96e" />;
      default: return <Navigation size={16} color="#c9a96e" />;
    }
  };

  const getCrowdColor = (level: string) => {
    switch (level) {
      case 'low': return '#4ade80';
      case 'medium': return '#fbbf24';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const RouteCard = ({ route }: { route: Route }) => (
    <TouchableOpacity 
      style={[
        styles.routeCard,
        selectedRoute === route.id && styles.routeCardSelected
      ]}
      onPress={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
      activeOpacity={0.9}
    >
      <BlurView intensity={60} style={styles.routeCardBlur}>
        <LinearGradient
          colors={
            selectedRoute === route.id 
              ? ['rgba(201,169,110,0.2)', 'rgba(139,134,128,0.15)']
              : ['rgba(40,40,45,0.8)', 'rgba(30,30,35,0.9)']
          }
          style={styles.routeCardGradient}
        >
        <View style={styles.routeHeader}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeDuration}>{route.duration}</Text>
            <Text style={styles.routeCost}>{route.cost}</Text>
          </View>
          <View style={styles.routeModes}>
            {route.modes.map((mode, index) => (
              <View key={index} style={styles.modeIcon}>
                {getModeIcon(mode)}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.routeDetails}>
          <View style={styles.routeLocations}>
            <Text style={styles.routeFrom}>{route.from}</Text>
            <ArrowRight size={16} color="#8b8680" />
            <Text style={styles.routeTo}>{route.to}</Text>
          </View>
        </View>

        <View style={styles.routeMetrics}>
          <View style={styles.metric}>
            <View style={[styles.crowdIndicator, { backgroundColor: getCrowdColor(route.crowdLevel) }]} />
            <Text style={styles.metricLabel}>Crowd: {route.crowdLevel}</Text>
          </View>
          <View style={styles.metric}>
            <Shield size={14} color="#c9a96e" />
            <Text style={styles.metricLabel}>Safety: {route.safetyScore}/10</Text>
          </View>
          <View style={styles.metric}>
            <Users size={14} color="#c9a96e" />
            <Text style={styles.metricLabel}>{route.companions} companions</Text>
          </View>
        </View>

        {selectedRoute === route.id && (
          <View style={styles.routeSteps}>
            <Text style={styles.stepsTitle}>Route Steps:</Text>
            {route.steps.map((step, index) => (
              <View key={index} style={styles.step}>
                <View style={styles.stepIcon}>
                  {getModeIcon(step.mode)}
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepInstruction}>{step.instruction}</Text>
                  <Text style={styles.stepDuration}>{step.duration}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1f', '#2a2a30', '#3a3a40', '#4a4a50']}
        style={styles.background}
      >
        <ScrollView 
          style={[styles.scrollView, { paddingTop: insets.top }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Smart Routes</Text>
            <Text style={styles.subtitle}>AI-optimized transit planning</Text>
          </View>

          {/* Search Section */}
          <View style={styles.searchContainer}>
            <BlurView intensity={60} style={styles.searchCard}>
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#c9a96e" />
                <TextInput
                  style={styles.input}
                  placeholder="From location"
                  placeholderTextColor="#999"
                  value={fromLocation}
                  onChangeText={setFromLocation}
                />
              </View>
              <View style={styles.inputSeparator} />
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#c9a96e" />
                <TextInput
                  style={styles.input}
                  placeholder="To location"
                  placeholderTextColor="#999"
                  value={toLocation}
                  onChangeText={setToLocation}
                />
              </View>
              <TouchableOpacity style={styles.searchButton}>
                <LinearGradient
                  colors={['#c9a96e', '#8b8680']}
                  style={styles.searchButtonGradient}
                >
                  <Navigation size={20} color="white" />
                  <Text style={styles.searchButtonText}>Find Routes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <BlurView intensity={60} style={styles.quickActionBlur}>
                <Zap size={24} color="#c9a96e" />
                <Text style={styles.quickActionText}>Fastest</Text>
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <BlurView intensity={60} style={styles.quickActionBlur}>
                <Shield size={24} color="#c9a96e" />
                <Text style={styles.quickActionText}>Safest</Text>
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <BlurView intensity={60} style={styles.quickActionBlur}>
                <Users size={24} color="#c9a96e" />
                <Text style={styles.quickActionText}>Social</Text>
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Routes */}
          <View style={styles.routesContainer}>
            <Text style={styles.sectionTitle}>Recommended Routes</Text>
            {mockRoutes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(40,40,45,0.6)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.2)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  inputSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 8,
  },
  searchButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionBlur: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(40,40,45,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.2)',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginTop: 8,
  },
  routesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  routeCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  routeCardBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.2)',
  },
  routeCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  routeCardGradient: {
    padding: 20,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDuration: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
  },
  routeCost: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c9a96e',
  },
  routeModes: {
    flexDirection: 'row',
    gap: 8,
  },
  modeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(201,169,110,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeDetails: {
    marginBottom: 16,
  },
  routeLocations: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeFrom: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  routeTo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
    textAlign: 'right',
  },
  routeMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  crowdIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  routeSteps: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,169,110,0.2)',
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(201,169,110,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepInfo: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  stepDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
});