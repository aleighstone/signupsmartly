-- Add subdomain slug and branding fields to organizations
ALTER TABLE organizations
  ADD COLUMN slug TEXT UNIQUE,
  ADD COLUMN primary_color TEXT,
  ADD COLUMN custom_domain TEXT UNIQUE;

-- Slug format: 3-32 chars, lowercase alphanumeric and hyphens, cannot start/end with hyphen
ALTER TABLE organizations
  ADD CONSTRAINT org_slug_format
  CHECK (slug IS NULL OR slug ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$');

-- Index for fast slug lookups (middleware will query this on every subdomain request)
CREATE INDEX idx_organizations_slug ON organizations(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_organizations_custom_domain ON organizations(custom_domain) WHERE custom_domain IS NOT NULL;
