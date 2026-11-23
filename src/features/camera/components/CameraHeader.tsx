import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { EditorColors, Motion, Radius, Spacing } from '@/constants/theme';
import { EditorLayout, IconButton } from '@/features/photo-editor';

import {
	CAPTURE_MODES,
	FLASH_ICONS,
	HEADER_NOTICE_MS,
	PERF_TOOLS_ENABLED,
	SELF_TIMER_ICONS,
	formatSelfTimer,
} from '../constants/camera.constants';
import { useIsLandscape } from '../hooks/useDeviceRotation';
import { useExposureDisplay } from '../hooks/useExposureDisplay';
import { shutterIsoInHeader, useHeaderCutout } from '../hooks/useHeaderCutout';
import { activeParams } from '../lib/exposure';
import { useCameraStore } from '../store/camera.store';
import type { CameraPanel, ExposureParam } from '../types/camera.types';
import { ExposureValueButton } from './ExposureValueButton';

type CameraHeaderProps = {
	/** The lens really runs S / M manually (false on lenses without manual control). */
	isManual: boolean;
	/** Why flash can't be used right now (shown on tap), or null when it can. */
	flashBlockedReason: string | null;
	onClose: () => void;
	onPanel: (panel: CameraPanel) => void;
	/** Opens the SS / ISO dial (switching mode first when needed). */
	onEditExposure: (param: ExposureParam) => void;
};

type QuickSetting = { param: 'shutter' | 'iso'; text: string };

const MODE_FONT_SIZE = 30;

/**
 * Close on the left; flash (tap cycles off / auto / on), self-timer and the shooting mode
 * as a large letter on the right, like Sony.
 * Held sideways, SS and ISO follow the close button as buttons that open their dials
 * (switching to S / M first when the current mode sets them automatically).
 */
export function CameraHeader({
	isManual,
	flashBlockedReason,
	onClose,
	onPanel,
	onEditExposure,
}: CameraHeaderProps) {
	const mode = useCameraStore((s) => s.mode);
	const togglePerfHud = useCameraStore((s) => s.togglePerfHud);
	const flashMode = useCameraStore((s) => s.flashMode);
	const cycleFlash = useCameraStore((s) => s.cycleFlash);
	const selfTimer = useCameraStore((s) => s.selfTimer);
	const cycleSelfTimer = useCameraStore((s) => s.cycleSelfTimer);
	const display = useExposureDisplay();
	const label = CAPTURE_MODES.find((m) => m.id === mode)?.label ?? '';
	const isLandscape = useIsLandscape();
	const params = activeParams(mode, isManual);
	const cutout = useHeaderCutout();
	// Next to a punch-hole, the header has no room for SS / ISO: they drop just below it.
	const showShutterIso = shutterIsoInHeader(isLandscape, cutout);
	const headerStyle = useAnimatedStyle(() => ({
		marginTop: cutout.kind === 'below' ? cutout.offset : 0,
	}));
	const leftStyle = useAnimatedStyle(() => ({
		width: cutout.kind === 'split' ? cutout.left : 'auto',
	}));
	const gapStyle = useAnimatedStyle(() => ({
		width: cutout.kind === 'split' ? cutout.gap : 0,
	}));
	const hasFlash = flashBlockedReason === null;
	const [notice, setNotice] = useState<string | null>(null);

	useEffect(() => {
		if (!notice) return;
		const id = setTimeout(() => setNotice(null), HEADER_NOTICE_MS);
		return () => clearTimeout(id);
	}, [notice]);

	// A greyed-out flash still answers a tap, explaining why it is off.
	const onFlash = () =>
		flashBlockedReason ? setNotice(flashBlockedReason) : cycleFlash();

	const quick: QuickSetting[] = [
		// Formatted values already carry their "SS" / "ISO" prefix.
		{ param: 'shutter', text: display.shutter },
		{ param: 'iso', text: display.iso },
	];

	return (
		<Animated.View style={[styles.header, headerStyle]}>
			{/* Two groups around the punch-hole (if any): close, SS / ISO, flash | timer, mode. */}
			<Animated.View style={[styles.side, leftStyle]}>
				<IconButton icon="close" onPress={onClose} />
				{/* Held sideways, SS / ISO follow the close button (when the header spans the full width). */}
				{showShutterIso
					? quick.map((q) => (
							<ExposureValueButton
								key={q.param}
								param={q.param}
								text={q.text}
								editable={params.includes(q.param)}
								variant="header"
								onEdit={onEditExposure}
							/>
						))
					: null}
				<Pressable
					hitSlop={Spacing.two}
					onPress={onFlash}
					accessibilityRole="button"
					accessibilityLabel={`Flash ${hasFlash ? flashMode : 'off'}`}
					accessibilityHint={flashBlockedReason ?? undefined}
					style={({ pressed }) => [
						styles.icon,
						!hasFlash && styles.dimmed,
						pressed && styles.pressed,
					]}
				>
					<SymbolView
						name={{
							android: FLASH_ICONS[hasFlash ? flashMode : 'off'],
							ios: 'bolt',
						}}
						size={EditorLayout.iconSize}
						tintColor={EditorColors.text}
					/>
				</Pressable>
			</Animated.View>
			{cutout.kind === 'split' ? <Animated.View style={gapStyle} /> : null}
			<View style={[styles.side, styles.sideEnd]}>
				<Pressable
					hitSlop={Spacing.two}
					onPress={cycleSelfTimer}
					accessibilityRole="button"
					accessibilityLabel={
						selfTimer ? `Hẹn giờ ${selfTimer} giây` : 'Hẹn giờ tắt'
					}
					style={({ pressed }) => [styles.timer, pressed && styles.pressed]}
				>
					<SymbolView
						name={{ android: SELF_TIMER_ICONS[selfTimer], ios: 'timer' }}
						size={EditorLayout.iconSize}
						tintColor={EditorColors.text}
					/>
					{selfTimer ? (
						<ThemedText type="smallBold" style={styles.timerText}>
							{formatSelfTimer(selfTimer)}
						</ThemedText>
					) : null}
				</Pressable>
				<Pressable
					hitSlop={Spacing.two}
					onPress={() => onPanel('mode')}
					onLongPress={PERF_TOOLS_ENABLED ? togglePerfHud : undefined}
					style={({ pressed }) => [styles.mode, pressed && styles.pressed]}
				>
					<ThemedText style={styles.modeText}>{label}</ThemedText>
				</Pressable>
			</View>
			{notice ? (
				<View style={styles.notice} pointerEvents="none">
					<ThemedText type="small" style={styles.noticeText}>
						{notice}
					</ThemedText>
				</View>
			) : null}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	header: {
		zIndex: 1,
		height: EditorLayout.headerHeight,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: Spacing.two,
	},
	side: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.two,
	},
	sideEnd: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	icon: {
		padding: Spacing.one,
	},
	dimmed: {
		opacity: Motion.disabledOpacity,
	},
	notice: {
		position: 'absolute',
		top: EditorLayout.headerHeight,
		left: Spacing.three,
		right: Spacing.three,
		zIndex: 1,
		alignItems: 'center',
	},
	noticeText: {
		color: EditorColors.text,
		textAlign: 'center',
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.two,
		borderRadius: Radius.medium,
		overflow: 'hidden',
		backgroundColor: EditorColors.surface,
	},
	timer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.half,
		padding: Spacing.one,
	},
	timerText: {
		color: EditorColors.text,
	},
	mode: {
		paddingHorizontal: Spacing.two,
		paddingRight: Spacing.three,
	},
	modeText: {
		color: EditorColors.text,
		fontSize: MODE_FONT_SIZE,
		lineHeight: MODE_FONT_SIZE + Spacing.one,
		fontWeight: '600',
	},
	pressed: {
		opacity: Motion.pressedOpacity,
	},
});
