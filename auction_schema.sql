-- Real Estate Auction Platform Database Schema
-- PostgreSQL Compatible

-- First, create the ENUM types
CREATE TYPE auction_type_enum AS ENUM ('timed', 'live');
CREATE TYPE auction_status_enum AS ENUM ('preview', 'live', 'ended', 'sold', 'cancelled');
CREATE TYPE bid_status_enum AS ENUM ('active', 'outbid', 'winning', 'cancelled');
CREATE TYPE event_type_enum AS ENUM ('bid_placed', 'auction_started', 'auction_extended', 'auction_ended');
CREATE TYPE verification_level_enum AS ENUM ('basic', 'verified', 'premium');

-- Auction Properties
CREATE TABLE auction_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  auction_type auction_type_enum DEFAULT 'live',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  preview_start TIMESTAMP NOT NULL,
  reserve_price DECIMAL(12,2) NOT NULL,
  buy_now_price DECIMAL(12,2),
  current_bid DECIMAL(12,2) DEFAULT 0,
  bid_count INTEGER DEFAULT 0,
  status auction_status_enum DEFAULT 'preview',
  commission_rate DECIMAL(5,4) DEFAULT 0.05,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bids
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_property_id UUID REFERENCES auction_properties(id),
  user_id UUID,
  amount DECIMAL(12,2) NOT NULL,
  bid_time TIMESTAMP DEFAULT NOW(),
  is_winning BOOLEAN DEFAULT FALSE,
  auto_bid_max DECIMAL(12,2), -- For proxy bidding
  ip_address INET,
  user_agent TEXT,
  status bid_status_enum DEFAULT 'active'
);

-- Auction Events
CREATE TABLE auction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_property_id UUID REFERENCES auction_properties(id),
  event_type event_type_enum,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Verification
CREATE TABLE user_verification_auctions (
  user_id UUID PRIMARY KEY,
  verification_level verification_level_enum DEFAULT 'basic',
  document_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  credit_check_score INTEGER,
  max_bid_limit DECIMAL(12,2),
  deposit_amount DECIMAL(12,2),
  verification_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Deposits (for auction participation)
CREATE TABLE user_deposits_auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  auction_property_id UUID REFERENCES auction_properties(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, refunded
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Auction Winners (for tracking successful auctions)
CREATE TABLE auction_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_property_id UUID REFERENCES auction_properties(id),
  user_id UUID NOT NULL,
  winning_bid DECIMAL(12,2) NOT NULL,
  final_price DECIMAL(12,2) NOT NULL, -- including fees
  commission_amount DECIMAL(12,2) NOT NULL,
  developer_share DECIMAL(12,2) NOT NULL,
  platform_share DECIMAL(12,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  contract_signed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_auction_properties_status ON auction_properties(status);
CREATE INDEX idx_auction_properties_start_time ON auction_properties(start_time);
CREATE INDEX idx_auction_properties_end_time ON auction_properties(end_time);
CREATE INDEX idx_auction_properties_property_id ON auction_properties(property_id);
CREATE INDEX idx_bids_auction_property_id ON bids(auction_property_id);
CREATE INDEX idx_bids_user_id ON bids(user_id);
CREATE INDEX idx_bids_bid_time ON bids(bid_time);
CREATE INDEX idx_bids_amount ON bids(amount);
CREATE INDEX idx_auction_events_auction_property_id ON auction_events(auction_property_id);
CREATE INDEX idx_auction_events_event_type ON auction_events(event_type);
CREATE INDEX idx_user_deposits_auctions_user_id ON user_deposits_auctions(user_id);
CREATE INDEX idx_user_deposits_auctions_auction_property_id ON user_deposits_auctions(auction_property_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_auction_properties_updated_at BEFORE UPDATE
    ON auction_properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_verification_auctions_updated_at BEFORE UPDATE
    ON user_verification_auctions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_deposits_auctions_updated_at BEFORE UPDATE
    ON user_deposits_auctions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW active_auctions AS
SELECT 
    ap.*,
    p.title,
    p.address,
    p.city,
    p.price as original_price,
    p.bedrooms,
    p.bathrooms,
    p.square_meters
FROM auction_properties ap
JOIN properties p ON ap.property_id = p.id
WHERE ap.status IN ('preview', 'live');

CREATE VIEW auction_summary AS
SELECT 
    ap.id,
    ap.property_id,
    ap.status,
    ap.current_bid,
    ap.reserve_price,
    ap.buy_now_price,
    ap.bid_count,
    ap.start_time,
    ap.end_time,
    CASE 
        WHEN ap.status = 'preview' THEN EXTRACT(EPOCH FROM (ap.start_time - NOW()))
        WHEN ap.status = 'live' THEN EXTRACT(EPOCH FROM (ap.end_time - NOW()))
        ELSE 0
    END as seconds_remaining,
    COUNT(DISTINCT b.user_id) as unique_bidders,
    MAX(b.bid_time) as last_bid_time
FROM auction_properties ap
LEFT JOIN bids b ON ap.id = b.auction_property_id
GROUP BY ap.id;

-- Sample data for testing (optional)
-- Note: Make sure you have actual property IDs from your properties table
/*
INSERT INTO auction_properties (
    property_id, 
    start_time, 
    end_time, 
    preview_start, 
    reserve_price, 
    buy_now_price
) VALUES (
    (SELECT id FROM properties LIMIT 1), -- Use an actual property ID
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day 1 hour',
    NOW(),
    500000.00,
    600000.00
);
*/