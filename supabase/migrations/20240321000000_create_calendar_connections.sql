create table public.calendar_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique (user_id, provider)
);

-- Enable RLS
alter table public.calendar_connections enable row level security;

-- Create policies
create policy "Users can view their own calendar connections"
  on public.calendar_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert their own calendar connections"
  on public.calendar_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own calendar connections"
  on public.calendar_connections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own calendar connections"
  on public.calendar_connections for delete
  using (auth.uid() = user_id);

-- Create indexes
create index calendar_connections_user_id_idx on public.calendar_connections(user_id);
create index calendar_connections_provider_idx on public.calendar_connections(provider);

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create trigger to automatically update updated_at
create trigger handle_calendar_connections_updated_at
  before update on public.calendar_connections
  for each row
  execute function public.handle_updated_at(); 