import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
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
  Share,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

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
}

interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  location: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timeAgo: string;
  tags: string[];
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
  },
];

const mockPosts: CommunityPost[] = [
  {
    id: '1',
    author: 'Elena Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    location: 'Historic District',
    content: 'Just discovered this amazing hidden pottery workshop! The master craftsman shared incredible stories about traditional techniques. Highly recommend for anyone interested in authentic cultural experiences! 🏺✨',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    likes: 24,
    comments: 8,
    timeAgo: '2h ago',
    tags: ['pottery', 'culture', 'artisan'],
  },
  {
    id: '2',
    author: 'David Kim',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    location: 'Night Market',
    content: 'Street food tour was incredible! Met amazing people and tasted flavors I never knew existed. The stories behind each dish made it even more special. Food really is a universal language! 🍜🌟',
    likes: 31,
    comments: 12,
    timeAgo: '4h ago',
    tags: ['food', 'culture', 'community'],
  },
];

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'companions' | 'community'>('companions');

  const CompanionCard = ({ companion }: { companion: TravelCompanion }) => (
    <TouchableOpacity style={styles.companionCard} activeOpacity={0.9}>
      <BlurView intensity={60} style={styles.cardBlur}>
        <LinearGradient
          colors={['rgba(40,40,45,0.8)', 'rgba(30,30,35,0.9)']}
          style={styles.cardGradient}
        >
        <View style={styles.companionHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: companion.avatar }} style={styles.avatar} />
            <View style={[
              styles.onlineIndicator,
              { backgroundColor: companion.isOnline ? '#4ade80' : '#6b7280' }
            ]} />
          </View>
          <View style={styles.companionInfo}>
            <Text style={styles.companionName}>{companion.name}</Text>
            <View style={styles.routeInfo}>
              <Navigation size={12} color="#c9a96e" />
              <Text style={styles.routeText}>{companion.route}</Text>
            </View>
            <View style={styles.timeInfo}>
              <Clock size={12} color="#8b8680" />
              <Text style={styles.timeText}>Departing {companion.departureTime}</Text>
            </View>
          </View>
          <View style={styles.safetyBadge}>
            <Shield size={14} color="#c9a96e" />
            <Text style={styles.safetyScore}>{companion.safetyScore}</Text>
          </View>
        </View>

        <View style={styles.companionDetails}>
          <Text style={styles.destination}>Going to: {companion.destination}</Text>
          <View style={styles.interests}>
            {companion.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.companionFooter}>
          <View style={styles.mutualConnections}>
            <Users size={14} color="#8b8680" />
            <Text style={styles.mutualText}>{companion.mutualConnections} mutual</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle size={16} color="#c9a96e" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <UserPlus size={16} color="#c9a96e" />
            </TouchableOpacity>
          </View>
        </View>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );

  const PostCard = ({ post }: { post: CommunityPost }) => (
    <TouchableOpacity style={styles.postCard} activeOpacity={0.9}>
      <BlurView intensity={60} style={styles.cardBlur}>
        <LinearGradient
          colors={['rgba(40,40,45,0.8)', 'rgba(30,30,35,0.9)']}
          style={styles.cardGradient}
        >
        <View style={styles.postHeader}>
          <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
          <View style={styles.postInfo}>
            <Text style={styles.postAuthor}>{post.author}</Text>
            <View style={styles.postLocation}>
              <MapPin size={12} color="#8b8680" />
              <Text style={styles.locationText}>{post.location}</Text>
              <Text style={styles.timeAgo}>• {post.timeAgo}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.postContent}>{post.content}</Text>

        {post.image && (
          <View style={styles.postImageContainer}>
            <Image source={{ uri: post.image }} style={styles.postImage} />
          </View>
        )}

        <View style={styles.postTags}>
          {post.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.postFooter}>
          <View style={styles.postStats}>
            <TouchableOpacity style={styles.statButton}>
              <Heart size={16} color="#c9a96e" />
              <Text style={styles.statText}>{post.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statButton}>
              <MessageCircle size={16} color="#c9a96e" />
              <Text style={styles.statText}>{post.comments}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Share size={16} color="#8b8680" />
          </TouchableOpacity>
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
            <Text style={styles.title}>Social Hub</Text>
            <Text style={styles.subtitle}>Connect with fellow travelers</Text>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <BlurView intensity={60} style={styles.tabSelector}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'companions' && styles.tabActive
                ]}
                onPress={() => setActiveTab('companions')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'companions' && styles.tabTextActive
                ]}>
                  Travel Companions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'community' && styles.tabActive
                ]}
                onPress={() => setActiveTab('community')}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === 'community' && styles.tabTextActive
                ]}>
                  Community Stories
                </Text>
              </TouchableOpacity>
            </BlurView>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {activeTab === 'companions' ? (
              <View>
                <Text style={styles.sectionTitle}>Nearby Companions</Text>
                {mockCompanions.map((companion) => (
                  <CompanionCard key={companion.id} companion={companion} />
                ))}
              </View>
            ) : (
              <View>
                <Text style={styles.sectionTitle}>Community Stories</Text>
                {mockPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </View>
            )}
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
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabSelector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(40,40,45,0.6)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.2)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: 'rgba(201,169,110,0.25)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  tabTextActive: {
    color: '#c9a96e',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  companionCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  postCard: {
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
  companionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  companionInfo: {
    flex: 1,
  },
  companionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  routeText: {
    fontSize: 12,
    color: '#c9a96e',
    fontWeight: '600',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201,169,110,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  safetyScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c9a96e',
  },
  companionDetails: {
    marginBottom: 16,
  },
  destination: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestTag: {
    backgroundColor: 'rgba(201,169,110,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  interestText: {
    fontSize: 12,
    color: '#c9a96e',
    fontWeight: '600',
  },
  companionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mutualConnections: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mutualText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201,169,110,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postInfo: {
    flex: 1,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  postLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  timeAgo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  postContent: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: 12,
  },
  postImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: 'rgba(201,169,110,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#c9a96e',
    fontWeight: '600',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139,134,128,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});