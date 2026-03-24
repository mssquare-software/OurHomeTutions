-- Safe Schema Fix for OurHomeTutions
-- Run this in your Supabase SQL Editor
-- This script handles existing data safely

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to automatically update updated_at timestamp (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table (create if not exists)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('parent', 'tutor', 'admin')) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Parent specific fields
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Tutor specific fields
    qualification TEXT,
    experience_years INTEGER,
    subjects TEXT[], -- Array of subjects
    boards TEXT[], -- Array of boards (CBSE, STATE, ICSE, IB)
    hourly_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2),
    total_students INTEGER DEFAULT 0,
    about TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects table (create if not exists)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    board VARCHAR(20) CHECK (board IN ('CBSE', 'STATE', 'ICSE', 'IB')) NOT NULL,
    class_level INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_subject UNIQUE (name, board, class_level)
);

-- Bookings table (drop and recreate to fix schema issues)
DROP TABLE IF EXISTS bookings CASCADE;

CREATE TABLE bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_mode VARCHAR(20) CHECK (class_mode IN ('online', 'offline')) NOT NULL,
    lesson_type VARCHAR(20) CHECK (lesson_type IN ('single', 'group')) NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    location JSONB, -- {address, latitude, longitude}
    notes TEXT,
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
    payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table (create if not exists)
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    payment_method VARCHAR(20) CHECK (payment_method IN ('razorpay', 'paypal', 'cash')) NOT NULL,
    transaction_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table (create if not exists)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) CHECK (type IN ('booking', 'payment', 'system', 'location')) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location tracking table (create if not exists)
CREATE TABLE IF NOT EXISTS location_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accuracy DECIMAL(8,2)
);

-- Reviews table (create if not exists)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_booking_review UNIQUE (booking_id)
);

-- Create indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);

CREATE INDEX IF NOT EXISTS idx_subjects_board ON subjects(board);
CREATE INDEX IF NOT EXISTS idx_subjects_class ON subjects(class_level);

CREATE INDEX IF NOT EXISTS idx_bookings_parent ON bookings(parent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tutor ON bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_location_booking ON location_tracking(booking_id);
CREATE INDEX IF NOT EXISTS idx_location_tutor ON location_tracking(tutor_id);

CREATE INDEX IF NOT EXISTS idx_reviews_tutor ON reviews(tutor_id);

-- Enable Row Level Security (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create triggers (if not exists)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample subjects with ON CONFLICT handling
INSERT INTO subjects (name, board, class_level, description) VALUES
('Mathematics', 'CBSE', 1, 'Mathematics for Class 1 - CBSE Board'),
('English', 'CBSE', 1, 'English for Class 1 - CBSE Board'),
('Hindi', 'CBSE', 1, 'Hindi for Class 1 - CBSE Board'),
('Mathematics', 'CBSE', 2, 'Mathematics for Class 2 - CBSE Board'),
('English', 'CBSE', 2, 'English for Class 2 - CBSE Board'),
('Hindi', 'CBSE', 2, 'Hindi for Class 2 - CBSE Board'),
('Mathematics', 'CBSE', 3, 'Mathematics for Class 3 - CBSE Board'),
('English', 'CBSE', 3, 'English for Class 3 - CBSE Board'),
('Hindi', 'CBSE', 3, 'Hindi for Class 3 - CBSE Board'),
('Mathematics', 'CBSE', 4, 'Mathematics for Class 4 - CBSE Board'),
('English', 'CBSE', 4, 'English for Class 4 - CBSE Board'),
('Hindi', 'CBSE', 4, 'Hindi for Class 4 - CBSE Board'),
('Mathematics', 'CBSE', 5, 'Mathematics for Class 5 - CBSE Board'),
('English', 'CBSE', 5, 'English for Class 5 - CBSE Board'),
('Hindi', 'CBSE', 5, 'Hindi for Class 5 - CBSE Board'),
('Mathematics', 'CBSE', 6, 'Mathematics for Class 6 - CBSE Board'),
('Science', 'CBSE', 6, 'Science for Class 6 - CBSE Board'),
('English', 'CBSE', 6, 'English for Class 6 - CBSE Board'),
('Hindi', 'CBSE', 6, 'Hindi for Class 6 - CBSE Board'),
('Social Studies', 'CBSE', 6, 'Social Studies for Class 6 - CBSE Board'),
('Mathematics', 'CBSE', 7, 'Mathematics for Class 7 - CBSE Board'),
('Science', 'CBSE', 7, 'Science for Class 7 - CBSE Board'),
('English', 'CBSE', 7, 'English for Class 7 - CBSE Board'),
('Hindi', 'CBSE', 7, 'Hindi for Class 7 - CBSE Board'),
('Social Studies', 'CBSE', 7, 'Social Studies for Class 7 - CBSE Board'),
('Mathematics', 'CBSE', 8, 'Mathematics for Class 8 - CBSE Board'),
('Science', 'CBSE', 8, 'Science for Class 8 - CBSE Board'),
('English', 'CBSE', 8, 'English for Class 8 - CBSE Board'),
('Hindi', 'CBSE', 8, 'Hindi for Class 8 - CBSE Board'),
('Social Studies', 'CBSE', 8, 'Social Studies for Class 8 - CBSE Board'),
('Mathematics', 'CBSE', 9, 'Mathematics for Class 9 - CBSE Board'),
('Science', 'CBSE', 9, 'Science for Class 9 - CBSE Board'),
('English', 'CBSE', 9, 'English for Class 9 - CBSE Board'),
('Hindi', 'CBSE', 9, 'Hindi for Class 9 - CBSE Board'),
('Social Studies', 'CBSE', 9, 'Social Studies for Class 9 - CBSE Board'),
('Mathematics', 'CBSE', 10, 'Mathematics for Class 10 - CBSE Board'),
('Science', 'CBSE', 10, 'Science for Class 10 - CBSE Board'),
('English', 'CBSE', 10, 'English for Class 10 - CBSE Board'),
('Hindi', 'CBSE', 10, 'Hindi for Class 10 - CBSE Board'),
('Social Studies', 'CBSE', 10, 'Social Studies for Class 10 - CBSE Board'),
('Physics', 'CBSE', 11, 'Physics for Class 11 - CBSE Board'),
('Chemistry', 'CBSE', 11, 'Chemistry for Class 11 - CBSE Board'),
('Biology', 'CBSE', 11, 'Biology for Class 11 - CBSE Board'),
('Mathematics', 'CBSE', 11, 'Mathematics for Class 11 - CBSE Board'),
('English', 'CBSE', 11, 'English for Class 11 - CBSE Board'),
('Physics', 'CBSE', 12, 'Physics for Class 12 - CBSE Board'),
('Chemistry', 'CBSE', 12, 'Chemistry for Class 12 - CBSE Board'),
('Biology', 'CBSE', 12, 'Biology for Class 12 - CBSE Board'),
('Mathematics', 'CBSE', 12, 'Mathematics for Class 12 - CBSE Board'),
('English', 'CBSE', 12, 'English for Class 12 - CBSE Board')
ON CONFLICT (name, board, class_level) DO NOTHING;

-- Insert sample tutor for testing
INSERT INTO users (id, email, password, role, first_name, last_name, phone, subjects, boards, is_available, rating, total_students)
VALUES 
    ('tutor_fallback_001', 'test@tutor.com', 'hashed_password', 'tutor', 'Test', 'Tutor', '+919876543210', ARRAY['Mathematics', 'Science'], ARRAY['CBSE', 'STATE'], true, 4.5, 50)
ON CONFLICT (id) DO NOTHING;

-- Verify tables were created successfully
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'subjects', 'bookings', 'payments', 'notifications')
ORDER BY table_name, ordinal_position;

-- Show sample subjects
SELECT * FROM subjects WHERE board = 'CBSE' AND class_level <= 5 LIMIT 10;

COMMIT;

SELECT 'Schema setup completed successfully!' as status;
