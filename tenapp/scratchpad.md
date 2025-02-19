# Lessons

- For website image paths, always use the correct relative path (e.g., 'images/filename.png') and ensure the images directory exists
- For search results, ensure proper handling of different character encodings (UTF-8) for international queries
- Add debug information to stderr while keeping the main output clean in stdout for better pipeline integration
- When using seaborn styles in matplotlib, use 'seaborn-v0_8' instead of 'seaborn' as the style name due to recent seaborn version changes
- When using Jest, a test suite can fail even if all individual tests pass, typically due to issues in suite-level setup code or lifecycle hooks
- For consistent UI design, use these icon sizes:
  - Regular icons: 16px (h-4 w-4)
  - Empty state icons: 20px (h-5 w-5)
  - Feature icons: 24px (h-6 w-6)
- Use gradient backgrounds (from-white to-gray-50) for cards with border-gray-100 for consistency
- TypeScript Lessons:
  - When extending database types with required fields that are nullable in the DB, use `Omit` to remove the original field and add it back with the non-null type
  - When using custom components with specific prop types alongside UI library components, rename imported components (e.g., `Select as UISelect`) to avoid naming conflicts
  - For form components that handle multiple value types (e.g., Select dropdowns), always properly type-assert the values to match the expected union types
  - When using Slider components from UI libraries, check if they expect single values or arrays, and adjust accordingly
  - Use consistent imports for Supabase client: '@/lib/supabase-client' instead of '@/lib/supabase'
  - Import types from '@/types/supabase' for database types
- Database
  - Use the existing `profiles` table instead of creating a new `user_profiles` table
  - Profile table uses `id` as the primary key, not `user_id`
  - Avatar URL is stored as text in the profiles table
  - For account deletion, use soft delete by setting `is_active = false` instead of removing the record
  - Always filter accounts with `is_active = true` when fetching
- Next.js
  - Must configure `next.config.js` with `remotePatterns` to allow external images in next/image component
  - Current Supabase project URL: qvjifftqmpmcvbqhylxv.supabase.co
  - Use Next.js Link component for client-side navigation instead of window.location
- Supabase
  - Storage buckets need proper RLS policies:
    - Public access for viewing avatars
    - Authenticated access for uploading
    - User can only modify their own files
  - Use `auth.uid()::text` when comparing with string user IDs in policies
  - Set proper MIME types and file size limits on buckets
- UI Components:
  - Use consistent styling for cards: bg-white shadow-sm border border-gray-100
  - For empty states, use centered layout with icon, title, description, and action button
  - Use Amount component for displaying currency values with proper formatting
  - Keep action buttons (edit/delete) in the last column of tables
  - Use consistent spacing in forms: space-y-4 for form groups
  - Add loading states with Skeleton components for better UX
- Account Management:
  - Use account IDs instead of user IDs when fetching account data
  - Always validate account ownership before performing actions
  - Use account type (e.g., checking, savings) to determine available actions
  - Implement account linking for external accounts
  - Use account categories for budgeting and tracking

## Windsurf learned

- For search results, ensure proper handling of different character encodings (UTF-8) for international queries
- Add debug information to stderr while keeping the main output clean in stdout for better pipeline integration
- When using seaborn styles in matplotlib, use 'seaborn-v0_8' instead of 'seaborn' as the style name due to recent seaborn version changes
- Use 'gpt-4o' as the model name for OpenAI's GPT-4 with vision capabilities 

# Scratchpad

# Current Task: Fix Analytics Page TypeScript Errors

## Objective
Fix TypeScript errors in the analytics page related to transaction type mismatches and null handling.

## Progress
[X] Update TopTransactions component to handle null descriptions
[X] Export Transaction interface from TopTransactions
[X] Fix type mapping in AnalyticsPage
[X] Add proper loading states
[X] Add fallback text for null descriptions

## Technical Details
- Transaction interface now includes nullable description
- Database transaction types properly mapped to analytics types
- Loading states added with spinner component
- Proper handling of undefined data with default empty arrays
- Type conversion from database transaction to analytics transaction

## Lessons Learned
- When dealing with database types, always check for nullable fields
- Export and reuse interfaces to maintain type consistency across components
- Use optional chaining and null coalescing for safer data access
- Add loading states to prevent undefined data errors
- Add fallback values for nullable fields in the UI
- When mapping between types, explicitly handle all possible values (e.g., transfer → expense)

## Next Steps
[ ] Add error boundary for better error handling
[ ] Add retry mechanism for failed data fetches
[ ] Add skeleton loading state for better UX
[ ] Add pagination for large transaction lists
[ ] Add sorting options for transactions

## Dependencies
- React with TypeScript
- Next.js
- Supabase for data storage
- Tailwind CSS for styling
- Heroicons for icons

## Notes
- Always handle loading states to prevent undefined data errors
- Use proper TypeScript types from database schema
- Add fallback UI for null/undefined values
- Consider the complete type mapping when converting between types
