import type { HealthDataAvailability, HealthDataPermissionState } from '@platform/health';

export const getHealthConnectAvailabilityCopy = (availability: HealthDataAvailability): string => {
  switch (availability) {
    case 'available':
      return 'Available on this device.';
    case 'provider_update_required':
      return 'Health Connect needs an update before syncing.';
    case 'unavailable':
      return 'Health Connect is not available on this Android device.';
    case 'unsupported':
      return 'Health Connect is Android-only.';
  }
};

export const getHealthConnectPermissionCopy = ({
  granted,
  readGranted,
  writeGranted,
}: HealthDataPermissionState): string => {
  if (granted) {
    return 'Read and write hydration access granted.';
  }

  if (readGranted) {
    return 'Read access granted. Write access is off.';
  }

  if (writeGranted) {
    return 'Write access granted. Read access is off.';
  }

  return 'Not connected.';
};
