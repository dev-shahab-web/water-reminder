import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  unitLabel: string;
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
  unitLabel,
  value,
  visible,
}: AmountEntryModalProps) {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const horizontalMargin = theme.app.spacing[4];
  const verticalMargin = theme.app.spacing[4];
  const availableHeight = Math.max(280, height - insets.top - insets.bottom - verticalMargin * 2);
  const dialogMaxHeight = Math.floor(availableHeight * 0.9);
  const dialogWidth = Math.min(width - horizontalMargin * 2, 460);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Close amount entry"
          style={styles.scrim}
          onPress={onCancel}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          pointerEvents="box-none"
          style={[
            styles.keyboardAvoiding,
            {
              paddingBottom: insets.bottom + verticalMargin,
              paddingHorizontal: horizontalMargin,
              paddingTop: insets.top + verticalMargin,
            },
          ]}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.app.colors.borderSubtle,
                borderRadius: theme.app.radius.lg,
                maxHeight: dialogMaxHeight,
                width: dialogWidth,
              },
            ]}
          >
            <ScrollView
              bounces={false}
              contentContainerStyle={styles.sheetScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <SectionHeader subtitle={`Enter the amount in ${unitLabel}.`} title={title} />
              <TextInput
                accessibilityLabel={`Water amount in ${unitLabel}`}
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
                <PrimaryButton icon="check" label={saveLabel} onPress={onSave} />
                <SecondaryButton
                  icon="close"
                  label="Cancel"
                  onPress={() => {
                    Keyboard.dismiss();
                    onCancel();
                  }}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  keyboardAvoiding: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    fontWeight: '800',
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalRoot: {
    flex: 1,
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
    overflow: 'hidden',
  },
  sheetScrollContent: {
    gap: 14,
    padding: 18,
  },
  supportingText: {},
});
