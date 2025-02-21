-- Check if income categories exist
SELECT 
    id,
    name,
    type,
    color,
    icon,
    is_active,
    created_at
FROM categories
WHERE 
    user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
    AND type = 'income'
ORDER BY name;

-- Count categories by type
SELECT 
    type,
    COUNT(*) as count
FROM categories
WHERE user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
GROUP BY type;
