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

# Current Task: Account Balance Display Improvements

## Objective
Improve how debt accounts (loans and credit cards) are displayed in the dashboard to properly reflect negative balances.

## Progress
[X] Fix loan and credit card display in the Amount component
[X] Update total balance calculation in AccountSummary
[X] Make loan amounts show as negative and red in the dashboard
[X] Reset form fields when Add Account modal opens
[X] Close Add Account modal after successful submission
[X] Add validation for loan-specific fields
[X] Add tooltips to explain debt amounts
[X] Add tooltips for EMI and other loan terms
[X] Add auto-calculation for monthly installment
[X] Fix duplicate interest rate field
[X] Improve mobile responsiveness

## Mobile Responsiveness Improvements
1. AddAccountModal:
   - Full-width modal on mobile, max-width on larger screens
   - Responsive grid layout (1 column on mobile, 2 columns on desktop)
   - Stacked buttons on mobile, side-by-side on desktop
   - Improved form field spacing and readability
   - Better touch targets for buttons and inputs

2. AccountSummary:
   - Simplified card design for better mobile viewing
   - Responsive padding and spacing
   - Horizontal scrolling for wide content on small screens
   - Stacked header on mobile (title above balance)
   - Optimized account list for mobile viewing
   - Better loading state design

## Next Steps
[ ] Consider adding transaction history view
[ ] Add account editing functionality
[ ] Implement account deletion
[ ] Add data export feature

## Technical Details
- Using Amount component for consistent balance display
- Tailwind CSS for styling (text-red-600 for debt amounts)
- Currency conversion support with preferred currency
- Added reusable Tooltip component for better UX
- Form validation with field-specific error messages
- Auto-calculation for loan installments and end date

## UI Components Modified
- Amount component: Added debt account handling
- AccountSummary: Updated balance calculations and display
- AddAccountModal: Added form reset and validation
- Added new Tooltip component for explanatory text

## Lessons Learned
1. Debt Account Handling:
   - Both loans and credit cards should be treated as debt (negative balances)
   - Use -Math.abs() to ensure debt amounts are always negative
   - Display debt amounts in red (text-red-600) with a minus sign
   - Subtract debt amounts from total balance calculations

2. Form Management:
   - Reset form fields when modal opens for better UX
   - Clear all fields including loan-specific ones
   - Set default values (e.g., checking for type, USD for currency)
   - Validate all required fields with clear error messages

3. User Experience:
   - Add tooltips to explain financial terms
   - Show helpful icons (ⓘ) next to complex terms
   - Use cursor-help to indicate additional information
   - Provide immediate feedback on invalid inputs
   - Auto-calculate fields where possible
   - Allow manual override of calculated fields

4. Mobile Design:
   - Use responsive grid layouts
   - Stack elements on mobile for better readability
   - Ensure touch targets are large enough
   - Handle horizontal scrolling gracefully
   - Provide appropriate spacing for mobile viewing

## Notes
- Maintain consistent handling of debt accounts across all components
- Follow the pattern of showing debts in red with negative values
- Keep currency conversion in mind for all balance displays
- Validate all loan fields before submission
- Provide clear error messages for invalid inputs
- Use tooltips to explain complex financial terms
- Ensure all components are mobile-responsive

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

# Current Task: Account Card Layout Optimization

## Objective
Improve the layout and design of account cards in the dashboard to be more compact and visually appealing.

## Progress
[X] Create separate cards for each account type with matching gradients
[X] Add account count to each section
[X] Attempted to make cards more compact by putting amount on same line (reverted)
[X] Maintain consistent styling with summary cards
[X] Restore detailed loan form with all required fields

## Technical Details
- Using Tailwind CSS for styling
- Card components with gradient backgrounds
- Heroicons for consistent iconography
- Responsive grid layout
- Currency conversion support
- Loan form fields:
  - Loan term (months)
  - Total loan amount
  - Monthly installment
  - Loan start/end dates
  - EMI enabled toggle
  - Interest rate and due date

## UI Components Used
- Card: bg-white with gradient overlay
- Icons: h-10 w-10 for consistent sizing
- Text: text-sm for names, text-xs for types
- Colors: blue/red/amber/green-500/10 for backgrounds
- Form inputs: consistent border-gray-300 and focus states

## Lessons Learned
- Keep consistent padding (p-6) for visual harmony
- Maintain account type display for better context
- Preserve currency conversion display
- Use gradient backgrounds to match summary cards
- Group related accounts (Bank+Credit, Loans+Investments)
- For loan accounts, include all necessary fields:
  - Basic fields: name, type, currency, balance
  - Loan-specific: term, dates, amounts, EMI
  - Optional: institution name
- Use proper input types (number, date) with appropriate step values
- Add min/max constraints where applicable (e.g., loan term > 0)
- Maintain consistent form field styling across all input types

## Next Steps
[ ] Consider mobile responsiveness improvements
[ ] Review hover states and interactions
[ ] Test with different account name lengths
[ ] Consider adding account balance trends
[ ] Add form validation for loan fields
[ ] Consider auto-calculating fields (e.g., monthly installment)
[ ] Add tooltips for EMI and other complex terms

## Notes
- Account grouping improves visual organization
- Consistent styling enhances user experience
- Preserve important account details
- Balance between compactness and readability
- Loan form needs all fields for proper tracking

# Current Task: Loan Form Improvements

## Objective
Improve the loan form functionality and user experience by fixing issues with interest rate input and ensuring consistency between add and edit forms.

## Progress
[X] Fix duplicate interest rate field in AddAccountModal
[X] Make interest rate field editable
[X] Add auto-calculate toggle for loan interest rate
[X] Add collateral and loan purpose fields
[X] Add EMI toggle with tooltip
[X] Improve form validation and error messages
[X] Make form fields consistent between add and edit modes
[X] Improve mobile responsiveness

## Technical Details
- Interest rate field shared between credit cards and loans
- Auto-calculate toggle only shows for loans
- EMI toggle affects auto-calculation
- Form validation with field-specific error messages
- Consistent styling using Tailwind CSS
- Responsive grid layout with sm:col-span-2

## Lessons Learned
1. Form Field Management:
   - Keep shared fields (like interest rate) in one place
   - Show/hide features based on account type
   - Use consistent validation and error handling
   - Maintain field state properly

2. User Experience:
   - Add tooltips for complex terms
   - Allow both auto-calculation and manual input
   - Show clear feedback on field changes
   - Keep form layout consistent

3. Code Organization:
   - Group related fields together
   - Share common functionality between forms
   - Use consistent styling patterns
   - Handle form state changes properly

## Next Steps
[ ] Add field validation for collateral and loan purpose
[ ] Consider adding more loan-specific fields
[ ] Add help text for loan terms
[ ] Improve error message clarity

## Notes
- Keep interest rate field consistent across account types
- Maintain clear separation between auto and manual calculation
- Use tooltips to explain complex terms
- Follow mobile-first design principles
