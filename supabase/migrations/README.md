# Database Migrations

This directory contains database migrations for the TenApp project.

## Latest Migration: Add EGP Currency (Feb 18, 2025)

This migration adds the Egyptian Pound (EGP) to the currency_code enum.

### To Apply the Migration

1. Connect to your Supabase project:
```bash
supabase link --project-ref your-project-ref
```

2. Push the migration:
```bash
supabase db push
```

### Manual Application (if needed)

If you need to apply the migration manually, connect to your Supabase database and run:

```sql
ALTER TYPE currency_code ADD VALUE IF NOT EXISTS 'EGP';
```

### Verification

To verify the migration was successful, run:

```sql
SELECT 'EGP'::currency_code;
```

This should return successfully without any errors.
