-- Get all categories
SELECT 
    id,
    name,
    type,
    color,
    icon,
    is_active,
    user_id,
    created_at,
    updated_at
FROM categories
WHERE user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
ORDER BY type, name;

-- Get only income categories
SELECT 
    id,
    name,
    color,
    icon,
    is_active,
    created_at
FROM categories
WHERE 
    user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
    AND type = 'income'
ORDER BY name;

-- Get only expense categories
SELECT 
    id,
    name,
    color,
    icon,
    is_active,
    created_at
FROM categories
WHERE 
    user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
    AND type = 'expense'
ORDER BY name;
