## Parent App – Planning & Execution Guide

This document explains how the **Parent experience** in OurHomeTutions is planned and implemented, so designers, developers, and PMs can quickly understand what exists and how to extend it.

---

### 1. Parent Journey Overview

- **Onboarding & First Run**
  - Animated onboarding in `app/index.tsx` using `onboardingSlides`.
  - Clear CTA to log in / sign up and reach the Parent Dashboard.

- **Authentication**
  - Login & signup flows live under `app/(auth)/`.
  - Role selection (Parent / Admin / Mentor) is implemented on the signup screen.
  - User information and avatar selection are stored via `UserContext` and `AsyncStorage`.

- **Core Parent Surfaces**
  - **Parent Dashboard**: quick overview, avatar, and primary actions.
  - **Booking**: create and manage bookings.
  - **Live Tracking**: view mentor or self-location depending on booking state.
  - **Payment Success / Delivery Tracking**: confirmation and tracking flows after actions.

---

### 2. Key Parent Screens & Responsibilities

- **`app/index.tsx` – Onboarding & Entry**
  - Parallax onboarding with hero visuals and CTA.
  - Navigates to `/(auth)/login` on “Skip” or “Continue”.

- **`app/(auth)/login.tsx`**
  - Email/password login for all roles.
  - On success, sets user in `UserContext` (email, name, avatar).

- **`app/(auth)/signup.tsx`**
  - Registration form.
  - Includes **Register as Parent / Admin / Mentor** role selector (chip-style UI).

- **`app/_layout.tsx`**
  - Wraps the app with global providers, including `UserProvider` and loaders.

- **`app/(tabs)/_layout.tsx`**
  - Custom tab layout.
  - Hides default Expo tab bar and routes directly to `parent-dashboard`.

- **`app/(tabs)/parent-dashboard.tsx`**
  - Main Parent home experience.
  - Shows greeting, avatar, and quick actions.
  - Avatar tap opens a **slide-in sidebar** with:
    - Messages  
    - Notifications toggle  
    - Account & Security  
    - Update Account Data  
    - Language  
    - Reset Password (planned navigation hooks).
  - Includes **Avatar Section** where parents can choose from 5 local avatar images.

- **`app/(tabs)/booking.tsx`**
  - Create new booking requests.
  - Displays booking details and relevant actions for parents.

- **`app/(tabs)/booking-confirmation.tsx`**
  - Shows booking status (pending / accepted) and key details.

- **`app/(tabs)/live-tracking.tsx`**
  - **If a booking is active**: shows mentor’s location on the map.
  - **If no booking**: shows parent’s current location and a card with “No new booking initiated”.
  - Integrates with notifications and location services.

- **`app/(tabs)/delivery-tracking.tsx` & payment success screens**
  - Post-action confirmations and tracking for tutors, sessions, or payments.

---

### 3. State Management & User Data (Parents)

- **`app/context/UserContext.tsx`**
  - Stores:
    - `email`
    - `parentName`
    - `selectedAvatarId`
  - Persists user + avatar in `AsyncStorage`.
  - On first login, assigns a random avatar from `AVATAR_OPTIONS`.

- **Avatar Assets**
  - Located in `assets/avatar/`.
  - Fixed set of 5 allowed avatars:
    - `teacher.png`
    - `school-boy.png`
    - `man-with-hat.png`
    - `man-with-hat (1).png`
    - `fashion-designer.png`

---

### 4. Visual Design & Theming

- **Global Theme**
  - Defined in `theme/aurora.ts` as **Aurora Modern**.
  - Centralized tokens for colors, typography, spacing, radii, and shadows.

- **Text & Typography**
  - `components/ui/text.tsx` maps variants (`heading`, `title`, `subtitle`, `body`, etc.) to Aurora typography.
  - All Parent-facing text should use these variants for consistency.

- **Buttons**
  - `components/AppButton.tsx` uses Aurora primary colors.
  - Primary actions (e.g., “Let’s go”, “Confirm Booking”) should use the primary button style.

- **Layout & Responsiveness**
  - Key Parent screens use `ScrollView` + Tailwind-like classes via NativeWind:
    - `flex-1`, padding utilities, background colors, rounded corners, etc.
  - Goal: all Parent pages scroll gracefully on smaller devices and look polished on large screens.

---

### 5. Navigation & Flows (Parent)

- **Entry Flow**
  1. Launch app → Onboarding (`app/index.tsx`).
  2. User taps **Skip / Continue** → `/(auth)/login`.
  3. Login or sign up (selecting **Parent** role).
  4. Redirect to `/(tabs)/parent-dashboard`.

- **From Parent Dashboard**
  - **Avatar Tap** → Open sidebar (settings / messages / account).
  - **Quick Actions** → Booking, Live Tracking, Payments, etc.

- **Live Tracking Logic**
  - Uses booking state to determine which map content to show.
  - Parent always has context on whether a booking is active.

---

### 6. Execution Checklist for Future Work

When adding or modifying Parent features, follow this checklist:

1. **Design**
   - Align with **Aurora Modern** theme.
   - Use existing typography variants and button styles.
2. **Routing**
   - Place new Parent screens under `app/(tabs)/` when they are main tabs/flows.
   - For nested flows, consider subfolders like `app/(tabs)/parent-settings/`.
3. **State**
   - Use `UserContext` for anything tied to the logged-in Parent (name, avatar, preferences).
4. **Responsiveness**
   - Wrap main content in `ScrollView`.
   - Use `flex-1` containers and Tailwind-style classNames.
5. **Testing**
   - Test on both iOS and Android.
   - Verify:
     - Onboarding → Login → Parent Dashboard.
     - Avatar selection & persistence.
     - Booking creation and confirmation screens.
     - Live Tracking behavior (with and without bookings).

---

### 7. How to Extend the Parent Experience

- Add new sidebar destinations (e.g., **Parent Profile**, **Child Profiles**, **Billing History**) by:
  - Creating screens under `app/(tabs)/` or nested routes.
  - Wiring navigation from the sidebar in `parent-dashboard.tsx`.

- Introduce new cards or sections on the Parent Dashboard:
  - Reuse `AppButton`, `Heading`, and `Text` variants.
  - Keep layouts scrollable and visually consistent.

Use this README as the starting point whenever you plan, review, or expand any **Parent-facing feature** in OurHomeTutions.