import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  MapPin,
  Sparkles,
  Clock,
  Users,
  Star,
  ChevronRight,
  Compass,
  Camera,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface CulturalExperience {
  id: string;
  title: string;
  category: string;
  location: string;
  rating: number;
  duration: string;
  participants: number;
  image: string;
  description: string;
  price: string;
}

const mockExperiences: CulturalExperience[] = [
  {
    id: '1',
    title: 'Traditional Pottery Workshop',
    category: 'Artisan Experience',
    location: 'Historic District',
    rating: 4.8,
    duration: '2h 30m',
    participants: 12,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: 'Learn ancient pottery techniques from master craftsmen',
    price: '$45',
  },
  {
    id: '2',
    title: 'Street Food Cultural Tour',
    category: 'Culinary Journey',
    location: 'Night Market',
    rating: 4.9,
    duration: '3h',
    participants: 8,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
    description: 'Discover authentic local flavors and food stories',
    price: '$35',
  },
  {
    id: '3',
    title: 'Urban Art & Mural Walk',
    category: 'Art Discovery',
    location: 'Arts Quarter',
    rating: 4.7,
    duration: '1h 45m',
    participants: 15,
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400',
    description: 'Explore vibrant street art with local artists',
    price: '$25',
  },
];

export default function DiscoveryScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Artisan', 'Culinary', 'Art', 'Music', 'History'];

  const ExperienceCard = ({ experience }: { experience: CulturalExperience }) => (
    <TouchableOpacity style={styles.experienceCard} activeOpacity={0.9}>
      <BlurView intensity={60} style={styles.cardBlur}>
        <LinearGradient
          colors={['rgba(40,40,45,0.8)', 'rgba(30,30,35,0.9)']}
          style={styles.cardGradient}
        >
        <View style={styles.cardHeader}>
          <View style={styles.cardImage}>
            <LinearGradient
              colors={['#c9a96e', '#8b8680']}
              style={styles.imagePlaceholder}
            >
              <Camera size={24} color="white" />
            </LinearGradient>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{experience.title}</Text>
            <Text style={styles.cardCategory}>{experience.category}</Text>
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <MapPin size={12} color="#8b8680" />
                <Text style={styles.metaText}>{experience.location}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={12} color="#8b8680" />
                <Text style={styles.metaText}>{experience.duration}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <Text style={styles.cardDescription}>{experience.description}</Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <View style={styles.rating}>
              <Star size={14} color="#c9a96e" fill="#c9a96e" />
              <Text style={styles.ratingText}>{experience.rating}</Text>
            </View>
            <View style={styles.participants}>
              <Users size={14} color="#8b8680" />
              <Text style={styles.participantsText}>{experience.participants} joined</Text>
            </View>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.price}>{experience.price}</Text>
            <ChevronRight size={16} color="#c9a96e" />
          </View>
        </View>
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
            <View>
              <Text style={styles.greeting}>Discover Culture</Text>
              <Text style={styles.subtitle}>AI-curated experiences just for you</Text>
            </View>
            <TouchableOpacity style={styles.aiButton}>
              <BlurView intensity={60} style={styles.aiButtonBlur}>
                <LinearGradient
                  colors={['rgba(201,169,110,0.3)', 'rgba(139,134,128,0.2)']}
                  style={styles.aiButtonGradient}
                >
                  <Sparkles size={20} color="#c9a96e" />
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <BlurView intensity={40} style={styles.statCard}>
              <LinearGradient
                colors={['rgba(201,169,110,0.15)', 'rgba(139,134,128,0.1)']}
                style={styles.statCardGradient}
              >
                <Text style={styles.statNumber}>127</Text>
                <Text style={styles.statLabel}>Experiences</Text>
                <Compass size={16} color="#c9a96e" />
              </LinearGradient>
            </BlurView>
            <BlurView intensity={40} style={styles.statCard}>
              <LinearGradient
                colors={['rgba(201,169,110,0.15)', 'rgba(139,134,128,0.1)']}
                style={styles.statCardGradient}
              >
                <Text style={styles.statNumber}>89%</Text>
                <Text style={styles.statLabel}>Match Rate</Text>
                <Sparkles size={16} color="#c9a96e" />
              </LinearGradient>
            </BlurView>
            <BlurView intensity={40} style={styles.statCard}>
              <LinearGradient
                colors={['rgba(201,169,110,0.15)', 'rgba(139,134,128,0.1)']}
                style={styles.statCardGradient}
              >
                <Text style={styles.statNumber}>4.8★</Text>
                <Text style={styles.statLabel}>Avg Rating</Text>
                <Star size={16} color="#c9a96e" />
              </LinearGradient>
            </BlurView>
          </View>

          {/* Categories */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Experiences */}
          <View style={styles.experiencesContainer}>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            {mockExperiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  aiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  aiButtonBlur: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.3)',
  },
  aiButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.2)',
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#c9a96e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(201,169,110,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.2)',
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(201,169,110,0.25)',
    borderColor: 'rgba(201,169,110,0.4)',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  categoryTextActive: {
    color: '#c9a96e',
  },
  experiencesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  experienceCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.2)',
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 14,
    color: '#c9a96e',
    fontWeight: '600',
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c9a96e',
  },
});