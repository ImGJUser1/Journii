// hooks/use-haptics.ts
import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export const useHaptics = () => {
  const lightImpact = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available on this device
    }
  }, []);

  const mediumImpact = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics not available on this device
    }
  }, []);

  const heavyImpact = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      // Haptics not available on this device
    }
  }, []);

  const success = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Haptics not available on this device
    }
  }, []);

  const error = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      // Haptics not available on this device
    }
  }, []);

  const warning = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      // Haptics not available on this device
    }
  }, []);

  return {
    lightImpact,
    mediumImpact,
    heavyImpact,
    success,
    error,
    warning,
  };
};