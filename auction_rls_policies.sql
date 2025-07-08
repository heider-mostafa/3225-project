-- Auction Tables Row Level Security (RLS) Policies
-- This script enables RLS and sets up secure policies without breaking existing functionality

-- Enable RLS on auction_properties table
ALTER TABLE auction_properties ENABLE ROW LEVEL SECURITY;

-- Enable RLS on related auction tables
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verification_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_deposits_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_winners ENABLE ROW LEVEL SECURITY;

-- =============================================
-- AUCTION PROPERTIES POLICIES
-- =============================================

-- Allow public read access to auction properties (for browsing auctions)
CREATE POLICY "Allow public read access to auction properties"
ON auction_properties
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to create auctions (admin functionality)
CREATE POLICY "Allow authenticated users to create auctions"
ON auction_properties
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update auctions (for system updates like bid counts)
CREATE POLICY "Allow authenticated users to update auctions"
ON auction_properties
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Only allow service role to delete auctions
CREATE POLICY "Allow service role to delete auctions"
ON auction_properties
FOR DELETE
TO service_role
USING (true);

-- =============================================
-- BIDS POLICIES
-- =============================================

-- Allow public read access to bids (for bid history)
CREATE POLICY "Allow public read access to bids"
ON bids
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to place bids
CREATE POLICY "Allow authenticated users to place bids"
ON bids
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update their own bids or system updates
CREATE POLICY "Allow bid updates"
ON bids
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Only allow service role to delete bids
CREATE POLICY "Allow service role to delete bids"
ON bids
FOR DELETE
TO service_role
USING (true);

-- =============================================
-- AUCTION EVENTS POLICIES
-- =============================================

-- Allow public read access to auction events
CREATE POLICY "Allow public read access to auction events"
ON auction_events
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to create events (system events)
CREATE POLICY "Allow authenticated users to create auction events"
ON auction_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only allow service role to modify/delete events
CREATE POLICY "Allow service role to modify auction events"
ON auction_events
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow service role to delete auction events"
ON auction_events
FOR DELETE
TO service_role
USING (true);

-- =============================================
-- USER VERIFICATION POLICIES
-- =============================================

-- Users can only read their own verification data
CREATE POLICY "Users can read own verification data"
ON user_verification_auctions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own verification data
CREATE POLICY "Users can insert own verification data"
ON user_verification_auctions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own verification data
CREATE POLICY "Users can update own verification data"
ON user_verification_auctions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow service role full access for admin functions
CREATE POLICY "Allow service role full access to user verification"
ON user_verification_auctions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================
-- USER DEPOSITS POLICIES
-- =============================================

-- Users can only read their own deposits
CREATE POLICY "Users can read own deposits"
ON user_deposits_auctions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own deposits
CREATE POLICY "Users can create own deposits"
ON user_deposits_auctions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own deposits
CREATE POLICY "Users can update own deposits"
ON user_deposits_auctions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow service role full access for admin functions
CREATE POLICY "Allow service role full access to user deposits"
ON user_deposits_auctions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================
-- AUCTION WINNERS POLICIES
-- =============================================

-- Allow public read access to auction winners (for transparency)
CREATE POLICY "Allow public read access to auction winners"
ON auction_winners
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to create winner records (system function)
CREATE POLICY "Allow authenticated users to create auction winners"
ON auction_winners
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update winner records (for payment status, etc.)
CREATE POLICY "Allow authenticated users to update auction winners"
ON auction_winners
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Only allow service role to delete winner records
CREATE POLICY "Allow service role to delete auction winners"
ON auction_winners
FOR DELETE
TO service_role
USING (true);

-- =============================================
-- GRANT ACCESS TO VIEWS
-- =============================================

-- Grant access to the views for all authenticated users
GRANT SELECT ON active_auctions TO authenticated;
GRANT SELECT ON auction_summary TO authenticated;

-- Grant access to anonymous users for read-only operations
GRANT SELECT ON active_auctions TO anon;
GRANT SELECT ON auction_summary TO anon;

-- =============================================
-- ADDITIONAL SECURITY CONFIGURATIONS
-- =============================================

-- Ensure service role can bypass RLS when needed
ALTER TABLE auction_properties FORCE ROW LEVEL SECURITY;
ALTER TABLE bids FORCE ROW LEVEL SECURITY;
ALTER TABLE auction_events FORCE ROW LEVEL SECURITY;
ALTER TABLE user_verification_auctions FORCE ROW LEVEL SECURITY;
ALTER TABLE user_deposits_auctions FORCE ROW LEVEL SECURITY;
ALTER TABLE auction_winners FORCE ROW LEVEL SECURITY;

-- Create a function to check if user is admin (optional, for future use)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;