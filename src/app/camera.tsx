import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermission } from 'react-native-vision-camera';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';
import {
  CameraHeader,
  CameraPanel,
  CameraPermissionView,
  ExposureReadout,
  FilmCameraView,
  LensSelector,
  LongExposureOverlay,
  PERF_TOOLS_ENABLED,
  PerfHud,
  SelfTimerOverlay,
  ShutterBar,
  ViewfinderGrid,
  useCameraStore,
  useFilmCamera,
  useHiddenStatusBar,
} from '@/features/camera';

export default function CameraScreen() {
  const router = useRouter();
  const permission = useCameraPermission();
  const cam = useFilmCamera();
  useHiddenStatusBar();
  const showGrid = useCameraStore((s) => s.showGrid);
  const { exposure } = cam;

  const renderPreview = () => {
    if (!permission.hasPermission) {
      return (
        <CameraPermissionView
          canRequest={permission.canRequestPermission}
          onRequest={permission.requestPermission}
        />
      );
    }
    if (!cam.device || !cam.onFrame) {
      return (
        <View style={styles.placeholder}>
          <ActivityIndicator color={EditorColors.accent} />
        </View>
      );
    }
    return (
      <FilmCameraView
        key={cam.sessionKey}
        aspect={1 / cam.aspect.ratio}
        device={cam.device}
        outputs={cam.outputs}
        onFrame={cam.onFrame}
        isActive={cam.isActive}
        shutterFlashStyle={cam.shutterFlashStyle}
        onController={cam.onController}>
        {showGrid ? <ViewfinderGrid /> : null}
        <LensSelector lenses={cam.lenses} selectedId={cam.lensId} onSelect={cam.selectLens} />
        <ExposureReadout isManual={exposure.isManual} onEditExposure={cam.editExposure} />
        {PERF_TOOLS_ENABLED ? <PerfHud /> : null}
        <LongExposureOverlay />
        <SelfTimerOverlay remaining={cam.timerRemaining} />
      </FilmCameraView>
    );
  };

  return (
    // No top inset: the status bar is hidden, so the header uses that space (the punch-hole
    // camera sits between the left and right header controls).
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <StatusBar style="light" />
      <CameraHeader
        isManual={exposure.isManual}
        flashBlockedReason={cam.flashBlockedReason}
        onClose={() => router.back()}
        onPanel={cam.setPanel}
        onEditExposure={cam.editExposure}
      />
      <View style={styles.preview}>{renderPreview()}</View>
      {cam.error ? (
        <ThemedText type="small" numberOfLines={2} style={styles.error}>
          {cam.error}
        </ThemedText>
      ) : null}
      <CameraPanel
        panel={cam.panel}
        onPanel={cam.setPanel}
        fnItems={cam.fnItems}
        sample={cam.sample}
        mode={exposure.mode}
        canManual={exposure.canManual}
        canBias={exposure.canBias}
        onMode={exposure.setMode}
        exposure={exposure.exposure}
        options={exposure.options}
        onExposure={exposure.setExposure}
      />
      <ShutterBar
        lastShot={cam.lastShot}
        isCapturing={cam.isCapturing}
        isSaving={cam.isSaving}
        disabled={!permission.hasPermission || !cam.device}
        fnActive={cam.panel !== 'film'}
        onFn={cam.toggleFn}
        onShoot={cam.shoot}
        onOpenLastShot={cam.openLastShot}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: EditorColors.background,
  },
  preview: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: EditorColors.danger,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
});
