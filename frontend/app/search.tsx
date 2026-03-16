// app/search.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Keyboard,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Search,
  ArrowLeft,
  X,
  Clock,
  TrendingUp,
  MapPin,
  Compass,
  Star,
  Users,
  Building2,
  Navigation,
} from 'lucide-react-native';
import { useDebounce } from '@/hooks/use-debounce';

import { useUIStore } from '@/stores/ui-store';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

type SearchResult = {
  id: string;
  type: 'experience' | 'business' | 'user' | 'location';
  title: string;
  subtitle?: string;
  image?: string;
  rating?: number;
  meta?: string;
};

const RECENT_SEARCHES_KEY = 'recent_searches';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useUIStore();
  
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches] = useState([
    'Kyoto temples',
    'Street food Bangkok',
    'Hidden beaches Bali',
    'Desert safari Dubai',
    'Northern lights Norway',
  ]);

  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Search when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
      setIsSearching(false);
    }
  }, [debouncedQuery]);

  const loadRecentSearches = async () => {
    // Load from AsyncStorage
    setRecentSearches([
      'Paris restaurants',
      'Tokyo hotels',
      'Hampi guide',
    ]);
  };

  const saveSearch = async (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    // Save to AsyncStorage
  };

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    
    try {
      // Simulated API call - replace with actual search endpoint
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'experience',
          title: 'Traditional Tea Ceremony',
          subtitle: 'Kyoto, Japan',
          image: 'https://images.unsplash.com/photo-1545579133-99bb5ab189bd?w=200',
          rating: 4.8,
          meta: 'Cultural Experience',
        },
        {
          id: '2',
          type: 'business',
          title: 'Sakura Hotel',
          subtitle: 'Gion District',
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200',
          rating: 4.5,
          meta: 'Hotel • $$',
        },
        {
          id: '3',
          type: 'user',
          title: 'Sarah Chen',
          subtitle: 'Travel Blogger • 12k followers',
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
          meta: 'Kyoto Expert',
        },
        {
          id: '4',
          type: 'location',
          title: 'Kyoto Station',
          subtitle: 'Transportation Hub',
          meta: 'Popular destination',
        },
      ].filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setResults(mockResults);
    } catch (error) {
      showToast({ type: 'error', message: 'Search failed' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    saveSearch(searchQuery);
    Keyboard.dismiss();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsSearching(false);
  };

  const handleResultPress = (result: SearchResult) => {
    saveSearch(result.title);
    
    switch (result.type) {
      case 'experience':
        router.push(`/experience/${result.id}`);
        break;
      case 'business':
        router.push(`/marketplace/business/${result.id}`);
        break;
      case 'user':
        router.push(`/profile/${result.id}`);
        break;
      case 'location':
        // Navigate to location-based discovery
        router.push({
          pathname: '/(tabs)',
          params: { location: result.title },
        });
        break;
    }
  };

  const removeRecentSearch = (search: string, e: any) => {
    e.stopPropagation();
    setRecentSearches(recentSearches.filter(s => s !== search));
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'experience': return Compass;
      case 'business': return Building2;
      case 'user': return Users;
      case 'location': return MapPin;
      default: return Navigation;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.background.gradient} style={styles.background}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <BlurView intensity={60} style={styles.searchBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.neutral.white} />
            </TouchableOpacity>
            
            <View style={styles.inputContainer}>
              <Search size={20} color={Colors.neutral.gray400} />
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Search experiences, places, people..."
                placeholderTextColor={Colors.neutral.gray400}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => handleSearch(query)}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <X size={20} color={Colors.neutral.gray400} />
                </TouchableOpacity>
              )}
            </View>
          </BlurView>
        </View>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isSearching ? (
            <MotiView
              key="loading"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={styles.loadingContainer}
            >
              <ActivityIndicator size="large" color={Colors.primary.gold} />
            </MotiView>
          ) : results.length > 0 ? (
            <MotiView
              key="results"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.resultsContainer}
            >
              <FlatList
                data={results}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                renderItem={({ item, index }) => {
                  const Icon = getResultIcon(item.type);
                  
                  return (
                    <MotiView
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: index * 50 }}
                    >
                      <TouchableOpacity
                        style={styles.resultItem}
                        onPress={() => handleResultPress(item)}
                        activeOpacity={0.8}
                      >
                        {item.image ? (
                          <Image source={{ uri: item.image }} style={styles.resultImage} />
                        ) : (
                          <View style={[styles.resultImage, styles.resultIconContainer]}>
                            <Icon size={24} color={Colors.primary.gold} />
                          </View>
                        )}
                        
                        <View style={styles.resultInfo}>
                          <View style={styles.resultHeader}>
                            <Text style={styles.resultTitle}>{item.title}</Text>
                            {item.rating && (
                              <View style={styles.resultRating}>
                                <Star size={14} color={Colors.primary.gold} fill={Colors.primary.gold} />
                                <Text style={styles.resultRatingText}>{item.rating}</Text>
                              </View>
                            )}
                          </View>
                          
                          <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                          
                          <View style={styles.resultMeta}>
                            <View style={[
                              styles.typeBadge,
                              { backgroundColor: `${getTypeColor(item.type)}20` }
                            ]}>
                              <Text style={[
                                styles.typeBadgeText,
                                { color: getTypeColor(item.type) }
                              ]}>
                                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                              </Text>
                            </View>
                            {item.meta && (
                              <Text style={styles.metaText}>• {item.meta}</Text>
                            )}
                          </View>
                        </View>
                        
                        <Navigation size={20} color={Colors.neutral.gray600} />
                      </TouchableOpacity>
                    </MotiView>
                  );
                }}
                contentContainerStyle={styles.resultsList}
                showsVerticalScrollIndicator={false}
              />
            </MotiView>
          ) : query.length >= 2 ? (
            <MotiView
              key="no-results"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.emptyContainer}
            >
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>
                Try different keywords or check your spelling
              </Text>
            </MotiView>
          ) : (
            <MotiView
              key="suggestions"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.suggestionsContainer}
            >
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent</Text>
                    <TouchableOpacity onPress={() => setRecentSearches([])}>
                      <Text style={styles.clearText}>Clear all</Text>
                    </TouchableOpacity>
                  </View>
                  {recentSearches.map((search, index) => (
                    <MotiView
                      key={search}
                      from={{ opacity: 0, translateX: -10 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: index * 30 }}
                    >
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => handleSearch(search)}
                      >
                        <Clock size={18} color={Colors.neutral.gray400} />
                        <Text style={styles.suggestionText}>{search}</Text>
                        <TouchableOpacity
                          onPress={(e) => removeRecentSearch(search, e)}
                          style={styles.removeButton}
                        >
                          <X size={16} color={Colors.neutral.gray500} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    </MotiView>
                  ))}
                </View>
              )}

              {/* Trending Searches */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <TrendingUp size={18} color={Colors.primary.gold} />
                  <Text style={styles.sectionTitle}>Trending Now</Text>
                </View>
                <View style={styles.trendingGrid}>
                  {trendingSearches.map((search, index) => (
                    <MotiView
                      key={search}
                      from={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 50 }}
                    >
                      <TouchableOpacity
                        style={styles.trendingChip}
                        onPress={() => handleSearch(search)}
                      >
                        <Text style={styles.trendingText}>{search}</Text>
                      </TouchableOpacity>
                    </MotiView>
                  ))}
                </View>
              </View>

              {/* Quick Categories */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Browse by Category</Text>
                <View style={styles.categoryGrid}>
                  {[
                    { name: 'Experiences', icon: Compass, color: Colors.primary.gold },
                    { name: 'Hotels', icon: Building2, color: Colors.primary.purple },
                    { name: 'Restaurants', icon: Star, color: Colors.semantic.error },
                    { name: 'Guides', icon: Users, color: Colors.semantic.success },
                  ].map((cat, index) => (
                    <MotiView
                      key={cat.name}
                      from={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 200 + index * 50 }}
                      style={styles.categoryItem}
                    >
                      <TouchableOpacity
                        style={[styles.categoryButton, { borderColor: cat.color }]}
                        onPress={() => handleSearch(cat.name)}
                      >
                        <cat.icon size={24} color={cat.color} />
                        <Text style={[styles.categoryText, { color: cat.color }]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    </MotiView>
                  ))}
                </View>
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </LinearGradient>
    </View>
  );
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'experience': return Colors.primary.gold;
    case 'business': return Colors.primary.purple;
    case 'user': return Colors.semantic.info;
    case 'location': return Colors.semantic.success;
    default: return Colors.neutral.gray400;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    paddingVertical: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsList: {
    paddingHorizontal: Spacing.lg,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray800,
  },
  resultImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  resultIconContainer: {
    backgroundColor: Colors.neutral.gray800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  resultTitle: {
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    fontWeight: '700',
    flex: 1,
  },
  resultRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultRatingText: {
    ...Typography.bodySmall,
    color: Colors.primary.gold,
    fontWeight: '700',
  },
  resultSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    marginBottom: Spacing.xs,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  metaText: {
    ...Typography.caption,
    color: Colors.neutral.gray500,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.neutral.white,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    textAlign: 'center',
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.neutral.white,
  },
  clearText: {
    ...Typography.bodySmall,
    color: Colors.semantic.error,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  suggestionText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray300,
    flex: 1,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  trendingChip: {
    backgroundColor: Colors.neutral.gray800,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  trendingText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryItem: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  categoryText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
});