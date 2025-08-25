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
  User,
  Trophy,
  MapPin,
  Calendar,
  Star,
  Award,
  Target,
  Zap,
  Crown,
  Medal,
  Settings,
  Share,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

interface Stats {
  culturalExperiences: number;
  routesCompleted: number;
  companionsConnected: number;
  safetyScore: number;
  totalDistance: string;
  favoriteCategory: string;
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

const mockStats: Stats = {
  culturalExperiences: 47,
  routesCompleted: 128,
  companionsConnected: 34,
  safetyScore: 9.6,
  totalDistance: '2,847 km',
  favoriteCategory: 'Artisan Experiences',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'achievements' | 'stats'>('achievements');

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6b7280';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getRarityGradient = (rarity: string): [string, string] => {
    switch (rarity) {
      case 'common': return ['#64748b', '#94a3b8'];
      case 'rare': return ['#2563eb', '#3b82f6'];
      case 'epic': return ['#7c3aed', '#8b5cf6'];
      case 'legendary': return ['#d97706', '#f59e0b'];
      default: return ['#64748b', '#94a3b8'];
    }
  };

  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'compass': return <MapPin size={24} color="white" />;
      case 'users': return <User size={24} color="white" />;
      case 'shield': return <Award size={24} color="white" />;
      case 'target': return <Target size={24} color="white" />;
      default: return <Trophy size={24} color="white" />;
    }
  };

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => (
    <TouchableOpacity style={styles.achievementCard} activeOpacity={0.9}>
      <BlurView intensity={40} style={styles.achievementBlur}>
        <LinearGradient
          colors={getRarityGradient(achievement.rarity)}
          style={styles.achievementGradient}
        >
        <View style={styles.achievementIcon}>
          {getAchievementIcon(achievement.icon)}
        </View>
        <View style={styles.achievementInfo}>
          <Text style={styles.achievementTitle}>{achievement.title}</Text>
          <Text style={styles.achievementDescription}>{achievement.description}</Text>
          {achievement.progress !== undefined && achievement.maxProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${(achievement.progress / achievement.maxProgress) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {achievement.progress}/{achievement.maxProgress}
              </Text>
            </View>
          )}
          <Text style={styles.achievementTime}>{achievement.unlockedAt}</Text>
        </View>
        <View style={styles.rarityBadge}>
          <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
        </View>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );

  const StatCard = ({ icon, title, value, subtitle }: { 
    icon: React.ReactNode; 
    title: string; 
    value: string | number; 
    subtitle?: string;
  }) => (
    <BlurView intensity={60} style={styles.statCard}>
      <View style={styles.statIcon}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </BlurView>
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
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' }}
                style={styles.profileAvatar}
              />
              <LinearGradient
                colors={['#d97706', '#f59e0b']}
                style={styles.levelBadge}
              >
                <Crown size={16} color="white" />
                <Text style={styles.levelText}>Level 12</Text>
              </LinearGradient>
            </View>
            <Text style={styles.profileName}>Alex Thompson</Text>
            <Text style={styles.profileTitle}>Cultural Explorer</Text>
            <View style={styles.profileActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Settings size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Share size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Level Progress */}
          <View style={styles.levelProgress}>
            <BlurView intensity={60} style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Level 12 Progress</Text>
                <Text style={styles.progressXP}>2,847 / 3,200 XP</Text>
              </View>
              <View style={styles.levelProgressBar}>
                <View style={[styles.levelProgressFill, { width: '89%' }]} />
              </View>
              <Text style={styles.nextLevel}>353 XP to Level 13</Text>
            </BlurView>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <BlurView intensity={60} style={styles.tabSelector}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'achievements' && styles.tabActive
                ]}
                onPress={() => setActiveTab('achievements')}
              >
                <Trophy size={16} color={activeTab === 'achievements' ? '#c9a96e' : 'rgba(255,255,255,0.8)'} />
                <Text style={[
                  styles.tabText,
                  activeTab === 'achievements' && styles.tabTextActive
                ]}>
                  Achievements
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'stats' && styles.tabActive
                ]}
                onPress={() => setActiveTab('stats')}
              >
                <Zap size={16} color={activeTab === 'stats' ? '#c9a96e' : 'rgba(255,255,255,0.8)'} />
                <Text style={[
                  styles.tabText,
                  activeTab === 'stats' && styles.tabTextActive
                ]}>
                  Statistics
                </Text>
              </TouchableOpacity>
            </BlurView>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {activeTab === 'achievements' ? (
              <View>
                <Text style={styles.sectionTitle}>Your Achievements</Text>
                {mockAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </View>
            ) : (
              <View>
                <Text style={styles.sectionTitle}>Your Statistics</Text>
                <View style={styles.statsGrid}>
                  <StatCard
                    icon={<MapPin size={20} color="white" />}
                    title="Cultural Experiences"
                    value={mockStats.culturalExperiences}
                  />
                  <StatCard
                    icon={<Target size={20} color="white" />}
                    title="Routes Completed"
                    value={mockStats.routesCompleted}
                  />
                  <StatCard
                    icon={<User size={20} color="white" />}
                    title="Companions Met"
                    value={mockStats.companionsConnected}
                  />
                  <StatCard
                    icon={<Award size={20} color="white" />}
                    title="Safety Score"
                    value={mockStats.safetyScore}
                    subtitle="out of 10"
                  />
                  <StatCard
                    icon={<Zap size={20} color="white" />}
                    title="Total Distance"
                    value={mockStats.totalDistance}
                  />
                  <StatCard
                    icon={<Star size={20} color="white" />}
                    title="Favorite Category"
                    value={mockStats.favoriteCategory}
                  />
                </View>
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
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelProgress: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(40,40,45,0.6)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.2)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  progressXP: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  levelProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 8,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#c9a96e',
    borderRadius: 4,
  },
  nextLevel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
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
  achievementCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  achievementBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.2)',
  },
  achievementGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  achievementTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(40,40,45,0.6)',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.2)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});