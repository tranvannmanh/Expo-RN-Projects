import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Whether the app is in the foreground, plus a counter bumped on every return.
 * The camera must be released in the background (the OS revokes it anyway) and
 * rebuilt on return, otherwise the viewfinder keeps showing its last frame.
 */
export function useAppActive() {
  const [isActive, setIsActive] = useState(AppState.currentState === 'active');
  const [resumeCount, setResumeCount] = useState(0);
  const wasActive = useRef(isActive);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      const active = state === 'active';
      if (active && !wasActive.current) setResumeCount((n) => n + 1);
      wasActive.current = active;
      setIsActive(active);
    };
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, []);

  return { isActive, resumeCount };
}
