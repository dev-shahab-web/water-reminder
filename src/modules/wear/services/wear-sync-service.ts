import { writeWearConfiguration } from '@platform/wear/wear-native-module';
import { appDarkTheme } from '@shared/theme';
import { applyPremiumTheme } from '@shared/theme/premium-themes';
import { store } from '@state/store/store';
import { getSettingsState } from '@modules/settings/storage/settings-storage';

export const syncWearConfiguration = async (): Promise<void> => {
  const { access, preferences } = store.getState().premium;
  const id = access.active && access.accessUntil > Date.now() ? preferences.theme : 'default';
  const theme = applyPremiumTheme(appDarkTheme, id, false);
  await writeWearConfiguration(
    JSON.stringify({
      themeId: id,
      reduceMotion: getSettingsState().reduceMotion,
      palette: {
        primary: theme.colors.primary,
        onPrimary: theme.colors.onPrimary,
        surface: theme.colors.surface,
        onSurface: theme.colors.onSurface,
        muted: theme.colors.onSurfaceVariant,
        waterTop: id === 'default' ? '#278BA2' : theme.colors.primaryContainer,
        waterBottom: id === 'default' ? '#06465D' : theme.colors.secondaryContainer,
      },
    }),
  );
};
