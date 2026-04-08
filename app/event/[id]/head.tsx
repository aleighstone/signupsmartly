import { getEventWithSlots } from '@/lib/db';
import { buildVolunteerFacingThemeHead } from '@/data/themes';

interface HeadProps {
  params: Promise<{ id: string }>;
}

export default async function Head({ params }: HeadProps) {
  const { id } = await params;
  const eventData = await getEventWithSlots(id);
  if (!eventData) return null;

  const { fontsUrl, themeStyleCss } = buildVolunteerFacingThemeHead(eventData.theme);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={fontsUrl} rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: themeStyleCss }} />
    </>
  );
}
