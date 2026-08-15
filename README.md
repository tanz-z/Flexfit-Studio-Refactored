# FlexFit Studio 🏋️‍♂️

FlexFit Studio is a modern gym management application built with Next.js, tRPC, and Drizzle ORM. Members can subscribe to membership plans, book and reschedule classes, and join waitlists. Staff members can manage the front desk kiosk, schedule trainer availability, view rosters, and pull comprehensive administrative revenue reports. Corporate accounts can also purchase shared credit pools for employees.

This project was successfully refactored from a monolithic, tightly-coupled setup into a **clean service-based architecture** separating routing concerns from domain/business logic.

---

## Optimization & Refactoring Highlights

The refactor focused on restructuring and optimizing the codebase for maintainability, reliability, and performance:

1.  **Strict Separation of Concerns (Decoupled Routers & Services)**:
    *   **Before**: tRPC routers handled input validation, SQL query execution, transaction orchestrations, and HTTP session management inside single 400+ line files.
    *   **After**: Routers act as thin HTTP controller adapters. Zod handles input schemas, and all domain operations are delegated to pure business services under `src/server/services/`. This keeps controllers light and modular.
2.  **Unified Business Policies (DRY & Single Source of Truth)**:
    *   **Before**: Business logic helpers like `hoursUntil` and `activeMembershipFor` were duplicated verbatim across multiple router files, risking policy drift. Constants were hardcoded inline.
    *   **After**: Unified policy helpers were extracted into `src/server/lib/time.ts` and `src/server/lib/memberships.ts`. Policy thresholds (12-hour member cancellation, 24-hour corporate cancellation, 4-hour reschedule limit, and 999 unlimited credit threshold) were centralized into `src/server/lib/constants.ts`.
3.  **Deduplicated Rescheduling Rules**:
    *   **Before**: Reschedule validations were copy-pasted across the validation query (UI preview) and the reschedule mutation (database write), leading to duplicate queries and validation pathways.
    *   **After**: Extracted the core business checks into a pure, database-free function (`validateRescheduleRequest`) inside `src/server/lib/reschedule-validation.ts`. Both the query and mutation run the exact same validation logic.
4.  **Optimized Page Architectures**:
    *   **Before**: Pages like the Member Dashboard and Trainer Schedule were bloated (200+ lines), mixed data-fetching hook states, mutation flows, and large nested HTML layouts.
    *   **After**: Extracted modular, single-concern components into `src/components/features/`. Pages now strictly act as composition roots that retrieve data and orchestrate mutations, delegating layouts to modular sub-components.
5.  **Automated Safety Net (Unit Testing)**:
    *   **Before**: No test suite was used, risking silent regressions when policies were updated.
    *   **After**: Integrated a Vitest unit test suite covering key policies, date boundaries, and scheduling validators. Tests compile and run instantly since validation helper functions are isolated and database-free.

---

## Technical Stack

*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **API Layer:** tRPC
*   **Database ORM:** Drizzle ORM
*   **Database Engine:** SQLite (Local file-based)
*   **Styling:** TailwindCSS
*   **Testing:** Vitest

---

## Getting Started

### Prerequisites

You need **Node.js 20** or newer, and **pnpm** installed globally. If you do not have `pnpm`:
```bash
npm install -g pnpm
```

### Installation & Database Setup

1.  **Clone the repository** and navigate to the project directory:
    ```bash
    cd flexfit-studio
    ```
2.  **Install dependencies**:
    ```bash
    pnpm install
    ```
3.  **Initialize the SQLite Database & Seed Data**:
    ```bash
    pnpm db:reset
    ```
    *This creates the SQLite database (`flexfit.db`), pushes the Drizzle schema, and seeds sample data.*
4.  **Start the Local Development Server**:
    ```bash
    pnpm dev
    ```
    *The app will be running at [http://localhost:3000](http://localhost:3000).*

---

## Demo Accounts

The database is seeded with multiple accounts representing each system role. Use these to sign in and explore the corresponding dashboards:

| Role | Email Address | Password | Features Available |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@flexfit.test` | `admin123` | Analytics reports, company setups, refund audits, and class management |
| **Trainer** | `arjun@flexfit.test` | `trainer123` | Assigned classes schedule, roster check-ins, and availability builder |
| **Member** | `rahul.k@example.com` | `member123` | Membership views, scheduling, class bookings, and reschedules |

*Every other seeded member uses the password `member123`. A full list of member emails can be viewed in `src/db/seed.ts`.*

---

## Available Commands

Execute these commands from the root directory of the project:

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Starts the Next.js development server on [http://localhost:3000](http://localhost:3000) |
| `pnpm build` | Pre-compiles and generates the production Next.js application bundle |
| `pnpm test` | Runs the automated Vitest test suite |
| `npx tsc --noEmit` | Performs type validation checking across the entire TypeScript codebase |
| `pnpm db:push` | Syncs schema changes from `src/db/schema.ts` directly into the database |
| `pnpm db:seed` | Resets and populates the database tables with clean seed data |
| `pnpm db:reset` | Wipes the database file (`flexfit.db`) and builds it again from scratch |

---

## Codebase Architecture

The project is structured according to clean architecture principles, decoupling API routes (tRPC adapters) from database access and business logic (services):

```
src/
  app/                            # Next.js routes and pages (URL endpoints)
  components/
    features/
      dashboard/                  # Member dashboard layout UI elements
      trainer/                    # Trainer scheduling dashboard UI elements
    NavBar.tsx                    # Shared header navigation layout
    reschedule-modal.tsx          # Shared modal for rescheduling class times
  db/                             # Drizzle schemas, clients, and database seed scripts
  lib/                            # Shared client-side helpers
  server/
    lib/                          # Shared policy checks, constants, and pure helpers
      constants.ts                # central gym policies (12h cancel, 4h reschedule, etc.)
      time.ts                     # Date and time helpers
      memberships.ts              # active membership evaluation helpers
      class-validation.ts         # bookable guard checks (started, cancelled, exists)
      reschedule-validation.ts    # pure reschedule rules (tested database-free)
    services/                     # Core Business Logic Layer (no tRPC dependencies)
      admin.ts                    # Reporting analytics & stats queries
      admin-companies.ts          # Corporate accounts & company links
      auth.ts                     # Login, register, and session handling
      classes.ts                  # Class scheduling, updates, and cancellations
      corporate-bookings.ts       # Corporate credit bookings lifecycle
      member-bookings.ts          # Member bookings lifecycle
      members.ts                  # Profile updates, directory lookups, and search
      notifications.ts            # Read counts, listing, and broadcasts
      payments.ts                 # Auditing payment logs and refund updates
      plans.ts                    # Subscription plan registration & checkouts
      reschedules.ts              # Reschedule operations and audit logs
      trainers.ts                 # Trainer availability constraints & conflicts
    trpc/
      index.ts                    # procedure definitions, middlewares, and context
    trpc.ts                       # Backward-compatible router shim
    routers/                      # Thin tRPC adapters (Zod parsing + service calls)
documents/                        # Refactor notes, technical decisions, and feature indices
```

*For details on the refactoring decisions, boundaries, and retained quirks, see [REFACTOR.md](file:///c:/Users/Tanya/OneDrive/Desktop/Callus/Project1/flexfit-studio/documents/REFACTOR.md).*

---

## Important Development Notes

1.  **TypeScript Diagnostics**: If you wish to typecheck the codebase while the dev server is active, avoid running `pnpm build` (which overrides build artifacts and triggers temporary `MODULE_NOT_FOUND` errors). Instead, run:
    ```bash
    npx tsc --noEmit
    ```
2.  **Schema Updates**: If you modify tables in `src/db/schema.ts`, make sure to run:
    ```bash
    pnpm db:push
    ```
    This updates your local database file so that the client and Drizzle models stay synchronized.
