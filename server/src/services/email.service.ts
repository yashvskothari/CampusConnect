import nodemailer from 'nodemailer';

interface PasswordResetEmail {
  recipient: string;
  recipientName: string;
  resetUrl: string;
}

const requiredEmailConfig = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM'] as const;

const getTransporter = () => {
  const missing = requiredEmailConfig.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Email service is not configured: ${missing.join(', ')}`);
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export const sendPasswordResetEmail = async ({ recipient, recipientName, resetUrl }: PasswordResetEmail) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipient,
    subject: 'Reset your Gigverse AI password',
    text: `Hello ${recipientName},\n\nWe received a request to reset your Gigverse AI password.\n\nReset your password: ${resetUrl}\n\nThis link will expire in 30 minutes. If you did not request a password reset, you can safely ignore this email.\n\nFor security reasons, never share this link with anyone.\n\nRegards,\nGigverse AI Team`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto;">
        <h1 style="color: #047857;">Reset your Gigverse AI password</h1>
        <p>Hello ${recipientName},</p>
        <p>We received a request to reset your Gigverse AI password.</p>
        <p><a href="${resetUrl}" style="display: inline-block; background: #059669; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p>This link will expire in 30 minutes.</p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <p>For security reasons, never share this link with anyone.</p>
        <p>Regards,<br />Gigverse AI Team</p>
      </div>
    `,
  });
};
