# Vereins-Management

> Club/Association Management System built with Next.js and Supabase

> Project Name: Club Management System (VMS - Vereins-Management-System) Description: A modular digital platform for club administration, specifically optimized for Carnival and Sports associations, focusing on financial transparency, member engagement, and data privacy.

---

## Tech Stack Overview

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (pre-installed)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **API:** Next.js API Routes + Supabase Client

### Dev Tools
- **Linting:** ESLint (Next.js config)
- **Package Manager:** npm

---

## Roles & Access Control (RBAC)
The system uses a multi-role approach where users can hold multiple positions simultaneously.

- **Board (Vorstand):** Full administrative access to finances, documents, and all member data.

- **Trainer:** Access to training management, attendance tracking, and group-specific communications.

- **Member (Mitglied):** Access to personal profile, assigned workgroups, and authorized documents.

- **Feature:** Dashboard Switcher – Users with multiple roles (e.g., a Board member who is also a Trainer/Dancer) can toggle between specialized views via a dedicated UI button.

---

## High-Level Roadmap & Feature-IDs

| ID | Feature | Description | Status | Priority |
|---------|-------------|---------|-------------|
| CORE-01 | Member & Family Mgmt | Profiles (Name, DoB, Role). Logical grouping of families for billing. | Planned | P0 |
| FIN-01 | Financials & Fees | Income/Expense tracking. Fee status (Paid/Partial/Open) for individuals & families. | Planned | P0 |
| WORK-01 | Workgroups (PM) | Kanban (Touch/DnD), file uploads, and private chats (first names only, auto-delete). | Planned | P1 |
| ORG-01 | Groups & Training | Group setup with auto-age range calculation. Training attendance with required reasons. | Planned | P1 |
| EVENT-01 | Event Management | Performance/Match planning (Location, Time, Description, Group assignment). | Planned | P2 |
| DOC-01 | Document Cloud | Tiered access for protocols and info. Strict GDPR compliance for sensitive data. | Planned | P2 |
| INV-01 | Inventory Management | Tracking of costumes, equipment, and rentals (who has what?). | Planned | P3 |

---
## Folder Structure

```
vereins-management/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   └── ui/              # shadcn/ui components (Button, Card, Dialog, etc.)
│   └── lib/                 # Utility functions
│       ├── supabase.ts      # Supabase client initialization
│       └── utils.ts         # Helper functions (cn for classnames)
├── public/                  # Static assets (images, fonts)
├── features/                # Feature specifications (AI workflow)
├── .claude/                 # AI agent configurations
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration (strict mode)
└── package.json             # Dependencies and scripts
```

---

## Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**How to get these values:**
1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Go to Settings > API
4. Copy the "Project URL" and "anon public" key

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Pre-installed UI Components

The following shadcn/ui components are ready to use:

- **Layout:** Card, Separator, Scroll Area, Sheet, Sidebar
- **Forms:** Button, Input, Label, Checkbox, Radio Group, Select, Switch, Form
- **Feedback:** Alert, Alert Dialog, Dialog, Toast (Sonner), Progress, Skeleton
- **Navigation:** Navigation Menu, Dropdown Menu, Tabs, Accordion, Breadcrumb, Pagination
- **Display:** Avatar, Badge, Tooltip, Popover, Command (search), Collapsible

Import example:
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
```

---

## Next Steps for Development

1. **Set up Supabase project**
   - Create a new project at supabase.com
   - Add credentials to `.env.local`

2. **Design your database schema**
   - Members table (name, email, role, etc.)
   - Events table (title, date, description)
   - Memberships table (fees, status)

3. **Build core features**
   - Member management (CRUD)
   - Event calendar
   - Membership tracking
   - Dashboard with statistics

4. **Add authentication**
   - Supabase Auth for login/signup
   - Role-based access control

---

# CORE-01: Member & Family Management

## Description
Management of all physical persons, their roles, and their grouping into families for unified billing.

## User Roles (System Permissions)
- **Board (Admin):** Can manage all data, finances, and global settings.
- **Trainer:** Can manage groups assigned to them and track attendance.
- **Member (User):** Can view their own data, groups, and assigned tasks.

## Member Tags (Descriptive Only)
- Dancer, Trainer, Helper, etc. (Multi-select).
- These do not grant permissions but allow for quick filtering in lists.

## Functional Requirements
1. **Family Grouping:** - A `Family` entity connects multiple members.
   - One member is designated as the "Primary Contact" (Head of Family).
2. **Membership Types:**
   - Definitions created by Board (e.g., "Standard", "Child", "Family-Flat").
   - Each type has a fixed annual/quarterly fee.
3. **Training Tracking:**
   - Members can RSVP to training sessions.
   - Absences require a text reason.
   - **Data Privacy:** Absense reasons are automatically deleted from the database after 4 weeks.

## Database Schema (Proposed)
- `profiles`: id, first_name, last_name, dob, email, family_id, system_role (enum), functional_tags (array).
- `families`: id, family_name, primary_member_id.
- `membership_types`: id, label, fee_amount, billing_cycle.
- `attendance`: id, member_id, session_id, status (present/absent), reason (text), created_at.

---

# FIN-01: Financials & Fee Management

## Description
Tracks income and expenses with a specialized focus on membership fees. Supports both individual and family-based billing with partial payment tracking.

## Functional Requirements

### 1. Fee Dashboard (View A)
- **Unified List:** A single view showing both individual members and families.
- **Collapsible Families:** Families are shown as one row/block. Clicking it expands to show all linked members.
- **Status Indicators:** - **Paid:** Balance is 0.
  - **Partial:** Balance is > 0 but some payments exist.
  - **Open:** No payments made for the current period.
- **At a Glance:** The main view must always show the "Remaining Balance" (Total Fee minus Sum of Payments).

### 2. Payment History (View B)
- **Detail Popup:** Clicking a member/family opens a modal showing a chronological history of payments (e.g., "2026-03-01: €25.00").
- **Manual Entry:** Admins can add payments manually, specifying the amount and date.

### 3. Billing Logic (Due Dates)
- **Standard Cycle:** Fees are generated globally on January 1st (01.01.) for all existing members.
- **Pro-rated/New Members:** If a member joins after Jan 1st, their fee is triggered immediately upon their join date for the remainder of the year.

## Data Model (Draft)
- `membership_fees`: id, profile_id (optional), family_id (optional), year, total_amount, status.
- `transactions`: id, fee_id, amount_paid, payment_date, note.
- `financial_logs`: id, type (income/expense), amount, category, description, date.

## UI Requirements
- Use **shadcn/ui Collapsible** for the family rows.
- Use **shadcn/ui Dialog** for the payment history and entry modal.
- Progress bar for "Paid vs. Total" on each row for quick visual feedback.

---

# ORG-01: Groups & Training Management

## Description
Management of club divisions (e.g., Show Dance, Guard, Male Ballet) and their recurring training schedules. Focuses on attendance tracking and automated age demographics.

## Functional Requirements

### 1. Group Administration
- **Dynamic Age Range:** The system automatically calculates and displays the current age span of the group (e.g., "Age 6 - 11") based on the birth dates of all assigned members.
- **Member Assignment:** Members can be part of multiple groups.
- **Trainer Assignment:** Specific users with the "Trainer" role are assigned to manage a group.

### 2. Training Sessions & Attendance (RSVP)
- **Schedule:** Trainers can create training events.
- **RSVP Logic:** Members (or parents) can confirm or decline attendance.
- **Absence Tracking:** If a member declines, a reason is mandatory. 
- **Trainer View:** Trainers see a detailed calendar/list history of absences per member to identify patterns.
- **Data Privacy:** Absence reasons are strictly visible only to the assigned Trainer and the Board. Reasons are auto-deleted after 4 weeks.

### 3. Communication
- **Group Chat:** A dedicated real-time chat for each group.
- **Access:** All members of the group can participate.
- **Board Oversight:** Board members have read-access for safety and coordination.

### 4. Internal Trainer Notes
- **Private Log:** A text area for Trainers to document training progress (e.g., "Finished choreography for part 1").
- **Visibility:** These notes are hidden from regular members.

## Data Model (Draft)
- `groups`: id, name, description, age_min (calc), age_max (calc).
- `group_members`: id, group_id, profile_id.
- `training_sessions`: id, group_id, date, start_time, end_time, trainer_notes.
- `attendance_logs`: (Referencing CORE-01 logic) status, reason, created_at.
- `group_messages`: id, group_id, sender_id, content, created_at.

## UI Requirements
- **Dashboard Widget:** "Upcoming Trainings" for members.
- **Trainer Dashboard:** Attendance heat-map or list view for their specific groups.

---

# WORK-01: Workgroups & Project Management

## Description
A collaborative task management tool for specific club projects (e.g., Float Building, Event Planning). Designed for mobile-first usage with a high focus on data privacy.

## Functional Requirements

### 1. Dynamic Kanban Board
- **Custom Columns:** Group administrators can define and rename columns (e.g., "Backlog", "In Preparation", "Ready for Session").
- **Touch-Optimized:** Full Drag & Drop support for mobile devices (using touch gestures).
- **Task Assignment:** Every group member can create tasks and assign them to themselves or others.

### 2. Privacy-First Communication
- **Anonymized Chat:** Users are displayed as "Firstname + First Letter of Lastname" (e.g., "Max M.").
- **Automated Cleanup:** To ensure data privacy, the entire chat history is permanently deleted once the workgroup is archived or dissolved.

### 3. Task Details & Attachments
- **Document Upload:** Files can be attached directly to tasks.
- **Constraints:** Max. 10MB per file and a limit of 5 files per task to manage storage costs.
- **Checklists:** Sub-tasks can be added to any main task.

## Data Model (Draft)
- `workgroups`: id, name, status (active/archived), created_by.
- `kanban_columns`: id, workgroup_id, title, order_index.
- `tasks`: id, column_id, title, description, assigned_to (profile_id), due_date.
- `task_attachments`: id, task_id, file_path, file_size, uploader_id.
- `workgroup_chat`: id, workgroup_id, sender_id, message, created_at.

## UI Requirements
- Use **dnd-kit** or **framer-motion** for fluid mobile drag-and-drop.
- **Visual Privacy:** Ensure the chat interface only fetches and renders the partial name format.

---

# EVENT-01: Event & Performance Management

## Description
Centralized management of club events, performances, and matches. It bridges the gap between administrative planning and member participation.

## Functional Requirements

### 1. Event Planning & Status
- **Extended Status Workflow:** Supports "Request" (Option), "Confirmed" (Fixed), and "Cancelled".
- **Role-Based Visibility:** Board members manage all statuses; members only see "Confirmed" events.

### 2. Group & Personnel Assignment
- **Granular Selection:** Trainers or Board members first assign a group to an event and then manually select which specific members of that group are required for the performance.
- **RSVP System:** Selected members must confirm or decline their participation. Unlike training, no reason is required for declining an event.

### 3. Member Information & Logistics
- **Event Details:** Displays Date, Time, Location (with Map integration), and a specific Meeting Point.
- **Run of Show (Ablaufplan):** A detailed timeline for members (e.g., 19:00 Arrival, 19:30 Performance, 20:00 Departure).
- **Logistics Info:** Dedicated section for travel arrangements, bus departure times, or parking instructions.

### 4. Sports-Specific Adaptability
- While optimized for Carnival (Performances), the structure allows for Sports matches by utilizing the "Logistics" and "Personnel Selection" fields for team rosters.

## Data Model (Draft)
- `events`: id, title, description, status (enum), location_name, address, meeting_point, start_time, end_time.
- `event_schedule`: id, event_id, time, activity_description.
- `event_assignments`: id, event_id, profile_id, rsvp_status (confirmed/declined/pending).
- `event_logistics`: id, event_id, info_text (e.g., "Bus departure at 18:00").

## UI Requirements
- **Event Card:** Visual countdown to the next "Confirmed" event.
- **Attendance Overview:** A summary for trainers showing how many selected members have already confirmed.
- **Map Integration:** Quick-link to open the location in Google Maps or Apple Maps.

---

# DOC-01: Document Management (Cloud)

## Description
A secure, tiered file storage system for meeting minutes, event schedules, and general club information. Focuses on GDPR compliance and audit-proof versioning.

## Functional Requirements

### 1. Flexible Organization
- **Custom Folder System:** Board members can create, rename, and nest folders to organize documents (e.g., "Season 2026" > "Protocols").
- **Versioning:** Every time a document is updated, the previous version is archived. Admins can view and restore older versions to ensure audit-readiness.

### 2. Granular Access Control
- **Tiered Permissions:** Access can be granted via:
  - **System Roles:** (e.g., "All Board Members").
  - **Groups:** (e.g., Only members of the "Show Dance" group).
  - **Individual Level:** Specific users can be granted access to sensitive files.
- **Privacy:** Files in "Board Only" folders are strictly invisible to all other users at the database level (RLS).

### 3. Compliance Features
- **Mandatory Read Receipts:** During upload, an admin can toggle "Require Read Confirmation." 
- **Tracking:** The system tracks which authorized members have opened/acknowledged the document and displays a "Pending/Read" list to the admin.
- **Preview:** Built-in PDF viewer to prevent unnecessary downloads to private devices.

## Data Model (Draft)
- `folders`: id, name, parent_id, created_by.
- `documents`: id, folder_id, current_version_id, title, category, requires_confirmation (boolean).
- `document_versions`: id, document_id, storage_path, version_number, uploaded_by, created_at.
- `document_permissions`: id, document_id, profile_id (opt), group_id (opt), role (opt).
- `read_confirmations`: id, document_id, profile_id, confirmed_at.

## UI Requirements
- **Admin View:** Progress bar showing the percentage of "Read Confirmations" for a file.
- **Member View:** A "New Documents" badge or notification for files requiring immediate attention.
- **Tree Navigation:** A sidebar for folder navigation.

---

# INV-01: Inventory & Asset Management

## Description
A comprehensive tracking system for club assets including costumes, technical equipment, and props. Supports QR/Barcode scanning for rapid inventory and location management.

## Functional Requirements

### 1. Categorization & Structure
- **Categories:** Flexible folders/categories (e.g., "Costumes", "Tech", "Props").
- **Costume Sets:** Special "Set" entity to group items that belong together (e.g., a Garde-uniform consisting of jacket, hat, skirt, and boots). Admins define the contents of each set.
- **Size Management:** Uses free-text fields to accommodate tailored or non-standard costume measurements.

### 2. Location & Rental Tracking
- **Hybrid Tracking:** Track if an item is at a specific **Location** (e.g., Warehouse Shelf A) or assigned to a **Person** (e.g., Loaned to Max M.).
- **Status System:** Every item/set has a status: `Available`, `Loaned`, `Defective`, or `In Cleaning`.

### 3. QR/Barcode System (Mobile First)
- **Code Generation:** Generate printable QR or Barcodes for individual items or entire storage locations (e.g., a shelf for paint).
- **Scanner Integration:** Use the smartphone camera within the app to scan a code.
- **Action on Scan:** Scanning a code immediately opens the item/location details to add/remove items or change loan status.

### 4. Inventory Audit
- Ability to perform a digital "Inventory Check" where items are scanned and marked as "Verified" for the current year.

## Data Model (Draft)
- `inventory_items`: id, category_id, name, description, size_info, qr_code_data, status (enum), current_location_id, current_holder_id.
- `inventory_sets`: id, set_name, item_list (array of IDs).
- `locations`: id, name, parent_location_id, qr_code_data.
- `loan_history`: id, item_id, profile_id, loan_date, return_date.

## UI Requirements
- **Camera View:** Integrated scanner overlay for mobile users.
- **Print View:** Dedicated layout to print labels for folders or items.
- **Status Badges:** Color-coded indicators for "Defective" or "Loaned" items.

---

## Development Workflow

This project includes an AI agent workflow (see `HOW_TO_USE_AGENTS.md`):

1. **Requirements Engineer** - Define feature specs
2. **Solution Architect** - Design database/architecture
3. **Frontend Developer** - Build UI components
4. **Backend Developer** - Supabase queries & API
5. **QA Engineer** - Test features
6. **DevOps** - Deployment

---

**Ready to start building!**

