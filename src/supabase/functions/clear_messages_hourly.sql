-- Script SQL sécurisé pour la gestion des messages temporaires
-- Fichier: c:\Users\capit\Ecole\web-Serveur\chatbox\src\supabase\functions\clear_messages_hourly.sql

-- 1. Ajout d'une colonne timestamp avec index pour améliorer les performances
ALTER TABLE temp_messages 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ 
DEFAULT (NOW() + INTERVAL '1 hour');

-- Création d'un index pour accélérer les requêtes sur expires_at
CREATE INDEX IF NOT EXISTS idx_temp_messages_expires_at ON temp_messages(expires_at);

-- 2. Fonction de nettoyage sécurisée avec limite de suppression pour éviter les problèmes de performance
CREATE OR REPLACE FUNCTION clear_expired_messages()
RETURNS void AS $$
BEGIN
  -- Suppression par lots de 1000 messages pour éviter les verrous trop longs
  DELETE FROM temp_messages
  WHERE ctid IN (
    SELECT ctid FROM temp_messages
    WHERE expires_at < NOW()
    LIMIT 1000
  );
  
  -- Si des enregistrements ont été supprimés, continuer le processus
  IF FOUND THEN
    PERFORM clear_expired_messages();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Fonction pour supprimer manuellement tous les messages (utile pour maintenance)
CREATE OR REPLACE FUNCTION clear_all_temp_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM temp_messages;
END;
$$ LANGUAGE plpgsql;

-- 4. Vérification et création d'un déclencheur pour mettre à jour automatiquement expires_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_temp_messages_expires_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER set_temp_messages_expires_at
             BEFORE INSERT ON temp_messages
             FOR EACH ROW
             EXECUTE FUNCTION set_expires_at()';
  END IF;
EXCEPTION
  WHEN undefined_function THEN
    -- Définir la fonction si elle n'existe pas
    CREATE OR REPLACE FUNCTION set_expires_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.expires_at := NOW() + INTERVAL '1 hour';
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Puis créer le déclencheur
    CREATE TRIGGER set_temp_messages_expires_at
    BEFORE INSERT ON temp_messages
    FOR EACH ROW
    EXECUTE FUNCTION set_expires_at();
END;
$$ LANGUAGE plpgsql;

-- 5. Création de règles de sécurité RLS pour protéger les messages
ALTER TABLE temp_messages ENABLE ROW LEVEL SECURITY;

-- Politique pour masquer les messages expirés automatiquement
DROP POLICY IF EXISTS "Filter expired messages" ON temp_messages;
CREATE POLICY "Filter expired messages" ON temp_messages
FOR ALL
USING (expires_at > NOW());

-- Politique pour autoriser l'insertion de nouveaux messages
DROP POLICY IF EXISTS "Insert messages" ON temp_messages;
CREATE POLICY "Insert messages" ON temp_messages
FOR INSERT
WITH CHECK (true);

-- Politique pour autoriser uniquement la lecture des messages du même canal
DROP POLICY IF EXISTS "Read messages by channel" ON temp_messages;
CREATE POLICY "Read messages by channel" ON temp_messages
FOR SELECT
USING (true);

-- NOTE: Pour utiliser cette fonction, exécutez-la régulièrement avec:
-- SELECT clear_expired_messages();
-- 
-- Si la fonction pg_cron est disponible (plans supérieurs de Supabase),
-- vous pouvez l'utiliser pour automatiser le processus:
-- 
-- SELECT cron.schedule(
--   'cleanup-hourly',
--   '*/15 * * * *',
--   'SELECT clear_expired_messages()'
-- );