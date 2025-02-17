# Personal Finance Dashboard

A comprehensive personal finance management application with AI-powered insights.

## Features

- User authentication and profile management
- Multi-currency support including Middle Eastern currencies
- Account management (checking, savings, credit cards, investments, etc.)
- Transaction tracking with categories
- Money transfers between accounts
- Debt management
- Financial goals and savings tracking
- AI-powered insights and recommendations

## Tech Stack

- Next.js (React)
- TypeScript
- Supabase (Authentication & Database)
- TailwindCSS
- Chart.js
- OpenAI API

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                 # Next.js app router
├── components/         # Reusable UI components
├── lib/               # Utility functions and configurations
├── types/             # TypeScript type definitions
└── features/          # Feature-specific components and logic
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

MIT
