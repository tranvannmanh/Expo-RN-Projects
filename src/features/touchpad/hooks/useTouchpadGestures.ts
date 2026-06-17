import { useEffect, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';

import { touchpadSocket } from '../api/touchpadSocket';
import { useTouchpadStore } from '../store/touchpadStore';

// Skip movements smaller than this to avoid sending jitter/noise
const MOVE_THRESHOLD = 0.4;

export function useTouchpadGestures(isConnected: boolean) {
  const sensitivity = useTouchpadStore((s) => s.sensitivity);
  const scrollSensitivity = useTouchpadStore((s) => s.scrollSensitivity);
  const naturalScroll = useTouchpadStore((s) => s.naturalScroll);

  const isConnectedRef = useRef(isConnected);
  const sensitivityRef = useRef(sensitivity);
  const scrollSensitivityRef = useRef(scrollSensitivity);
  const naturalScrollRef = useRef(naturalScroll);

  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);
  useEffect(() => { sensitivityRef.current = sensitivity; }, [sensitivity]);
  useEffect(() => { scrollSensitivityRef.current = scrollSensitivity; }, [scrollSensitivity]);
  useEffect(() => { naturalScrollRef.current = naturalScroll; }, [naturalScroll]);

  const lastCursor = useRef({ x: 0, y: 0 });
  const lastScroll = useRef({ x: 0, y: 0 });

  // Accumulated movement sent in one burst per animation frame
  const pendingMove = useRef({ dx: 0, dy: 0, pending: false });

  useEffect(() => {
    let rafId: ReturnType<typeof requestAnimationFrame>;

    function flush() {
      if (pendingMove.current.pending && isConnectedRef.current) {
        touchpadSocket.send({
          type: 'MOVE',
          dx: pendingMove.current.dx,
          dy: pendingMove.current.dy,
        });
        pendingMove.current = { dx: 0, dy: 0, pending: false };
      }
      rafId = requestAnimationFrame(flush);
    }

    rafId = requestAnimationFrame(flush);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // 1-finger drag → accumulate cursor movement, flush per animation frame
  const cursorGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onStart(() => {
      lastCursor.current = { x: 0, y: 0 };
    })
    .onUpdate((e) => {
      if (!isConnectedRef.current) return;
      const dx = (e.translationX - lastCursor.current.x) * sensitivityRef.current;
      const dy = (e.translationY - lastCursor.current.y) * sensitivityRef.current;
      lastCursor.current = { x: e.translationX, y: e.translationY };

      if (Math.abs(dx) < MOVE_THRESHOLD && Math.abs(dy) < MOVE_THRESHOLD) return;

      pendingMove.current.dx += dx;
      pendingMove.current.dy += dy;
      pendingMove.current.pending = true;
    })
    .runOnJS(true);

  // 2-finger drag → scroll
  const scrollGesture = Gesture.Pan()
    .minPointers(2)
    .maxPointers(2)
    .onStart(() => {
      lastScroll.current = { x: 0, y: 0 };
    })
    .onUpdate((e) => {
      if (!isConnectedRef.current) return;
      const rawDx = (e.translationX - lastScroll.current.x) * scrollSensitivityRef.current;
      const rawDy = (e.translationY - lastScroll.current.y) * scrollSensitivityRef.current;
      lastScroll.current = { x: e.translationX, y: e.translationY };

      if (Math.abs(rawDx) < MOVE_THRESHOLD && Math.abs(rawDy) < MOVE_THRESHOLD) return;

      const direction = naturalScrollRef.current ? 1 : -1;
      touchpadSocket.send({ type: 'SCROLL', dx: rawDx * direction, dy: rawDy * direction });
    })
    .runOnJS(true);

  // 1-finger quick tap → left click
  const leftClickGesture = Gesture.Tap()
    .maxDuration(300)
    .maxDistance(10)
    .onEnd((_, success) => {
      if (!success || !isConnectedRef.current) return;
      touchpadSocket.send({ type: 'LEFT_CLICK' });
    })
    .runOnJS(true);

  // 1-finger double tap → double click
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .maxDistance(10)
    .onEnd((_, success) => {
      if (!success || !isConnectedRef.current) return;
      touchpadSocket.send({ type: 'DOUBLE_CLICK' });
    })
    .runOnJS(true);

  // 1-finger long press (500ms) → right click
  const rightClickGesture = Gesture.LongPress()
    .minDuration(500)
    .maxDistance(10)
    .onStart(() => {
      if (!isConnectedRef.current) return;
      touchpadSocket.send({ type: 'RIGHT_CLICK' });
    })
    .runOnJS(true);

  return Gesture.Simultaneous(
    Gesture.Exclusive(doubleTapGesture, leftClickGesture),
    rightClickGesture,
    scrollGesture,
    cursorGesture,
  );
}
