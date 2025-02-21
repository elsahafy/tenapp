# Project Overview

## Current Tasks Status

### Active Tasks
1. Account Summary UI Enhancement
   - Implementing 2x2 grid layout with compact design
   - Enhancing visual hierarchy and interactions

### Recently Completed
1. Account Balance Display
   - Fixed debt account handling
   - Improved currency formatting
2. Analytics Page TypeScript
   - Fixed type mismatches
   - Added proper null handling
3. Loan Form Improvements
   - Fixed interest rate handling
   - Enhanced form consistency

## Technical Implementation Details

### UI Components
- AccountSummary:
  - Tailwind CSS grid (grid-cols-2)
  - Max height with overflow scroll
  - Color-coded account types
  - Responsive design
  - Sparkline integration

### Form Handling
- Interest rate field shared between credit cards and loans
- Auto-calculate toggle for loans
- EMI calculation integration
- Responsive grid layout
- Form validation with field-specific messages

### Data Management
- Amount component for balance display
- Currency conversion support
- Balance history tracking
- Transaction interface with nullable fields
- Type conversion handling

### Mobile Optimization
- Full-width modals on mobile
- Responsive grid layouts
- Stacked headers and buttons
- Touch-optimized targets
- Horizontal scroll handling

## Lessons Learned

### UI/UX Design
1. Icon System:
   - Regular icons: 16px (h-4 w-4) for inline and list items
   - Empty state icons: 20px (h-5 w-5) for placeholders
   - Feature icons: 24px (h-6 w-6) for card headers
   - Use consistent stroke width (1.5 for small, 2 for large)
   - Match icon colors with text colors for harmony

2. Card Design:
   - Use gradient backgrounds (from-white to-gray-50)
   - Consistent border (border-gray-100)
   - Shadow hierarchy:
     - Default: shadow-sm
     - Hover: shadow-md
     - Active: shadow-lg
   - Rounded corners (rounded-lg)
   - Padding scale: p-4 for compact, p-6 for spacious

3. Layout Patterns:
   - Grid-based organization for predictability
   - Mobile-first approach with responsive breakpoints
   - Handle overflow with max-height and auto scroll
   - Maintain consistent spacing:
     - Between sections: space-y-8
     - Between items: space-y-4
     - Between related elements: space-x-2
   - Use flex layouts for alignment
   - Stack on mobile, grid on desktop

4. Visual Hierarchy:
   - Color coding for status:
     - Positive: emerald-600
     - Negative: red-600
     - Neutral: gray-600
   - Typography scale:
     - Headers: text-lg font-semibold
     - Subheaders: text-base font-medium
     - Body: text-sm
     - Caption: text-xs
   - Interactive states:
     - Hover effects
     - Active states
     - Focus rings
   - Loading states with skeletons

### Data Handling
1. Debt Account Management:
   - Always use -Math.abs() for debt amounts
   - Display in red (text-red-600)
   - Show minus sign consistently
   - Include in total calculations correctly
   - Handle zero balances appropriately
   - Support both positive and negative trends

2. Currency Formatting:
   - Consistent prefix placement
   - Proper spacing between symbol and amount
   - Handle different currency codes
   - Support decimal places appropriately
   - Show exchange rates in tooltips
   - Format large numbers with separators
   - Handle zero and negative amounts
   - Support multiple currency displays

3. State Management:
   - Keep source of truth in database
   - Cache frequently accessed data
   - Handle loading states
   - Provide fallback values
   - Update optimistically
   - Handle errors gracefully
   - Maintain data consistency

4. Data Validation:
   - Validate on both client and server
   - Show clear error messages
   - Handle edge cases
   - Support different data types
   - Prevent invalid submissions
   - Maintain audit trail

### TypeScript Practices
1. Database Types:
   - Handle nullable fields explicitly
   - Use proper type assertions
   - Export interfaces for reuse
   - Map types correctly
   - Handle optional fields
   - Use strict null checks
   - Document complex types
   - Create utility types for common patterns

2. Component Types:
   - Rename to avoid conflicts
   - Use proper imports
   - Handle undefined states
   - Type props correctly
   - Use generics when needed
   - Create reusable types
   - Document prop requirements
   - Handle event types

3. Error Handling:
   - Type error responses
   - Handle async errors
   - Provide type guards
   - Use discriminated unions
   - Handle edge cases
   - Document error states
   - Create error boundaries
   - Log errors appropriately

4. Type Safety:
   - Use strict mode
   - Avoid any type
   - Create custom types
   - Use type inference
   - Handle null checks
   - Document type decisions
   - Review type coverage
   - Maintain type consistency

### Form Management
1. Field Handling:
   - Clear fields on modal open
   - Validate all required fields
   - Show clear error messages
   - Auto-calculate when possible
   - Handle dependencies
   - Support field masking
   - Implement field constraints
   - Maintain field state

2. User Experience:
   - Add helpful tooltips
   - Show calculation toggles
   - Maintain consistency
   - Provide clear feedback
   - Support keyboard navigation
   - Handle form submission
   - Show loading states
   - Prevent double submission

3. Validation Rules:
   - Required fields
   - Number ranges
   - Date constraints
   - Format patterns
   - Cross-field validation
   - Custom rules
   - Async validation
   - Error messaging

4. Form Architecture:
   - Reusable components
   - State management
   - Event handling
   - Error boundaries
   - Loading states
   - Success feedback
   - Field dependencies
   - Form persistence

### Mobile Responsiveness
1. Layout Adaptation:
   - Stack on small screens
   - Adjust spacing
   - Resize text
   - Reorder content
   - Handle navigation
   - Optimize images
   - Manage overflow
   - Support touch

2. Interactive Elements:
   - Larger touch targets
   - Clear focus states
   - Swipe actions
   - Pull to refresh
   - Bottom sheets
   - Modal handling
   - Keyboard support
   - Gesture support

3. Performance:
   - Optimize loading
   - Reduce animations
   - Handle offline
   - Cache data
   - Lazy loading
   - Code splitting
   - Resource optimization
   - Monitor metrics

### Security Practices
1. Data Protection:
   - Validate inputs
   - Sanitize outputs
   - Encrypt sensitive data
   - Handle permissions
   - Implement RLS
   - Audit trails
   - Rate limiting
   - Error handling

2. Authentication:
   - Secure routes
   - Handle sessions
   - Manage tokens
   - Implement MFA
   - Password rules
   - Account recovery
   - Session timeout
   - Activity logging

### Testing Strategies
1. Unit Testing:
   - Component tests
   - Function tests
   - Type testing
   - Mock services
   - Test coverage
   - Edge cases
   - Error scenarios
   - Performance tests

2. Integration Testing:
   - API testing
   - Database testing
   - Auth testing
   - Form submission
   - Error handling
   - State management
   - Route testing
   - Event handling

### Exchange Rates Implementation
1. Database Design:
   - Use JSONB for flexible rate storage
   - Include timestamps for last_updated and next_update
   - Implement RLS policies for security
   - Handle table creation through migrations
   - Store base currency explicitly

2. API Integration:
   - Use exchange-rate-api.com for rates
   - Cache rates to minimize API calls
   - Include fallback rates for failures
   - Support specific currency codes
   - Handle API response validation
   - Log rate update attempts

3. Security Practices:
   - Use environment variables for secrets
   - Implement request authentication
   - Apply RLS policies properly
   - Validate API responses
   - Handle errors gracefully
   - Log security-relevant events

4. Cron Job Setup:
   - Use pg_cron for scheduling
   - Handle existing job cleanup
   - Set appropriate permissions
   - Use service role for updates
   - Include error handling
   - Monitor job execution

5. Error Handling:
   - Provide fallback rates
   - Log error details
   - Handle API failures
   - Validate data integrity
   - Return appropriate status
   - Maintain data consistency

## Next Steps

### UI Improvements
- [ ] Add sorting options for accounts
- [ ] Implement quick actions
- [ ] Add filtering capabilities
- [ ] Add search functionality
- [ ] Add export options
- [ ] Improve mobile responsiveness
- [ ] Review hover states
- [ ] Test different content lengths

### Feature Additions
- [ ] Add transaction history view
- [ ] Implement account editing
- [ ] Add account deletion
- [ ] Add data export
- [ ] Add error boundaries
- [ ] Add retry mechanisms
- [ ] Implement pagination
- [ ] Add sorting options

### Form Enhancements
- [ ] Add field validation
- [ ] Add loan-specific fields
- [ ] Add help text
- [ ] Improve error messages
- [ ] Add auto-calculations
- [ ] Add field constraints

## Development Tools

### Python Environment
- Python3 venv in ./venv
- Debug info in output
- File reading before editing
- LLM for text processing

### Testing Tools
- Screenshot verification
- LLM API integration
- Web scraping
- Search functionality

## Global Guidelines

### Database Patterns
- Use `profiles` table
- Soft delete with `is_active`
- Proper RLS policies
- Type-safe queries

### Next.js Configuration
- External image handling
- Client-side navigation
- Proper routing patterns
- State management

### Account Management
- Use account IDs
- Validate ownership
- Type-based actions
- Category organization
