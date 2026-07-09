# Project Structure

```txt
app/
  _layout.tsx
  index.tsx

src/
  core/
    config/
    env/
    errors/
    logger/

  platform/
    analytics/
    database/
    network/
    notifications/
    permissions/
    storage/

  shared/
    components/
    hooks/
    theme/
    constants/
    utils/
    types/

  modules/
    playground/

  state/
    store/
    slices/

  query/
    client/
    keys/

assets/
docs/
```

Feature modules should use this shape when they are added:

```txt
src/modules/water/
  components/
  hooks/
  screens/
  services/
  repository/
  types/
  utils/
```
