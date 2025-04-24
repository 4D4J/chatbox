-- Protection anti-spam côté serveur pour empêcher le contournement par API directe
-- Ce script renforce la sécurité contre les attaques utilisant curl ou d'autres méthodes directes

-- 1. Table pour suivre la fréquence des messages par utilisateur
CREATE TABLE IF NOT EXISTS message_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  last_messages_timestamps TIMESTAMPTZ[] DEFAULT ARRAY[]::TIMESTAMPTZ[],
  last_check TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fonction pour vérifier et mettre à jour le taux d'envoi de messages
CREATE OR REPLACE FUNCTION check_message_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  max_messages_allowed INTEGER := 5; -- Maximum de messages dans la fenêtre de temps
  time_window INTERVAL := INTERVAL '5 seconds'; -- Fenêtre de temps pour considérer comme spam
  cooldown_period INTERVAL := INTERVAL '30 seconds'; -- Période de réinitialisation du compteur
  current_timestamps TIMESTAMPTZ[] := ARRAY[]::TIMESTAMPTZ[];
  current_time TIMESTAMPTZ := NOW();
  timestamps_count INTEGER;
BEGIN
  -- Récupérer ou créer l'enregistrement de limite de taux pour l'utilisateur
  INSERT INTO message_rate_limits (user_id, last_messages_timestamps, last_check)
  VALUES (NEW.user_id, ARRAY[current_time]::TIMESTAMPTZ[], current_time)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    last_check = current_time
  RETURNING last_messages_timestamps INTO current_timestamps;

  -- Filtrer les timestamps pour ne garder que ceux dans la fenêtre de temps actuelle
  SELECT ARRAY(
    SELECT ts 
    FROM unnest(current_timestamps) AS ts
    WHERE ts > (current_time - time_window)
  ) INTO current_timestamps;
  
  -- Ajouter le timestamp actuel
  current_timestamps := array_append(current_timestamps, current_time);
  
  -- Mettre à jour la table des limites de taux
  UPDATE message_rate_limits
  SET last_messages_timestamps = current_timestamps
  WHERE user_id = NEW.user_id;
  
  -- Compter les messages dans la fenêtre de temps
  timestamps_count := array_length(current_timestamps, 1);
  
  -- Si le nombre de messages dépasse la limite, bannir l'utilisateur
  IF timestamps_count >= max_messages_allowed THEN
    -- Insérer l'utilisateur dans la table des utilisateurs bannis
    INSERT INTO banned_users (user_id, banned_at, ban_expires_at, reason)
    VALUES (
      NEW.user_id, 
      current_time, 
      current_time + INTERVAL '1 week',
      'Envoi excessif de messages (spam) détecté par le système'
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      banned_at = current_time,
      ban_expires_at = current_time + INTERVAL '1 week';
      
    -- Annuler l'insertion du message
    RAISE EXCEPTION 'Vous avez été banni pour 1 semaine en raison de spam.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer un déclencheur pour appliquer la limite de taux à chaque insertion de message
DROP TRIGGER IF EXISTS rate_limit_check ON temp_messages;
CREATE TRIGGER rate_limit_check
BEFORE INSERT ON temp_messages
FOR EACH ROW
EXECUTE FUNCTION check_message_rate_limit();

-- 4. Fonction pour nettoyer les données de limite de taux anciennes
CREATE OR REPLACE FUNCTION cleanup_rate_limit_data()
RETURNS void AS $$
BEGIN
  -- Supprimer les entrées plus anciennes que la période de cooldown
  DELETE FROM message_rate_limits
  WHERE last_check < (NOW() - INTERVAL '1 hour');
  
  -- Pour les entrées restantes, nettoyer les tableaux de timestamps
  UPDATE message_rate_limits
  SET last_messages_timestamps = ARRAY(
    SELECT ts 
    FROM unnest(last_messages_timestamps) AS ts
    WHERE ts > (NOW() - INTERVAL '5 minutes')
  )
  WHERE array_length(last_messages_timestamps, 1) > 0;
END;
$$ LANGUAGE plpgsql;

-- 5. Amélioration de la politique de prévention des utilisateurs bannis
DROP POLICY IF EXISTS "prevent_banned_users" ON temp_messages;
CREATE POLICY "prevent_banned_users" ON temp_messages
FOR INSERT 
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM banned_users 
    WHERE user_id = auth.uid() 
    AND ban_expires_at > NOW()
  )
);

-- 6. Index pour améliorer les performances des requêtes sur message_rate_limits
CREATE INDEX IF NOT EXISTS idx_message_rate_limits_last_check ON message_rate_limits(last_check);

-- Note: Exécutez régulièrement cleanup_rate_limit_data() pour nettoyer les données anciennes
-- Si pg_cron est disponible: SELECT cron.schedule('cleanup-rate-limits', '*/15 * * * *', 'SELECT cleanup_rate_limit_data()');