// app/chat/[id].tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Mic,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  Clock,
  Smile,
  MapPin,
  Calendar,
} from 'lucide-react-native';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';

import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useMessages, useSendMessage, useMarkAsRead } from '@/services/api/hooks';
import { wsService } from '@/services/websocket';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'location' | 'itinerary_share';
  media_url?: string;
  metadata?: any;
  is_edited: boolean;
  created_at: string;
  read_by: string[];
  reply_to_id?: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'trip';
  name?: string;
  participants: {
    id: string;
    full_name: string;
    avatar_url: string;
    is_online?: boolean;
  }[];
  last_message?: Message;
  unread_count: number;
  trip_id?: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const { lightImpact, mediumImpact } = useHaptics();
  
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  // Fetch messages
  const {
    data: messagesData,
    isLoading,
    error,
    refetch,
  } = useMessages(id);
  
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  
  const messages = messagesData?.messages || [];
  const conversation = messagesData?.conversation;

  // WebSocket setup
  useEffect(() => {
    if (!id || !user) return;
    
    // Connect to WebSocket
    wsService.connect();
    
    // Join conversation room
    wsService.joinConversation(id);
    
    // Listen for messages
    const unsubscribe = wsService.onMessage((message: Message) => {
      if (message.conversation_id === id) {
        // New message received - refetch to update
        refetch();
        
        // Mark as read if from other user
        if (message.sender_id !== user.id) {
          markAsRead.mutate({ messageIds: [message.id] });
        }
      }
    });
    
    // Listen for typing indicators
    const unsubscribeTyping = wsService.onTyping((data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== user.id) {
        setIsTyping(data.isTyping);
      }
    });
    
    return () => {
      unsubscribe();
      unsubscribeTyping();
      wsService.leaveConversation(id);
    };
  }, [id, user, refetch, markAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Typing indicator debounce
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const handleTyping = useCallback(() => {
    wsService.sendTyping(id, true);
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      wsService.sendTyping(id, false);
    }, 3000);
  }, [id]);

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() && !replyingTo) return;
    
    mediumImpact();
    
    const content = messageText.trim();
    setMessageText('');
    setReplyingTo(null);
    
    try {
      // Optimistic update
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: id,
        sender_id: user!.id,
        content,
        message_type: 'text',
        is_edited: false,
        created_at: new Date().toISOString(),
        read_by: [user!.id],
        reply_to_id: replyingTo?.id,
        sender: {
          id: user!.id,
          full_name: user!.full_name,
          avatar_url: user!.avatar_url || '',
        },
      };
      
      // Send via API (WebSocket will broadcast)
      await sendMessage.mutateAsync({
        conversationId: id,
        content,
        messageType: 'text',
        replyToId: replyingTo?.id,
      });
      
      // Also send via WebSocket for real-time
      wsService.sendMessage(id, content, 'text');
      
    } catch (error: any) {
      showToast({
        type: 'error',
        message: 'Failed to send message',
      });
    }
  }, [messageText, id, user, replyingTo, sendMessage, showToast, mediumImpact]);

  const handleImagePick = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ type: 'error', message: 'Permission needed to access photos' });
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets) {
      // Upload and send each image
      for (const asset of result.assets) {
        // Upload to S3/MinIO first
        // Then send message with media_url
        showToast({ type: 'info', message: 'Sending image...' });
      }
    }
    
    setShowAttachMenu(false);
  }, [showToast]);

  const handleCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToast({ type: 'error', message: 'Camera permission needed' });
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    
    if (!result.canceled) {
      // Upload and send
      showToast({ type: 'info', message: 'Sending photo...' });
    }
    
    setShowAttachMenu(false);
  }, [showToast]);

  const handleLocationShare = useCallback(() => {
    // Get current location and share
    showToast({ type: 'info', message: 'Location sharing coming soon' });
    setShowAttachMenu(false);
  }, [showToast]);

  const handleItineraryShare = useCallback(() => {
    router.push({
      pathname: '/itenary',
      params: { shareTo: id },
    });
    setShowAttachMenu(false);
  }, [router, id]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentGroup: { date: string; messages: Message[] } | null = null;
    
    messages.forEach((message) => {
      const date = new Date(message.created_at);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!currentGroup || currentGroup.date !== dateKey) {
        currentGroup = {
          date: dateKey,
          messages: [],
        };
        groups.push(currentGroup);
      }
      
      currentGroup.messages.push(message);
    });
    
    return groups;
  };

  const renderMessageBubble = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender_id === user?.id;
    const showAvatar = !isMe && (
      index === 0 || 
      messages[index - 1]?.sender_id !== item.sender_id
    );
    const isLastInGroup = 
      index === messages.length - 1 || 
      messages[index + 1]?.sender_id !== item.sender_id;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 50 }}
        style={[
          styles.messageContainer,
          isMe ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        {!isMe && showAvatar && (
          <Image
            source={{ uri: item.sender.avatar_url || 'https://via.placeholder.com/40' }}
            style={styles.messageAvatar}
          />
        )}
        
        {!isMe && !showAvatar && <View style={styles.avatarPlaceholder} />}
        
        <View style={[
          styles.messageBubble,
          isMe ? styles.myBubble : styles.theirBubble,
          !isLastInGroup && (isMe ? styles.myBubbleGrouped : styles.theirBubbleGrouped),
        ]}>
          {item.reply_to_id && (
            <View style={styles.replyPreview}>
              <Text style={styles.replyText} numberOfLines={1}>
                Replying to message
              </Text>
            </View>
          )}
          
          {item.message_type === 'text' && (
            <Text style={[
              styles.messageText,
              isMe ? styles.myMessageText : styles.theirMessageText,
            ]}>
              {item.content}
            </Text>
          )}
          
          {item.message_type === 'image' && item.media_url && (
            <TouchableOpacity activeOpacity={0.9}>
              <Image
                source={{ uri: item.media_url }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          
          <View style={styles.messageMeta}>
            <Text style={styles.messageTime}>
              {formatMessageTime(item.created_at)}
            </Text>
            {isMe && (
              <View style={styles.readStatus}>
                {item.read_by.length > 1 ? (
                  <CheckCheck size={14} color={Colors.semantic.success} />
                ) : (
                  <Check size={14} color={Colors.neutral.gray400} />
                )}
              </View>
            )}
          </View>
        </View>
      </MotiView>
    );
  };

  const renderDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    let label = format(date, 'MMMM d, yyyy');
    
    if (isToday(date)) {
      label = 'Today';
    } else if (isYesterday(date)) {
      label = 'Yesterday';
    }
    
    return (
      <View style={styles.dateHeader}>
        <BlurView intensity={40} style={styles.dateBlur}>
          <Text style={styles.dateText}>{label}</Text>
        </BlurView>
      </View>
    );
  };

  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary.gold} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load conversation</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const otherParticipant = conversation?.participants.find(p => p.id !== user?.id);

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.background.gradient} style={styles.background}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <BlurView intensity={60} style={styles.headerBlur}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={Colors.neutral.white} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.headerInfo}>
              <Image
                source={{ 
                  uri: conversation?.type === 'direct' 
                    ? otherParticipant?.avatar_url 
                    : undefined 
                }}
                style={styles.headerAvatar}
              />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerName}>
                  {conversation?.name || otherParticipant?.full_name || 'Chat'}
                </Text>
                {isTyping ? (
                  <Text style={styles.typingText}>typing...</Text>
                ) : otherParticipant?.is_online ? (
                  <Text style={styles.onlineText}>Online</Text>
                ) : (
                  <Text style={styles.lastSeen}>Last seen recently</Text>
                )}
              </View>
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerAction}>
                <Phone size={22} color={Colors.neutral.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerAction}>
                <Video size={22} color={Colors.neutral.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerAction}>
                <MoreVertical size={22} color={Colors.neutral.white} />
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messageGroups}
          keyExtractor={(group) => group.date}
          renderItem={({ item: group }) => (
            <View>
              {renderDateHeader(group.date)}
              {group.messages.map((message, idx) => (
                <View key={message.id}>
                  {renderMessageBubble({ item: message, index: messages.indexOf(message) })}
                </View>
              ))}
            </View>
          )}
          contentContainerStyle={[
            styles.messagesList,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        {/* Reply Preview */}
        {replyingTo && (
          <View style={styles.replyBar}>
            <View style={styles.replyBarContent}>
              <View style={styles.replyBarLine} />
              <View style={styles.replyBarInfo}>
                <Text style={styles.replyBarName}>
                  {replyingTo.sender_id === user?.id ? 'You' : replyingTo.sender.full_name}
                </Text>
                <Text style={styles.replyBarText} numberOfLines={1}>
                  {replyingTo.content}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Text style={styles.replyBarCancel}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
            <BlurView intensity={60} style={styles.inputBlur}>
              {/* Attachment Menu */}
              {showAttachMenu && (
                <View style={styles.attachMenu}>
                  <TouchableOpacity style={styles.attachOption} onPress={handleImagePick}>
                    <View style={[styles.attachIcon, { backgroundColor: `${Colors.primary.purple}20` }]}>
                      <ImageIcon size={24} color={Colors.primary.purple} />
                    </View>
                    <Text style={styles.attachText}>Gallery</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.attachOption} onPress={handleCamera}>
                    <View style={[styles.attachIcon, { backgroundColor: `${Colors.semantic.error}20` }]}>
                      <ImageIcon size={24} color={Colors.semantic.error} />
                    </View>
                    <Text style={styles.attachText}>Camera</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.attachOption} onPress={handleLocationShare}>
                    <View style={[styles.attachIcon, { backgroundColor: `${Colors.semantic.success}20` }]}>
                      <MapPin size={24} color={Colors.semantic.success} />
                    </View>
                    <Text style={styles.attachText}>Location</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.attachOption} onPress={handleItineraryShare}>
                    <View style={[styles.attachIcon, { backgroundColor: `${Colors.primary.gold}20` }]}>
                      <Calendar size={24} color={Colors.primary.gold} />
                    </View>
                    <Text style={styles.attachText}>Itinerary</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.inputRow}>
                <TouchableOpacity
                  style={styles.attachButton}
                  onPress={() => setShowAttachMenu(!showAttachMenu)}
                >
                  <Paperclip
                    size={24}
                    color={showAttachMenu ? Colors.primary.gold : Colors.neutral.gray400}
                  />
                </TouchableOpacity>
                
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={messageText}
                    onChangeText={(text) => {
                      setMessageText(text);
                      handleTyping();
                    }}
                    placeholder="Message..."
                    placeholderTextColor={Colors.neutral.gray400}
                    multiline
                    maxLength={2000}
                    onSubmitEditing={handleSendMessage}
                  />
                  <TouchableOpacity style={styles.emojiButton}>
                    <Smile size={20} color={Colors.neutral.gray400} />
                  </TouchableOpacity>
                </View>
                
                {messageText.trim() ? (
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSendMessage}
                    disabled={sendMessage.isPending}
                  >
                    <LinearGradient
                      colors={[Colors.primary.gold, Colors.primary.purple]}
                      style={styles.sendGradient}
                    >
                      <Send size={20} color={Colors.neutral.white} />
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.micButton}
                    onLongPress={() => setIsRecording(true)}
                    onPressOut={() => setIsRecording(false)}
                  >
                    <Mic size={24} color={Colors.primary.gold} />
                  </TouchableOpacity>
                )}
              </View>
            </BlurView>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.bodyLarge,
    color: Colors.semantic.error,
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary.gold,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  header: {
    zIndex: 100,
  },
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(26,26,31,0.9)',
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary.gold,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerName: {
    ...Typography.bodyLarge,
    color: Colors.neutral.white,
    fontWeight: '700',
  },
  typingText: {
    ...Typography.bodySmall,
    color: Colors.semantic.success,
  },
  onlineText: {
    ...Typography.bodySmall,
    color: Colors.semantic.success,
  },
  lastSeen: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerAction: {
    padding: Spacing.sm,
  },
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dateBlur: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  dateText: {
    ...Typography.caption,
    color: Colors.neutral.gray400,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
    alignSelf: 'flex-end',
    marginBottom: Spacing.xs,
  },
  avatarPlaceholder: {
    width: 28,
    marginRight: Spacing.xs,
  },
  messageBubble: {
    maxWidth: '100%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  myBubble: {
    backgroundColor: Colors.primary.gold,
    borderBottomRightRadius: BorderRadius.sm,
  },
  theirBubble: {
    backgroundColor: Colors.neutral.gray800,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  myBubbleGrouped: {
    marginRight: 36,
  },
  theirBubbleGrouped: {
    marginLeft: 36,
  },
  replyPreview: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  replyText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  messageText: {
    ...Typography.bodyMedium,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.neutral.white,
  },
  theirMessageText: {
    color: Colors.neutral.white,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  readStatus: {
    marginLeft: 2,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.gray800,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  replyBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyBarLine: {
    width: 4,
    height: 40,
    backgroundColor: Colors.primary.gold,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  replyBarInfo: {
    flex: 1,
  },
  replyBarName: {
    ...Typography.bodySmall,
    color: Colors.primary.gold,
    fontWeight: '700',
    marginBottom: 2,
  },
  replyBarText: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray400,
  },
  replyBarCancel: {
    ...Typography.h3,
    color: Colors.neutral.gray400,
    paddingHorizontal: Spacing.sm,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputBlur: {
    backgroundColor: 'rgba(26,26,31,0.95)',
  },
  attachMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray800,
  },
  attachOption: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  attachIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachText: {
    ...Typography.caption,
    color: Colors.neutral.white,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  attachButton: {
    padding: Spacing.sm,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.gray800,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.neutral.white,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
  },
  emojiButton: {
    padding: Spacing.xs,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  sendGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral.gray800,
    justifyContent: 'center',
    alignItems: 'center',
  },
});