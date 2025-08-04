-- Create password_reset_tokens table
CREATE TABLE public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only access their own reset tokens" 
ON public.password_reset_tokens 
FOR ALL 
USING (auth.email() = email);

-- Create index for faster lookups
CREATE INDEX idx_password_reset_tokens_email_token ON public.password_reset_tokens(email, token);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);