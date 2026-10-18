export type EngagementPreferences = {
  firstInstallTime: number;
  reviewRemindersEnabled: boolean;
  updateNotificationsEnabled: boolean;
  reviewStatus: 'not-confirmed' | 'reviewed' | 'never';
};

export type AppUpdate = {
  state:
    | 'available'
    | 'up-to-date'
    | 'unavailable'
    | 'downloading'
    | 'downloaded'
    | 'installing'
    | 'resume';
  versionCode: number;
  downloadedBytes: number;
  totalBytes: number;
};
