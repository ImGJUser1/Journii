import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  User,
  Trophy,
  MapPin,
  Star,
  Award,
  Target,
  Zap,
  Crown,
  Settings,
  Share2,
  ChevronRight,
  Shield,
  Globe,
  Heart,
  Bookmark,
  Camera,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/stores/auth-store';
import { useGamificationProfile } from '@/services/api/hooks';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: string;
  progress?: number;
  maxProgress?: number;
}

interface UserStats {
  tripsCompleted: number;
  countriesVisited: number;
  experiencesBooked: number;
  photosShared: number;
  totalDistance: string;
  followers: number;
  following: number;
}

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Cultural Explorer',
    description: 'Visited 10 cultural experiences',
    icon: 'compass',
    rarity: 'rare',
    unlockedAt: '2 days ago',
  },
  {
    id: '2',
    title: 'Social Butterfly',
    description: 'Connected with 25 travel companions',
    icon: 'users',
    rarity: 'epic',
    unlockedAt: '1 week ago',
  },
  {
    id: '3',
    title: 'Safety Champion',
    description: 'Maintained 9.5+ safety score for 30 days',
    icon: 'shield',
    rarity: 'legendary',
    unlockedAt: '3 days ago',
  },
  {
    id: '4',
    title: 'Route Master',
    description: 'Complete 50 optimized routes',
    icon: 'target',
    rarity: 'common',
    unlockedAt: 'In progress',
    progress: 32,
    maxProgress: 50,
  },
];

const rarityColors = {
  common: Colors.neutral.gray400,
  rare: Colors.semantic.info,
  epic: Colors.primary.purple,
  legendary: Colors.primary.gold,
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'achievements' | 'stats' | 'trips'>('achievements');

  const { data: gamificationData } = useGamificationProfile();

  const userStats: UserStats = {
    tripsCompleted: 12,
    countriesVisited: 8,
    experiencesBooked: 47,
    photosShared: 156,
    totalDistance: '12,450 km',
    followers: 234,
    following: 189,
  };

  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'compass': return Compass;
      case 'users': return User;
      case 'shield': return Shield;
      case 'target': return Target;
      default: return Trophy;
    }
  };

  const renderHeader = () => (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
    >
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.iconButton}>
          <Settings size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Share2 size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' }}
            style={styles.avatar}
          />
          <View style={styles.levelBadge}>
            <Crown size={14} color={Colors.neutral.white} />
            <Text style={styles.levelText}>Level {user?.level || 12}</Text>
          </View>
        </View>

        <Text style={styles.userName}>{user?.full_name || 'Alex Thompson'}</Text>
        <Text style={styles.userHandle}>@{user?.email?.split('@')[0] || 'alextraveler'}</Text>

        <View style={styles.followStats}>
          <View style={styles.followStat}>
            <Text style={styles.followCount}>{userStats.followers}</Text>
            <Text style={styles.followLabel}>Followers</Text>
          </View>
          <View style={styles.followDivider} />
          <View style={styles.followStat}>
            <Text style={styles.followCount}>{userStats.following}</Text>
            <Text style={styles.followLabel}>Following</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editProfileButton}>
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );

  const renderXPProgress = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 100 }}
      style={styles.xpContainer}
    >
      <BlurView intensity={60} style={styles.xpBlur}>
        <View style={styles.xpHeader}>
          <View>
            <Text style={styles.xpTitle}>Level {user?.level || 12}</Text>
            <Text style={styles.xpSubtitle}>
              {user?.xp_points || 2847} / {(user?.level || 12) * 300} XP
            </Text>
          </View>
          <View style={styles.xpBadge}>
            <Zap size={16} color={Colors.primary.gold} />
            <Text style={styles.xpBadgeText}>+50 XP to next level</Text>
          </View>
        </View>

        <View style={styles.xpProgressBar}>
          <View
            style={[
              styles.xpProgressFill,
              { width: `${((user?.xp_points || 2847) % 300) / 3}%` },
            ]}
          />
        </View>

        <Text style={styles.xpNextReward}>Next reward: Epic Traveler Badge</Text>
      </BlurView>
    </MotiView>
  );

  const renderQuickStats = () => (
    <View style={styles.quickStatsContainer}>
      {[
        { icon: Globe, value: userStats.countriesVisited, label: 'Countries' },
        { icon: MapPin, value: userStats.tripsCompleted, label: 'Trips' },
        { icon: Camera, value: userStats.photosShared, label: 'Photos' },
        { icon: Award, value: userStats.experiencesBooked, label: 'Experiences' },
      ].map((stat, index) => (
        <MotiView
          key={stat.label}
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 200 + index * 50 }}
          style={styles.quickStatCard}
        >
          <BlurView intensity={40} style={styles.quickStatBlur}>
            <stat.icon size={20} color={Colors.primary.gold} />
            <Text style={styles.quickStatValue}>{stat.value}</Text>
            <Text style={styles.quickStatLabel}>{stat.label}</Text>
          </BlurView>
        </MotiView>
      ))}
    </View>
  );

  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      <BlurView intensity={60} style={styles.tabSelector}>
        {[
          { id: 'achievements', label: 'Achievements', icon: Trophy },
          { id: 'stats', label: 'Statistics', icon: Target },
          { id: 'trips', label: 'My Trips', icon: MapPin },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as any)}
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
    </View>
  );

  const renderAchievementCard = ({ item, index }: { item: Achievement; index: number }) => {
    const Icon = getAchievementIcon(item.icon);
    const rarityColor = rarityColors[item.rarity];

    return (
      <MotiView
        from={{ opacity: 0, translateX: -50 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ delay: index * 100 }}
      >
        <TouchableOpacity style={styles.achievementCard} activeOpacity={0.9}>
          <BlurView intensity={60} style={styles.achievementBlur}>
            <LinearGradient
              colors={[`${rarityColor}20`, `${rarityColor}10`]}
              style={styles.achievementGradient}
            >
              <View style={[styles.achievementIcon, { backgroundColor: `${rarityColor}30` }]}>
                <Icon size={24} color={rarityColor} />
              </View>

              <View style={styles.achievementInfo}>
                <View style={styles.achievementHeader}>
                  <Text style={styles.achievementTitle}>{item.title}</Text>
                  <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}30` }]}>
                    <Text style={[styles.rarityText, { color: rarityColor }]}>
                      {item.rarity.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.achievementDescription}>{item.description}</Text>

                {item.progress !== undefined && item.maxProgress && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${(item.progress / item.maxProgress) * 100}%`,
                            backgroundColor: rarityColor,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {item.progress}/{item.maxProgress}
                    </Text>
                  </View>
                )}

                <Text style={styles.unlockedAt}>{item.unlockedAt}</Text>
              </View>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </MotiView>
    );
  };

  const renderStatsGrid = () => (
    <View style={styles.statsGrid}>
      {[
        { label: 'Total Distance', value: userStats.totalDistance, icon: MapPin },
        { label: 'Safety Score', value: '9.6/10', icon: Shield },
        { label: 'Response Rate', value: '98%', icon: Zap },
        { label: 'Member Since', value: '2023', icon: Calendar },
      ].map((stat, index) => (
        <MotiView
          key={stat.label}
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 50 }}
          style={styles.statCard}
        >
          <BlurView intensity={40} style={styles.statCardBlur}>
            <stat.icon size={20} color={Colors.primary.gold} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </BlurView>
        </MotiView>
      ))}
    </View>
  );

  const renderTripsList = () => (
    <View style={styles.tripsContainer}>
      <Text style={styles.sectionTitle}>Upcoming Trips</Text>
      <TouchableOpacity style={styles.tripCard}>
        <BlurView intensity={60} style={styles.tripBlur}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400' }}
            style={styles.tripImage}
          />
          <View style={styles.tripInfo}>
            <Text style={styles.tripDestination}>Kyoto, Japan</Text>
            <Text style={styles.tripDates}>Mar 15 - Mar 22, 2026</Text>
            <View style={styles.tripStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Planning</Text>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.neutral.gray400} />
        </BlurView>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Past Trips</Text>
      <TouchableOpacity style={styles.tripCard}>
        <BlurView intensity={60} style={styles.tripBlur}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1531572753322-ad0ce1af293f?w=400' }}
            style={styles.tripImage}
          />
          <View style={styles.tripInfo}>
            <Text style={styles.tripDestination}>Rome, Italy</Text>
            <Text style={styles.tripDates}>Dec 10 - Dec 17, 2025</Text>
            <View style={styles.tripStatus}>
              <View style={[styles.statusDot, { backgroundColor: Colors.semantic.success }]} />
              <Text style={styles.statusText}>Completed</Text>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.neutral.gray400} />
        </BlurView>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'achievements':
        return (
          <FlatList
            data={mockAchievements}
            keyExtractor={(item) => item.id}
            renderItem={renderAchievementCard}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <Text style={styles.sectionTitle}>Your Achievements</Text>
            }
            showsVerticalScrollIndicator={false}
          />
        );
      case 'stats':
        return (
          <ScrollView contentContainerStyle={styles.listContent}>
            <Text style={styles.sectionTitle}>Travel Statistics</Text>
            {renderStatsGrid()}
          </ScrollView>
        );
      case 'trips':
        return (
          <ScrollView contentContainerStyle={styles.listContent}>
            {renderTripsList()}
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.background.gradient} style={styles.background}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {renderHeader()}
          {renderXPProgress()}
          {renderQuickStats()}
          {renderTabSelector()}
          {renderContent()}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    borderWidth: 4,
    borderColor: Colors.primary.gold,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  levelText: {
    ...Typography.bodySmall,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  userName: {
    ...Typography.h2,
    color: Colors.neutral.white,
    marginTop: Spacing.md,
  },
  userHandle: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
    marginTop: Spacing.xs,
  },
  followStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  followStat: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  followDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.neutral.gray700,
  },
  followCount: {
    ...Typography.h3,
    color: Colors.neutral.white,
  },
  followLabel: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    marginTop: 2,
  },
  editProfileButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.primary.gold}20`,
    borderWidth: 1,
    borderColor: Colors.primary.gold,
  },
  editProfileText: {
    ...Typography.bodyMedium,
    color: Colors.primary.gold,
    fontWeight: '700',
  },
  xpContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  xpBlur: {
    padding: Spacing.md,
    backgroundColor: 'rgba(40,40,45,0.6)',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  xpTitle: {
    ...Typography.h4,
    color: Colors.neutral.white,
  },
  xpSubtitle: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    marginTop: 2,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary.gold}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  xpBadgeText: {
    ...Typography.caption,
    color: Colors.primary.gold,
  },
  xpProgressBar: {
    height: 8,
    backgroundColor: Colors.neutral.gray700,
    borderRadius: BorderRadius.full,
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary.gold,
    borderRadius: BorderRadius.full,
  },
  xpNextReward: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  quickStatBlur: {
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(40,40,45,0.6)',
  },
  quickStatValue: {
    ...Typography.h3,
    color: Colors.primary.gold,
    marginTop: Spacing.xs,
  },
  quickStatLabel: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
    marginTop: 2,
  },
  tabContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
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
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: `${Colors.primary.gold}25`,
  },
  tabText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.primary.gold,
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
  achievementCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  achievementBlur: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  achievementGradient: {
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  achievementTitle: {
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  rarityBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  rarityText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  achievementDescription: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.neutral.gray700,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
  },
  unlockedAt: {
    ...Typography.caption,
    color: Colors.neutral.gray500,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  statCardBlur: {
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(40,40,45,0.6)',
  },
  statValue: {
    ...Typography.h4,
    color: Colors.neutral.white,
    marginTop: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
    marginTop: 2,
  },
  tripsContainer: {
    paddingHorizontal: Spacing.lg,
  },
  tripCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  tripBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: 'rgba(40,40,45,0.6)',
  },
  tripImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  tripInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  tripDestination: {
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  tripDates: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    marginTop: 2,
  },
  tripStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.semantic.warning,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
  },
});