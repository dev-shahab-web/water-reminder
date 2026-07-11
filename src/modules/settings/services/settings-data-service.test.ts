import { describe, expect, it } from '@jest/globals';

import { formatDatabaseSize } from './settings-data-service';

describe('settings data service', () => {
  it('formats local database sizes for Settings', () => {
    expect(formatDatabaseSize(512)).toBe('512 B');
    expect(formatDatabaseSize(2048)).toBe('2 KB');
    expect(formatDatabaseSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});
