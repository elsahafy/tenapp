-- Check the latest exchange rates
SELECT 
    id,
    base_currency,
    rates,
    last_updated,
    next_update
FROM exchange_rates
ORDER BY last_updated DESC
LIMIT 1;
