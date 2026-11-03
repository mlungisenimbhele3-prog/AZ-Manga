import { Resend } from 'resend';

export interface EmailDispatchResult {
  delivered: boolean;
  providerMessageId?: string;
  fallbackPreviewUrl?: string;
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || apiKey === 're_xxxxxxxxx' || apiKey.length < 8) {
    return null;
  }
  return new Resend(apiKey);
}

function getFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    'AZ OVERVERSE Creators <onboarding@resend.dev>'
  );
}

export async function sendVerificationEmail(params: {
  to: string;
  penName: string;
  verifyUrl: string;
}): Promise<EmailDispatchResult> {
  const resend = getResendClient();
  if (!resend) {
    console.info(
      `[OVERVERSE Mailer] RESEND_API_KEY not configured. Verification link for ${params.to}: ${params.verifyUrl}`
    );
    return {
      delivered: false,
      fallbackPreviewUrl: params.verifyUrl,
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [params.to],
      subject: 'Verify your AZ OVERVERSE Creator Account',
      html: `
        <div style="background-color:#09090b;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:40px 24px;max-width:560px;margin:0 auto;border-radius:16px;border:1px solid #27272a;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#00DC64;margin-bottom:12px;">
            AZ OVERVERSE CREATORS
          </div>
          <h1 style="font-size:24px;font-weight:800;margin:0 0 16px;color:#ffffff;">
            Welcome to the Canvas, ${escapeHtml(params.penName)}
          </h1>
          <p style="font-size:14px;line-height:1.6;color:#a1a1aa;margin:0 0 28px;">
            Confirm your email address to activate your AZ OVERVERSE account and start publishing original manga chapters. This verification link expires in 24 hours.
          </p>
          <a href="${params.verifyUrl}" style="display:inline-block;background-color:#00DC64;color:#052e16;font-weight:700;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:10px;">
            Verify Email Address
          </a>
          <p style="font-size:12px;line-height:1.6;color:#71717a;margin:28px 0 0;word-break:break-all;">
            Or copy and paste this URL into your browser:<br />
            <span style="color:#d4d4d8;">${params.verifyUrl}</span>
          </p>
        </div>
      `,
    });

    if (error) {
      console.warn('[OVERVERSE Mailer] Resend delivery warning:', error);
      return {
        delivered: false,
        fallbackPreviewUrl: params.verifyUrl,
      };
    }

    return {
      delivered: true,
      providerMessageId: data?.id,
    };
  } catch (err) {
    console.warn('[OVERVERSE Mailer] Resend request error:', err);
    return {
      delivered: false,
      fallbackPreviewUrl: params.verifyUrl,
    };
  }
}

export async function sendPasswordResetEmail(params: {
  to: string;
  penName: string;
  resetUrl: string;
}): Promise<EmailDispatchResult> {
  const resend = getResendClient();
  if (!resend) {
    console.info(
      `[OVERVERSE Mailer] RESEND_API_KEY not configured. Password reset link for ${params.to}: ${params.resetUrl}`
    );
    return {
      delivered: false,
      fallbackPreviewUrl: params.resetUrl,
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [params.to],
      subject: 'Reset your AZ OVERVERSE password',
      html: `
        <div style="background-color:#09090b;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:40px 24px;max-width:560px;margin:0 auto;border-radius:16px;border:1px solid #27272a;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#f59e0b;margin-bottom:12px;">
            AZ OVERVERSE SECURITY
          </div>
          <h1 style="font-size:24px;font-weight:800;margin:0 0 16px;color:#ffffff;">
            Reset Your Password
          </h1>
          <p style="font-size:14px;line-height:1.6;color:#a1a1aa;margin:0 0 28px;">
            Hi ${escapeHtml(params.penName)}, we received a request to reset your AZ OVERVERSE password. Click the button below within the next 60 minutes to choose a new password.
          </p>
          <a href="${params.resetUrl}" style="display:inline-block;background-color:#00DC64;color:#052e16;font-weight:700;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:10px;">
            Reset Password
          </a>
          <p style="font-size:12px;line-height:1.6;color:#71717a;margin:28px 0 0;word-break:break-all;">
            If you didn't request this reset, you can safely ignore this email.<br />
            <span style="color:#d4d4d8;">${params.resetUrl}</span>
          </p>
        </div>
      `,
    });

    if (error) {
      console.warn('[OVERVERSE Mailer] Resend reset delivery warning:', error);
      return {
        delivered: false,
        fallbackPreviewUrl: params.resetUrl,
      };
    }

    return {
      delivered: true,
      providerMessageId: data?.id,
    };
  } catch (err) {
    console.warn('[OVERVERSE Mailer] Resend reset error:', err);
    return {
      delivered: false,
      fallbackPreviewUrl: params.resetUrl,
    };
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
