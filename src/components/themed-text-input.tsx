import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { APP_FONT_FAMILY, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextInputProps = TextInputProps & {
  invalid?: boolean;
};

export function ThemedTextInput({ style, invalid, ...rest }: ThemedTextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      selectionColor={theme.primary}
      cursorColor={theme.primary}
      style={[
        styles.input,
        {
          color: theme.text,
          backgroundColor: theme.backgroundElement,
          borderColor: invalid ? theme.danger : theme.backgroundSelected,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // Same metrics as ThemedText "default" so inputs align with body text.
  input: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 16,
    lineHeight: 24,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
