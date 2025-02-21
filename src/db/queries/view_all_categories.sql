-- View all categories organized by type
WITH categories_by_type AS (
    SELECT 
        type,
        STRING_AGG(name, ', ' ORDER BY name) as category_names,
        COUNT(*) as count
    FROM categories
    WHERE user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
    GROUP BY type
)
SELECT 
    type,
    count,
    category_names
FROM categories_by_type
ORDER BY type;
