-- Drop existing views if they exist
drop view if exists insights_view cascade;

-- Drop existing tables if they exist (in correct dependency order)
drop table if exists report_generations cascade;
drop table if exists custom_reports cascade;
drop table if exists analysis_metrics_history cascade;
drop table if exists debt_balance_changes cascade;
drop table if exists notification_logs cascade;
drop table if exists scenario_analyses cascade;
drop table if exists risk_profiles cascade;
drop table if exists portfolio_snapshots cascade;
drop table if exists portfolio_settings cascade;
drop table if exists recurring_transactions cascade;
drop table if exists goal_progress cascade;
drop table if exists goals cascade;
drop table if exists insights cascade;
drop table if exists transactions cascade;
drop table if exists subcategories cascade;
drop table if exists categories cascade;
drop table if exists debts cascade;
drop table if exists accounts cascade;

-- Drop existing functions if they exist
drop function if exists update_updated_at_column() cascade;
drop function if exists update_account_balance() cascade;
drop function if exists record_debt_balance_change() cascade;
drop function if exists calculate_portfolio_metrics(jsonb, timestamptz, timestamptz) cascade;

-- Drop existing types if they exist
drop type if exists recurring_frequency cascade;
drop type if exists debt_type cascade;
drop type if exists goal_status cascade;
drop type if exists transaction_type cascade;
drop type if exists account_type cascade;
drop type if exists currency_code cascade;

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type currency_code as enum ('USD', 'EUR', 'GBP', 'AED', 'SAR', 'QAR', 'BHD', 'KWD', 'OMR');
create type account_type as enum ('checking', 'savings', 'credit_card', 'investment', 'loan', 'cash');
create type transaction_type as enum ('income', 'expense', 'transfer');
create type goal_status as enum ('not_started', 'in_progress', 'on_track', 'behind', 'achieved', 'cancelled');
create type debt_type as enum ('mortgage', 'credit_card', 'student_loan', 'auto_loan', 'personal');
create type recurring_frequency as enum ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly');

-- Create accounts table
create table accounts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    type account_type not null,
    currency currency_code not null default 'USD',
    current_balance decimal(12,2) not null default 0,
    credit_limit decimal(12,2),
    interest_rate decimal(5,2),
    due_date integer, -- Day of month (1-31)
    institution text,
    is_active boolean default true,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    constraint valid_due_date check (due_date is null or (due_date >= 1 and due_date <= 31))
);

-- Create categories table
create table categories (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    type transaction_type not null,
    icon text,
    color text,
    is_active boolean default true,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    unique (user_id, name, type)
);

-- Create subcategories table
create table subcategories (
    id uuid primary key default uuid_generate_v4(),
    category_id uuid references categories(id) on delete cascade not null,
    name text not null,
    is_active boolean default true,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    unique (category_id, name)
);

-- Create transactions table
create table transactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    account_id uuid references accounts(id) on delete cascade not null,
    category_id uuid references categories(id) on delete set null,
    subcategory_id uuid references subcategories(id) on delete set null,
    amount decimal(12,2) not null,
    currency currency_code not null default 'USD',
    description text,
    date timestamptz not null,
    type transaction_type not null,
    status text not null check (status in ('pending', 'completed', 'cancelled')),
    transfer_account_id uuid references accounts(id) on delete set null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Create debts table
create table debts (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    current_balance decimal(12,2) not null check (current_balance >= 0),
    interest_rate decimal(5,2) not null check (interest_rate >= 0),
    minimum_payment decimal(12,2) not null check (minimum_payment >= 0),
    due_date date not null,
    type debt_type not null,
    active boolean not null default true,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Create goals table
create table goals (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    description text,
    type text not null check (type in ('savings', 'debt_payoff', 'investment', 'purchase', 'emergency_fund', 'custom')),
    target_amount decimal(12,2) not null,
    current_amount decimal(12,2) not null default 0,
    currency currency_code not null default 'USD',
    start_date timestamptz not null,
    target_date timestamptz not null,
    status goal_status not null default 'not_started',
    priority text not null check (priority in ('low', 'medium', 'high')),
    icon text,
    color text,
    linked_account_ids uuid[],
    contribution_frequency text check (contribution_frequency in ('one_time', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually')),
    contribution_amount decimal(12,2),
    auto_contribution boolean default false,
    notifications_enabled boolean default true,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Create goal_progress table
create table goal_progress (
    id uuid primary key default uuid_generate_v4(),
    goal_id uuid references goals(id) on delete cascade not null,
    amount decimal(12,2) not null,
    date timestamptz not null,
    type text not null check (type in ('contribution', 'withdrawal', 'interest', 'adjustment')),
    description text,
    created_at timestamptz default now() not null
);

-- Create insights table
create table insights (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    type text not null check (type in ('spending', 'budget', 'investment', 'savings', 'debt')),
    title text not null,
    description text not null,
    importance text not null check (importance in ('low', 'medium', 'high')),
    action_items jsonb not null default '[]'::jsonb,
    data jsonb not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Create recurring_transactions table
create table recurring_transactions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    description text,
    amount decimal(12,2) not null,
    type transaction_type not null,
    category_id uuid references categories(id) on delete set null,
    account_id uuid not null references accounts(id) on delete cascade,
    frequency recurring_frequency not null,
    start_date date not null,
    end_date date,
    last_generated date,
    next_occurrence date not null,
    day_of_month integer check (day_of_month between 1 and 31),
    day_of_week integer check (day_of_week between 0 and 6),
    week_of_month integer check (week_of_month between 1 and 5),
    active boolean default true,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Create debt_balance_changes table
create table debt_balance_changes (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    debt_id uuid references debts(id) on delete cascade not null,
    previous_balance decimal(12,2) not null,
    current_balance decimal(12,2) not null,
    change_amount decimal(12,2) not null,
    change_date timestamptz default now() not null,
    notified boolean default false,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Create notification_logs table
create table notification_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    type text not null check (type in ('payment', 'recommendation', 'balance', 'summary')),
    email text not null,
    data jsonb,
    created_at timestamptz default now() not null
);

-- Create portfolio_settings table
create table portfolio_settings (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    risk_tolerance decimal check (risk_tolerance between 0 and 1),
    investment_horizon integer,
    rebalancing_frequency text check (rebalancing_frequency in ('monthly', 'quarterly', 'semi_annually', 'annually')),
    target_allocation jsonb,
    constraints jsonb,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Create portfolio_snapshots table
create table portfolio_snapshots (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    timestamp timestamptz not null,
    total_value decimal not null,
    allocation jsonb not null,
    performance_metrics jsonb not null,
    risk_metrics jsonb not null,
    created_at timestamptz default now() not null
);

-- Create risk_profiles table
create table risk_profiles (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    profile_type text not null,
    risk_factors jsonb not null,
    risk_score decimal not null,
    recommendations jsonb,
    last_updated timestamptz default now() not null,
    created_at timestamptz default now() not null
);

-- Create scenario_analyses table
create table scenario_analyses (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    description text,
    scenario_type text not null,
    parameters jsonb not null,
    results jsonb,
    status text default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Create indexes
create index idx_accounts_user_id on accounts(user_id);
create index idx_accounts_type on accounts(type);
create index idx_transactions_user_id on transactions(user_id);
create index idx_transactions_account_id on transactions(account_id);
create index idx_transactions_date on transactions(date);
create index idx_transactions_category_id on transactions(category_id);
create index idx_categories_user_id on categories(user_id);
create index idx_subcategories_category_id on subcategories(category_id);
create index idx_debts_user_id on debts(user_id);
create index idx_goals_user_id on goals(user_id);
create index idx_goals_status on goals(status);
create index idx_goals_target_date on goals(target_date);
create index idx_goal_progress_goal_id on goal_progress(goal_id);
create index idx_goal_progress_date on goal_progress(date);
create index idx_insights_user_id on insights(user_id);
create index idx_insights_type on insights(type);
create index idx_insights_created_at on insights(created_at);
create index idx_recurring_transactions_user_id on recurring_transactions(user_id);
create index idx_recurring_transactions_next_occurrence on recurring_transactions(next_occurrence);
create index idx_debt_balance_changes_user_id on debt_balance_changes(user_id);
create index idx_debt_balance_changes_notified on debt_balance_changes(notified);
create index idx_notification_logs_user_type on notification_logs(user_id, type);
create index idx_notification_logs_created_at on notification_logs(created_at);
create index idx_portfolio_snapshots_user_timestamp on portfolio_snapshots(user_id, timestamp);
create index idx_risk_profiles_user_type on risk_profiles(user_id, profile_type);
create index idx_scenario_analyses_user_status on scenario_analyses(user_id, status);

-- Enable RLS on all tables
alter table accounts enable row level security;
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table transactions enable row level security;
alter table debts enable row level security;
alter table goals enable row level security;
alter table goal_progress enable row level security;
alter table insights enable row level security;
alter table recurring_transactions enable row level security;
alter table debt_balance_changes enable row level security;
alter table notification_logs enable row level security;
alter table portfolio_settings enable row level security;
alter table portfolio_snapshots enable row level security;
alter table risk_profiles enable row level security;
alter table scenario_analyses enable row level security;

-- Create RLS policies for all tables
create policy "Users can view their own accounts" on accounts for select using (auth.uid() = user_id);
create policy "Users can create their own accounts" on accounts for insert with check (auth.uid() = user_id);
create policy "Users can update their own accounts" on accounts for update using (auth.uid() = user_id);
create policy "Users can delete their own accounts" on accounts for delete using (auth.uid() = user_id);

create policy "Users can view their own categories" on categories for select using (auth.uid() = user_id);
create policy "Users can create their own categories" on categories for insert with check (auth.uid() = user_id);
create policy "Users can update their own categories" on categories for update using (auth.uid() = user_id);
create policy "Users can delete their own categories" on categories for delete using (auth.uid() = user_id);

create policy "Users can view subcategories of their categories" on subcategories for select
    using (exists (select 1 from categories where categories.id = subcategories.category_id and categories.user_id = auth.uid()));
create policy "Users can create subcategories for their categories" on subcategories for insert
    with check (exists (select 1 from categories where categories.id = subcategories.category_id and categories.user_id = auth.uid()));
create policy "Users can update subcategories of their categories" on subcategories for update
    using (exists (select 1 from categories where categories.id = subcategories.category_id and categories.user_id = auth.uid()));
create policy "Users can delete subcategories of their categories" on subcategories for delete
    using (exists (select 1 from categories where categories.id = subcategories.category_id and categories.user_id = auth.uid()));

create policy "Users can view their own transactions" on transactions for select using (auth.uid() = user_id);
create policy "Users can create their own transactions" on transactions for insert with check (auth.uid() = user_id);
create policy "Users can update their own transactions" on transactions for update using (auth.uid() = user_id);
create policy "Users can delete their own transactions" on transactions for delete using (auth.uid() = user_id);

create policy "Users can view their own debts" on debts for select using (auth.uid() = user_id);
create policy "Users can create their own debts" on debts for insert with check (auth.uid() = user_id);
create policy "Users can update their own debts" on debts for update using (auth.uid() = user_id);
create policy "Users can delete their own debts" on debts for delete using (auth.uid() = user_id);

create policy "Users can view their own goals" on goals for select using (auth.uid() = user_id);
create policy "Users can create their own goals" on goals for insert with check (auth.uid() = user_id);
create policy "Users can update their own goals" on goals for update using (auth.uid() = user_id);
create policy "Users can delete their own goals" on goals for delete using (auth.uid() = user_id);

create policy "Users can view progress for their goals" on goal_progress for select
    using (exists (select 1 from goals where goals.id = goal_id and goals.user_id = auth.uid()));
create policy "Users can add progress to their goals" on goal_progress for insert
    with check (exists (select 1 from goals where goals.id = goal_id and goals.user_id = auth.uid()));
create policy "Users can update progress for their goals" on goal_progress for update
    using (exists (select 1 from goals where goals.id = goal_id and goals.user_id = auth.uid()));
create policy "Users can delete progress from their goals" on goal_progress for delete
    using (exists (select 1 from goals where goals.id = goal_id and goals.user_id = auth.uid()));

create policy "Users can view their own insights" on insights for select using (auth.uid() = user_id);
create policy "Users can create their own insights" on insights for insert with check (auth.uid() = user_id);
create policy "Users can update their own insights" on insights for update using (auth.uid() = user_id);
create policy "Users can delete their own insights" on insights for delete using (auth.uid() = user_id);

create policy "Users can view their own recurring transactions" 
    on recurring_transactions for select using (auth.uid() = user_id);
create policy "Users can insert their own recurring transactions" 
    on recurring_transactions for insert with check (auth.uid() = user_id);
create policy "Users can update their own recurring transactions" 
    on recurring_transactions for update using (auth.uid() = user_id);
create policy "Users can delete their own recurring transactions" 
    on recurring_transactions for delete using (auth.uid() = user_id);

create policy "Users can view their own balance changes"
    on debt_balance_changes for select using (auth.uid() = user_id);
create policy "Service role can insert balance changes"
    on debt_balance_changes for insert with check (true);
create policy "Service role can update balance changes"
    on debt_balance_changes for update using (true);

create policy "Users can view their own notification logs"
    on notification_logs for select using (auth.uid() = user_id);
create policy "Service role can insert notification logs"
    on notification_logs for insert with check (true);

create policy "Users can view own portfolio settings" 
    on portfolio_settings for select using (auth.uid() = user_id);
create policy "Users can update own portfolio settings" 
    on portfolio_settings for all using (auth.uid() = user_id);

create policy "Users can view own portfolio snapshots" 
    on portfolio_snapshots for select using (auth.uid() = user_id);
create policy "Users can create own portfolio snapshots" 
    on portfolio_snapshots for insert with check (auth.uid() = user_id);

create policy "Users can view own risk profiles" 
    on risk_profiles for select using (auth.uid() = user_id);
create policy "Users can manage own risk profiles" 
    on risk_profiles for all using (auth.uid() = user_id);

create policy "Users can view own scenario analyses" 
    on scenario_analyses for select using (auth.uid() = user_id);
create policy "Users can manage own scenario analyses" 
    on scenario_analyses for all using (auth.uid() = user_id);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- Create triggers for updated_at
create trigger update_accounts_updated_at before update on accounts for each row execute function update_updated_at_column();
create trigger update_categories_updated_at before update on categories for each row execute function update_updated_at_column();
create trigger update_subcategories_updated_at before update on subcategories for each row execute function update_updated_at_column();
create trigger update_transactions_updated_at before update on transactions for each row execute function update_updated_at_column();
create trigger update_debts_updated_at before update on debts for each row execute function update_updated_at_column();
create trigger update_goals_updated_at before update on goals for each row execute function update_updated_at_column();
create trigger update_insights_updated_at before update on insights for each row execute function update_updated_at_column();
create trigger update_recurring_transactions_updated_at before update on recurring_transactions for each row execute function update_updated_at_column();
create trigger update_portfolio_settings_updated_at before update on portfolio_settings for each row execute function update_updated_at_column();
create trigger update_portfolio_snapshots_updated_at before update on portfolio_snapshots for each row execute function update_updated_at_column();
create trigger update_risk_profiles_updated_at before update on risk_profiles for each row execute function update_updated_at_column();
create trigger update_scenario_analyses_updated_at before update on scenario_analyses for each row execute function update_updated_at_column();

-- Create transaction balance update trigger
create or replace function update_account_balance()
returns trigger as $$
begin
    if TG_OP = 'INSERT' then
        if NEW.type = 'expense' then
            update accounts
            set current_balance = current_balance - NEW.amount
            where id = NEW.account_id;
        elsif NEW.type = 'income' then
            update accounts
            set current_balance = current_balance + NEW.amount
            where id = NEW.account_id;
        elsif NEW.type = 'transfer' and NEW.transfer_account_id is not null then
            update accounts
            set current_balance = current_balance - NEW.amount
            where id = NEW.account_id;
            
            update accounts
            set current_balance = current_balance + NEW.amount
            where id = NEW.transfer_account_id;
        end if;
    elsif TG_OP = 'DELETE' then
        if OLD.type = 'expense' then
            update accounts
            set current_balance = current_balance + OLD.amount
            where id = OLD.account_id;
        elsif OLD.type = 'income' then
            update accounts
            set current_balance = current_balance - OLD.amount
            where id = OLD.account_id;
        elsif OLD.type = 'transfer' and OLD.transfer_account_id is not null then
            update accounts
            set current_balance = current_balance + OLD.amount
            where id = OLD.account_id;
            
            update accounts
            set current_balance = current_balance - OLD.amount
            where id = OLD.transfer_account_id;
        end if;
    end if;
    return coalesce(NEW, OLD);
end;
$$ language 'plpgsql';

create trigger update_account_balance_trigger
    after insert or delete on transactions
    for each row
    execute function update_account_balance();

-- Create debt balance change trigger
create or replace function record_debt_balance_change()
returns trigger as $$
begin
    if OLD.current_balance is distinct from NEW.current_balance then
        insert into debt_balance_changes (
            user_id,
            debt_id,
            previous_balance,
            current_balance,
            change_amount
        ) values (
            NEW.user_id,
            NEW.id,
            OLD.current_balance,
            NEW.current_balance,
            NEW.current_balance - OLD.current_balance
        );
    end if;
    return NEW;
end;
$$ language plpgsql;

create trigger debt_balance_change_trigger
    after update of current_balance
    on debts
    for each row
    execute function record_debt_balance_change();

-- Create portfolio metrics calculation function
create or replace function calculate_portfolio_metrics(
    portfolio_data jsonb,
    start_date timestamptz,
    end_date timestamptz
) returns jsonb
language plpgsql
security definer
as $$
declare
    result jsonb;
begin
    -- Placeholder for actual calculation logic
    result = '{
        "returns": {
            "total_return": 0,
            "annualized_return": 0,
            "risk_adjusted_return": 0
        },
        "risk_metrics": {
            "volatility": 0,
            "sharpe_ratio": 0,
            "max_drawdown": 0
        },
        "diversification_metrics": {
            "correlation_matrix": {},
            "concentration_index": 0
        }
    }'::jsonb;
    
    return result;
end;
$$;

-- Create insights view
create or replace view insights_view with (security_invoker=true) as
select 
    i.*,
    u.email,
    u.raw_user_meta_data->>'first_name' as first_name,
    u.raw_user_meta_data->>'last_name' as last_name
from insights i
join auth.users u on i.user_id = u.id;
