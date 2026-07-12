import { describe, expect, it } from '@jest/globals';

import {
  getHealthConnectAvailabilityCopy,
  getHealthConnectPermissionCopy,
} from './health-connect-copy';

describe('Health Connect copy', () => {
  it('explains platform availability without implying Health Connect is required', () => {
    expect(getHealthConnectAvailabilityCopy('available')).toBe('Available on this device.');
    expect(getHealthConnectAvailabilityCopy('provider_update_required')).toBe(
      'Health Connect needs an update before syncing.',
    );
    expect(getHealthConnectAvailabilityCopy('unavailable')).toBe(
      'Health Connect is not available on this Android device.',
    );
    expect(getHealthConnectAvailabilityCopy('unsupported')).toBe('Health Connect is Android-only.');
  });

  it('explains partial and complete permission states clearly', () => {
    expect(
      getHealthConnectPermissionCopy({
        canRequest: true,
        granted: true,
        readGranted: true,
        writeGranted: true,
      }),
    ).toBe('Read and write hydration access granted.');

    expect(
      getHealthConnectPermissionCopy({
        canRequest: true,
        granted: false,
        readGranted: true,
        writeGranted: false,
      }),
    ).toBe('Read access granted. Write access is off.');

    expect(
      getHealthConnectPermissionCopy({
        canRequest: true,
        granted: false,
        readGranted: false,
        writeGranted: true,
      }),
    ).toBe('Write access granted. Read access is off.');

    expect(
      getHealthConnectPermissionCopy({
        canRequest: true,
        granted: false,
        readGranted: false,
        writeGranted: false,
      }),
    ).toBe('Not connected.');
  });
});
