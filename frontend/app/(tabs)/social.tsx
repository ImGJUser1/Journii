import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Users,
  MapPin,
  Clock,
  Shield,
  MessageCircle,
  UserPlus,
  Star,
  Navigation,
  Heart,
  Share2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Video,
  Image as ImageIcon,
  Mic,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useCommunityFeed, useCreatePost, useLikePost } from '@/services/api/hooks';
import { useAuthStore } from '@/stores/auth-store';
import { useLocationStore } from '@/stores/location-store';
import { useUIStore } from '@/stores/ui-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Skeleton } from '@/components/ui/Skeleton';
import { VideoPlayer } from '@/components/VideoPlayer';

const { width } = Dimensions.get('window');

type TabType = 'companions' | 'feed' | 'reels';

interface TravelCompanion {
  id: string;
  name: string;
  avatar: string;
  route: string;
  destination: string;
  departureTime: string;
  safetyScore: number;
  mutualConnections: number;
  interests: string[];
  isOnline: boolean;
  isVerified: boolean;
}

interface CommunityPost {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  location: {
    name: string;
    coords?: { lat: number; lng: number };
  };
  content: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'carousel';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  createdAt: string;
  tags: string[];
  aiSummary?: string;
}

const mockCompanions: TravelCompanion[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
    route: 'Downtown → Arts District',
    destination: 'Museum Quarter',
    departureTime: '2:30 PM',
    safetyScore: 9.5,
    mutualConnections: 3,
    interests: ['Art', 'Photography', 'Culture'],
    isOnline: true,
    isVerified: true,
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    route: 'Central Station → Cultural Hub',
    destination: 'Food Market',
    departureTime: '3:15 PM',
    safetyScore: 8.9,
    mutualConnections: 1,
    interests: ['Food', 'Music', 'Local Culture'],
    isOnline: false,
    isVerified: false,
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    route: 'Airport → Old Town',
    destination: 'Historic Center',
    departureTime: '4:00 PM',
    safetyScore: 9.8,
    mutualConnections: 5,
    interests: ['History', 'Architecture', 'Food'],
    isOnline: true,
    isVerified: true,
  },
];

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { currentLocation } = useLocationStore();
  const { showToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Community feed
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingFeed,
    refetch: refetchFeed,
  } = useCommunityFeed({
    location: currentLocation?.city,
  });

  const likePost = useLikePost();
  const createPost = useCreatePost();

  const posts = feedData?.pages.flatMap((page) => page.posts) || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchFeed();
    setRefreshing(false);
  }, [refetchFeed]);

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      showToast({ type: 'info', message: 'Sign in to share your travel stories' });
      return;
    }
    setShowCreateModal(true);
  };

  const handleCompanionPress = (companion: TravelCompanion) => {
    router.push({
      pathname: '/companion/[id]',
      params: { id: companion.id, data: JSON.stringify(companion) },
    });
  };

  const handleStartChat = (companion: TravelCompanion) => {
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: 'new',
        companionId: companion.id,
        companionName: companion.name,
      },
    });
  };

  const renderHeader = () => (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
    >
      <View>
        <Text style={styles.title}>Social Hub</Text>
        <Text style={styles.subtitle}>Connect with fellow travelers</Text>
      </View>
      <TouchableOpacity style={styles.createButton} onPress={handleCreatePost}>
        <LinearGradient
          colors={[Colors.primary.gold, Colors.primary.purple]}
          style={styles.createButtonGradient}
        >
          <Plus size={24} color={Colors.neutral.white} />
        </LinearGradient>
      </TouchableOpacity>
    </MotiView>
  );

  const renderTabSelector = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 100 }}
      style={styles.tabContainer}
    >
      <BlurView intensity={60} style={styles.tabSelector}>
        {[
          { id: 'companions', label: 'Companions', icon: Users },
          { id: 'feed', label: 'Community', icon: MessageSquare },
          { id: 'reels', label: 'Reels', icon: Video },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as TabType)}
          >
            <tab.icon
              size={16}
              color={activeTab === tab.id ? Colors.primary.gold : Colors.neutral.gray400}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </BlurView>
    </MotiView>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Search size={20} color={Colors.neutral.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search travelers, posts, or locations..."
          placeholderTextColor={Colors.neutral.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={16} color={Colors.primary.gold} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCompanionCard = ({ item, index }: { item: TravelCompanion; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay: index * 100 }}
    >
      <TouchableOpacity
        style={styles.companionCard}
        onPress={() => handleCompanionPress(item)}
        activeOpacity={0.9}
      >
        <BlurView intensity={60} style={styles.cardBlur}>
          <LinearGradient
            colors={['rgba(40,40,45,0.95)', 'rgba(30,30,35,0.98)']}
            style={styles.cardGradient}
          >
            {/* Header */}
            <View style={styles.companionHeader}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View
                  style={[
                    styles.onlineIndicator,
                    { backgroundColor: item.isOnline ? Colors.semantic.success : Colors.neutral.gray500 },
                  ]}
                />
                {item.isVerified && (
                  <View style={styles.verifiedBadgeSmall}>
                    <Star size={10} color={Colors.neutral.white} fill={Colors.neutral.white} />
                  </View>
                )}
              </View>
              
              <View style={styles.companionInfo}>
                <Text style={styles.companionName}>{item.name}</Text>
                <View style={styles.routeRow}>
                  <Navigation size={12} color={Colors.primary.gold} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {item.route}
                  </Text>
                </View>
                <View style={styles.timeRow}>
                  <Clock size={12} color={Colors.neutral.gray400} />
                  <Text style={styles.timeText}>Departing {item.departureTime}</Text>
                </View>
              </View>
              
              <View style={styles.safetyBadge}>
                <Shield size={14} color={Colors.primary.gold} />
                <Text style={styles.safetyScore}>{item.safetyScore}</Text>
              </View>
            </View>

            {/* Interests */}
            <View style={styles.interestsContainer}>
              {item.interests.map((interest, i) => (
                <View key={i} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={styles.companionFooter}>
              <View style={styles.mutualConnections}>
                <Users size={14} color={Colors.neutral.gray400} />
                <Text style={styles.mutualText}>{item.mutualConnections} mutual connections</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={() => handleStartChat(item)}
                >
                  <MessageCircle size={18} color={Colors.neutral.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.connectButton}>
                  <UserPlus size={18} color={Colors.primary.gold} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>
    </MotiView>
  );

  const renderPostCard = ({ item, index }: { item: CommunityPost; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 50 }}
    >
      <View style={styles.postCard}>
        <BlurView intensity={60} style={styles.postBlur}>
          <LinearGradient
            colors={['rgba(40,40,45,0.95)', 'rgba(30,30,35,0.98)']}
            style={styles.postGradient}
          >
            {/* Post Header */}
            <View style={styles.postHeader}>
              <TouchableOpacity style={styles.authorRow}>
                <Image source={{ uri: item.author.avatar }} style={styles.postAvatar} />
                <View>
                  <View style={styles.authorNameRow}>
                    <Text style={styles.authorName}>{item.author.name}</Text>
                    {item.author.isVerified && (
                      <Star size={14} color={Colors.primary.gold} fill={Colors.primary.gold} />
                    )}
                  </View>
                  <View style={styles.locationRow}>
                    <MapPin size={12} color={Colors.neutral.gray400} />
                    <Text style={styles.postLocation}>{item.location.name}</Text>
                    <Text style={styles.postTime}>• {item.createdAt}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity>
                <MoreHorizontal size={20} color={Colors.neutral.gray400} />
              </TouchableOpacity>
            </View>

            {/* AI Summary (if available) */}
            {item.aiSummary && (
              <View style={styles.aiSummaryContainer}>
                <Sparkles size={14} color={Colors.primary.gold} />
                <Text style={styles.aiSummaryText}>{item.aiSummary}</Text>
              </View>
            )}

            {/* Content */}
            <Text style={styles.postContent}>{item.content}</Text>

            {/* Media */}
            {item.mediaUrls.length > 0 && (
              <View style={styles.mediaContainer}>
                {item.mediaType === 'video' ? (
                  <VideoPlayer uri={item.mediaUrls[0]} thumbnailStyle={styles.postMedia} />
                ) : (
                  <Image source={{ uri: item.mediaUrls[0] }} style={styles.postMedia} />
                )}
                {item.mediaUrls.length > 1 && (
                  <View style={styles.mediaOverlay}>
                    <Text style={styles.mediaCount}>+{item.mediaUrls.length - 1}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Tags */}
            {item.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {item.tags.map((tag, i) => (
                  <Text key={i} style={styles.tag}>#{tag}</Text>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.postActions}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => likePost.mutate(item.id)}
              >
                <Heart
                  size={22}
                  color={item.isLiked ? Colors.semantic.error : Colors.neutral.gray400}
                  fill={item.isLiked ? Colors.semantic.error : 'transparent'}
                />
                <Text style={[styles.actionCount, item.isLiked && styles.actionCountActive]}>
                  {item.likesCount}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionItem}>
                <MessageCircle size={22} color={Colors.neutral.gray400} />
                <Text style={styles.actionCount}>{item.commentsCount}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionItem}>
                <Share2 size={22} color={Colors.neutral.gray400} />
                <Text style={styles.actionCount}>{item.sharesCount}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </MotiView>
  );

  const renderCreateModal = () => (
    <AnimatePresence>
      {showCreateModal && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.modalOverlay}
        >
          <BlurView intensity={80} style={styles.modalBlur}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Post</Text>
              
              <View style={styles.createOptions}>
                <TouchableOpacity style={styles.createOption}>
                  <View style={[styles.createIcon, { backgroundColor: `${Colors.primary.gold}20` }]}>
                    <ImageIcon size={28} color={Colors.primary.gold} />
                  </View>
                  <Text style={styles.createOptionText}>Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.createOption}>
                  <View style={[styles.createIcon, { backgroundColor: `${Colors.semantic.error}20` }]}>
                    <Video size={28} color={Colors.semantic.error} />
                  </View>
                  <Text style={styles.createOptionText}>Reel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.createOption}>
                  <View style={[styles.createIcon, { backgroundColor: `${Colors.primary.purple}20` }]}>
                    <Mic size={28} color={Colors.primary.purple} />
                  </View>
                  <Text style={styles.createOptionText}>Audio</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </MotiView>
      )}
    </AnimatePresence>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'companions':
        return (
          <FlatList
            data={mockCompanions}
            keyExtractor={(item) => item.id}
            renderItem={renderCompanionCard}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <Text style={styles.sectionTitle}>Nearby Travelers</Text>
            }
            showsVerticalScrollIndicator={false}
          />
        );
      
      case 'feed':
        return (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderPostCard}
            contentContainerStyle={styles.listContent}
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListHeaderComponent={
              <Text style={styles.sectionTitle}>Community Stories</Text>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator style={styles.loadMore} color={Colors.primary.gold} />
              ) : null
            }
            ListEmptyComponent={
              isLoadingFeed ? (
                <View style={styles.loadingContainer}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={300} style={styles.skeletonPost} />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <MessageSquare size={48} color={Colors.neutral.gray400} />
                  <Text style={styles.emptyTitle}>No posts yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Be the first to share your travel story!
                  </Text>
                </View>
              )
            }
            showsVerticalScrollIndicator={false}
          />
        );
      
      case 'reels':
        return (
          <View style={styles.reelsContainer}>
            <Text style={styles.sectionTitle}>Travel Reels</Text>
            <Text style={styles.comingSoon}>Reels feature coming soon!</Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.background.gradient} style={styles.background}>
        {renderHeader()}
        {renderTabSelector()}
        {activeTab === 'companions' && renderSearchBar()}
        {renderContent()}
        {renderCreateModal()}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: { ...Typography.h1, color: Colors.neutral.white },
  subtitle: { ...Typography.bodyMedium, color: Colors.neutral.gray400, marginTop: Spacing.xs },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  createButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  tabSelector: {
    flexDirection: 'row',
    padding: Spacing.xs,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(40,40,45,0.6)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  tabActive: { backgroundColor: `${Colors.primary.gold}25` },
  tabText: { ...Typography.bodySmall, color: Colors.neutral.gray400, fontWeight: '600' },
  tabTextActive: { color: Colors.primary.gold },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral.white,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  companionCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardBlur: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  cardGradient: { padding: Spacing.md },
  companionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.neutral.gray900,
  },
  verifiedBadgeSmall: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.gray900,
  },
  companionInfo: { flex: 1 },
  companionName: { ...Typography.h4, color: Colors.neutral.white },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  routeText: {
    ...Typography.bodySmall,
    color: Colors.primary.gold,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: Spacing.xs,
  },
  timeText: { ...Typography.bodySmall, color: Colors.neutral.gray400 },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary.gold}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  safetyScore: {
    ...Typography.bodySmall,
    color: Colors.primary.gold,
    fontWeight: '700',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  interestTag: {
    backgroundColor: Colors.neutral.gray800,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  interestText: { ...Typography.caption, color: Colors.neutral.gray300 },
  companionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray800,
  },
  mutualConnections: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  mutualText: { ...Typography.bodySmall, color: Colors.neutral.gray400 },
  actionButtons: { flexDirection: 'row', gap: Spacing.sm },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.semantic.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.primary.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  postBlur: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  postGradient: { padding: Spacing.md },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  authorName: { ...Typography.bodyLarge, color: Colors.neutral.white, fontWeight: '700' },
  postLocation: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    marginLeft: Spacing.xs,
  },
  postTime: {
    ...Typography.caption,
    color: Colors.neutral.gray500,
    marginLeft: Spacing.xs,
  },
  aiSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary.gold}15`,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  aiSummaryText: {
    ...Typography.bodySmall,
    color: Colors.primary.gold,
    flex: 1,
    fontStyle: 'italic',
  },
  postContent: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  mediaContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  postMedia: {
    width: '100%',
    height: 240,
    borderRadius: BorderRadius.md,
  },
  mediaOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  mediaCount: {
    ...Typography.bodySmall,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tag: {
    ...Typography.bodySmall,
    color: Colors.primary.gold,
  },
  postActions: {
    flexDirection: 'row',
    gap: Spacing.xl,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.gray800,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionCount: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
  },
  actionCountActive: { color: Colors.semantic.error },
  loadMore: { marginVertical: Spacing.lg },
  loadingContainer: { gap: Spacing.lg },
  skeletonPost: { marginBottom: Spacing.lg },
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
  reelsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoon: {
    ...Typography.bodyLarge,
    color: Colors.neutral.gray400,
    marginTop: Spacing.md,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalBlur: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.neutral.gray900,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.neutral.white,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  createOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  createOption: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  createIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createOptionText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.bodyLarge,
    color: Colors.neutral.gray400,
  },
});