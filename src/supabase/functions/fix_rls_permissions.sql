-- Correction des politiques RLS pour permettre les insertions par des utilisateurs authentifiés
-- Pour exécuter dans l'éditeur SQL de Supabase

-- 1. Ajout d'une colonne timestamp avec index pour améliorer les performances
ALTER TABLE temp_messages 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ 
DEFAULT (NOW() + INTERVAL '1 hour');

-- Création d'un index pour accélérer les requêtes sur expires_at
CREATE INDEX IF NOT EXISTS idx_temp_messages_expires_at ON temp_messages(expires_at);

-- 2. Fonction de nettoyage sécurisée avec limite de suppression
CREATE OR REPLACE FUNCTION clear_expired_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM temp_messages
  WHERE ctid IN (
    SELECT ctid FROM temp_messages
    WHERE expires_at < NOW()
    LIMIT 1000
  );
  
  IF FOUND THEN
    PERFORM clear_expired_messages();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Activation de RLS sur la table
ALTER TABLE temp_messages ENABLE ROW LEVEL SECURITY;

-- 4. Suppression des anciennes politiques qui pourraient causer des conflits
DROP POLICY IF EXISTS "Filter expired messages" ON temp_messages;
DROP POLICY IF EXISTS "Insert messages" ON temp_messages;
DROP POLICY IF EXISTS "Read messages by channel" ON temp_messages;

-- 5. Création de nouvelles politiques avec définitions claires des permissions

-- Politique pour permettre la lecture de messages à tous les utilisateurs authentifiés
CREATE POLICY "select_messages" ON temp_messages 
FOR SELECT 
TO authenticated
USING (true);

-- Politique pour permettre l'insertion de messages à tous les utilisateurs authentifiés
CREATE POLICY "insert_messages" ON temp_messages 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. Exécuter une première fois le nettoyage des messages expirés
SELECT clear_expired_messages();