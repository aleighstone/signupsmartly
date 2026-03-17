import { Resend } from 'resend';
import { format } from 'date-fns';
import type { Event, Slot, Signup } from '@/types/database';
import { generateAddToCalendarUrl } from '@/lib/calendar';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'SignupSmartly <onboarding@resend.dev>';

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || 'allisonleighstone@gmail.com';

function buildSignupEmailDetails(params: {
  signup: Signup;
  slot: Slot;
  event: Event;
}) {
  const { signup, slot, event } = params;
  if (!signup.email) {
    throw new Error('Cannot send confirmation: signup has no email');
  }
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

  const cancelUrl = `${APP_URL}/signup/cancel?token=${signup.cancel_token}`;
  const detailRows = isSimple ? simpleDetailRows : scheduledDetailRows;
  const manageUrl = `${APP_URL}/signup/preferences?token=${signup.cancel_token}`;

  return {
    cancelUrl,
    manageUrl,
    isSimple,
    logoUrl,
    labelSpotOrItem,
    detailRows,
  };
}

export async function sendSignupConfirmation(params: {
  signup: Signup;
  slot: Slot;
  event: Event;
}) {
  const { signup, slot, event } = params;
  const { cancelUrl, manageUrl, logoUrl, detailRows } =
    buildSignupEmailDetails({ signup, slot, event });

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: signup.email!,
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
      <div style="background-color: #27272A; padding: 20px 24px; display: flex; align-items: center;">
        <img src="${logoUrl}" alt="SignupSmartly" width="28" height="28" style="display: block; margin-right: 16px;">
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
      <div style="padding: 16px 24px; border-top: 1px solid #E5F2E5; font-size: 14px; color: #71717A;">
        <div style="margin-bottom: 4px;">Organized with SignupSmartly</div>
        <div style="margin-top: 4px;">
          <a href="${manageUrl}" style="color: #15803D; text-decoration: underline;">Manage reminder preferences</a>
        </div>
      </div>
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

export async function sendSignupReminder(params: {
  signup: Signup;
  slot: Slot;
  event: Event;
}) {
  const { signup, slot, event } = params;
  if (!signup.email) {
    throw new Error('Cannot send reminder: signup has no email');
  }

  const { cancelUrl, manageUrl, logoUrl, detailRows, labelSpotOrItem } =
    buildSignupEmailDetails({ signup, slot, event });

  const isSimple = event.signup_type === 'simple';

  const subject = isSimple
    ? `SignupSmartly Reminder: ${slot.role_name} for ${event.title}`
    : `SignupSmartly Reminder: ${slot.role_name} on ${
        event.start_date
          ? format(
              new Date(
                event.start_date.includes('T')
                  ? event.start_date
                  : `${event.start_date}T00:00:00`
              ),
              'MMMM d, yyyy'
            )
          : event.title
      }`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: signup.email!,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signup Reminder</title>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #27272A; margin: 0; padding: 0; background-color: #FAF9F6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
      <div style="background-color: #27272A; padding: 20px 24px; display: flex; align-items: center;">
        <img src="${logoUrl}" alt="SignupSmartly" width="28" height="28" style="display: block; margin-right: 16px;">
        <span style="font-family: 'Quicksand', sans-serif; font-weight: 600; font-size: 1.25rem; color: #FFFFFF;">SignupSmartly</span>
      </div>
      <div style="padding: 24px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #27272A; margin: 0 0 20px;">Just a reminder — you're signed up!</h1>
        <p style="margin: 0 0 16px; color: #27272A;">
          Here are the details for your upcoming ${labelSpotOrItem.toLowerCase()}:
        </p>
        <div style="background-color: #F0F9F0; border-radius: 8px; padding: 0 20px; margin-bottom: 24px;">
          ${detailRows}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
          <a href="${generateAddToCalendarUrl({
            event,
            slot,
            volunteerName: signup.name,
          })}" style="display: inline-block; background-color: #15803D; color: #FFFFFF; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Add to Calendar</a>
          <a href="${cancelUrl}" style="display: inline-block; background-color: #FFFFFF; color: #27272A; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; border: 2px solid #27272A;">Cancel signup</a>
        </div>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #E5F2E5; font-size: 14px; color: #71717A;">
        <div style="margin-bottom: 4px;">Organized with SignupSmartly</div>
        <div style="margin-top: 4px;">
          <a href="${manageUrl}" style="color: #15803D; text-decoration: underline;">Manage reminder preferences</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim(),
  });

  if (error) {
    throw new Error(`Failed to send reminder email: ${error.message}`);
  }
}

// --- Organizer notification emails ---

export async function sendOrganizerInstantNotification(params: {
  event: Event;
  slot: Slot;
  signup: Signup;
  organizerEmail: string;
}) {
  const { event, slot, signup, organizerEmail } = params;
  const logoUrl = `${APP_URL}/smartly-icon.png`;
  const settingsUrl = `${APP_URL}/dashboard/settings`;
  const signupsUrl = `${APP_URL}/dashboard/event/${event.id}/signups`;

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

  const isSimple = event.signup_type === 'simple';
  const labelSpotOrItem = isSimple ? 'Item' : 'Spot';
  const startTimeStr = safeFormatTime(slot.start_time);
  const endTimeStr = safeFormatTime(slot.end_time);
  const timeStr =
    !isSimple && startTimeStr && endTimeStr
      ? `${startTimeStr} – ${endTimeStr}`
      : event.start_date
        ? safeFormatDate(event.start_date)
        : 'TBD';

  const commentRow =
    signup.comment && signup.comment.trim()
      ? `<p style="margin: 0; padding: 12px 0;"><strong>Comment:</strong> ${signup.comment}</p>`
      : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Signup</title>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #27272A; margin: 0; padding: 0; background-color: #FAF9F6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
      <div style="background-color: #27272A; padding: 20px 24px; display: flex; align-items: center;">
        <img src="${logoUrl}" alt="SignupSmartly" width="28" height="28" style="display: block; margin-right: 16px;">
        <span style="font-family: 'Quicksand', sans-serif; font-weight: 600; font-size: 1.25rem; color: #FFFFFF;">SignupSmartly</span>
      </div>
      <div style="padding: 24px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #27272A; margin: 0 0 20px;">New signup!</h1>
        <div style="background-color: #F0F9F0; border-radius: 8px; padding: 0 20px; margin-bottom: 24px;">
          <p style="margin: 0; padding: 12px 0; border-bottom: 1px solid #E5F2E5;"><strong>Event:</strong> ${event.title}</p>
          <p style="margin: 0; padding: 12px 0; border-bottom: 1px solid #E5F2E5;"><strong>${labelSpotOrItem}:</strong> ${slot.role_name}</p>
          <p style="margin: 0; padding: 12px 0; border-bottom: 1px solid #E5F2E5;"><strong>Date / Time:</strong> ${timeStr}</p>
          <p style="margin: 0; padding: 12px 0; border-bottom: 1px solid #E5F2E5;"><strong>Volunteer:</strong> ${signup.name}</p>
          <p style="margin: 0; padding: 12px 0; border-bottom: 1px solid #E5F2E5;"><strong>Email:</strong> <a href="mailto:${signup.email ?? ''}">${signup.email ?? ''}</a></p>
          ${commentRow}
        </div>
        <a href="${signupsUrl}" style="display: inline-block; background-color: #15803D; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View all signups</a>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #E5F2E5; font-size: 14px; color: #71717A;">
        You're receiving this because you have instant notifications on for this event.
        <a href="${settingsUrl}" style="color: #15803D; text-decoration: underline;">Change notification settings</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: organizerEmail,
    subject: `${event.title} — ${signup.name} just signed up`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send organizer notification: ${error.message}`);
  }
}

export type DigestSignupRow = {
  signup: Signup;
  slot: Slot;
  event: Event;
};

export async function sendOrganizerDigest(params: {
  organizerEmail: string;
  signupsByEvent: Map<string, DigestSignupRow[]>;
  isWeekly: boolean;
}) {
  const { organizerEmail, signupsByEvent, isWeekly } = params;
  const logoUrl = `${APP_URL}/smartly-icon.png`;
  const settingsUrl = `${APP_URL}/dashboard/settings`;

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

  const dateRange = isWeekly
    ? format(new Date(), 'MMMM d, yyyy')
    : format(new Date(), 'EEEE, MMMM d, yyyy');

  const subject = isWeekly
    ? 'SignupSmartly — Your weekly signup summary'
    : `SignupSmartly — Your signup summary for ${dateRange}`;

  const heading = isWeekly
    ? "Here's who signed up (last 7 days)"
    : "Here's who signed up";

  const eventBlocks: string[] = [];

  for (const [eventId, rows] of Array.from(signupsByEvent.entries())) {
    const event = rows[0]!.event;
    const signupsUrl = `${APP_URL}/dashboard/event/${eventId}/signups`;
    const isSimple = event.signup_type === 'simple';
    const labelSpotOrItem = isSimple ? 'Item' : 'Spot';

    const rowsHtml = rows
      .map(({ signup, slot }) => {
        const timeStr =
          !isSimple && slot.start_time && slot.end_time
            ? `${safeFormatTime(slot.start_time)} – ${safeFormatTime(slot.end_time)}`
            : event.start_date
              ? safeFormatDate(event.start_date)
              : '';
        const commentCell = signup.comment && signup.comment.trim()
          ? `<td style="padding: 8px 12px; border-bottom: 1px solid #E5F2E5;">${signup.comment}</td>`
          : '<td style="padding: 8px 12px; border-bottom: 1px solid #E5F2E5;">-</td>';
        return `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #E5F2E5;">${slot.role_name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #E5F2E5;">${signup.name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #E5F2E5;"><a href="mailto:${signup.email ?? ''}">${signup.email ?? ''}</a></td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #E5F2E5;">${timeStr}</td>
          ${commentCell}
        </tr>`;
      })
      .join('');

    eventBlocks.push(`
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 18px; font-weight: 600; color: #27272A; margin: 0 0 12px;">${event.title}</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px 12px; border-bottom: 1px solid #27272A;">${labelSpotOrItem}</th>
              <th style="text-align: left; padding: 8px 12px; border-bottom: 1px solid #27272A;">Volunteer</th>
              <th style="text-align: left; padding: 8px 12px; border-bottom: 1px solid #27272A;">Email</th>
              <th style="text-align: left; padding: 8px 12px; border-bottom: 1px solid #27272A;">Time</th>
              <th style="text-align: left; padding: 8px 12px; border-bottom: 1px solid #27272A;">Comment</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <a href="${signupsUrl}" style="display: inline-block; margin-top: 8px; color: #15803D; text-decoration: underline; font-size: 14px;">View all signups →</a>
      </div>
    `);
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signup Summary</title>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #27272A; margin: 0; padding: 0; background-color: #FAF9F6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
      <div style="background-color: #27272A; padding: 20px 24px; display: flex; align-items: center;">
        <img src="${logoUrl}" alt="SignupSmartly" width="28" height="28" style="display: block; margin-right: 16px;">
        <span style="font-family: 'Quicksand', sans-serif; font-weight: 600; font-size: 1.25rem; color: #FFFFFF;">SignupSmartly</span>
      </div>
      <div style="padding: 24px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #27272A; margin: 0 0 20px;">${heading}</h1>
        ${eventBlocks.join('')}
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #E5F2E5; font-size: 14px; color: #71717A;">
        Change how often you receive these emails:
        <a href="${settingsUrl}" style="color: #15803D; text-decoration: underline;">Notification settings</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: organizerEmail,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send organizer digest: ${error.message}`);
  }
}
