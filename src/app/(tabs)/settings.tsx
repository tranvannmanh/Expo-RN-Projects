import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { type ChipOption, OptionChips } from '@/features/pdf-tools/components/OptionChips';
import { type ThemePreference, useAppearanceStore } from '@/shared/appearance/appearance.store';
import { deviceLanguage, type LanguagePreference, useLocaleStore, useT } from '@/shared/i18n';

const SCREEN_PADDING = Spacing.four;

export default function SettingsScreen() {
  const t = useT();
  const language = useLocaleStore((state) => state.preference);
  const setLanguage = useLocaleStore((state) => state.setPreference);
  const theme = useAppearanceStore((state) => state.preference);
  const setTheme = useAppearanceStore((state) => state.setPreference);
  const systemName = deviceLanguage() === 'vi' ? t.settings.vietnamese : t.settings.english;

  const languages: ChipOption<LanguagePreference>[] = [
    { value: 'system', label: t.settings.system, description: t.settings.systemDescription(systemName) },
    // Each language is labelled in its own language so it can be found from either one.
    { value: 'vi', label: t.settings.vietnamese, description: 'Vietnamese' },
    { value: 'en', label: t.settings.english, description: 'Tiếng Anh' },
  ];
  const themes: ChipOption<ThemePreference>[] = [
    { value: 'system', label: t.settings.themeSystem, description: t.settings.themeSystemDescription },
    { value: 'light', label: t.settings.themeLight },
    { value: 'dark', label: t.settings.themeDark },
  ];

  return (
    <ThemedView style={styles.root}>
      {/* The tab bar handles the bottom inset. */}
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">{t.nav.settings}</ThemedText>
          <OptionChips label={t.settings.appearance} options={themes} value={theme} onChange={setTheme} />
          <OptionChips
            label={t.settings.language}
            options={languages}
            value={language}
            onChange={setLanguage}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {t.settings.languageHint}
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
  },
});
