import { Resend } from 'resend';
import { format } from 'date-fns';
import type { Event, Slot, Signup } from '@/types/database';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'SignupSmartly <onboarding@resend.dev>';

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || 'allisonleighstone@gmail.com';

export async function sendSignupConfirmation(params: {
  signup: Signup;
  slot: Slot;
  event: Event;
}) {
  const { signup, slot, event } = params;
  if (!signup.email) {
    throw new Error('Cannot send confirmation: signup has no email');
  }
  const cancelUrl = `${APP_URL}/signup/cancel?token=${signup.cancel_token}`;
  const isSimple = event.signup_type === 'simple';
  const logoUrl = `${APP_URL}/smartly-icon.png`;

  const labelSpotOrItem = isSimple ? 'Item' : 'Spot';

  const safeFormatDate = (d: string | null): string => {
    if (!d) return 'TBD';
    const dateStr = d.includes('T') ? d : `${d}T00:00:00`;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'TBD';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const safeFormatTime = (t: string | null): string | null => {
    if (!t) return null;
    const date = new Date(t);
    if (isNaN(date.getTime())) return null;
    return format(date, 'h:mm a');
  };

  const spotOrItemRow = `<p style="margin: 0; padding: 12px 0; border-bottom: 1px solid #E5F2E5;"><strong>${labelSpotOrItem}:</strong> ${slot.role_name}</p>`;
  const dateRow = (show: boolean, dateVal: string | null) =>
    show
      ? `<p style="margin: 0; padding: 12px 0; border-bottom: 1px solid #E5F2E5;"><strong>Date:</strong> ${safeFormatDate(dateVal)}</p>`
      : '';
  const startTimeStr = safeFormatTime(slot.start_time);
  const endTimeStr = safeFormatTime(slot.end_time);
  const timeRow =
    !isSimple && startTimeStr && endTimeStr
      ? `<p style="margin: 0; padding: 12px 0; border-bottom: 1px solid #E5F2E5;"><strong>Time:</strong> ${startTimeStr} – ${endTimeStr}</p>`
      : '';
  const eventRow = `<p style="margin: 0; padding: 12px 0; border-bottom: 1px solid #E5F2E5;"><strong>Event:</strong> ${event.title}</p>`;
  const locationRow = event.location
    ? `<p style="margin: 0; padding: 12px 0;"><strong>Location:</strong> ${event.location}</p>`
    : '';

  const scheduledDetailRows = [
    spotOrItemRow,
    dateRow(true, event.start_date),
    timeRow,
    eventRow,
    locationRow,
  ].filter(Boolean).join('');

  const simpleDetailRows = [
    spotOrItemRow,
    dateRow(!!event.start_date, event.start_date),
    eventRow,
    locationRow,
  ].filter(Boolean).join('');

  const detailRows = isSimple ? simpleDetailRows : scheduledDetailRows;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: signup.email,
    subject: `You're signed up: ${slot.role_name} — ${event.title}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signup Confirmation</title>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #27272A; margin: 0; padding: 0; background-color: #FAF9F6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
      <div style="background-color: #27272A; padding: 20px 24px; display: flex; align-items: center; gap: 12px;">
        <img src="${logoUrl}" alt="SignupSmartly" width="40" height="40" style="display: block;">
        <span style="font-family: 'Quicksand', sans-serif; font-weight: 600; font-size: 1.25rem; color: #FFFFFF;">SignupSmartly</span>
      </div>
      <div style="padding: 24px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #27272A; margin: 0 0 20px;">You're signed up!</h1>
        <div style="background-color: #F0F9F0; border-radius: 8px; padding: 0 20px; margin-bottom: 24px;">
          ${detailRows}
        </div>
        <p style="margin: 0 0 16px; color: #27272A;">Need to cancel? Use the link below:</p>
        <a href="${cancelUrl}" style="display: inline-block; background-color: #FFFFFF; color: #27272A; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; border: 2px solid #27272A;">Cancel signup</a>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #E5F2E5; font-size: 14px; color: #71717A;">Organized with SignupSmartly</div>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });

  if (error) {
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }
}

export async function sendNpsResponse(params: {
  score: number;
  comment: string | null;
  userEmail: string;
  eventCount: number;
}) {
  const { score, comment, userEmail, eventCount } = params;
  const submittedAt = format(new Date(), 'MMMM d, yyyy');

  const body = `Score: ${score} / 10
Comment: ${comment ?? '(no comment)'}

───────────────
User: ${userEmail}
Events created: ${eventCount}
Submitted: ${submittedAt}`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `NPS Response — Score ${score}/10`,
    text: body,
  });

  if (error) {
    throw new Error(`Failed to send NPS email: ${error.message}`);
  }
}
