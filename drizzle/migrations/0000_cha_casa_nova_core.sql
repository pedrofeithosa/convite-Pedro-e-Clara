-- ROLES
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- EVENT
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  couple text not null default 'Pedro & Clara',
  tagline text,
  event_date date not null,
  event_time text,
  location_name text,
  address text,
  maps_url text,
  description text,
  story_text text,
  gifts_text text,
  whatsapp text,
  pix_key text,
  pix_name text,
  updated_at timestamptz not null default now()
);
grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "events public read" on public.events for select to anon, authenticated using (true);
create policy "events admin write" on public.events for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- GIFTS
create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  category text not null default 'Casa',
  price numeric(10,2) not null default 0,
  gift_type text not null default 'individual' check (gift_type in ('individual','cotas')),
  total_quotas int not null default 1 check (total_quotas >= 1),
  quota_value numeric(10,2) not null default 0,
  reserved_quotas int not null default 0,
  status text not null default 'disponivel' check (status in ('disponivel','reservado','indisponivel')),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.gifts to anon, authenticated;
grant insert, update, delete on public.gifts to authenticated;
grant all on public.gifts to service_role;
alter table public.gifts enable row level security;
create policy "gifts public read" on public.gifts for select to anon, authenticated using (true);
create policy "gifts admin write" on public.gifts for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- GUESTS (RSVP)
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  people_count int not null default 1 check (people_count between 1 and 20),
  note text,
  created_at timestamptz not null default now()
);
grant insert on public.guests to anon, authenticated;
grant select, update, delete on public.guests to authenticated;
grant all on public.guests to service_role;
alter table public.guests enable row level security;
create policy "guests public insert" on public.guests for insert to anon, authenticated with check (
  char_length(name) between 2 and 100 and char_length(whatsapp) between 8 and 30
);
create policy "guests admin read" on public.guests for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "guests admin write" on public.guests for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- RESERVATIONS
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts(id) on delete cascade,
  guest_name text not null,
  guest_whatsapp text not null,
  reservation_type text not null check (reservation_type in ('individual','cota')),
  amount numeric(10,2) not null default 0,
  status text not null default 'reservado' check (status in ('reservado','confirmado','cancelado')),
  created_at timestamptz not null default now()
);
create index reservations_gift_idx on public.reservations(gift_id);
grant select, update, delete on public.reservations to authenticated;
grant all on public.reservations to service_role;
alter table public.reservations enable row level security;
create policy "reservations admin all" on public.reservations for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- SYNC GIFT AVAILABILITY
create or replace function public.sync_gift_availability()
returns trigger language plpgsql security definer set search_path = public as $$
declare g_id uuid; taken int; total int;
begin
  g_id := coalesce(new.gift_id, old.gift_id);
  select count(*) into taken from public.reservations
    where gift_id = g_id and status in ('reservado','confirmado');
  select total_quotas into total from public.gifts where id = g_id;
  update public.gifts
    set reserved_quotas = taken,
        status = case when taken >= total then 'reservado' else 'disponivel' end
  where id = g_id;
  return null;
end; $$;

create trigger reservations_sync
after insert or update or delete on public.reservations
for each row execute function public.sync_gift_availability();

-- ATOMIC RESERVATION (public entry point)
create or replace function public.reserve_gift(p_gift_id uuid, p_name text, p_whatsapp text)
returns public.reservations language plpgsql security definer set search_path = public as $$
declare g public.gifts; taken int; r public.reservations;
begin
  if char_length(coalesce(p_name,'')) < 2 or char_length(coalesce(p_whatsapp,'')) < 8 then
    raise exception 'Dados inválidos';
  end if;
  select * into g from public.gifts where id = p_gift_id and active for update;
  if not found then raise exception 'Presente não encontrado'; end if;
  select count(*) into taken from public.reservations
    where gift_id = g.id and status in ('reservado','confirmado');
  if taken >= g.total_quotas then raise exception 'Presente já reservado'; end if;
  insert into public.reservations (gift_id, guest_name, guest_whatsapp, reservation_type, amount)
  values (g.id, left(p_name,100), left(p_whatsapp,30),
          case when g.gift_type = 'cotas' then 'cota' else 'individual' end,
          case when g.gift_type = 'cotas' then g.quota_value else g.price end)
  returning * into r;
  return r;
end; $$;

revoke all on function public.reserve_gift(uuid,text,text) from public;
grant execute on function public.reserve_gift(uuid,text,text) to anon, authenticated;

-- SEED
insert into public.events (name, couple, tagline, event_date, event_time, location_name, address, description, story_text, gifts_text, whatsapp)
values ('Chá de Casa Nova','Pedro & Clara','Uma nova casa, uma nova história.','2026-10-17',
 '[definir horário]','[definir local]','[definir endereço]',
 'Chá de Casa Nova de Pedro & Clara',
 'Depois de muitos planos, encontramos o lugar que vamos chamar de lar. Cada canto ainda está sendo construído, e queremos dividir com você o começo dessa história.',
 'Presentear é opcional. O mais importante é a sua presença — mas, se quiser fazer parte da nossa nova casa de um jeito especial, escolhemos algumas coisas com carinho.',
 '[definir WhatsApp]');

insert into public.gifts (name, description, category, price, gift_type, total_quotas, quota_value, sort_order) values
('Air Fryer','Para deixar nossa cozinha ainda mais completa.','Cozinha',400,'cotas',4,100,1),
('Jogo de panelas','O começo de muitos jantares em casa.','Cozinha',600,'cotas',6,100,2),
('Liquidificador','Vitaminas nas manhãs de domingo.','Cozinha',250,'individual',1,0,3),
('Jogo de taças','Para brindar cada conquista.','Cozinha',180,'individual',1,0,4),
('Jogo de cama queen','Noites bem dormidas na casa nova.','Quarto',450,'cotas',3,150,5),
('Travesseiros','Simples e essencial.','Quarto',160,'individual',1,0,6),
('Cortina blackout','Para as manhãs preguiçosas.','Quarto',300,'cotas',3,100,7),
('Jogo de toalhas','Banho quentinho depois de um dia longo.','Banheiro',220,'individual',1,0,8),
('Kit organizadores','Cada coisa no seu lugar.','Banheiro',120,'individual',1,0,9),
('Poltrona de leitura','Nosso canto favorito da sala.','Casa',900,'cotas',6,150,10),
('Luminária de chão','Luz quente para as noites em casa.','Casa',350,'cotas',2,175,11),
('Tapete da sala','Para deixar tudo mais acolhedor.','Casa',500,'cotas',5,100,12),
('Aspirador de pó','Praticidade no dia a dia.','Limpeza e lavanderia',400,'cotas',4,100,13),
('Ferro de passar','Para dar conta das camisas do Pedro.','Limpeza e lavanderia',150,'individual',1,0,14),
('Varal e cesto de roupas','Detalhes que fazem falta.','Limpeza e lavanderia',130,'individual',1,0,15),
('Cota do jantar de inauguração','Ajude a celebrar a casa nova com a gente.','Presentes coletivos',600,'cotas',12,50,16),
('Cota da máquina de lavar','Um presente grande feito por muitas mãos.','Presentes coletivos',2400,'cotas',24,100,17);
