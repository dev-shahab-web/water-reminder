# Open Source Notices

This document lists direct production dependencies currently declared in `package.json`. Licences were read from installed package metadata in `node_modules` during the release audit. Transitive native dependencies, Gradle dependencies, and Play Services/Firebase bundled notices still require manual review before publication.

## Direct Production Dependencies

| Library                              | Version    | Licence    | Notice                     |
| ------------------------------------ | ---------- | ---------- | -------------------------- |
| `@expo/vector-icons`                 | `^15.0.2`  | MIT        | Include MIT attribution.   |
| `@react-native-firebase/app`         | `^25.1.0`  | Apache-2.0 | Include Apache 2.0 notice. |
| `@react-native-firebase/analytics`   | `^25.1.0`  | Apache-2.0 | Include Apache 2.0 notice. |
| `@react-native-firebase/crashlytics` | `^25.1.0`  | Apache-2.0 | Include Apache 2.0 notice. |
| `@reduxjs/toolkit`                   | `^2.12.0`  | MIT        | Include MIT attribution.   |
| `@tanstack/react-query`              | `^5.101.2` | MIT        | Include MIT attribution.   |
| `expo`                               | `~57.0.4`  | MIT        | Include MIT attribution.   |
| `expo-constants`                     | `~57.0.3`  | MIT        | Include MIT attribution.   |
| `expo-dev-client`                    | `~57.0.5`  | MIT        | Include MIT attribution.   |
| `expo-font`                          | `~57.0.0`  | MIT        | Include MIT attribution.   |
| `expo-haptics`                       | `~57.0.0`  | MIT        | Include MIT attribution.   |
| `expo-linking`                       | `~57.0.2`  | MIT        | Include MIT attribution.   |
| `expo-notifications`                 | `~57.0.3`  | MIT        | Include MIT attribution.   |
| `expo-router`                        | `~57.0.4`  | MIT        | Include MIT attribution.   |
| `expo-splash-screen`                 | `~57.0.2`  | MIT        | Include MIT attribution.   |
| `expo-sqlite`                        | `~57.0.0`  | MIT        | Include MIT attribution.   |
| `expo-status-bar`                    | `~57.0.0`  | MIT        | Include MIT attribution.   |
| `expo-system-ui`                     | `~57.0.0`  | MIT        | Include MIT attribution.   |
| `react`                              | `19.2.3`   | MIT        | Include MIT attribution.   |
| `react-dom`                          | `19.2.3`   | MIT        | Include MIT attribution.   |
| `react-native`                       | `0.86.0`   | MIT        | Include MIT attribution.   |
| `react-native-gesture-handler`       | `~2.32.0`  | MIT        | Include MIT attribution.   |
| `react-native-health-connect`        | `^3.5.3`   | MIT        | Include MIT attribution.   |
| `react-native-mmkv`                  | `^4.3.2`   | MIT        | Include MIT attribution.   |
| `react-native-paper`                 | `^5.15.3`  | MIT        | Include MIT attribution.   |
| `react-native-reanimated`            | `4.5.0`    | MIT        | Include MIT attribution.   |
| `react-native-safe-area-context`     | `~5.7.0`   | MIT        | Include MIT attribution.   |
| `react-native-screens`               | `4.25.2`   | MIT        | Include MIT attribution.   |
| `react-native-svg`                   | `15.15.4`  | MIT        | Include MIT attribution.   |
| `react-native-web`                   | `~0.21.0`  | MIT        | Include MIT attribution.   |
| `react-native-worklets`              | `0.10.0`   | MIT        | Include MIT attribution.   |
| `react-redux`                        | `^9.3.0`   | MIT        | Include MIT attribution.   |

## Android Native Notices

- Android Jetpack Glance/widget libraries are introduced by the widget config plugin and generated Gradle project. Manual review required after native build generation.
- Firebase Android SDK transitive dependencies are introduced by React Native Firebase. Manual review required in the generated Gradle dependency report.
- Health Connect Android dependencies are introduced by `expo-health-connect` and `react-native-health-connect`. Manual review required in the generated Gradle dependency report.

## In-App Source

The in-app Open Source Licences row should link to hosted notices through `EXPO_PUBLIC_LICENSES_URL` when available. The bundled fallback copy must remain non-misleading and should not claim that this document replaces formal legal review.
