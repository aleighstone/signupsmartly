type ClaimExistingUserEmailProps = {
  senderName: string;
  senderEmail: string;
  eventTitle: string;
  claimUrl: string;
  appUrl: string;
};

export function renderClaimExistingUserEmail({
  senderName,
  senderEmail,
  eventTitle,
  claimUrl,
  appUrl,
}: ClaimExistingUserEmailProps) {
  const logoUrl = `${appUrl}/smartly-icon.png`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claim your SignupSmartly copy</title>
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
        <p style="margin: 0 0 16px;">Hi there,</p>
        <p style="margin: 0 0 16px;"><strong>${senderName}</strong> (${senderEmail}) made a copy of their signup <strong>"${eventTitle}"</strong> and sent it to you.</p>
        <p style="margin: 0 0 20px;">It's waiting in your SignupSmartly account - claim it to add it to your dashboard.</p>
        <a href="${claimUrl}" style="display: inline-block; background-color: #15803D; color: #FFFFFF; padding: 12px 22px; border-radius: 8px; text-decoration: none; font-weight: 600;">Claim your signup →</a>
        <p style="margin: 20px 0 0;">If you weren't expecting this, you can safely ignore this email.</p>
        <p style="margin: 12px 0 0;">- The SignupSmartly team</p>
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #E5F2E5; font-size: 14px; color: #71717A;">
        Organized with SignupSmartly
      </div>
    </div>
    <p style="margin: 10px 4px 0; font-size: 12px; color: #78716C;">
      This claim link expires 14 days from when it was sent. After that, the shared copy will be removed. If you weren't expecting this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
  `.trim();
}
