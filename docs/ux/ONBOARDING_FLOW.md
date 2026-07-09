# Onboarding Flow

## Purpose

Onboarding should help users start tracking quickly with sensible defaults. It should not feel like marketing, medical advice, or account setup.

## Goals

- Establish the product promise.
- Set preferred unit.
- Set daily goal.
- Set reminder preference.
- Complete setup with or without notification permission.
- Land the user on Home ready to log water.

## Flow

```txt
Splash
-> Onboarding Intro
-> Unit Selection
-> Goal Setup
-> Reminder Preference
-> Notification Permission, if reminders enabled
-> Home
```

Default path:

```txt
Onboarding Intro
-> Use Defaults
-> Home
```

## Onboarding Intro

Purpose:

- Explain the app in one sentence.

Suggested copy:

- "Track water quickly and get gentle reminders when you want them."

Primary CTA:

- "Set up my goal."

Secondary CTA:

- "Use defaults."

## Unit Selection

Options:

- Milliliters.
- Ounces.

Rules:

- Default can follow locale if approved.
- User can change later in Settings.

## Goal Setup

Rules:

- Show default goal.
- Explain goal is editable.
- Avoid medical claims.
- Validate custom input.

## Reminder Preference

Options:

- Enable gentle reminders.
- Track manually.

Rules:

- Manual tracking is a first-class path.
- If reminders are disabled, skip Notification Permission.

## Skip Behavior

Using defaults should:

- Complete onboarding.
- Set default unit.
- Set default goal.
- Create default quick-add sizes.
- Leave reminders disabled unless product review approves otherwise.
- Route to Home.

Using defaults should not:

- Request notification permission.
- Require account creation.
- Hide core features.

## Resume Behavior

If onboarding is interrupted:

- Resume at the last incomplete step if known.
- If unknown, return to Onboarding Intro.
- Never trap the user in a broken partial state.

## Edge Cases

- User changes unit after entering goal.
- User enters invalid goal.
- User denies permission after enabling reminders.
- User exits app during native permission prompt.
- User uses large text or screen reader.

## Acceptance Criteria

- New user reaches Home in under one minute.
- User can skip setup and still use tracking.
- Notification permission appears only after reminder intent.
- No onboarding step requires internet connectivity.
