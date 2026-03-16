// components/VideoPlayer.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  GestureResponderEvent,
  Animated,
} from 'react-native';
import { Video, ResizeMode, VideoReadyForDisplayEvent } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useHaptics } from '@/hooks/use-haptics';
import { Colors, BorderRadius } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface VideoPlayerProps {
  uri: string;
  thumbnailUri?: string;
  style?: any;
  thumbnailStyle?: any;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  showControls?: boolean;
  onLoadStart?: () => void;
  onLoad?: (status: any) => void;
  onError?: (error: any) => void;
  onProgress?: (progress: number) => void;
  onEnd?: () => void;
  onDoubleTap?: () => void;
  resizeMode?: ResizeMode;
  posterSource?: any;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  uri,
  thumbnailUri,
  style,
  thumbnailStyle,
  autoPlay = false,
  loop = true,
  muted = false,
  showControls = true,
  onLoadStart,
  onLoad,
  onError,
  onProgress,
  onEnd,
  onDoubleTap,
  resizeMode = ResizeMode.COVER,
  posterSource,
}) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(muted);
  const [showPlayButton, setShowPlayButton] = useState(!autoPlay);
  const [error, setError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { lightImpact, mediumImpact } = useHaptics();
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls
  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 3000);
  }, [controlsOpacity]);

  const showControlsTemporarily = useCallback(() => {
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    scheduleHideControls();
  }, [controlsOpacity, scheduleHideControls]);

  // Playback controls
  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    
    lightImpact();
    
    if (status?.isPlaying) {
      await videoRef.current.pauseAsync();
      setShowPlayButton(true);
    } else {
      await videoRef.current.playAsync();
      setShowPlayButton(false);
      showControlsTemporarily();
    }
  }, [status, lightImpact, showControlsTemporarily]);

  const toggleMute = useCallback(async () => {
    if (!videoRef.current) return;
    
    lightImpact();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    await videoRef.current.setIsMutedAsync(newMuted);
  }, [isMuted, lightImpact]);

  const seekTo = useCallback(async (positionMillis: number) => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(positionMillis);
  }, []);

  // Double tap gesture for like
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(mediumImpact)();
      runOnJS(onDoubleTap)?.();
    });

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(togglePlayPause)();
    });

  const composedGesture = Gesture.Exclusive(doubleTapGesture, singleTapGesture);

  // Video event handlers
  const handlePlaybackStatusUpdate = useCallback((newStatus: any) => {
    setStatus(newStatus);
    
    if (newStatus.isLoaded) {
      setIsLoading(false);
      setIsBuffering(newStatus.isBuffering);
      
      if (newStatus.positionMillis && newStatus.durationMillis) {
        const newProgress = newStatus.positionMillis / newStatus.durationMillis;
        setProgress(newProgress);
        onProgress?.(newProgress);
      }
      
      if (newStatus.didJustFinish) {
        onEnd?.();
        if (loop) {
          videoRef.current?.replayAsync();
        }
      }
    }
    
    if (newStatus.error) {
      setError('Failed to load video');
      onError?.(newStatus.error);
    }
  }, [loop, onProgress, onEnd, onError]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleReadyForDisplay = useCallback((event: VideoReadyForDisplayEvent) => {
    setIsLoading(false);
    onLoad?.(event);
  }, [onLoad]);

  // Auto-play on mount
  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.playAsync();
      setShowPlayButton(false);
      showControlsTemporarily();
    }
    
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
      videoRef.current?.unloadAsync();
    };
  }, [autoPlay, showControlsTemporarily]);

  // Handle mute prop changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setIsMutedAsync(muted);
      setIsMuted(muted);
    }
  }, [muted]);

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Ionicons name="alert-circle" size={48} color={Colors.semantic.error} />
      </View>
    );
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={[styles.container, style]}>
        <Video
          ref={videoRef}
          source={{ uri }}
          style={[styles.video, thumbnailStyle]}
          resizeMode={resizeMode}
          isLooping={loop}
          isMuted={isMuted}
          shouldPlay={autoPlay}
          posterSource={posterSource || { uri: thumbnailUri }}
          usePoster={!!thumbnailUri}
          posterStyle={styles.poster}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onLoadStart={handleLoadStart}
          onReadyForDisplay={handleReadyForDisplay}
          onError={(e: any) => {
            setError(e.message || 'Video error');
            onError?.(e);
          }}
          useNativeControls={false}
          bufferOptions={{
            minBufferMs: 15000,
            maxBufferMs: 50000,
            bufferForPlaybackMs: 2500,
            bufferForPlaybackAfterRebufferMs: 5000,
          }}
        />

        {/* Loading indicator */}
        {(isLoading || isBuffering) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary.gold} />
          </View>
        )}

        {/* Play/Pause button overlay */}
        {showPlayButton && !isLoading && (
          <TouchableOpacity
            style={styles.playButtonOverlay}
            onPress={togglePlayPause}
            activeOpacity={0.8}
          >
            <View style={styles.playButton}>
              <Ionicons name="play" size={32} color={Colors.neutral.white} />
            </View>
          </TouchableOpacity>
        )}

        {/* Controls overlay */}
        {showControls && !isLoading && (
          <Animated.View
            style={[
              styles.controlsOverlay,
              { opacity: controlsOpacity },
            ]}
            pointerEvents="box-none"
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.controlsGradient}
            >
              {/* Bottom controls */}
              <View style={styles.bottomControls}>
                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progress * 100}%` },
                      ]}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.muteButton}
                    onPress={toggleMute}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={isMuted ? 'volume-mute' : 'volume-medium'}
                      size={24}
                      color={Colors.neutral.white}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Double tap heart animation */}
        {/* Implementation would include animated heart that appears on double tap */}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral.black,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  poster: {
    resizeMode: 'cover',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(201,169,110,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  controlsGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bottomControls: {
    width: '100%',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.gold,
    borderRadius: 1.5,
  },
  muteButton: {
    padding: 4,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral.gray800,
  },
});