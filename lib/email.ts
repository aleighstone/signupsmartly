import { Resend } from 'resend';
import { format } from 'date-fns';
import type { Event, Slot, Signup } from '@/types/database';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'SignupSmartly <onboarding@resend.dev>';

export async function sendSignupConfirmation(params: {
  signup: Signup;
  slot: Slot;
  event: Event;
}) {
  const { signup, slot, event } = params;
  const cancelUrl = `${APP_URL}/signup/cancel?token=${signup.cancel_token}`;
  const isSimple = event.signup_type === 'simple';

  const timeDisplay =
    slot.start_time && slot.end_time
      ? `${format(new Date(slot.start_time), 'h:mm a')} – ${format(new Date(slot.end_time), 'h:mm a')}`
      : 'All day';

  const labelRow = isSimple ? 'Item' : 'Role';
  const timeRow = isSimple
    ? ''
    : `<p style="margin: 0 0 8px;"><strong>Time:</strong> ${timeDisplay}</p>`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: signup.email,
    subject: `You're signed up: ${slot.role_name} - ${event.title}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signup Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 16px;">You're signed up!</h1>
  
  <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0 0 8px;"><strong>${labelRow}:</strong> ${slot.role_name}</p>
    ${timeRow}
    <p style="margin: 0 0 8px;"><strong>Event:</strong> ${event.title}</p>
    <p style="margin: 0;"><strong>Location:</strong> ${event.location || 'TBD'}</p>
  </div>

  <p style="margin: 24px 0;">Need to cancel? Use the link below:</p>
  <a href="${cancelUrl}" style="display: inline-block; background: #111827; color: white !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">Cancel signup</a>

  <p style="margin-top: 32px; font-size: 14px; color: #6b7280;">Organized with SignupSmartly</p>
</body>
</html>
    `.trim(),
  });

  if (error) {
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }
}
