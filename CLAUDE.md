# Expo React Native - Claude Rules

Read ALL files in `.claude/` before generating code.

## Stack

- Expo
- React Native
- TypeScript
- Expo Router
- Zustand
- TanStack Query
- MMKV
- Reanimated

## Architecture

Use Feature-based Architecture.

src/
├── app
├── features
├── shared
├── hooks
├── components
└── providers

Rules:

- UI -> Screens / Components
- Business Logic -> Hooks
- API -> api/
- Global State -> Zustand
- Server State -> React Query
- Persistent Storage -> MMKV

Never:

- use any
- inline style
- API calls inside screens
- duplicate components/hooks
