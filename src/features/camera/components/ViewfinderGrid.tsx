import { StyleSheet, View } from 'react-native';

import { EditorColors } from '@/constants/theme';

import { CameraLayout } from '../constants/camera.constants';

/** Rule-of-thirds guide over the viewfinder. */
export function ViewfinderGrid() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.line, styles.v1]} />
      <View style={[styles.line, styles.v2]} />
      <View style={[styles.line, styles.h1]} />
      <View style={[styles.line, styles.h2]} />
    </View>
  );
}

const W = CameraLayout.gridLineWidth;

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    backgroundColor: EditorColors.grid,
  },
  v1: { left: '33.33%', top: 0, bottom: 0, width: W },
  v2: { left: '66.66%', top: 0, bottom: 0, width: W },
  h1: { top: '33.33%', left: 0, right: 0, height: W },
  h2: { top: '66.66%', left: 0, right: 0, height: W },
});
