---
title: Customizing Actions
description: Reorder, hide, and relabel the feedback toolbar actions.
---

## Default action order

By default, the toolbar shows (left to right): **Support → Thumbs Down → Thumbs Up → Voice**

The rightmost action is visually closest to the trigger button.

## Reorder actions

The `actions` array determines toolbar order. List them in the order you want, left to right:

```tsx
<MusProvider
  config={{
    projectName: 'My App',
    slack: { ... },
    actions: [
      { type: 'support' },
      { type: 'thumbs-down' },
      { type: 'thumbs-up' },
      { type: 'voice' },   // rightmost, closest to trigger
    ],
  }}
>
```

## Hide actions

Simply omit any action you don't want. For example, thumbs only:

```ts
actions: [
  { type: 'thumbs-up' },
  { type: 'thumbs-down' },
]
```

Or voice and support only, no thumbs:

```ts
actions: [
  { type: 'support' },
  { type: 'voice' },
]
```

## Custom labels

Override the tooltip text shown on hover:

```ts
actions: [
  { type: 'voice',    label: 'Record feedback' },
  { type: 'support',  label: 'Contact us' },
  { type: 'thumbs-up',   label: 'This is helpful' },
  { type: 'thumbs-down', label: 'Needs improvement' },
]
```

## Per-section override

Each `FeedbackTarget` can override the provider-level actions:

```tsx
<FeedbackTarget
  sectionId="hero"
  sectionName="Hero Banner"
  actions={[
    { type: 'thumbs-up',   label: 'Love it' },
    { type: 'thumbs-down', label: 'Not my thing' },
  ]}
>
  <Hero />
</FeedbackTarget>
```

This section shows only the two thumbs. The voice and support actions from the provider are not shown here.

## Adding the video action

The `video` action shows an overview video. It requires a `videoUrl` on `FeedbackTarget`:

```tsx
<MusProvider
  config={{
    ...
    actions: [
      { type: 'video' },
      { type: 'voice' },
      { type: 'thumbs-up' },
    ],
  }}
>
  <FeedbackTarget
    sectionId="onboarding"
    sectionName="Onboarding"
    videoUrl="/videos/onboarding-overview.mp4"
  >
    <OnboardingFlow />
  </FeedbackTarget>
</MusProvider>
```
