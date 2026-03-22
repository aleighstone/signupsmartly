import { serviceSupabase } from '@/lib/supabase-service';

export type OrgBranding = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
};

export async function getOrgBySlug(slug: string): Promise<OrgBranding | null> {
  const { data } = await serviceSupabase
    .from('organizations')
    .select('id, name, slug, logo_url, primary_color')
    .eq('slug', slug)
    .maybeSingle();
  return data as OrgBranding | null;
}

export async function getOrgByCustomDomain(domain: string): Promise<OrgBranding | null> {
  const { data } = await serviceSupabase
    .from('organizations')
    .select('id, name, slug, logo_url, primary_color')
    .eq('custom_domain', domain)
    .maybeSingle();
  return data as OrgBranding | null;
}
