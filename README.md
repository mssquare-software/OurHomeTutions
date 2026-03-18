## OurHomeTutions — Product Vision & Build Workflow

### Product vision
OurHomeTutions is a **home-tuition + tutoring platform** that connects Parents with Mentors and provides an Admin system to manage bookings, mentor applications, queries, jobs, and platform configuration.

- **Parent app**: discover/choose subjects & topics, create bookings, track sessions, raise support queries, manage profile/avatar, and receive session updates.
- **Mentor app**: manage availability, accept/complete sessions, apply for jobs, manage profile/avatar, and earn trust via ratings/badges (later).
- **Admin portal (in-app)**: manage bookings & assignments, review mentor applications, handle parent/mentor queries, post jobs, manage subjects/topics, and configure platform settings.

---

### UI references (screenshots)
Use these folders as the single source of truth for UI reference images.

- **Parent UI references**: `assets/Parentimagereadme/`
- **Admin UI references**: `assets/Adminimages/`

If you add new reference screenshots, put them into the correct folder and keep names descriptive (e.g. `admin-dashboard.jpeg`, `parent-sidebar.jpeg`) so developers can find them fast.

---

### Planning workflow (how features are designed + delivered)
We build features in **vertical slices** so UI and logic stay aligned and testable:

1. **Define user story**
   - Example: “Parent raises a query with subject + attachments, Admin sees it instantly.”
2. **Define data contract**
   - Decide what fields are required, status lifecycle, and storage strategy.
3. **Create routes/screens**
   - Expo Router route + screen UI based on `assets/Parentimagereadme/` and `assets/Adminimages/`.
4. **Wire state & persistence**
   - During frontend phase: local repo (AsyncStorage).
   - After frontend completion: move to Supabase (Auth + DB + Storage + Realtime).
5. **Validate end-to-end flow**
   - Parent action → Admin visibility → status updates.

---

### Application workflows (core flows)

### Parent workflows
- **Sign up / sign in**
  - Role-based signup (Parent/Admin/Mentor).
  - Welcome email (currently stored in outbox for testing).
- **Booking**
  - Select subject/topic → choose mode → pick slot → confirm.
  - Admin can assign mentor.
- **Live tracking**
  - If booking active: mentor tracking.
  - If no booking: parent current location + “No new booking initiated.”
- **Raise query**
  - Parent creates a query (subject + message + optional attachments).
  - Admin sees unsolved queries and can mark as solved.

### Admin workflows
- **Dashboard**
  - Overview cards + quick actions + list of today’s active mentors.
- **Queries**
  - Solved/Unsolved + date range filter.
- **Booking management**
  - Review bookings → assign mentor (active/inactive indicators).
- **Jobs & HR review**
  - Post job (criteria → auto summary).
  - HR review applications → accept/reject → notification email (outbox now, real later).
- **Subjects & topics**
  - Admin adds/removes subjects and topics.
  - Parent booking reads subjects/topics dynamically.

---

### Developer workflow (how the team should work)

- **Branching**
  - Create one branch per feature: `feature/<area>-<short-name>`
  - Example: `feature/admin-queries-filters`

- **Component strategy**
  - Keep screens in `app/(tabs)/` and `app/(admin)/`.
  - Keep shared UI building blocks in `components/`.
  - Keep global state/providers in `app/context/`.
  - Keep data access behind repo/service modules (so migration to Supabase is simple).

- **Data strategy (current → future)**
  - **Now**: `app/data/repo/` uses AsyncStorage for fast UI delivery.
  - **After frontend completion**: switch repo implementations to Supabase:
    - Tables: `profiles`, `bookings`, `queries`, `jobs`, `applications`, `subjects`, `topics`
    - Storage bucket: `attachments/` for PDFs/JPGs
    - Realtime: subscribe to `queries` and `bookings` for Admin live updates

- **Testing checklist (minimum)**
  - Parent: login → booking → raise query → logout
  - Admin: login → see queries → mark solved → see bookings → assign mentor
  - Verify language switch works (English/Hindi/Telugu) on key screens

---

### Tech stack
- **Framework**: Expo + React Native + Expo Router (TypeScript)
- **UI**: NativeWind/Tailwind-style utilities + custom themed components
- **State**: React Context (User, Loader, Notifications, Tour, Language)
- **Local persistence (frontend phase)**: AsyncStorage
- **Maps/Location**: `expo-location`, `react-native-maps`
- **Animations**: Lottie
- **Backend (post-frontend phase)**: Supabase (Auth + DB + Storage + Realtime)

---

### Notes
- During UI build phase, we intentionally keep backend logic minimal and stable. Once the UI/UX is finalized, we migrate storage/auth to Supabase without redesigning screens.

