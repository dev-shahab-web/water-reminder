import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from 'react-native-paper';

import { PrimaryButton, SecondaryButton, SectionHeader } from '@shared/components';
import type { AppTheme } from '@shared/theme';

type AmountEntryModalProps = {
  errorMessage?: string;
  guidanceMessage?: string;
  onCancel: () => void;
  onChangeAmount: (amount: string) => void;
  onSave: () => void;
  saveLabel: string;
  title: string;
  value: string;
  visible: boolean;
};

export function AmountEntryModal({
  errorMessage,
  guidanceMessage,
  onCancel,
  onChangeAmount,
  onSave,
  saveLabel,
  title,
  value,
  visible,
}: AmountEntryModalProps) {
  const theme = useTheme<AppTheme>();

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityLabel="Close amount entry"
          style={styles.scrim}
          onPress={onCancel}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.app.colors.borderSubtle,
              borderRadius: theme.app.radius.lg,
            },
          ]}
        >
          <SectionHeader subtitle="Enter the amount in milliliters." title={title} />
          <TextInput
            accessibilityLabel="Water amount in milliliters"
            keyboardType="number-pad"
            onChangeText={onChangeAmount}
            onSubmitEditing={onSave}
            placeholder="250"
            placeholderTextColor={theme.app.colors.textSecondary}
            returnKeyType="done"
            selectTextOnFocus
            style={[
              styles.input,
              {
                borderColor:
                  errorMessage === undefined
                    ? theme.app.colors.borderSubtle
                    : theme.app.colors.statusError,
                borderRadius: theme.app.radius.md,
                color: theme.app.colors.textPrimary,
                fontSize: theme.app.typography.fontSize.title,
                lineHeight: theme.app.typography.lineHeight.title,
              },
            ]}
            value={value}
          />
          {errorMessage === undefined ? null : (
            <Text
              accessibilityRole="alert"
              style={[
                styles.supportingText,
                {
                  color: theme.app.colors.statusError,
                  fontSize: theme.app.typography.fontSize.caption,
                  lineHeight: theme.app.typography.lineHeight.caption,
                },
              ]}
            >
              {errorMessage}
            </Text>
          )}
          {guidanceMessage === undefined ? null : (
            <Text
              style={[
                styles.supportingText,
                {
                  color: theme.app.colors.textSecondary,
                  fontSize: theme.app.typography.fontSize.caption,
                  lineHeight: theme.app.typography.lineHeight.caption,
                },
              ]}
            >
              {guidanceMessage}
            </Text>
          )}
          <View style={styles.actions}>
            <PrimaryButton label={saveLabel} onPress={onSave} />
            <SecondaryButton label="Cancel" onPress={onCancel} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  backdrop: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  input: {
    borderWidth: 1,
    fontWeight: '800',
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrim: {
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    borderWidth: 1,
    gap: 18,
    margin: 16,
    maxWidth: 520,
    padding: 20,
    width: '100%',
  },
  supportingText: {},
});
