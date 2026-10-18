# Bundled premium typography

Google Sans Flex, Nunito and Lora are distributed under the SIL Open Font License
1.1; the complete license/copyright files are included alongside the fonts.

Source: [google/fonts](https://github.com/google/fonts/tree/47d54ca1ebb14fd864695f1d39dc734f39017c33/ofl)
at revision `47d54ca1ebb14fd864695f1d39dc734f39017c33`.

`scripts/generate-theme-fonts.py` creates regular (400), semibold (600) and bold
(700) static instances with fonttools 4.60.1. Google Sans Flex uses ROND=50 and
otherwise default axes. Instances are renamed `WR-Sans`, `WR-Rounded` and
`WR-Serif`, each with explicit weight aliases, to avoid platform-dependent font
weight synthesis. All original glyphs are retained. This is a build-time tool;
the Android app needs no Python or font download service.

Expo bundles these assets and loads them locally with expo-font. System type
remains available while loading or if a font cannot be loaded. Typography follows
the selected theme; native Play/Android dialogs retain their platform typography.
No Google endorsement is implied by using its open-source fonts or design system.
