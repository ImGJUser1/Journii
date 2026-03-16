// app/(tabs)/reels.tsx (or ReelFeedScreen.tsx)
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import {
  Heart,
  MessageCircle,
  Share2,
  Music,
  MapPin,
  Plus,
  ChevronLeft,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { VideoPlayer } from '@/components/VideoPlayer';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useCommunityFeed } from '@/services/api/hooks';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { BottomSheet } from '@/components/ui/BottomSheet';

const { width, height } = Dimensions.get('window');

interface Reel {
  id: string;
  video_url: string;
  thumbnail_url: string;
  caption: string;
  author: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  location?: {
    name: string;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  audio_title?: string;
}

export default function ReelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();
  const { lightImpact, mediumImpact } = useHaptics();
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentReel, setCurrentReel] = useState<Reel | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const {
    data: reelsData,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = useCommunityFeed({ category: 'reels' });

  const reels = reelsData?.pages.flatMap((page) => page.posts) || [];

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleLike = useCallback((reel: Reel) => {
    mediumImpact();
    // API call to toggle like
  }, [mediumImpact]);

  const handleComment = useCallback((reel: Reel) => {
    setCurrentReel(reel);
    setShowComments(true);
  }, []);

  const handleShare = useCallback(async (reel: Reel) => {
    // Share functionality
    showToast({ type: 'success', message: 'Link copied to clipboard' });
  }, [showToast]);

  const handleFollow = useCallback((authorId: string) => {
    lightImpact();
    // API call to follow user
  }, [lightImpact]);

  const handleDoubleTap = useCallback((reel: Reel) => {
    handleLike(reel);
  }, [handleLike]);

  const renderReel = ({ item, index }: { item: Reel; index: number }) => {
    const isActive = index === activeIndex;

    return (
      <View style={styles.reelContainer}>
        {/* Video */}
        <VideoPlayer
          uri={item.video_url}
          thumbnailUri={item.thumbnail_url}
          style={styles.video}
          autoPlay={isActive}
          loop={true}
          muted={isMuted}
          onDoubleTap={() => handleDoubleTap(item)}
        />

        {/* Overlay UI */}
        <View style={styles.overlay}>
          {/* Top Bar */}
          <View style={[styles.topBar, { paddingTop: insets.top + Spacing.md }]}>
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft size={28} color={Colors.neutral.white} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setIsMuted(!isMuted)}>
              {isMuted ? (
                <VolumeX size={24} color={Colors.neutral.white} />
              ) : (
                <Volume2 size={24} color={Colors.neutral.white} />
              )}
            </TouchableOpacity>
          </View>

          {/* Right Side Actions */}
          <View style={[styles.actions, { paddingBottom: insets.bottom + 100 }]}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(item)}
            >
              <Heart
                size={32}
                color={item.is_liked ? Colors.semantic.error : Colors.neutral.white}
                fill={item.is_liked ? Colors.semantic.error : 'transparent'}
              />
              <Text style={styles.actionCount}>{item.likes_count}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleComment(item)}
            >
              <MessageCircle size={32} color={Colors.neutral.white} />
              <Text style={styles.actionCount}>{item.comments_count}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(item)}
            >
              <Share2 size={32} color={Colors.neutral.white} />
            </TouchableOpacity>
          </View>

          {/* Bottom Info */}
          <View style={[styles.bottomInfo, { paddingBottom: insets.bottom + 120 }]}>
            <View style={styles.authorRow}>
              <TouchableOpacity style={styles.authorInfo}>
                <Animated.Image
                  source={{ uri: item.author.avatar_url }}
                  style={styles.authorAvatar}
                />
                <Text style={styles.authorName}>{item.author.full_name}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.followButton}
                onPress={() => handleFollow(item.author.id)}
              >
                <Plus size={16} color={Colors.neutral.white} />
                <Text style={styles.followText}>Follow</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.caption} numberOfLines={2}>
              {item.caption}
            </Text>

            {item.location && (
              <View style={styles.locationRow}>
                <MapPin size={14} color={Colors.neutral.white} />
                <Text style={styles.locationText}>{item.location.name}</Text>
              </View>
            )}

            {item.audio_title && (
              <View style={styles.audioRow}>
                <Music size={14} color={Colors.neutral.white} />
                <Text style={styles.audioText}>{item.audio_title}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={reels}
        keyExtractor={(item) => item.id}
        renderItem={renderReel}
        pagingEnabled
        horizontal={false}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={() => hasNextPage && fetchNextPage()}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
      />

      {/* Comments Bottom Sheet */}
      <BottomSheet
        isVisible={showComments}
        onClose={() => setShowComments(false)}
        snapPoints={[0.5, 0.75]}
        initialSnapPoint={0}
      >
        <View style={styles.commentsContainer}>
          <Text style={styles.commentsTitle}>Comments</Text>
          {/* Comments list would go here */}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral.black,
  },
  reelContainer: {
    width: width,
    height: height,
    position: 'relative',
  },
  video: {
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  actions: {
    position: 'absolute',
    right: Spacing.lg,
    gap: Spacing.lg,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    ...Typography.bodySmall,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  bottomInfo: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primary.gold,
  },
  authorName: {
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  followText: {
    ...Typography.bodySmall,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  caption: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  locationText: {
    ...Typography.bodySmall,
    color: Colors.neutral.white,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  audioText: {
    ...Typography.bodySmall,
    color: Colors.neutral.white,
  },
  commentsContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  commentsTitle: {
    ...Typography.h3,
    color: Colors.neutral.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});