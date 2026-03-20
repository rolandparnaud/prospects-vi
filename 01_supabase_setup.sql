-- =============================================
-- PROSPECTS VI — Script de création Supabase
-- À exécuter dans SQL Editor de Supabase
-- =============================================

-- 1. Créer la table
create table prospects (
  id bigint primary key generated always as identity,
  date date,
  societe text not null,
  type_acteur jsonb default '[]',
  detention jsonb default '[]',
  destination jsonb default '[]',
  etat text default 'En veille',
  localites jsonb default '[]',
  commentaires text default '',
  surface numeric,
  contact text default '',
  numero text default '',
  email text default '',
  responsable text default '',
  notes jsonb default '[]',
  created_at timestamptz default now()
);

-- 2. Activer Row Level Security (obligatoire)
alter table prospects enable row level security;

-- 3. Politique : accès ouvert (outil interne)
create policy "Accès complet" on prospects for all using (true) with check (true);

-- 4. Insérer les données existantes
insert into prospects (date, societe, type_acteur, detention, destination, etat, localites, commentaires, surface, contact, numero, email, responsable, notes) values
(
  '2024-04-16', 'ALTRAD ENDEL SRA',
  '["Utilisateur"]', '["Achat", "Location"]', '["Activité", "Bureaux"]',
  'Terminé', '["Vaulx-en-Velin", "Plaine de l''Ain"]',
  '<b>Recherche bâtiment existant.</b> Bureaux 900/1000m², salles réunion/formation 300/400m², atelier 2000m², stockage ext. 1000m², ~70 parkings, ERP, hauteur ~6m',
  3400, 'Stéphane FANJAS', '07 86 38 91 58', 'stephane.fanjas@altradendel.com', 'Roland',
  '[{"id": 1, "text": "Premier contact téléphonique — besoin confirmé", "date": "2024-04-16T10:00:00"}]'
),
(
  '2024-01-01', 'ALCAIX NOTAIRES',
  '[]', '["Achat", "Location"]', '["Bureaux"]',
  'Actif', '["Lyon Part-Dieu"]',
  'Recherche plateau cœur Part-Dieu',
  2000, 'Thomas SCHWENNINGER', '', '', '', '[]'
),
(
  '2024-01-01', 'SOHO ATLAS INFINE',
  '[]', '["Achat", "Location"]', '["Bureaux"]',
  'Actif', '["Lyon Centre"]',
  'Recherche plateau cœur Lyon',
  2000, 'Patrick MITTON', '', '', '', '[]'
),
(
  '2024-05-28', 'BABEL COMMUNITY',
  '[]', '["Achat"]', '["Hôtel", "Bureaux"]',
  'Actif', '[]',
  '<b>5 000 à 15 000 m² SDP.</b> Co-living, co-working, restauration, salle sport, events. <i>Extérieurs souhaités.</i>',
  10000, '', '', '', '', '[]'
),
(
  '2024-05-01', 'HUBER Tuyauterie',
  '[]', '["Achat"]', '["Activité"]',
  'Actif', '["Tassin", "Ouest Lyonnais"]',
  'Recherche locaux d''activité (250 à 500 m²) sur terrain ~1500 m². Proche Route de Paris, porte A89.',
  500, 'Pierre HUBER', '06 42 41 83 78', '', '', '[]'
),
(
  '2025-05-05', 'MEDIPLUS',
  '[]', '["Achat", "Location"]', '["Bureaux", "École"]',
  'En veille', '["Oullins", "Saint-Genis-Laval"]',
  'Recherche 650 m² bureaux (<b>école - ERP Type R 5ème cat.</b>) pour prépa médical. Proche métro.',
  650, 'Christophe GLEYE', '06 81 43 94 30', '', '', '[]'
);
