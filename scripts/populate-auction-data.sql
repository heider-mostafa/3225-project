-- Auction Sample Data for Real Estate Platform
-- This script adds sample auction data using existing properties

-- Clean existing auction data (optional - uncomment if needed)
-- DELETE FROM auction_events;
-- DELETE FROM bids; 
-- DELETE FROM user_deposits_auctions;
-- DELETE FROM auction_winners;
-- DELETE FROM auction_properties;

-- Insert sample auction properties using existing property IDs
-- This assumes you have properties in your properties table
DO $$
DECLARE
    property_record RECORD;
    auction_count INTEGER := 0;
    auction_uuid UUID;
    sample_user_id UUID := gen_random_uuid(); -- Sample user for bids
BEGIN
    RAISE NOTICE 'Starting auction data population...';
    
    -- Get up to 12 available properties and create auctions for them
    FOR property_record IN 
        SELECT id, price FROM properties 
        WHERE status = 'available' 
        LIMIT 12
    LOOP
        -- Generate auction UUID
        auction_uuid := gen_random_uuid();
        
        INSERT INTO auction_properties (
            id,
            property_id,
            auction_type,
            start_time,
            end_time,
            preview_start,
            reserve_price,
            buy_now_price,
            current_bid,
            bid_count,
            status,
            commission_rate,
            created_at,
            updated_at
        ) VALUES (
            auction_uuid,
            property_record.id,
            CASE WHEN auction_count % 2 = 0 THEN 'live'::auction_type_enum ELSE 'timed'::auction_type_enum END,
            -- Mix of times: some live, some upcoming, some ended
            CASE 
                WHEN auction_count < 3 THEN NOW() - INTERVAL '2 hours'
                WHEN auction_count < 6 THEN NOW() + INTERVAL '1 day'
                WHEN auction_count < 9 THEN NOW() + INTERVAL '3 days'
                ELSE NOW() + INTERVAL '1 week'
            END,
            CASE 
                WHEN auction_count < 3 THEN NOW() + INTERVAL '4 hours'
                WHEN auction_count < 6 THEN NOW() + INTERVAL '1 day 6 hours'
                WHEN auction_count < 9 THEN NOW() + INTERVAL '3 days 8 hours'
                ELSE NOW() + INTERVAL '1 week 12 hours'
            END,
            CASE 
                WHEN auction_count < 3 THEN NOW() - INTERVAL '7 days'
                WHEN auction_count < 6 THEN NOW() - INTERVAL '5 days'
                WHEN auction_count < 9 THEN NOW() - INTERVAL '2 days'
                ELSE NOW() + INTERVAL '1 day'
            END,
            FLOOR(property_record.price * 0.85), -- Reserve at 85% of listing price
            CASE WHEN auction_count % 3 = 0 THEN FLOOR(property_record.price * 1.15) ELSE NULL END, -- Some have buy-now
            CASE 
                WHEN auction_count < 3 THEN FLOOR(property_record.price * 0.9 + RANDOM() * property_record.price * 0.1)
                WHEN auction_count = 3 THEN FLOOR(property_record.price * 0.95) -- One sold auction
                ELSE 0
            END, -- Current bid for live/ended auctions
            CASE 
                WHEN auction_count < 3 THEN FLOOR(RANDOM() * 8) + 2 -- 2-10 bids for live
                WHEN auction_count = 3 THEN 12 -- Sold auction has many bids
                ELSE 0
            END, -- Bid count
            CASE 
                WHEN auction_count < 2 THEN 'live'::auction_status_enum
                WHEN auction_count < 4 THEN 'ended'::auction_status_enum
                WHEN auction_count = 4 THEN 'sold'::auction_status_enum
                WHEN auction_count < 8 THEN 'preview'::auction_status_enum
                ELSE 'preview'::auction_status_enum
            END,
            0.05, -- 5% commission
            NOW() - (auction_count * INTERVAL '1 day'),
            NOW()
        );
        
        -- Add some sample bids for auctions that have bid_count > 0
        IF auction_count <= 4 THEN
            FOR i IN 1..(CASE WHEN auction_count = 3 THEN 12 WHEN auction_count < 3 THEN FLOOR(RANDOM() * 8) + 2 ELSE 0 END) LOOP
                INSERT INTO bids (
                    auction_property_id,
                    user_id,
                    amount,
                    bid_time,
                    is_winning,
                    status
                ) VALUES (
                    auction_uuid,
                    gen_random_uuid(), -- Different user for each bid
                    FLOOR(property_record.price * 0.85) + (i * (RANDOM() * 5000 + 2000)), -- Increasing bids
                    CASE 
                        WHEN auction_count < 3 THEN NOW() - INTERVAL '2 hours' + (i * INTERVAL '15 minutes')
                        ELSE NOW() - INTERVAL '1 hour' + (i * INTERVAL '5 minutes')
                    END,
                    false, -- Will be updated later for winning bids
                    'active'::bid_status_enum
                );
            END LOOP;
        END IF;
        
        -- Add auction created event
        INSERT INTO auction_events (
            auction_property_id,
            event_type,
            event_data,
            created_at
        ) VALUES (
            auction_uuid,
            'auction_started',
            jsonb_build_object(
                'property_id', property_record.id,
                'reserve_price', FLOOR(property_record.price * 0.85),
                'auction_type', CASE WHEN auction_count % 2 = 0 THEN 'live' ELSE 'timed' END
            ),
            NOW() - (auction_count * INTERVAL '1 day')
        );
        
        auction_count := auction_count + 1;
        
        RAISE NOTICE 'Created auction % for property %', auction_count, property_record.id;
    END LOOP;
    
    RAISE NOTICE 'Created % sample auctions total', auction_count;
END $$;

-- Update the highest bid as winning for each auction that has bids
UPDATE bids SET is_winning = true 
WHERE id IN (
    SELECT DISTINCT ON (auction_property_id) id
    FROM bids
    ORDER BY auction_property_id, amount DESC
);

-- Update current_bid in auction_properties to match the highest bid
UPDATE auction_properties 
SET current_bid = COALESCE(
    (SELECT MAX(amount) FROM bids WHERE auction_property_id = auction_properties.id),
    0
);

-- Add some auction winners for sold auctions
INSERT INTO auction_winners (
    auction_property_id,
    user_id,
    winning_bid,
    final_price,
    commission_amount,
    developer_share,
    platform_share,
    payment_status,
    contract_signed
)
SELECT 
    ap.id,
    b.user_id,
    b.amount,
    b.amount + (ap.reserve_price * ap.commission_rate), -- Add commission to final price
    ap.reserve_price * ap.commission_rate,
    b.amount,
    ap.reserve_price * ap.commission_rate,
    'confirmed',
    true
FROM auction_properties ap
JOIN bids b ON ap.id = b.auction_property_id
WHERE ap.status = 'sold' AND b.is_winning = true;

-- Add more auction events for variety
INSERT INTO auction_events (auction_property_id, event_type, event_data, created_at)
SELECT 
    ap.id,
    'bid_placed',
    jsonb_build_object(
        'bid_amount', b.amount,
        'bid_count', ap.bid_count,
        'user_id', b.user_id
    ),
    b.bid_time
FROM auction_properties ap
JOIN bids b ON ap.id = b.auction_property_id
WHERE ap.bid_count > 0
LIMIT 20; -- Add 20 bid events

RAISE NOTICE 'Auction sample data population completed successfully!';
RAISE NOTICE 'You should now see sample auctions in your admin dashboard.';