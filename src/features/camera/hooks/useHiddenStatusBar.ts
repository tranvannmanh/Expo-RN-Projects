import { useFocusEffect } from 'expo-router';
import { setStatusBarHidden } from 'expo-status-bar';
import { useCallback } from 'react';

/**
 * Full-screen camera: hides the status bar while the screen is focused and
 * brings it back on leave (a `hidden` prop alone stays hidden on the next screen).
 */
export function useHiddenStatusBar() {
  useFocusEffect(
    useCallback(() => {
      setStatusBarHidden(true, 'fade');
      return () => setStatusBarHidden(false, 'fade');
    }, []),
  );
}
