-- Fix Bookings Table Schema
-- Run this in your Supabase SQL Editor

-- Drop existing bookings table if it exists (WARNING: This will delete all existing bookings)
DROP TABLE IF EXISTS bookings CASCADE;

-- Recreate bookings table with correct schema
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_parent ON bookings(parent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tutor ON bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Parents can view own bookings" ON bookings
    FOR SELECT USING (auth.uid()::text = parent_id::text);

CREATE POLICY "Tutors can view assigned bookings" ON bookings
    FOR SELECT USING (auth.uid()::text = tutor_id::text);

-- Create trigger for updated_at
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample tutor for testing
INSERT INTO users (id, email, password, role, first_name, last_name, phone, subjects, boards, is_available, rating, total_students)
VALUES 
    ('tutor_fallback_001', 'test@tutor.com', 'hashed_password', 'tutor', 'Test', 'Tutor', '+919876543210', ARRAY['Mathematics', 'Science'], ARRAY['CBSE', 'STATE'], true, 4.5, 50)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
