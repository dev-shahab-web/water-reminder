import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { UpdateCard } from './update-card';
import type { AppUpdate } from '../types';

jest.mock('react-native-paper', () => ({
  Icon: () => null,
  ProgressBar: () => null,
  useTheme: () => ({
    app: { colors: { surfaceBase: '#fff', textPrimary: '#000', textSecondary: '#555' } },
    colors: { primary: '#007A8A', primaryContainer: '#E0F4F5' },
  }),
}));
jest.mock('@shared/components', () => {
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Button = ({ label, ...props }: { label: string }) => (
    <Pressable {...props}>
      <Text>{label}</Text>
    </Pressable>
  );
  return { PrimaryButton: Button, SecondaryButton: Button };
});
const update: AppUpdate = { state: 'available', versionCode: 9, downloadedBytes: 0, totalBytes: 0 };
describe('app update UI', () => {
  it('offers a deliberate update action without starting automatically', () => {
    const start = jest.fn();
    render(<UpdateCard update={update} checking={false} busy={false} onUpdate={start} />);
    expect(screen.getByText('A fresh version is ready')).toBeTruthy();
    expect(start).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('app-update-action'));
    expect(start).toHaveBeenCalledTimes(1);
  });
  it('explains the restart before completing a downloaded update', () => {
    render(
      <UpdateCard
        update={{ ...update, state: 'downloaded' }}
        checking={false}
        busy={false}
        onUpdate={jest.fn()}
      />,
    );
    expect(screen.getByText('Restart to update')).toBeTruthy();
    expect(screen.getByText(/Restart Water Reminder to finish/)).toBeTruthy();
  });
  it('never calls a failed check up to date', () => {
    render(
      <UpdateCard
        update={{ ...update, state: 'unavailable' }}
        checking={false}
        busy={false}
        onUpdate={jest.fn()}
        onCheck={jest.fn()}
        onStore={jest.fn()}
      />,
    );
    expect(screen.queryByText('You’re up to date')).toBeNull();
    expect(screen.getByText('Open Google Play')).toBeTruthy();
  });
});
