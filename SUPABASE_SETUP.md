# Supabase Database Setup Guide

## 🚀 Quick Setup

### 1. Run the SQL Schema
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the sidebar
3. Copy and paste the entire content of `backend/supabase-schema.sql`
4. Click "Run" to execute the schema

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cd backend
cp .env.example .env
```

Your `.env` file already has the Supabase configuration:
```
SUPABASE_URL=https://gjusrbtrohibyxnglwai.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Start the Backend
```bash
cd backend
npm run dev
```

## 📊 What Gets Stored in Supabase

### Bookings Table
- **Parent ID**: Who made the booking
- **Tutor ID**: Assigned tutor
- **Subject ID**: Subject information
- **Class Mode**: online/offline
- **Lesson Type**: single/group
- **Scheduled Date**: When the session happens
- **Duration**: Session length in minutes
- **Price**: Cost of the session
- **Status**: pending/confirmed/completed
- **Location**: Address details (JSON)
- **Payment Status**: paid/pending/refunded

### Additional Details Stored
- **Class**: Which class (1-12)
- **Board**: CBSE/STATE/ICSE/IB
- **Subjects**: All selected subjects
- **Topics**: Specific topics for each subject
- **Hours per Subject**: Duration breakdown
- **Participants**: Student names and contact
- **Parent Name**: Who booked
- **Contact Info**: Phone/email details
- **Selected Time**: Time slot chosen
- **Selected Date**: Date of booking

### Payments Table
- **Booking ID**: Links to booking
- **Amount**: How much was paid
- **Currency**: INR/USD/etc
- **Status**: completed/failed/refunded
- **Payment Method**: razorpay/upi/paypal
- **Transaction ID**: Payment reference

### Notifications Table
- **User ID**: Parent or tutor
- **Title**: Notification title
- **Message**: Full message content
- **Type**: booking/payment/system/location
- **Read Status**: Read/unread
- **Data**: Additional JSON data

## 🧪 Testing the Integration

### 1. Make a Test Booking
1. Open the React Native app
2. Complete a full booking flow
3. Select any subject, time slot, and complete payment
4. Check the backend console for Supabase logs

### 2. Check Supabase Dashboard
1. Go to your Supabase project
2. Click on "Table Editor" in sidebar
3. View the following tables:
   - `bookings` - Should show your new booking
   - `payments` - Should show payment record
   - `notifications` - Should show confirmation messages

### 3. Verify Data Storage
Your booking should contain:
```json
{
  "class": "10",
  "board": "CBSE", 
  "subjects": {"Mathematics": ["Algebra", "Geometry"]},
  "topics": ["Algebra", "Geometry"],
  "participants": [{"name": "Student Name", "contact": "Phone"}],
  "parentName": "Parent Name",
  "selectedTime": "16:00",
  "selectedDate": "2026-03-12",
  "mode": "online",
  "address": "Full address"
}
```

## 🔍 Debugging

### Check Console Logs
Look for these messages:
```
🗄️ Storing booking in Supabase: {...}
✅ Booking successfully stored in Supabase: {...}
❌ Supabase booking creation failed: {...}
```

### Common Issues
1. **Subject not found**: Make sure subjects exist in the subjects table
2. **No suitable tutor**: Add tutors to the users table with role='tutor'
3. **Permission denied**: Check RLS policies in Supabase
4. **Connection failed**: Verify SUPABASE_URL and keys

## 📱 Features Now Working

✅ **Persistent Storage**: Bookings saved to database
✅ **Tutor Assignment**: Automatic tutor matching
✅ **Payment Records**: Complete payment tracking
✅ **Notifications**: Real-time booking confirmations
✅ **Message System**: All messages stored in database
✅ **Data Retrieval**: Fetch booking history and notifications

## 🎯 Next Steps

1. **Add Real Tutors**: Insert tutor records in users table
2. **Set Up RLS**: Configure proper row-level security
3. **Add More Subjects**: Populate subjects table as needed
4. **Implement Auth**: Connect with user authentication
5. **Add Location**: Store GPS coordinates for offline classes

Your booking system is now fully integrated with Supabase! 🎉
