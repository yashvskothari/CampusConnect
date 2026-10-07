import prisma from './prisma';

/**
 * Validates that two users are permitted to chat based on business rules:
 * 1. Must be strictly between a Freelancer and a Client (or Admin).
 * 2. Must share an active proposal (Bid), job contract, or payment.
 */
export async function canUsersChat(userAId: string, userBId: string): Promise<boolean> {
  if (!userAId || !userBId || userAId === userBId) return false;

  const [userA, userB] = await Promise.all([
    prisma.user.findUnique({ where: { id: userAId }, select: { id: true, role: true } }),
    prisma.user.findUnique({ where: { id: userBId }, select: { id: true, role: true } }),
  ]);

  if (!userA || !userB) return false;

  // Admins have platform-wide oversight
  if (userA.role === 'ADMIN' || userB.role === 'ADMIN') return true;

  // Rule 1: Strictly between Freelancer and Client
  const isFreelancerClientPair =
    (userA.role === 'FREELANCER' && userB.role === 'CLIENT') ||
    (userA.role === 'CLIENT' && userB.role === 'FREELANCER');

  if (!isFreelancerClientPair) return false;

  const freelancerId = userA.role === 'FREELANCER' ? userA.id : userB.id;
  const clientId = userA.role === 'CLIENT' ? userA.id : userB.id;

  // Rule 2: Access Control — Must share an active contract, proposal, or project
  const sharedBid = await prisma.bid.findFirst({
    where: {
      freelancerId,
      job: { clientId },
    },
  });

  if (sharedBid) return true;

  const sharedPayment = await prisma.payment.findFirst({
    where: { freelancerId, clientId },
  });

  return Boolean(sharedPayment);
}
