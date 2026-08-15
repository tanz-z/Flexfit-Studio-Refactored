# Feature Inventory

Working inventory of FlexFit Studio behavior, documented before/during refactor to protect against regressions.

## Roles

| Role | Access |
|------|--------|
| **Member** | Book classes, manage membership, waitlist, reschedule, notifications |
| **Trainer** | Schedule view, availability, class roster, check-in |
| **Admin** | Full staff access plus reports, companies, payments, member management |

## Authentication

- Cookie-based sessions (`flexfit_session`)
- Login/logout via `auth` router
- Protected routes require sign-in; staff/admin procedures enforce role

## Member features

### Membership & plans (`plans`, `members`)
- Browse active membership plans
- Subscribe to a plan (creates membership + paid payment record)
- View profile with current membership, credits, classes attended
- Update name and phone

### Class schedule (`classes`, `bookings`)
- Browse upcoming classes with spots remaining
- Book a class (requires active membership with sufficient credits)
- Full classes → waitlisted status (no credit charge until promoted)
- Unlimited plans (≥999 credits) never decrement
- Cancel booking:
  - ≥12 hours before: credit refunded
  - <12 hours before: spot freed, credit forfeited
  - Confirmed cancel promotes longest-waiting waitlisted member
- View waitlist position

### Reschedule (`reschedules`)
- Move a booking to another slot of the **same class name**
- Allowed up to 4 hours before original class start
- Keeps credits already spent; may land on waitlist if target is full
- Validation query for UI preview

### Notifications (`notifications`)
- View and mark notifications read

## Staff features

### Front desk / kiosk (`bookings`, `members`)
- Look up member by email or phone
- View upcoming bookings for a member
- Mark attendance (check-in) with source: front_desk, kiosk, app
- Class roster view

### Trainer schedule (`trainers`)
- View upcoming assigned classes with booking/check-in counts
- Set weekly availability (day, start time, end time)
- Remove availability slots

## Admin features

### Dashboard & reports (`admin`)
- Stats: total members, active memberships, upcoming classes, revenue, check-ins, pending payments
- Class utilisation
- Revenue by month and payment method
- Expiring memberships (next 14 days)
- Refund count
- Check-ins per day (last 14 days)
- Top trainers by attendance
- No-show list

### Companies (`adminCompanies`, `corporateBookings`)
- Create companies with credit pools
- Top up credit pools
- Link/unlink members to companies
- Activate/deactivate companies
- Corporate members book against company pool (not personal membership)
- Corporate cancel policy: ≥24 hours for credit refund
- Corporate waitlist promotion deducts from company pool

### Payments (`payments`)
- View all payments (admin)
- Mark pending as paid
- Refund paid payments (cancels linked membership)

### Classes & members (`classes`, `members`)
- Create/update/cancel classes
- Search members, view history
- Set member active status and role

### Announcements (`admin` page)
- Admin announcements UI

## Business rules reference

| Rule | Value |
|------|-------|
| Free cancellation (member) | 12 hours before class |
| Free cancellation (corporate) | 24 hours before class |
| Free reschedule | 4 hours before original class |
| Unlimited credits threshold | ≥999 |
| Waitlist credit charge | On promotion, not on join |
| Reschedule target | Same class name only |

## Pages

| Path | Purpose |
|------|---------|
| `/` | Home |
| `/login` | Sign in |
| `/dashboard` | Member dashboard |
| `/schedule` | Class schedule |
| `/plans` | Membership plans |
| `/waitlist` | Waitlist view |
| `/notifications` | Notifications |
| `/kiosk` | Front desk kiosk |
| `/trainer/schedule` | Trainer schedule |
| `/admin` | Admin dashboard |
| `/admin/reports` | Revenue reports |
| `/admin/companies` | Company list |
| `/admin/companies/[id]` | Company detail |
| `/admin/attendance` | Attendance |
| `/admin/announcements` | Announcements |
