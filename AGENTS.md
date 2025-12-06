# Agent Guide

## Overview
- TeamVote is a Vite/React/TypeScript single-page app for planning team events with voting, budgeting, scheduling, and simple analytics. All data is mocked and stored in the browser (no backend).
- German copy is used throughout; several strings contain mojibake from broken encoding—be careful when editing text. Keep GUI/text in German and save files as UTF-8.
- React Query is set up but current data functions are simple async mocks.

## Run & Tooling
- Scripts: `npm run dev`, `npm run build`, `npm run build:dev`, `npm run preview`, `npm run lint`. Vite dev server listens on `::` port `8080`.
- Path alias `@` points to `./src` (vite.config.ts). TypeScript project config lives in the `tsconfig.*.json` files.
- UI stack: Tailwind + shadcn components, Framer Motion for animation, Lucide icons, Zustand for state, canvas-confetti for effects.
- Styling: CSS variables and custom utility classes in `src/index.css`; dark theme is enforced by wrapping the app in `<div className="dark">`.

## Routing (src/App.tsx)
- `/` Index: `DeptCodeForm` collects name and dept code, persists to store, then navigates to dashboard.
- `/dashboard`: `CampaignList` for the current dept code. Buttons point to `/create` and `/qr-create`, but those routes are not registered (will 404).
- `/voting/:id`: Loads campaign, presents swipe deck (`TinderDeck`), submits votes, then redirects to `/campaign/:id`.
- `/campaign/:id`: Campaign detail with budget/goal status, contribution form, wall of fame, scheduling grid, and analytics.
- `/qr-scan`: `QROnboarding` in scan mode (simulated scan and join). Any other routes hit `NotFound`.

## State & Data
- Global store: `useAppStore` (src/store/appStore.ts) persisted via `zustand/middleware`. Tracks deptCode, user profile, currentCampaignId, votes, and `superLikeUsed`; `logout` clears the session.
- Storage helper: `src/utils/storage.ts` wraps localStorage with prefix `teamvote_`; `generateId` builds pseudo-unique ids.
- Mock backend: `src/services/apiClient.ts` seeds a demo campaign (dept code `IN-VIA-1234`, status `voting`, stretch goals, event options) on first load. API functions read/write localStorage with small artificial delays:
  - `getCampaigns(deptCode)`, `getCampaign(id)`, `createCampaign(payload)` (uses mock stretch goals and event options).
  - `submitVotes(campaignId, votes)` stores votes; `submitAvailability` stores availability.
  - `submitContribution` appends contribution, assigns badges (`early_bird`, `whale`, `closer`), updates stretch goals, and returns the updated campaign.
  - `getTeamAnalytics` derives simple percentages/persona from stored votes (falls back to defaults if no data).
  - Helpers: `getTotalFunded`, `getFundingPercentage`.
- Data models live in `src/types/domain.ts` (Campaign, EventOption, Vote, PrivateContribution, Availability, StretchGoal, etc.); note the region literal for Austria is already mojibake in that file.

## Feature Modules
- Auth/Onboarding: `DeptCodeForm` validates name/code, sets store, routes to dashboard. `QROnboarding` has create/scan modes; scan simulates a QR read, create mode shows a QR for sharing the generated code.
- Campaigns: `CampaignList` fetches campaigns for the dept code, shows status badges and funding progress, and routes to voting (if status `voting`) or detail otherwise.
- Voting: `TinderDeck` presents cards for event options with like/dislike/super-like controls (super-like weight 3, single use per session). Drag left/right also records votes.
- Budget: `BudgetOverview` shows total funded/progress and funding source breakdown; `StretchGoals` animates unlocked goals; `ContributionForm` supports presets and anonymous toggle; `WallOfFame` lists contributions with badges/hero flag handling.
- Scheduling: `DateGrid` generates the next 14 days with morning/afternoon/evening slots and returns `Availability[]` on submit.
- Analytics: `TeamAnalytics` exports `PersonaSummary`, `TeamMeter`, and `CompromiseScoreBadge` to display persona, participation, and category focus.

## UI Notes
- Custom `Button` variants include `gradient`, `success`, `warning`, `like`, `dislike`, and `superlike`, plus larger icon sizes (`iconLg`, `iconXl`).
- Utility classes in `src/index.css` add gradient backgrounds, glow shadows, glassmorphism, shimmer, and floating animations; Tailwind theme is extended in `tailwind.config.ts` (colors map to CSS vars).

## Gaps / Caveats
- `/create` and `/qr-create` are referenced but not implemented routes.
- Encoding issues are present in multiple strings; preserve or clean deliberately.
- All data is client-side; clearing localStorage resets campaigns, votes, and analytics.
