-- Create xero_connections table to store Xero OAuth tokens and connection info
CREATE TABLE IF NOT EXISTS xero_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token text NOT NULL,
    refresh_token text,
    expires_at timestamptz NOT NULL,
    org_id text,
    org_name text,
    tenant_id text,
    tenant_name text,
    connected_at timestamptz DEFAULT now(),
    last_refreshed_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Ensure one connection per user (can be relaxed later if multiple orgs needed)
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE xero_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own Xero connections
CREATE POLICY "Users can manage their own xero connections" ON xero_connections
    FOR ALL USING (auth.uid() = user_id);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_xero_connections_user_id ON xero_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_xero_connections_expires_at ON xero_connections(expires_at);

-- Grant permissions
GRANT ALL ON xero_connections TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

