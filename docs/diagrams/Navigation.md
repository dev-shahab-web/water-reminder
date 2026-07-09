# Navigation Diagram

```mermaid
flowchart TD
  A[app/_layout.tsx] --> B[AppRoot]
  B --> C[AppShell]
  C --> D[Expo Router Stack]
  D --> E[app/index.tsx]
  D --> F[Future module route]
  F --> G[Module screen]
```
