# Fanbe Real Estate Website

A modern real estate website with integrated CRM system built with React, Vite, and Supabase.

## Features

- 🏠 Property listings and showcase
- 📊 Integrated CRM system for admin, sales manager, and sales executive roles
- 📱 Fully responsive design
- 🔐 Supabase Auth + Row Level Security (RLS)
- 📈 Analytics and reporting

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **UI Components**: Radix UI
- **Backend**: Supabase (Auth, Postgres, Edge Functions)

## Getting Started

### Prerequisites

- Node.js 22.x or higher
- npm or yarn

### Installation

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Supabase Setup

1. Create a Supabase project.
2. Add environment variables in `.env.local`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

3. Deploy Edge Function:

```bash
supabase functions deploy create_employee
```

4. Set function secrets (dashboard or CLI):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

5. Ensure DB has `profiles`, `leads`, `site_visits`, and `bookings` tables + RLS policies.

## CRM Role Routes

- **Super Admin**: `/crm/admin/*`
- **Sales Manager**: `/crm/manager/*`
- **Sales Executive**: `/crm/employee/*`

## Deployment

This project is configured for deployment on Hostinger.

- **Framework**: Vite
- **Node version**: 22.x
- **Build command**: `npm run build`
- **Output directory**: `dist`

## Project Structure

```
├── src/
│   ├── components/
│   ├── crm/
│   ├── pages/
│   ├── context/
│   ├── lib/
│   ├── data/
│   └── App.jsx
├── supabase/functions/create_employee/
├── public/
├── index.html
└── vite.config.js
```

## License

Private - All rights reserved.
