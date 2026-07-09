# 0003 Use MMKV

## Decision

Use MMKV for small non-secret key-value persistence.

## Rationale

MMKV is fast and well suited for preferences, flags, and lightweight app metadata.

## Consequences

- MMKV access must be isolated behind `src/platform/storage`.
- Secrets require secure storage.
- Screens and components never access MMKV directly.
