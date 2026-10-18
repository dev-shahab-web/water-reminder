import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { PaperMaterialCommunityIcon } from '@shared/components/material-community-icon';
import { appDarkTheme, appLightTheme } from '@shared/theme';
import { applyPremiumTheme } from '@shared/theme/premium-themes';
import { ThemeStudio } from './theme-studio';

jest.mock('expo-font', () => ({
  ...jest.requireActual<typeof import('expo-font')>('expo-font'),
  isLoaded: () => true,
}));
jest.mock('@shared/motion', () => ({
  AnimatedPressableScale:
    jest.requireActual<typeof import('react-native')>('react-native').Pressable,
}));

const theme = applyPremiumTheme(appLightTheme, 'default', true);
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider theme={theme} settings={{ icon: PaperMaterialCommunityIcon }}>
    {children}
  </PaperProvider>
);

describe('Theme studio', () => {
  it('previews paid styles and both appearances without applying, then opens the matching paywall intent', async () => {
    const apply = jest.fn();
    const unlock = jest.fn();
    render(<ThemeStudio active={false} applied="default" onApply={apply} onUnlock={unlock} />, {
      wrapper,
    });
    fireEvent.press(screen.getByRole('radio', { name: 'Preview Material Expressive theme' }));
    await waitFor(() => expect(screen.getByText('Google Sans Flex')).toBeTruthy());
    expect(apply).not.toHaveBeenCalled();
    expect(unlock).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Preview Ocean theme, applied' })).toBeTruthy();
    fireEvent.press(screen.getByRole('radio', { name: 'Dark theme preview' }));
    expect(screen.getByTestId('theme-live-preview')).toHaveStyle({
      backgroundColor: applyPremiumTheme(appDarkTheme, 'expressive').colors.background,
    });
    fireEvent.press(screen.getByRole('radio', { name: 'Light theme preview' }));
    expect(screen.getByTestId('theme-live-preview')).toHaveStyle({
      backgroundColor: applyPremiumTheme(appLightTheme, 'expressive').colors.background,
    });
    fireEvent.press(screen.getByTestId('apply-premium-theme'));
    expect(unlock).toHaveBeenCalledWith('expressive');
    expect(apply).not.toHaveBeenCalled();
  });

  it('requires a deliberate Apply and lets members return to Ocean', () => {
    const apply = jest.fn();
    const unlock = jest.fn();
    const view = render(
      <ThemeStudio active applied="default" onApply={apply} onUnlock={unlock} />,
      { wrapper },
    );
    fireEvent.press(screen.getByRole('radio', { name: 'Preview Rose theme' }));
    expect(apply).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('apply-premium-theme'));
    expect(apply).toHaveBeenLastCalledWith('rose');
    view.rerender(<ThemeStudio active applied="rose" onApply={apply} onUnlock={unlock} />);
    expect(screen.getByTestId('apply-premium-theme')).toBeDisabled();
    fireEvent.press(screen.getByRole('radio', { name: 'Preview Ocean theme' }));
    fireEvent.press(screen.getByTestId('apply-premium-theme'));
    expect(apply).toHaveBeenLastCalledWith('default');
    expect(unlock).not.toHaveBeenCalled();
  });

  it('returns from checkout to the intended preview without silently applying it', () => {
    const apply = jest.fn();
    render(
      <ThemeStudio
        active
        applied="default"
        initialSelection="jade"
        onApply={apply}
        onUnlock={jest.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByRole('radio', { name: 'Preview Jade theme' })).toBeChecked();
    expect(screen.getByText('Apply Jade')).toBeTruthy();
    expect(apply).not.toHaveBeenCalled();
  });
});
