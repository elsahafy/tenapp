-- Income Categories
INSERT INTO categories (id, name, type, color, icon, is_active, user_id) VALUES
  (gen_random_uuid(), 'Salary', 'income', '#34D399', 'briefcase', true, 'system'),
  (gen_random_uuid(), 'Freelance', 'income', '#60A5FA', 'code', true, 'system'),
  (gen_random_uuid(), 'Investments', 'income', '#F59E0B', 'chart-bar', true, 'system'),
  (gen_random_uuid(), 'Rental Income', 'income', '#8B5CF6', 'home', true, 'system'),
  (gen_random_uuid(), 'Business', 'income', '#EC4899', 'office-building', true, 'system'),
  (gen_random_uuid(), 'Gifts', 'income', '#F472B6', 'gift', true, 'system'),
  (gen_random_uuid(), 'Other Income', 'income', '#6B7280', 'plus-circle', true, 'system');

-- Expense Categories
INSERT INTO categories (id, name, type, color, icon, is_active, user_id) VALUES
  -- Housing & Utilities
  (gen_random_uuid(), 'Rent/Mortgage', 'expense', '#EF4444', 'home', true, 'system'),
  (gen_random_uuid(), 'Utilities', 'expense', '#F59E0B', 'light-bulb', true, 'system'),
  (gen_random_uuid(), 'Internet & Phone', 'expense', '#3B82F6', 'wifi', true, 'system'),
  (gen_random_uuid(), 'Home Maintenance', 'expense', '#6B7280', 'wrench', true, 'system'),

  -- Transportation
  (gen_random_uuid(), 'Fuel', 'expense', '#DC2626', 'truck', true, 'system'),
  (gen_random_uuid(), 'Public Transport', 'expense', '#2563EB', 'ticket', true, 'system'),
  (gen_random_uuid(), 'Car Maintenance', 'expense', '#4B5563', 'cog', true, 'system'),
  (gen_random_uuid(), 'Parking', 'expense', '#6B7280', 'parking', true, 'system'),

  -- Food & Dining
  (gen_random_uuid(), 'Groceries', 'expense', '#10B981', 'shopping-cart', true, 'system'),
  (gen_random_uuid(), 'Restaurants', 'expense', '#F59E0B', 'cake', true, 'system'),
  (gen_random_uuid(), 'Coffee Shops', 'expense', '#92400E', 'coffee', true, 'system'),

  -- Shopping
  (gen_random_uuid(), 'Clothing', 'expense', '#8B5CF6', 'shopping-bag', true, 'system'),
  (gen_random_uuid(), 'Electronics', 'expense', '#3B82F6', 'device-mobile', true, 'system'),
  (gen_random_uuid(), 'Home Goods', 'expense', '#6B7280', 'home', true, 'system'),

  -- Health & Wellness
  (gen_random_uuid(), 'Healthcare', 'expense', '#EF4444', 'heart', true, 'system'),
  (gen_random_uuid(), 'Pharmacy', 'expense', '#DC2626', 'first-aid', true, 'system'),
  (gen_random_uuid(), 'Fitness', 'expense', '#10B981', 'fire', true, 'system'),

  -- Entertainment
  (gen_random_uuid(), 'Movies & Shows', 'expense', '#8B5CF6', 'film', true, 'system'),
  (gen_random_uuid(), 'Games', 'expense', '#6366F1', 'puzzle-piece', true, 'system'),
  (gen_random_uuid(), 'Hobbies', 'expense', '#EC4899', 'music-note', true, 'system'),

  -- Education
  (gen_random_uuid(), 'Books', 'expense', '#8B5CF6', 'book-open', true, 'system'),
  (gen_random_uuid(), 'Courses', 'expense', '#3B82F6', 'academic-cap', true, 'system'),
  (gen_random_uuid(), 'Software', 'expense', '#6366F1', 'code', true, 'system'),

  -- Financial
  (gen_random_uuid(), 'Insurance', 'expense', '#1F2937', 'shield-check', true, 'system'),
  (gen_random_uuid(), 'Taxes', 'expense', '#DC2626', 'document-text', true, 'system'),
  (gen_random_uuid(), 'Bank Fees', 'expense', '#4B5563', 'credit-card', true, 'system'),
  (gen_random_uuid(), 'Investments', 'expense', '#F59E0B', 'trending-up', true, 'system'),

  -- Personal Care
  (gen_random_uuid(), 'Hair & Beauty', 'expense', '#EC4899', 'sparkles', true, 'system'),
  (gen_random_uuid(), 'Spa & Massage', 'expense', '#F472B6', 'sun', true, 'system'),
  (gen_random_uuid(), 'Personal Care', 'expense', '#6B7280', 'user', true, 'system'),

  -- Miscellaneous
  (gen_random_uuid(), 'Gifts', 'expense', '#F472B6', 'gift', true, 'system'),
  (gen_random_uuid(), 'Charity', 'expense', '#10B981', 'heart', true, 'system'),
  (gen_random_uuid(), 'Other Expenses', 'expense', '#6B7280', 'dots-horizontal', true, 'system');
