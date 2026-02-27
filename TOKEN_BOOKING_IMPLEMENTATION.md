# Token & Booking Amount Feature - Implementation Guide

## ✅ Completed Components

### Overview
Implemented a comprehensive token and booking amount tracking system for real estate CRM. Employees can record token and booking amounts, while Admin/SubAdmin can view detailed performance reports.

---

## 📦 Files Created

### 1. Database Migration
**File**: `supabase/migrations/20260227_add_token_booking_fields.sql`

**Fields Added to `leads` table**:
- `token_amount` - Token amount received (₹)
- `token_date` - Date when token was received
- `token_notes` - Additional notes about token
- `token_receipt_no` - Token receipt number
- `booking_amount` - Full booking amount (₹)
- `booking_date` - Booking confirmation date
- `booking_notes` - Booking details
- `booking_unit` - Unit/Plot number allocated
- `booking_receipt_no` - Booking receipt number
- `payment_status` - Payment tracking status

**Indexes Created**:
- `idx_leads_token_date` - Fast token date queries
- `idx_leads_booking_date` - Fast booking date queries
- `idx_leads_assigned_token` - Performance queries by salesperson
- `idx_leads_assigned_booking` - Booking performance queries

### 2. Employee Modals
**File**: `src/crm/components/TokenBookingModals.jsx`

**Exports**:
- `TokenAmountModal` - For recording token amounts
- `BookingAmountModal` - For recording booking confirmations

**Features**:
- ✅ Rupee symbol input fields
- ✅ Date validation (can't be future dates)
- ✅ Receipt number tracking
- ✅ Notes field for payment details
- ✅ Auto-updates lead status
- ✅ Mobile-optimized UI
- ✅ Real-time validation

### 3. Sales Performance Report
**File**: `src/crm/components/SalesPerformanceReport.jsx`

**Features for Admin/SubAdmin**:
- ✅ Salesperson leaderboard with rankings
- ✅ Total tokens and bookings by employee
- ✅ Date range filters (Today, Week, Month, Custom)
- ✅ Employee filter
- ✅ Export to CSV functionality
- ✅ Summary cards with totals
- ✅ Trophy icons for top 3 performers
- ✅ Responsive table layout

**Metrics Tracked**:
- Token count and total amount
- Booking count and total amount
- Total revenue per salesperson
- Leaderboard ranking

### 4. Employee Performance Widget
**File**: `src/crm/components/MyPerformanceWidget.jsx`

**Features for Employees**:
- ✅ Personal total revenue
- ✅ Token and booking breakdown
- ✅ This month performance
- ✅ Transaction counts
- ✅ Motivational messages
- ✅ Currency formatting (Cr, L, K)
- ✅ Beautiful gradient design

---

## 🛠️ Installation Steps

### Step 1: Run Database Migration

```bash
# Connect to your Supabase project
# Go to SQL Editor and run the migration file
```

Or via Supabase CLI:
```bash
supabase migration up
```

### Step 2: Import Components in Lead Management

**In your lead detail or lead table component**:

```jsx
import { TokenAmountModal, BookingAmountModal } from '@/crm/components/TokenBookingModals';
import { useState } from 'react';

// Add state
const [tokenModalOpen, setTokenModalOpen] = useState(false);
const [bookingModalOpen, setBookingModalOpen] = useState(false);
const [selectedLead, setSelectedLead] = useState(null);

// Add save handlers
const handleSaveToken = async (tokenData) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update(tokenData)
      .eq('id', selectedLead.id);
    
    if (error) throw error;
    
    // Refresh leads
    toast.success('Token amount recorded successfully!');
  } catch (error) {
    console.error('Error saving token:', error);
    toast.error('Failed to save token amount');
  }
};

const handleSaveBooking = async (bookingData) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update(bookingData)
      .eq('id', selectedLead.id);
    
    if (error) throw error;
    
    toast.success('Booking confirmed successfully! 🎉');
  } catch (error) {
    console.error('Error saving booking:', error);
    toast.error('Failed to save booking');
  }
};

// Add buttons in your UI
<Button onClick={() => {
  setSelectedLead(lead);
  setTokenModalOpen(true);
}}>
  💰 Add Token
</Button>

<Button onClick={() => {
  setSelectedLead(lead);
  setBookingModalOpen(true);
}}>
  ✅ Confirm Booking
</Button>

// Add modals
<TokenAmountModal
  isOpen={tokenModalOpen}
  onClose={() => setTokenModalOpen(false)}
  onSave={handleSaveToken}
  lead={selectedLead}
/>

<BookingAmountModal
  isOpen={bookingModalOpen}
  onClose={() => setBookingModalOpen(false)}
  onSave={handleSaveBooking}
  lead={selectedLead}
/>
```

### Step 3: Add to Admin Reports Page

**Create or update `src/crm/pages/Reports.jsx`**:

```jsx
import SalesPerformanceReport from '@/crm/components/SalesPerformanceReport';
import { useCRMData } from '@/crm/hooks/useCRMData';

const ReportsPage = () => {
  const { leads, employees } = useCRMData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sales Reports</h1>
      <SalesPerformanceReport leads={leads} employees={employees} />
    </div>
  );
};

export default ReportsPage;
```

### Step 4: Add to Employee Dashboard

**Update `src/crm/pages/EmployeeDashboard.jsx`**:

```jsx
import MyPerformanceWidget from '@/crm/components/MyPerformanceWidget';
import { useCRMData } from '@/crm/hooks/useCRMData';

const EmployeeDashboard = () => {
  const { leads } = useCRMData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MyPerformanceWidget leads={leads} />
      {/* Other dashboard widgets */}
    </div>
  );
};
```

---

## 🎯 Usage Workflow

### For Employees:

1. **Receive Token**:
   - Customer gives token amount
   - Click "Add Token" button on lead
   - Enter token amount, date, receipt number
   - Submit - Lead status updates to "token_received"

2. **Confirm Booking**:
   - Customer confirms booking with full amount
   - Click "Confirm Booking" button
   - Enter booking amount, unit number, receipt
   - Submit - Lead status updates to "booked"

3. **View Performance**:
   - Check "My Performance" widget on dashboard
   - See total tokens, bookings, and revenue
   - Track this month's performance

### For Admin/SubAdmin:

1. **View Reports**:
   - Navigate to Reports page
   - See leaderboard with all salespeople
   - View total tokens and bookings

2. **Filter Data**:
   - Select date range (Today, Week, Month, Custom)
   - Filter by specific employee
   - Export to CSV for further analysis

3. **Track Performance**:
   - Monitor top performers (Gold, Silver, Bronze)
   - Identify sales trends
   - Make data-driven decisions

---

## 📊 Database Schema

```sql
leads table structure (new fields):

| Column Name         | Type      | Description                          |
|---------------------|-----------|--------------------------------------|
| token_amount        | NUMERIC   | Token amount in INR                  |
| token_date          | TIMESTAMP | When token was received              |
| token_notes         | TEXT      | Payment mode, bank details           |
| token_receipt_no    | VARCHAR   | Receipt/transaction reference        |
| booking_amount      | NUMERIC   | Full booking amount in INR           |
| booking_date        | TIMESTAMP | Booking confirmation date            |
| booking_notes       | TEXT      | Installment details, etc.            |
| booking_unit        | VARCHAR   | Unit/Plot allocated (B-204, etc.)    |
| booking_receipt_no  | VARCHAR   | Booking receipt reference            |
| payment_status      | VARCHAR   | pending/token_received/booking_received |
```

---

## 🔍 Query Examples

### Get employee performance:
```sql
SELECT 
  e.name,
  COUNT(CASE WHEN l.token_amount > 0 THEN 1 END) as token_count,
  SUM(l.token_amount) as total_tokens,
  COUNT(CASE WHEN l.booking_amount > 0 THEN 1 END) as booking_count,
  SUM(l.booking_amount) as total_bookings
FROM employees e
LEFT JOIN leads l ON e.id = l.assigned_to
GROUP BY e.id, e.name
ORDER BY (COALESCE(SUM(l.token_amount), 0) + COALESCE(SUM(l.booking_amount), 0)) DESC;
```

### Get this month's performance:
```sql
SELECT 
  SUM(token_amount) as month_tokens,
  SUM(booking_amount) as month_bookings
FROM leads
WHERE assigned_to = 'employee_id'
  AND (token_date >= date_trunc('month', CURRENT_DATE)
    OR booking_date >= date_trunc('month', CURRENT_DATE));
```

---

## ✨ Features Summary

### Employee Features:
- ✅ Record token amounts with dates
- ✅ Confirm bookings with unit allocation
- ✅ Track receipt numbers
- ✅ Add payment notes
- ✅ View personal performance metrics
- ✅ See monthly progress

### Admin/SubAdmin Features:
- ✅ View all employees' performance
- ✅ Leaderboard with rankings
- ✅ Date range filters
- ✅ Employee-specific reports
- ✅ Export to CSV
- ✅ Real-time revenue tracking
- ✅ Top performer identification

---

## 🚀 Next Steps

### Enhancements You Can Add:

1. **Notifications**:
   - Alert admin when token > ₹1L
   - Notify on booking confirmations

2. **Goals & Targets**:
   - Set monthly targets per employee
   - Show progress bars
   - Achievement badges

3. **Charts & Graphs**:
   - Line chart for monthly trends
   - Bar chart comparing employees
   - Pie chart for token vs booking ratio

4. **Payment Tracking**:
   - Add installment schedule
   - Track pending payments
   - Payment reminder system

5. **Commission Calculation**:
   - Auto-calculate commission
   - Commission payout reports
   - Incentive tracking

---

## 🐛 Troubleshooting

### Issue: Migration fails
**Solution**: Check if columns already exist. Use `IF NOT EXISTS` in ALTER statements.

### Issue: Modals don't open
**Solution**: Ensure state management is correct and Dialog component is imported.

### Issue: Data not showing in reports
**Solution**: 
- Verify leads have `assigned_to` field populated
- Check date filters
- Ensure employees array is loaded

### Issue: CSV export empty
**Solution**: Check browser console for errors. Ensure data is filtered correctly.

---

## 📝 Testing Checklist

- [ ] Run database migration successfully
- [ ] Test TokenAmountModal on mobile and desktop
- [ ] Test BookingAmountModal with all fields
- [ ] Verify data saves to database
- [ ] Check SalesPerformanceReport loads all employees
- [ ] Test date range filters
- [ ] Test CSV export
- [ ] Verify MyPerformanceWidget shows correct data
- [ ] Test with multiple employees
- [ ] Verify leaderboard ranking is correct

---

**Implementation Date**: February 27, 2026  
**Status**: ✅ Ready for Integration  
**Next Feature**: Follow-up Priority System
