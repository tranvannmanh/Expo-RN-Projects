import { useState } from 'react';
import { KeyboardAvoidingView, Modal, StyleSheet } from 'react-native';

import { ThemedPressable } from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

import { MAX_NAME_LENGTH } from '../services/document.service';

type RenameDocumentDialogProps = {
  visible: boolean;
  initialName: string;
  saving: boolean;
  onCancel: () => void;
  onSave: (name: string) => void;
};

export function RenameDocumentDialog(props: RenameDocumentDialogProps) {
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={props.onCancel}>
      {props.visible && <DialogBody {...props} />}
    </Modal>
  );
}

function DialogBody({ initialName, saving, onCancel, onSave }: RenameDocumentDialogProps) {
  const [name, setName] = useState(initialName);
  const isEmpty = name.trim().length === 0;

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.backdrop}>
      <ThemedView type="scrim" style={[StyleSheet.absoluteFill, styles.scrim]} />
      <ThemedView style={styles.dialog}>
        <ThemedText type="smallBold">Rename document</ThemedText>
        <ThemedTextInput
          value={name}
          onChangeText={setName}
          autoFocus
          selectTextOnFocus
          maxLength={MAX_NAME_LENGTH}
          invalid={isEmpty}
          returnKeyType="done"
          onSubmitEditing={() => !isEmpty && onSave(name)}
          accessibilityLabel="Document name"
        />
        <ThemedView style={styles.actions}>
          <ThemedPressable type="background" accessibilityRole="button" onPress={onCancel} style={styles.button}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Cancel
            </ThemedText>
          </ThemedPressable>
          <ThemedPressable
            type="primary"
            pressedType="primaryPressed"
            accessibilityRole="button"
            disabled={isEmpty || saving}
            onPress={() => onSave(name)}
            style={styles.button}>
            <ThemedText type="smallBold" themeColor="onPrimary">
              {saving ? 'Saving…' : 'Save'}
            </ThemedText>
          </ThemedPressable>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const DIALOG_MAX_WIDTH = 420;
/** Dims the screen behind the dialog without hiding it. */
const BACKDROP_OPACITY = 0.5;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  scrim: {
    opacity: BACKDROP_OPACITY,
  },
  dialog: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    width: '100%',
    maxWidth: DIALOG_MAX_WIDTH,
    alignSelf: 'center',
    elevation: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
