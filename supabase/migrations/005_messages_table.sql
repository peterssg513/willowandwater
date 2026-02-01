-- Messages table for contact form submissions
-- Run this in your Supabase SQL Editor

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    notes TEXT
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin)
CREATE POLICY "Authenticated users can read messages"
    ON messages
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update messages"
    ON messages
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete messages"
    ON messages
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Allow anonymous users to insert messages (from contact form)
CREATE POLICY "Anyone can submit a message"
    ON messages
    FOR INSERT
    WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
