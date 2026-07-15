# Motion Guidelines

## Motion Principles

Water Reminder motion should feel like water responding to a light touch. It should support habit formation, not create spectacle.

Principles:

- Calm before playful.
- Purpose before decoration.
- Immediate feedback.
- Low amplitude.
- Short action responses.
- Continuous motion only where it reinforces water identity.
- Respect Reduce Motion everywhere.

## Signature Interaction

Quick add sequence:

1. User taps quick-add amount.
2. Button gives subtle pressed feedback.
3. Water level rises.
4. Surface emits a short disturbance.
5. One or two circular ripples expand and fade.
6. Progress ring updates.
7. Number transitions.
8. Soft haptic.
9. Microcopy updates.

Timing:

- Primary feedback begins immediately.
- Main visual response completes around 300-500ms.
- Ripple fades within 300-450ms.
- Number transition should not lag behind the water rise.

## Continuous Water Motion

Use only in the Home hydration hero.

Behavior:

- Two smooth SVG sine-wave paths.
- Horizontal phase movement only.
- Low amplitude, about 3-6px.
- Slow duration.
- Different phase offsets and speeds.
- Water level remains tied to progress.

Do not use:

- Rounded rectangles.
- Capsules.
- Repeated humps.
- Vertical bouncing.
- Elastic springs.
- Continuous circular ripples.
- Large ocean waves.

## Goal Completion

Goal completion should feel like a calm finish:

- Gentle glow.
- Warm microcopy.
- Completion haptic.
- No confetti.
- No sound in v1.
- No pressure to continue.

## Navigation Motion

Navigation should feel stable and Android-native:

- Short fade/slide where already established.
- No excessive page choreography.
- No haptics for passive navigation.
- Avoid motion that delays logging.

## Widget Motion

Android home-screen widgets should not depend on complex animation. Use stateful visual changes:

- Updated progress.
- Clear logged state.
- Responsive layout.
- No fragile motion assumptions.

## Splash Motion

Native splash should be static and clean:

- Mist background.
- Centered mark.
- No heavy animation.
- App transition should avoid flash or color jump.

## Reduce Motion

When Reduce Motion is enabled:

- Disable continuous wave movement.
- Disable expanding ripple animation.
- Preserve immediate progress updates.
- Allow minimal fades only when necessary for state clarity.
- Do not remove important status changes.

## Performance Rules

- Use UI-thread animation primitives for high-frequency motion.
- Avoid React state updates every frame.
- Pause continuous motion when screen is unfocused.
- Pause when app is backgrounded.
- Avoid heavyweight animation dependencies.
- Keep Home responsive during logging.

## Image Model Motion Notes

For motion storyboard generation, describe:

> A calm teal water surface slowly moving inside a circular progress ring, low-amplitude sine wave, subtle ripple after tap, premium Material 3 hydration app, restrained, no confetti, no cartoon splash, no large waves.
