-- Set near-expiry dates (30 hours from now) for Carnation, Freesia, Gerbera, Alstroemeria to trigger 50% OFF discount tags
UPDATE batches 
SET expiry_date = CURRENT_TIMESTAMP + INTERVAL '30 hours'
WHERE product_id IN (
  SELECT id FROM products WHERE name IN ('Carnation', 'Freesia', 'Gerbera', 'Alstroemeria')
);
