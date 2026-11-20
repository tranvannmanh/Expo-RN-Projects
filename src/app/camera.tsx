import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermission } from 'react-native-vision-camera';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Spacing } from '@/constants/theme';
import {
	CameraFilmPicker,
	CameraHeader,
	CameraLayout,
	CameraModeBar,
	CameraPermissionView,
	ExposureBar,
	ExposureReadout,
	ExposureValuePicker,
	FilmCameraView,
	LensSelector,
	ShutterBar,
	useFilmCamera,
} from '@/features/camera';

export default function CameraScreen() {
	const router = useRouter();
	const permission = useCameraPermission();
	const cam = useFilmCamera();
	const { exposure, activeParam } = cam;

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
				device={cam.device}
				outputs={cam.outputs}
				onFrame={cam.onFrame}
				isActive={cam.isActive}
				shutterFlashStyle={cam.shutterFlashStyle}
				onController={cam.onController}
			>
				<ExposureReadout />
				<LensSelector
					lenses={cam.lenses}
					selectedId={cam.lensId}
					onSelect={cam.selectLens}
				/>
			</FilmCameraView>
		);
	};

	return (
		<SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
			<StatusBar style="light" />
			<CameraHeader hasFlash={cam.hasFlash} onClose={() => router.back()} />
			<View style={styles.preview}>{renderPreview()}</View>
			{cam.error ? (
				<ThemedText type="small" numberOfLines={2} style={styles.error}>
					{cam.error}
				</ThemedText>
			) : null}
			<View style={styles.controls}>
				<CameraModeBar
					mode={exposure.mode}
					canManual={exposure.canManual}
					canBias={exposure.canBias}
					onChange={exposure.setMode}
				/>
				<ExposureBar
					mode={exposure.mode}
					exposure={exposure.exposure}
					activeParam={activeParam}
					onToggleParam={cam.toggleParam}
					onRemeter={exposure.remeter}
				/>
				<View style={styles.picker}>
					{activeParam ? (
						<ExposureValuePicker
							param={activeParam}
							values={exposure.options[activeParam]}
							value={exposure.exposure[activeParam]}
							onChange={(value) =>
								exposure.setExposure({ [activeParam]: value })
							}
						/>
					) : (
						<CameraFilmPicker sample={cam.sample} />
					)}
				</View>
				<ShutterBar
					lastShot={cam.lastShot}
					isCapturing={cam.isCapturing}
					disabled={!permission.hasPermission || !cam.device}
					onShoot={cam.shoot}
					onOpenLastShot={cam.openLastShot}
				/>
			</View>
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
	controls: {
		gap: Spacing.two,
		paddingTop: Spacing.two,
	},
	picker: {
		height: CameraLayout.pickerHeight,
		justifyContent: 'center',
		// backgroundColor: 'pink',
	},
});
