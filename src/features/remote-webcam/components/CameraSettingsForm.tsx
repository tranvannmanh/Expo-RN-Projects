import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import type { CameraFacing, ResolutionPreset } from '../types/remote-webcam.types';

type CameraSettingsFormProps = {
	facing: CameraFacing;
	resolution: ResolutionPreset;
	disabled: boolean;
	onFacingChange: (facing: CameraFacing) => void;
	onResolutionChange: (resolution: ResolutionPreset) => void;
};

const FACING_OPTIONS: { value: CameraFacing; label: string }[] = [
	{ value: 'environment', label: 'Camera sau' },
	{ value: 'user', label: 'Camera trước' },
];

const RESOLUTION_OPTIONS: ResolutionPreset[] = ['480p', '720p', '1080p'];

export const CameraSettingsForm = ({
	facing,
	resolution,
	disabled,
	onFacingChange,
	onResolutionChange,
}: CameraSettingsFormProps) => {
	return (
		<ThemedView style={styles.container}>
			<ThemedView style={styles.row}>
				{FACING_OPTIONS.map((option) => (
					<Pressable
						key={option.value}
						disabled={disabled}
						onPress={() => onFacingChange(option.value)}
						style={disabled ? styles.optionDisabled : undefined}
					>
						<ThemedView type={option.value === facing ? 'backgroundSelected' : 'backgroundElement'} style={styles.option}>
							<ThemedText type="small">{option.label}</ThemedText>
						</ThemedView>
					</Pressable>
				))}
			</ThemedView>
			<ThemedView style={styles.row}>
				{RESOLUTION_OPTIONS.map((option) => (
					<Pressable
						key={option}
						disabled={disabled}
						onPress={() => onResolutionChange(option)}
						style={disabled ? styles.optionDisabled : undefined}
					>
						<ThemedView type={option === resolution ? 'backgroundSelected' : 'backgroundElement'} style={styles.option}>
							<ThemedText type="small">{option}</ThemedText>
						</ThemedView>
					</Pressable>
				))}
			</ThemedView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: Spacing.three,
		gap: Spacing.two,
	},
	row: {
		flexDirection: 'row',
		gap: Spacing.two,
	},
	option: {
		paddingHorizontal: Spacing.three,
		paddingVertical: Spacing.two,
		borderRadius: Spacing.two,
	},
	optionDisabled: {
		opacity: 0.5,
	},
});
