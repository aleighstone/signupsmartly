-- Organizer signup notifications: user and event prefs, digest table

ALTER TABLE users
  ADD COLUMN notification_preference text NOT NULL DEFAULT 'daily'
    CHECK (notification_preference IN ('instant', 'daily', 'weekly', 'never'));

ALTER TABLE events
  ADD COLUMN notification_override text NULL
    CHECK (notification_override IN ('instant', 'daily', 'weekly', 'never'));

CREATE TABLE organizer_notification_digest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  signup_id uuid NOT NULL REFERENCES signups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  digest_sent_at timestamptz NULL
);

CREATE INDEX idx_organizer_digest_user ON organizer_notification_digest(user_id);
CREATE INDEX idx_organizer_digest_event ON organizer_notification_digest(event_id);
CREATE INDEX idx_organizer_digest_signup ON organizer_notification_digest(signup_id);
CREATE INDEX idx_organizer_digest_unsent ON organizer_notification_digest(user_id, digest_sent_at) WHERE digest_sent_at IS NULL;

