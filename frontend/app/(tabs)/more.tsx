import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Book,
  Feather,
  DollarSign,
  Utensils,
  Globe2,
  Plane,
  TramFront,
  CloudSun,
  Film,
  Leaf,
  Radar,
} from 'lucide-react-native';

const apiFeatures = [
  {
    key: 'openlibrary',
    label: 'Books & Literature',
    icon: <Book size={32} color="#c9a96e" />,
    description: 'Discover books, authors, and local literary culture with Open Library.',
  },
  {
    key: 'poetrydb',
    label: 'Poetry',
    icon: <Feather size={32} color="#c9a96e" />,
    description: 'Read and share poems matched to journeys from PoetryDB.',
  },
  {
    key: 'currencyapi',
    label: 'Currency Converter',
    icon: <DollarSign size={32} color="#c9a96e" />,
    description: 'Live exchange rates for international budgeting.',
  },
  {
    key: 'foodfacts',
    label: 'Local Foods',
    icon: <Utensils size={32} color="#c9a96e" />,
    description: 'Discover local cuisines and food info from Open Food Facts.',
  },
  {
    key: 'graphcountries',
    label: 'Country Insights',
    icon: <Globe2 size={32} color="#c9a96e" />,
    description: 'Quick facts about your destination from GraphCountries.',
  },
  {
    key: 'aviationapi',
    label: 'Flights & Airports',
    icon: <Plane size={32} color="#c9a96e" />,
    description: 'Access flight data and airport info with AviationAPI.',
  },
  {
    key: 'transitland',
    label: 'Transit Planner',
    icon: <TramFront size={32} color="#c9a96e" />,
    description: 'Navigate local public transport using TransitLand.',
  },
  {
    key: 'openmeteo',
    label: 'Weather',
    icon: <CloudSun size={32} color="#c9a96e" />,
    description: 'Check current and forecasted weather with Open-Meteo.',
  },
  {
    key: 'movie-db',
    label: 'Film Explorer',
    icon: <Film size={32} color="#c9a96e" />,
    description: 'Find cinema events and movie locations using TMDB.',
  },
  {
    key: 'trefle',
    label: 'Plants & Nature',
    icon: <Leaf size={32} color="#c9a96e" />,
    description: 'Discover nature trails and local flora with Trefle.',
  },
  {
    key: 'opensky',
    label: 'Live Air Traffic',
    icon: <Radar size={32} color="#c9a96e" />,
    description: 'Track real-time planes overhead with OpenSky Network.',
  },
];

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232329', '#2b2b35', '#363649', '#41415e']}
        style={styles.background}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Explore More Features</Text>
            <Text style={styles.subtitle}>Powerful, free tools for cultural journeying</Text>
          </View>
          {apiFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.key}
              style={styles.featureCard}
              activeOpacity={0.92}
              // Example: You can add onPress navigation or modal here for showing live data
            >
              <View style={styles.icon}>{feature.icon}</View>
              <View style={styles.info}>
                <Text style={styles.label}>{feature.label}</Text>
                <Text style={styles.description}>{feature.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  scrollView: { flex: 1 },
  header: { paddingHorizontal: 24, paddingVertical: 28 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 18 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(201,169,110,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.24)',
    gap: 18,
  },
  icon: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  label: { fontSize: 18, fontWeight: 'bold', color: '#c9a96e', marginBottom: 2 },
  description: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
});
