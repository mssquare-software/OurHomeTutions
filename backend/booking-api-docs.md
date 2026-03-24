# Booking API Documentation

## Base URL
`http://192.168.0.34:8080/api/bookings`

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create New Booking
**POST** `/`

Creates a new booking with all required details.

**Request Body:**
```json
{
  "classLevel": "10",
  "board": "cbse",
  "subjects": ["Mathematics", "Science"],
  "topics": ["Algebra", "Physics"],
  "hours": 2,
  "mode": "online",
  "date": "2026-03-20",
  "time": "10:00",
  "lessonType": "group",
  "participants": ["Student 1", "Student 2"],
  "address": "123 Main St, City",
  "contact": "9876543210",
  "paymentMethod": "razorpay",
  "amount": 1000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": "booking-uuid",
      "parent_id": "parent-uuid",
      "class_level": "10",
      "board": "cbse",
      "subjects": ["Mathematics", "Science"],
      "status": "pending",
      "payment_status": "pending",
      "created_at": "2026-03-17T10:00:00Z"
    },
    "payment": {
      "id": "payment-uuid",
      "booking_id": "booking-uuid",
      "amount": 1000,
      "status": "pending",
      "payment_method": "razorpay"
    }
  }
}
```

### 2. Get My Bookings
**GET** `/my-bookings`

Retrieves all bookings for the authenticated parent.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "booking-uuid",
      "parent_id": "parent-uuid",
      "class_level": "10",
      "board": "cbse",
      "subjects": ["Mathematics"],
      "status": "confirmed",
      "payment_status": "paid",
      "scheduled_date": "2026-03-20T10:00:00Z",
      "duration_minutes": 120,
      "class_mode": "online",
      "lesson_type": "single",
      "participants": ["Student 1"],
      "contact": "9876543210",
      "price": 500,
      "created_at": "2026-03-17T10:00:00Z"
    }
  ]
}
```

### 3. Get Booking Details
**GET** `/:id`

Retrieves detailed information about a specific booking.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "booking-uuid",
    "parent_id": "parent-uuid",
    "class_level": "10",
    "board": "cbse",
    "subjects": ["Mathematics", "Science"],
    "topics": ["Algebra", "Physics"],
    "status": "confirmed",
    "payment_status": "paid",
    "scheduled_date": "2026-03-20T10:00:00Z",
    "duration_minutes": 120,
    "class_mode": "online",
    "lesson_type": "group",
    "participants": ["Student 1", "Student 2"],
    "location": null,
    "contact": "9876543210",
    "price": 1000,
    "created_at": "2026-03-17T10:00:00Z",
    "updated_at": "2026-03-17T10:30:00Z"
  }
}
```

### 4. Update Booking Status
**PATCH** `/:id/status`

Updates the status of a booking (Admin/Tutor/Parent only).

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Status Values:**
- `pending` - Initial state
- `confirmed` - Booking confirmed by tutor
- `in_progress` - Session is currently running
- `completed` - Session completed successfully
- `cancelled` - Booking was cancelled

**Response:**
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "id": "booking-uuid",
    "status": "confirmed",
    "updated_at": "2026-03-17T10:30:00Z"
  }
}
```

### 5. Update Payment Status
**PATCH** `/payment/:id/status`

Updates the status of a payment.

**Request Body:**
```json
{
  "status": "completed",
  "transactionId": "txn_123456789"
}
```

**Valid Payment Status Values:**
- `pending` - Payment initiated but not completed
- `completed` - Payment successfully processed
- `failed` - Payment failed
- `refunded` - Payment was refunded

**Response:**
```json
{
  "success": true,
  "message": "Payment status updated successfully",
  "data": {
    "id": "payment-uuid",
    "status": "completed",
    "transaction_id": "txn_123456789",
    "updated_at": "2026-03-17T10:30:00Z"
  }
}
```

### 6. Get All Bookings (Admin Only)
**GET** `/all`

Retrieves all bookings in the system (Admin access required).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "booking-uuid",
      "parent_id": "parent-uuid",
      "status": "pending",
      "payment_status": "pending",
      "created_at": "2026-03-17T10:00:00Z"
    }
  ]
}
```

## Validation Rules

### Contact Number
- Must be exactly 10 digits
- Must start with 6, 7, 8, or 9
- Regex: `/^[6-9]\d{9}$/`

### Class Level
- Must be between 1 and 12
- Required field

### Board
- Must be either "cbse" or "state"
- Required field

### Subjects
- Must be an array with at least 1 subject
- Required field

### Hours
- Must be between 1 and 2
- Required field

### Mode
- Must be either "online" or "offline"
- Required field

### Lesson Type
- Must be either "single" or "group"
- Required field

### Participants
- Single session: Exactly 1 participant
- Group session: 1 to 5 participants
- Required field

### Address
- Required only for offline mode
- Optional for online mode

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "contact",
      "message": "Contact must be a valid 10-digit mobile number"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "message": "Access denied"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Booking not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Notifications

The system automatically sends notifications to:

1. **Admin Users** - When a new booking is created
2. **Tutors** - When a booking matches their subjects
3. **Parents** - When booking status changes
4. **Parents** - When payment is confirmed

## Payment Flow

1. Booking is created with `payment_status: "pending"`
2. Payment is processed through the selected payment method
3. Payment status is updated via `/payment/:id/status`
4. When payment is `completed`, booking status automatically changes to `confirmed`
5. Notifications are sent to parent and relevant parties
