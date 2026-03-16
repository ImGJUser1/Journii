// app/notifications.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Calendar,
  Star,
  Check,
  Trash2,
  Settings,
} from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

import { 
  useNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead 
} from '@/services/api/hooks';
import { useUIStore } from '@/stores/ui-store';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';

const { width } = Dimensions.get('window');

type NotificationType = 
  | 'like' 
  | 'comment' 
  | 'follow' 
  | 'trip_invite' 
  | 'booking_confirmed'
  | 'message'
  | 'achievement'
  | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  image?: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

const notificationIcons: Record<NotificationType, any> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  trip_invite: Calendar,
  booking_confirmed: Check,
  message: MessageCircle,
  achievement: Star,
  system: Bell,
};

const notificationColors: Record<NotificationType, string> = {
  like: Colors.semantic.error,
  comment: Colors.primary.purple,
  follow: Colors.semantic.info,
  trip_invite: Colors.primary.gold,
  booking_confirmed: Colors.semantic.success,
  message: Colors.primary.gold,
  achievement: Colors.primary.gold,
  system: Colors.neutral.gray400,
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useUIStore();
  const { lightImpact } = useHaptics();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useNotifications();

  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();

  const notifications: Notification[] = notificationsData?.notifications || [];

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead.mutateAsync();
      showToast({ type: 'success', message: 'All notifications marked as read' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to mark as read' });
    }
  }, [markAllAsRead, showToast]);

  const handleNotificationPress = useCallback(async (notification: Notification) => {
    lightImpact();
    
    // Mark as read
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate based on type
    switch (notification.type) {
      case 'like':
      case 'comment':
        if (notification.data?.post_id) {
          router.push(`/post/${notification.data.post_id}`);
        }
        break;
      case 'follow':
        if (notification.data?.user_id) {
          router.push(`/profile/${notification.data.user_id}`);
        }
        break;
      case 'trip_invite':
        if (notification.data?.itinerary_id) {
          router.push(`/itenary/${notification.data.itinerary_id}`);
        }
        break;
      case 'booking_confirmed':
        if (notification.data?.booking_id) {
          router.push(`/booking/${notification.data.booking_id}`);
        }
        break;
      case 'message':
        if (notification.data?.conversation_id) {
          router.push(`/chat/${notification.data.conversation_id}`);
        }
        break;
      case 'achievement':
        router.push('/profile');
        break;
    }
  }, [lightImpact, markAsRead, router]);

  const handleDeleteNotification = useCallback((id: string) => {
    // Delete notification API call
    showToast({ type: 'success', message: 'Notification removed' });
  }, [showToast]);

  const renderNotification = ({ item, index }: { item: Notification; index: number }) => {
    const Icon = notificationIcons[item.type];
    const color = notificationColors[item.type];

    return (
      <MotiView
        from={{ opacity: 0, translateX: -30 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ delay: index * 50 }}
      >
        <TouchableOpacity
          style={[
            styles.notificationItem,
            !item.is_read && styles.notificationUnread,
          ]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Icon size={20} color={color} />
          </View>

          {item.image && (
            <Image source={{ uri: item.image }} style={styles.notificationImage} />
          )}

          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>
              {item.title}
            </Text>
            <Text style={styles.notificationBody} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.notificationTime}>
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </Text>
          </View>

          {!item.is_read && (
            <View style={styles.unreadIndicator} />
          )}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteNotification(item.id)}
          >
            <Trash2 size={16} color={Colors.neutral.gray500} />
          </TouchableOpacity>
        </TouchableOpacity>
      </MotiView>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bell size={64} color={Colors.neutral.gray600} />
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'unread' 
          ? "You're all caught up!" 
          : "We'll notify you about likes, comments, and trip updates"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.background.gradient} style={styles.background}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <BlurView intensity={60} style={styles.headerBlur}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.neutral.white} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllRead}>
                  <Check size={22} color={Colors.primary.gold} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => router.push('/settings/notifications')}>
                <Settings size={22} color={Colors.neutral.white} />
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'unread'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === f && styles.filterTabTextActive,
                ]}
              >
                {f === 'all' ? 'All' : 'Unread'}
                {f === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary.gold}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.neutral.white,
  },
  badge: {
    backgroundColor: Colors.semantic.error,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.neutral.white,
    fontWeight: '700',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral.gray800,
  },
  filterTabActive: {
    backgroundColor: `${Colors.primary.gold}30`,
  },
  filterTabText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.gray400,
  },
  filterTabTextActive: {
    color: Colors.primary.gold,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  notificationUnread: {
    backgroundColor: `${Colors.primary.gold}10`,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.gold,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  notificationImage: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
    marginBottom: 2,
  },
  notificationBody: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
    marginBottom: 4,
  },
  notificationTime: {
    ...Typography.caption,
    color: Colors.neutral.gray500,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.gold,
    marginLeft: Spacing.sm,
  },
  deleteButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
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
});