import prisma from '../utils/prisma';

// Tuning knobs — kept in one place so limits are easy to revisit.
const EMAIL_COOLDOWN_MS = 60 * 1000;              // can't re-request the same email inside 1 minute
const EMAIL_WINDOW_MS = 60 * 60 * 1000;           // 1 hour window for the per-email cap
const EMAIL_MAX_IN_WINDOW = 3;                    // max 3 reset emails per address per hour
const IP_WINDOW_MS = 60 * 60 * 1000;              // 1 hour window for the per-IP cap
const IP_MAX_IN_WINDOW = 10;                      // max 10 requests per IP per hour (catches an
                                                   // attacker spraying many different addresses)
const ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000; // rows older than this are safe to prune

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

const emailKey = (email: string) => `email:${email}`;
const ipKey = (ip: string) => `ip:${ip}`;
const resetIpKey = (ip: string) => `reset-submit-ip:${ip}`;

const RESET_SUBMIT_WINDOW_MS = 60 * 60 * 1000;
const RESET_SUBMIT_MAX_IN_WINDOW = 10; // guessing a 256-bit token isn't realistic, but this
                                        // still caps blind automated submission attempts

const countSince = async (identifier: string, since: Date) =>
  prisma.passwordResetAttempt.count({ where: { identifier, createdAt: { gte: since } } });

const mostRecent = async (identifier: string) =>
  prisma.passwordResetAttempt.findFirst({ where: { identifier }, orderBy: { createdAt: 'desc' } });

/**
 * Checks whether a forgot-password request from this email + IP should be
 * allowed. Enforces three things, mirroring what most production apps do:
 *   1. A short per-email cooldown, so double-clicks / accidental resubmits
 *      don't count as separate abuse.
 *   2. A per-email hourly cap, so a single mailbox can't be bombarded with
 *      reset links.
 *   3. A per-IP hourly cap, so one client can't cycle through many email
 *      addresses to spam multiple inboxes.
 * Does NOT record the attempt — call recordAttempt() only after this
 * returns allowed: true, so failed/blocked calls don't themselves consume
 * more of the window than necessary.
 */
export const checkPasswordResetRateLimit = async (email: string, ip: string): Promise<RateLimitResult> => {
  const now = Date.now();

  const lastForEmail = await mostRecent(emailKey(email));
  if (lastForEmail) {
    const elapsed = now - lastForEmail.createdAt.getTime();
    if (elapsed < EMAIL_COOLDOWN_MS) {
      return { allowed: false, retryAfterSeconds: Math.ceil((EMAIL_COOLDOWN_MS - elapsed) / 1000) };
    }
  }

  const emailCount = await countSince(emailKey(email), new Date(now - EMAIL_WINDOW_MS));
  if (emailCount >= EMAIL_MAX_IN_WINDOW) {
    return { allowed: false, retryAfterSeconds: Math.ceil(EMAIL_WINDOW_MS / 1000) };
  }

  const ipCount = await countSince(ipKey(ip), new Date(now - IP_WINDOW_MS));
  if (ipCount >= IP_MAX_IN_WINDOW) {
    return { allowed: false, retryAfterSeconds: Math.ceil(IP_WINDOW_MS / 1000) };
  }

  return { allowed: true };
};

/** Simple IP-only limiter for the reset-password (token submission) endpoint. */
export const checkResetSubmitRateLimit = async (ip: string): Promise<RateLimitResult> => {
  const count = await countSince(resetIpKey(ip), new Date(Date.now() - RESET_SUBMIT_WINDOW_MS));
  if (count >= RESET_SUBMIT_MAX_IN_WINDOW) {
    return { allowed: false, retryAfterSeconds: Math.ceil(RESET_SUBMIT_WINDOW_MS / 1000) };
  }
  return { allowed: true };
};

export const recordResetSubmitAttempt = async (ip: string): Promise<void> => {
  await prisma.passwordResetAttempt.create({ data: { identifier: resetIpKey(ip) } });
};

export const recordPasswordResetAttempt = async (email: string, ip: string): Promise<void> => {
  await prisma.passwordResetAttempt.createMany({
    data: [{ identifier: emailKey(email) }, { identifier: ipKey(ip) }],
  });

  // Lazy cleanup — cheap, and keeps the table from growing forever without
  // needing a cron job. Roughly one in twenty requests pays this cost.
  if (Math.random() < 0.05) {
    await prisma.passwordResetAttempt.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - ATTEMPT_RETENTION_MS) } },
    });
  }
};
