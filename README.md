# Teammate — Employee Scheduling App

A full-stack employee scheduling web application built with Next.js 14, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database + Auth**: Supabase
- **Styling**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel (free tier)

---

## Setup Instructions

### 1. Clone / Download this project

```bash
git clone <your-repo-url>
cd teammate
npm install
```

### 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for it to finish provisioning

### 3. Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase-schema.sql`
3. Paste it into the editor and click **Run**
4. This creates all tables, indexes, RLS policies, and triggers

### 4. Configure Auth

In your Supabase dashboard:
1. Go to **Authentication → Settings**
2. Under **Email Auth**, disable **"Confirm email"** (for simpler V1 experience)
3. Set your site URL to `http://localhost:3000` (development) or your Vercel URL (production)

### 5. Create the Storage Bucket

In your Supabase dashboard:
1. Go to **Storage**
2. Click **New bucket**
3. Name it `org-logos`
4. Check **"Public bucket"**
5. Click **Create bucket**

### 6. Set Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in your values from the Supabase dashboard (**Settings → API**):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/teammate.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project**
3. Import your `teammate` repository
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
   - `NEXT_PUBLIC_APP_URL` → your Vercel deployment URL (e.g. `https://teammate.vercel.app`)
5. Click **Deploy**

### 3. Update Supabase Auth Settings

Once deployed, go back to Supabase:
1. **Authentication → Settings → Site URL** → set to your Vercel URL
2. **Authentication → Settings → Redirect URLs** → add your Vercel URL

---

## Features

### Manager Features
- Create and brand your organization (logo, colors, font)
- Manage shift types as reusable templates
- Create weekly or monthly scheduling periods
- Open periods for availability collection
- Share availability link with employees
- Visual schedule builder with week view
- See available/unavailable employees per shift
- Assign employees with one click, see hours update live
- Add manual write-in assignments
- Publish schedules for employees to view
- Review and approve/deny drop requests
- Archive completed schedules

### Employee Features
- See all open availability periods directly on dashboard
- Submit availability shift-by-shift (no link required)
- View published schedules with team assignments
- Request to drop assigned shifts
- View historical schedules

---

## Project Structure

```
teammate/
├── app/
│   ├── (auth)/login/        # Login page
│   ├── (auth)/signup/       # Signup page
│   ├── (app)/               # Protected app routes
│   │   ├── dashboard/       # Manager & employee dashboards
│   │   ├── schedule/        # Schedule builder
│   │   ├── employees/       # Employee management
│   │   ├── availability/    # Availability submission
│   │   ├── my-schedule/     # Employee schedule view
│   │   ├── history/         # Archived schedules
│   │   ├── settings/        # Org settings
│   │   └── profile/         # User profile
│   └── join/[code]/         # Join via link
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Sidebar, topbar, mobile nav
│   ├── schedule/            # Schedule builder components
│   ├── dashboard/           # Dashboard components
│   └── shared/              # Reusable components
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── hooks/               # React hooks (org context)
│   ├── types.ts             # TypeScript types
│   ├── utils.ts             # Helper functions
│   └── constants.ts         # App constants
├── middleware.ts             # Auth route protection
└── supabase-schema.sql      # Complete DB schema
```

---

## Customization

- **Colors**: Each organization sets its own primary/secondary colors in Settings
- **Fonts**: Choose from Inter, Plus Jakarta Sans, DM Sans, or Outfit
- **Logo**: Upload to Supabase storage via Settings
- **Timezone**: Per-organization timezone setting

---

## License

MIT
