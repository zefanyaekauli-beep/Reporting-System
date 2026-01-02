-- Add GPS Coordinates to Sites for Heatmap Visualization
-- This script adds GPS coordinates to existing sites

-- Jakarta area coordinates (default for sites without specific location)
-- Central Jakarta: -6.2088, 106.8456

-- Update sites with GPS coordinates
-- You should replace these with actual site coordinates

-- Example sites (adjust IDs and coordinates based on your actual sites)
UPDATE sites SET lat = -6.2088, lng = 106.8456 WHERE id = 1 AND (lat IS NULL OR lat = 0);
UPDATE sites SET lat = -6.1751, lng = 106.8650 WHERE id = 2 AND (lat IS NULL OR lat = 0);
UPDATE sites SET lat = -6.2297, lng = 106.8253 WHERE id = 3 AND (lat IS NULL OR lat = 0);
UPDATE sites SET lat = -6.1945, lng = 106.8227 WHERE id = 4 AND (lat IS NULL OR lat = 0);
UPDATE sites SET lat = -6.2146, lng = 106.8451 WHERE id = 5 AND (lat IS NULL OR lat = 0);

-- Verify the update
SELECT id, name, lat, lng, address 
FROM sites 
WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Check count
SELECT 
    COUNT(*) as total_sites,
    COUNT(lat) as sites_with_gps,
    COUNT(*) - COUNT(lat) as sites_without_gps
FROM sites;

