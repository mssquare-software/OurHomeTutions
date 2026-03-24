# OurHomeTutions Backend API

Backend API for the OurHomeTutions mobile app, integrated within the React Native project.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **User Management**: Support for parents, tutors, and admins
- **Booking System**: Complete tutoring session booking workflow
- **Payment Integration**: Razorpay/PayPal payment processing
- **Real-time Tracking**: WebSocket-based location tracking
- **Notifications**: In-app notification system
- **Subject Management**: CBSE/State board subjects management
- **Location Services**: Location-based tutor discovery

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Setup

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase configuration:
```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-super-secret-jwt-key
```

3. **Set up Supabase database**:
   - Go to your Supabase project dashboard
   - Open the SQL Editor
   - Run the SQL commands from `supabase-schema.sql`

4. **Start the server**:
```bash
npm run dev
```

The server will start on `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get specific booking
- `PATCH /api/bookings/:id/status` - Update booking status

### Subjects
- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/board/:board` - Get subjects by board
- `GET /api/subjects/class/:classLevel/board/:board` - Get subjects by class and board

### And more...

## WebSocket Events

- `join-tracking` - Join tracking room for a booking
- `location-update` - Send/receive location updates
- `booking-status` - Send/receive booking status updates
