import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { APP_VERSION } from '@/constants/app-info';
import {
	Colors,
	MaxContentWidth,
	Motion,
	Radius,
	Spacing,
} from '@/constants/theme';
import { useEditorStore, usePickPhoto } from '@/features/photo-editor';
import { useColorScheme } from '@/hooks/use-color-scheme';

const APP_ICON = require('@/assets/images/icon.png');
const HERO_ICON_SIZE = 144;
const BUTTON_ICON_SIZE = 22;

export default function StudioScreen() {
	const router = useRouter();
	const picker = usePickPhoto();
	const hasPhoto = useEditorStore((s) => s.photo !== null);
	const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
	const tone = toneStyles[scheme];
	const accentText = Colors[scheme].accentText;
	const textColor = Colors[scheme].text;

	return (
		<ThemedView style={styles.container}>
			<SafeAreaView style={styles.safeArea}>
				<ThemedView style={styles.hero}>
					<Image
						source={APP_ICON}
						style={[styles.heroIcon, tone.heroIcon]}
						contentFit="cover"
					/>
					<ThemedText type="subtitle">Film-Photo Pro</ThemedText>
					{/* <ThemedText themeColor="textSecondary" style={styles.centerText}>
						Giả lập màu phim, chỉnh sáng/tối, curve, cắt xoay — xử lý trực tiếp
						trên GPU.
					</ThemedText> */}
				</ThemedView>

				<Pressable
					onPress={() => picker.mutate()}
					disabled={picker.isPending}
					style={({ pressed }) => [
						styles.primary,
						tone.primary,
						pressed && styles.pressed,
					]}
				>
					{picker.isPending ? (
						<ActivityIndicator color={accentText} />
					) : (
						<>
							<SymbolView
								name={{
									ios: 'photo',
									android: 'add_photo_alternate',
									web: 'add_photo_alternate',
								}}
								size={BUTTON_ICON_SIZE}
								tintColor={accentText}
							/>
							<ThemedText type="smallBold" style={tone.primaryText}>
								Chọn ảnh để chỉnh
							</ThemedText>
						</>
					)}
				</Pressable>

				<Pressable
					onPress={() => router.push('/camera')}
					style={({ pressed }) => [
						styles.primary,
						styles.outline,
						tone.outline,
						pressed && styles.pressed,
					]}
				>
					<SymbolView
						name={{
							ios: 'camera',
							android: 'photo_camera',
							web: 'photo_camera',
						}}
						size={BUTTON_ICON_SIZE}
						tintColor={textColor}
					/>
					<ThemedText type="smallBold">Chụp ảnh với màu phim</ThemedText>
				</Pressable>

				{hasPhoto ? (
					<Pressable
						onPress={() => router.push('/editor')}
						style={({ pressed }) => [
							styles.secondary,
							pressed && styles.pressed,
						]}
					>
						<ThemedText type="small">Tiếp tục ảnh đang chỉnh</ThemedText>
					</Pressable>
				) : null}

				{picker.error ? (
					<ThemedText
						type="small"
						themeColor="danger"
						style={styles.centerText}
					>
						{picker.error.message}
					</ThemedText>
				) : null}

				<ThemedText
					type="small"
					themeColor="textSecondary"
					style={styles.version}
				>
					{`Phiên bản ${APP_VERSION}`}
				</ThemedText>
			</SafeAreaView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	version: {
		textAlign: 'center',
		opacity: Motion.disabledOpacity,
	},
	container: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
	},
	safeArea: {
		flex: 1,
		maxWidth: MaxContentWidth,
		paddingHorizontal: Spacing.four,
		paddingBottom: Spacing.four,
		gap: Spacing.three,
	},
	hero: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: Spacing.three,
	},
	heroIcon: {
		width: HERO_ICON_SIZE,
		height: HERO_ICON_SIZE,
		borderRadius: Radius.large * 2,
		borderWidth: StyleSheet.hairlineWidth * 3,
	},
	centerText: {
		textAlign: 'center',
	},
	primary: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: Spacing.two,
		paddingVertical: Spacing.three,
		borderRadius: Radius.medium,
	},
	outline: {
		borderWidth: StyleSheet.hairlineWidth * 3,
	},
	secondary: {
		alignItems: 'center',
		paddingVertical: Spacing.three,
	},
	pressed: {
		opacity: Motion.pressedOpacity,
	},
});

function makeToneStyles(colors: (typeof Colors)['light' | 'dark']) {
	return StyleSheet.create({
		heroIcon: { borderColor: colors.border },
		primary: { backgroundColor: colors.accent },
		primaryText: { color: colors.accentText },
		outline: { borderColor: colors.text },
	});
}

const toneStyles = {
	light: makeToneStyles(Colors.light),
	dark: makeToneStyles(Colors.dark),
};
