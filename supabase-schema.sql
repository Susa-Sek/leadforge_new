-- Create a schema for your application data
-- create schema if not exists public;

-- Set up Row Level Security (RLS)
-- Alter default to no privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- Set up the 'profiles' table
CREATE TABLE public.profiles (
    id uuid references auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Set up the 'user_credits' table
CREATE TABLE public.user_credits (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid references auth.users(id) ON DELETE CASCADE NOT NULL,
    total_credits integer DEFAULT 0 NOT NULL,
    used_credits integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_credits_non_negative CHECK (total_credits >= 0 AND used_credits >= 0),
    CONSTRAINT check_used_credits_not_exceed_total CHECK (total_credits >= used_credits)
);
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own credits." ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own credits." ON public.user_credits FOR UPDATE USING (auth.uid() = user_id);

-- Set up the 'subscriptions' table
CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid references auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_name text NOT NULL,
    status text NOT NULL,
    stripe_customer_id text UNIQUE,
    stripe_subscription_id text UNIQUE,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscriptions." ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions." ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions." ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Set up the 'payments' table
CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid references auth.users(id) ON DELETE CASCADE NOT NULL,
    product_type text NOT NULL,
    plan_name text NOT NULL,
    credits_amount integer,
    amount_paid numeric(10,2) NOT NULL,
    currency text NOT NULL,
    status text NOT NULL,
    stripe_session_id text UNIQUE,
    stripe_payment_intent_id text UNIQUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own payments." ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payments." ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Set up the 'search_results' table
CREATE TABLE public.search_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    search_id text UNIQUE NOT NULL,
    user_id uuid references auth.users(id) ON DELETE CASCADE NOT NULL,
    query_params jsonb NOT NULL,
    status text NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    total_expected integer,
    results jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    apify_run_id text,
    apify_dataset_id text,
    apify_cost_usd numeric(10,4),
    leads_found integer,
    cost_per_lead numeric(10,4)
);
ALTER TABLE public.search_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own search results." ON public.search_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own search results." ON public.search_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own search results." ON public.search_results FOR UPDATE USING (auth.uid() = user_id);

-- Set up the 'search_collections' table
CREATE TABLE public.search_collections (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid references auth.users(id) ON DELETE CASCADE NOT NULL,
    search_query text NOT NULL,
    location text,
    results_count integer DEFAULT 0 NOT NULL,
    search_results jsonb NOT NULL, -- All leads of a collection
    csv_data text,
    filename text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.search_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own search collections." ON public.search_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own search collections." ON public.search_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own search collections." ON public.search_collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own search collections." ON public.search_collections FOR DELETE USING (auth.uid() = user_id);


-- Set up the 'crm_contacts' table
CREATE TABLE public.crm_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid references auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    company text,
    email text,
    phone text,
    website text,
    address text,
    street text,
    city text,
    country_code text,
    stage text DEFAULT 'Lead' NOT NULL, -- e.g., Lead, Qualifiziert, Opportunity, Kunde
    status text DEFAULT 'nicht_angegangen' NOT NULL, -- e.g., nicht_angegangen, kontaktiert, interessiert, nicht_interessiert
    source text,
    url text, -- Google Maps URL or Website URL
    category_name text,
    contact_count integer DEFAULT 0 NOT NULL,
    last_contacted timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own CRM contacts." ON public.crm_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own CRM contacts." ON public.crm_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own CRM contacts." ON public.crm_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own CRM contacts." ON public.crm_contacts FOR DELETE USING (auth.uid() = user_id);

-- Set up the 'notifications' table
CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid references auth.users(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL, -- e.g., search_completed, credits_low, subscription_renewed, admin_message
    title text NOT NULL,
    message text NOT NULL,
    metadata jsonb,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications." ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications." ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications." ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Set up the 'user_roles' table
CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid references auth.users(id) ON DELETE CASCADE NOT NULL,
    role text NOT NULL, -- e.g., admin, moderator, user
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, role) -- Ensure a user has only one of each role
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- Admins can view all roles, users can view their own
CREATE POLICY "Admins and owners can view user roles." ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
-- Only Admins can insert or update roles
CREATE POLICY "Admins can manage user roles." ON public.user_roles FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update user roles." ON public.user_roles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete user roles." ON public.user_roles FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Set up the 'feedback' table
CREATE TABLE public.feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid references auth.users(id) ON DELETE CASCADE, -- User ID is optional for anonymous feedback
    email text,
    message text NOT NULL,
    attachment_url text,
    status text DEFAULT 'new' NOT NULL, -- e.g., new, in_progress, resolved
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert feedback." ON public.feedback FOR INSERT WITH CHECK (true); -- Anyone can submit feedback
CREATE POLICY "Admins can view all feedback." ON public.feedback FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update feedback." ON public.feedback FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));


-- Set up the 'contact_submissions' table
CREATE TABLE public.contact_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    subject text,
    message text NOT NULL,
    status text DEFAULT 'new' NOT NULL, -- e.g., new, processed
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert contact submissions." ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all contact submissions." ON public.contact_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update contact submissions." ON public.contact_submissions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Set up the 'apify_progress_updates' table
CREATE TABLE public.apify_progress_updates (
    search_id text references public.search_results(search_id) ON DELETE CASCADE NOT NULL,
    run_id text NOT NULL,
    status text NOT NULL,
    processed_items integer,
    phase text,
    dataset_id text,
    message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (search_id, run_id, created_at)
);
ALTER TABLE public.apify_progress_updates ENABLE ROW LEVEL SECURITY;
-- No specific user RLS for this table as it's primarily system-internal
-- Can be viewed by users who own the search_id or by admins
CREATE POLICY "Users can view their own Apify progress updates." ON public.apify_progress_updates FOR SELECT USING (EXISTS (SELECT 1 FROM public.search_results WHERE id = search_id AND user_id = auth.uid()));
CREATE POLICY "Admins can view all Apify progress updates." ON public.apify_progress_updates FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));


-- Create an updated 'handle_new_user' function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');

  -- Assign initial credits (e.g., 30 for free plan)
  INSERT INTO public.user_credits (user_id, total_credits, used_credits)
  VALUES (NEW.id, 30, 0);

  -- Assign free plan subscription
  INSERT INTO public.subscriptions (user_id, plan_name, status)
  VALUES (NEW.id, 'free', 'active');

  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that executes on new user signups
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Create a function to check user roles (for RLS and app logic)
CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id AND role = p_role
  );
END;
$$;

-- Grant usage on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
