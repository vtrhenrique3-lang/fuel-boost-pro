-- ROLES
CREATE TYPE public.app_role AS ENUM ('gestor', 'motorista');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Usuarios veem seus papeis" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Gestores veem todos os papeis" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'gestor'));

-- UPDATED AT HELPER
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- STATIONS
CREATE TABLE public.stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stations TO authenticated;
GRANT ALL ON public.stations TO service_role;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Postos ativos visiveis" ON public.stations
  FOR SELECT TO authenticated USING (active OR public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Gestores gerenciam postos" ON public.stations
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  cpf text,
  phone text,
  station_id uuid REFERENCES public.stations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario le proprio perfil" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Gestores leem todos os perfis" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Usuario atualiza proprio perfil" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuario cria proprio perfil" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TIERS
CREATE TABLE public.tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_liters numeric NOT NULL DEFAULT 0,
  max_liters numeric NOT NULL DEFAULT 9999,
  discount_per_liter numeric NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT 'tier-bronze',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tiers TO authenticated;
GRANT ALL ON public.tiers TO service_role;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tiers visiveis a autenticados" ON public.tiers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestores gerenciam tiers" ON public.tiers
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));
CREATE TRIGGER tiers_updated_at BEFORE UPDATE ON public.tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FUELINGS
CREATE TABLE public.fuelings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_id uuid REFERENCES public.stations(id) ON DELETE SET NULL,
  fuel_type text NOT NULL DEFAULT 'Gasolina Comum',
  liters numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  discount_per_liter numeric NOT NULL DEFAULT 0,
  discount_total numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ok',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fuelings_user_created_idx ON public.fuelings (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.fuelings TO authenticated;
GRANT ALL ON public.fuelings TO service_role;
ALTER TABLE public.fuelings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Motorista le seus abastecimentos" ON public.fuelings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Gestores leem todos abastecimentos" ON public.fuelings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Gestores lancam abastecimentos" ON public.fuelings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'gestor'));

-- FUEL TOKENS
CREATE TABLE public.fuel_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fuel_tokens_user_idx ON public.fuel_tokens (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.fuel_tokens TO authenticated;
GRANT ALL ON public.fuel_tokens TO service_role;
ALTER TABLE public.fuel_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario le seus tokens" ON public.fuel_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuario cria seus tokens" ON public.fuel_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Gestores leem tokens" ON public.fuel_tokens
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'gestor'));
CREATE POLICY "Gestores baixam tokens" ON public.fuel_tokens
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'gestor'))
  WITH CHECK (public.has_role(auth.uid(), 'gestor'));

-- NEW USER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'motorista')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED
INSERT INTO public.stations (name, city) VALUES
  ('Posto Centro', 'São Paulo'),
  ('Posto Av. Brasil', 'São Paulo'),
  ('Posto Rodovia', 'Campinas');

INSERT INTO public.tiers (name, min_liters, max_liters, discount_per_liter, color, sort_order) VALUES
  ('Bronze', 0, 50, 0.05, 'tier-bronze', 1),
  ('Prata', 51, 150, 0.08, 'tier-silver', 2),
  ('Ouro', 151, 300, 0.10, 'tier-gold', 3),
  ('Diamante', 301, 999999, 0.15, 'tier-diamond', 4);