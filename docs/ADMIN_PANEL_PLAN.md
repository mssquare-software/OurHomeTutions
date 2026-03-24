# Admin Panel – Plan (OurHomeTutions)

## 1. Role & routing

- **Current:** Signup has "Register as: Parent | Admin | Mentor" but role is not stored; everyone lands on `(tabs)` (parent dashboard).
- **Change:**
  - Persist **role** (e.g. in `UserContext` or a small auth store) when user signs up or logs in.
  - After login/signup:
    - **Parent** → `/(tabs)/parent-dashboard` (current behavior).
    - **Admin** → `/(admin)` (new Admin Panel).
    - **Mentor** → `/(mentor)` or `/(tabs)` with mentor-specific tabs (can be Phase 2).

---

## 2. Folder structure (suggested)

```
app/
  _layout.tsx                    # Add (admin) to Stack
  (auth)/
  (tabs)/                        # Parent app
  (admin)/                       # NEW – Admin Panel
    _layout.tsx                  # Stack or Tabs for admin
    index.tsx                    # Admin dashboard (landing)
    bookings.tsx                 # List + assign/reject bookings
    booking-detail.tsx           # Single booking: assign teacher, accept/reject
    users.tsx                    # Optional: list parents/mentors
    settings.tsx                 # Optional: app settings
```

Use a **stack** if admin has a clear “list → detail” flow; use **tabs** if you want a bottom nav (Dashboard, Bookings, Users, Settings).

---

## 3. Main admin screens

| Screen           | Purpose |
|------------------|--------|
| **Admin Dashboard** | Summary: pending bookings count, today’s sessions, quick stats. Links to Bookings / Users. |
| **Bookings**     | List all bookings (from `NotificationContext.bookings`). Filter: Pending / Assigned / Accepted / Rejected. |
| **Booking detail** | One booking: parent name, child, subject, date/time, address. Actions: **Assign teacher**, **Accept**, **Reject**. Calls `assignTeacher`, `acceptBooking`, `rejectBooking` from `NotificationContext`. |
| **Users** (optional) | List parents and/or mentors (mock or from API later). |
| **Settings** (optional) | App name, support email, etc. |

---

## 4. Data & context

- **Bookings / notifications:** Reuse `NotificationContext` (`bookings`, `assignTeacher`, `acceptBooking`, `rejectBooking`). Admin screens read and call these.
- **Role:** Extend `UserContext` (or add a small auth module) to store `role: "Parent" | "Admin" | "Mentor"` and persist it (e.g. with `email`/`parentName` in AsyncStorage). On app load, if role is Admin, redirect to `/(admin)` instead of `/(tabs)`.

---

## 5. Auth flow changes

1. **Signup:** When user submits, save `email`, `name`, **role** (Parent/Admin/Mentor). Then redirect:
   - Parent → `/(tabs)/parent-dashboard`
   - Admin → `/(admin)`
   - Mentor → `/(tabs)` or `/(mentor)` (your choice).
2. **Login:** For now you can use one demo admin account (e.g. `admin@demo.com` / `Admin@123`) that sets role to Admin and redirects to `/(admin)`. Parents keep using `parent@demo.com` → `/(tabs)`.
3. **Logout from Admin:** Clear user + role and navigate to `/(auth)/login`.

---

## 6. Implementation order

1. **Extend UserContext** (or auth): add `role`, `setUser(email, name, role)`, persist and read role.
2. **Signup:** Pass selected `role` into `setUser`; redirect by role after signup.
3. **Login:** Determine role (e.g. by email: `admin@demo.com` → Admin) and redirect to `/(admin)` or `/(tabs)`.
4. **Add `app/(admin)/_layout.tsx`** (Stack or Tabs) and **`app/(admin)/index.tsx`** (dashboard placeholder).
5. **Register `(admin)` in root `_layout.tsx`** Stack.
6. **Bookings list screen** in `(admin)/bookings.tsx`: read `bookings` from `useNotifications()`, show list, tap → detail.
7. **Booking detail screen** in `(admin)/booking-detail.tsx`: show one booking; buttons for Assign teacher / Accept / Reject calling `NotificationContext` methods.
8. (Optional) Users and Settings screens later.

---

## 7. UI notes

- Reuse Aurora theme and existing components (`Text`, `AppButton`, etc.).
- Reuse `NotificationContext` types (`BookingRequest`, etc.) for admin.
- Admin layout can be a simple stack with a back bar, or tabs (Dashboard, Bookings, Users, Settings) for faster switching.

---

## 8. Summary

| Item              | Action |
|-------------------|--------|
| **Where**         | New route group `app/(admin)/`. |
| **Who**           | Users with role **Admin** (set at signup or login). |
| **Data**          | Same `NotificationContext` (bookings, assign, accept, reject). |
| **Auth**          | Store role in UserContext; redirect by role after login/signup. |
| **First screens** | Admin dashboard (index), Bookings list, Booking detail. |

Once this is in place, you can add Mentor-specific flows and more admin features (reports, users, settings) on top of the same structure.
