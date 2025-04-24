-- Création d'une table pour les utilisateurs bannis
CREATE TABLE IF NOT EXISTS banned_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  banned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ban_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 week'),
  reason TEXT NOT NULL DEFAULT 'Spam de messages',
  
  -- Contrainte pour ne pas avoir de doublons d'utilisateurs
  CONSTRAINT unique_banned_user UNIQUE (user_id)
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_ban_expires_at ON banned_users(ban_expires_at);

-- Fonction pour vérifier si un utilisateur est banni
CREATE OR REPLACE FUNCTION is_user_banned(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_banned BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM banned_users
    WHERE user_id = check_user_id
    AND ban_expires_at > NOW()
  ) INTO is_banned;
  
  RETURN is_banned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique RLS pour empêcher les utilisateurs bannis d'insérer des messages
DROP POLICY IF EXISTS "prevent_banned_users" ON temp_messages;
CREATE POLICY "prevent_banned_users" ON temp_messages
FOR INSERT 
TO authenticated
WITH CHECK (
  NOT is_user_banned(auth.uid())
);

-- Suppression automatique des bans expirés (pour le nettoyage)
CREATE OR REPLACE FUNCTION clear_expired_bans()
RETURNS void AS $$
BEGIN
  DELETE FROM banned_users
  WHERE ban_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;