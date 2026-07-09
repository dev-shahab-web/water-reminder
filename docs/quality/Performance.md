# Performance Quality Gate

## Checklist

- [ ] No unnecessary heavy dependency was added.
- [ ] Lists are designed for virtualization when needed.
- [ ] Expensive work is not performed during render.
- [ ] Persistence choices match the data shape.
- [ ] Network and sync behavior can be retried safely.
- [ ] Animations avoid blocking the JS thread.

## Review Notes

Do not optimize prematurely, but do not introduce obvious bottlenecks into shared framework code.
