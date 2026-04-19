# Broker Admin Panel (Separate Internal App)

This module implements a **separate internal admin panel** for broker payout management at `/broker/admin/*`.

## Design goals
- Operations-first sidebar layout
- Works on top of existing Supabase Auth session
- Uses `bp_*` + `brokers` tables as source of truth
- Indian currency formatting (`en-IN`, INR)
- Built with modular pages/components for scalability

## Modules delivered
1. Dashboard
2. Projects
3. Inventory / Plots
4. Bookings
5. Customers
6. Brokers
7. Payout Queue
8. Commission Rules
9. Reports
10. Settings / Audit / Notifications

## Notes
- `adminApi` centralizes Supabase interactions.
- `ModulePage` provides reusable listing + quick create/update scaffolding.
- `DashboardPage` includes KPI cards, charts, recent activity, and alert panel.
- Keep extending table-specific actions (confirmations, stage actions, batch payout actions) in dedicated components under `components/`.
