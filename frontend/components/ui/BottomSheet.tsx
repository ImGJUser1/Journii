// components/ui/BottomSheet.tsx
import React, { useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { X } from 'lucide-react-native';

import { Colors, Spacing, BorderRadius } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnapPoint?: number;
  enablePanDownToClose?: boolean;
  enableBackdrop?: boolean;
  backdropOpacity?: number;
  handleComponent?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isVisible,
  onClose,
  children,
  snapPoints = [0.25, 0.5, 0.75],
  initialSnapPoint = 0,
  enablePanDownToClose = true,
  enableBackdrop = true,
  backdropOpacity = 0.5,
  handleComponent,
}) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const activeIndex = useSharedValue(initialSnapPoint);

  const snapToPoint = useCallback((index: number) => {
    const point = SCREEN_HEIGHT * (1 - snapPoints[index]);
    translateY.value = withSpring(point, {
      damping: 50,
      stiffness: 400,
    });
    activeIndex.value = index;
  }, [snapPoints, translateY, activeIndex]);

  useEffect(() => {
    if (isVisible) {
      snapToPoint(initialSnapPoint);
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT);
    }
  }, [isVisible, initialSnapPoint, snapToPoint, translateY]);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      const newTranslateY = translateY.value + event.translationY;
      if (newTranslateY > 0) {
        translateY.value = newTranslateY;
      }
    })
    .onEnd((event) => {
      const velocity = event.velocityY;
      const currentTranslateY = translateY.value;
      const currentPosition = 1 - currentTranslateY / SCREEN_HEIGHT;
      
      // Determine closest snap point
      let closestIndex = 0;
      let closestDistance = Math.abs(snapPoints[0] - currentPosition);
      
      for (let i = 1; i < snapPoints.length; i++) {
        const distance = Math.abs(snapPoints[i] - currentPosition);
        if (distance < closestDistance) {
          closestIndex = i;
          closestDistance = distance;
        }
      }
      
      // Close if swiped down fast or below threshold
      if (enablePanDownToClose && (velocity > 500 || currentPosition < 0.1)) {
        runOnJS(onClose)();
        translateY.value = withSpring(SCREEN_HEIGHT);
      } else {
        runOnJS(snapToPoint)(closestIndex);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleClose = () => {
    translateY.value = withSpring(SCREEN_HEIGHT);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      {enableBackdrop && (
        <TouchableOpacity
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          onPress={handleClose}
          activeOpacity={1}
        >
          <BlurView intensity={20} style={styles.backdropBlur} />
        </TouchableOpacity>
      )}

      {/* Sheet */}
      <GestureDetector gesture={gesture}>
        <MotiView
          from={{ translateY: SCREEN_HEIGHT }}
          animate={{ translateY: SCREEN_HEIGHT * (1 - snapPoints[initialSnapPoint]) }}
          transition={{ type: 'spring', damping: 50, stiffness: 400 }}
          style={[styles.sheet, animatedStyle]}
        >
          <BlurView intensity={80} style={styles.sheetContent}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              {handleComponent || (
                <>
                  <View style={styles.handle} />
                  <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <X size={20} color={Colors.neutral.gray400} />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Content */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.content}
            >
              {children}
            </KeyboardAvoidingView>
          </BlurView>
        </MotiView>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.neutral.black,
  },
  backdropBlur: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  sheetContent: {
    flex: 1,
    backgroundColor: 'rgba(26,26,31,0.95)',
  },
  handleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    position: 'relative',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral.gray600,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.md,
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
  },
});