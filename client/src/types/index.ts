export type Role = 'FREELANCER' | 'CLIENT' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  bio?: string;
  skills: string[];
  avatar?: string;
  rating: number;
  status?: UserStatus;
  createdAt: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  freelancerId: string;
  freelancer?: Pick<User, 'id' | 'name' | 'avatar' | 'rating'>;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  clientId: string;
  client?: Pick<User, 'id' | 'name' | 'avatar' | 'rating'>;
  bids?: Bid[];
  _count?: { bids: number };
  matchScore?: number;
  breakdown?: {
    skillMatch: number;
    categoryMatch: number;
    ratingScore: number;
    experienceScore: number;
  };
  createdAt: string;
}

export interface Bid {
  id: string;
  proposal: string;
  quote: number;
  deliveryDays: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  jobId: string;
  freelancerId: string;
  job?: Job;
  freelancer?: Pick<User, 'id' | 'name' | 'avatar' | 'rating' | 'skills'>;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewerId: string;
  revieweeId: string;
  reviewer?: Pick<User, 'id' | 'name' | 'avatar'>;
  reviewee?: Pick<User, 'id' | 'name' | 'avatar'>;
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  commission: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  clientId: string;
  freelancerId: string;
  jobId?: string;
  client?: Pick<User, 'id' | 'name'>;
  freelancer?: Pick<User, 'id' | 'name'>;
  createdAt: string;
}

export interface Message {
  id: string;
  text: string;
  fileUrl?: string;
  senderId: string;
  conversationId: string;
  sender?: Pick<User, 'id' | 'name' | 'avatar'>;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: { user: Pick<User, 'id' | 'name' | 'avatar'> }[];
  messages?: Message[];
  updatedAt: string;
}

export interface BidSuggestion {
  suggestedQuote: number;
  suggestedDeliveryDays: number;
  proposalTemplate: string;
}

export const CATEGORIES = [
  'Web Development',
  'Graphic Design',
  'Writing',
  'Tutoring',
  'Video Editing',
  'Data Entry',
  'Marketing',
  'Mobile Development',
] as const;


/* ---------------- Admin ---------------- */

export interface Paginated<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminUser extends User {
  status: UserStatus;
  suspendedAt?: string | null;
  suspensionReason?: string | null;
  lastLoginAt?: string | null;
  _count?: { services: number; jobs: number; bids: number };
}

export interface AdminUserDetail extends AdminUser {
  _count?: {
    services: number;
    jobs: number;
    bids: number;
    reviewsGiven: number;
    reviewsReceived: number;
    paymentsAsClient: number;
    paymentsAsFreelancer: number;
  };
  recentJobs: { id: string; title: string; status: string; budget: number; createdAt: string }[];
  recentBids: { id: string; quote: number; status: string; jobId: string; createdAt: string }[];
  recentPayments: { id: string; amount: number; commission: number; status: string; createdAt: string }[];
}

export interface AdminStats {
  users: {
    total: number;
    clients: number;
    freelancers: number;
    admins: number;
    active: number;
    suspended: number;
    newLast7Days: number;
    newLast30Days: number;
  };
  jobs: { total: number; open: number; inProgress: number; completed: number; cancelled: number };
  marketplace: { services: number; bids: number; reviews: number };
  payments: {
    completedCount: number;
    totalVolume: number;
    totalCommission: number;
    pendingCount: number;
    pendingVolume: number;
  };
  signupsLast30Days: { date: string; count: number }[];
}

type PersonRef = { id: string; name: string; email: string };

export interface AdminJob extends Omit<Job, 'client'> {
  client?: PersonRef;
}

export interface AdminService extends Omit<Service, 'freelancer'> {
  freelancer?: PersonRef;
}

export interface AdminReview extends Omit<Review, 'reviewer' | 'reviewee'> {
  reviewer?: PersonRef;
  reviewee?: PersonRef;
}

export interface AdminPayment extends Omit<Payment, 'client' | 'freelancer'> {
  client?: PersonRef;
  freelancer?: PersonRef;
}

export interface AuditLog {
  id: string;
  adminId: string | null;
  admin?: PersonRef | null;
  action: string;
  targetType: string;
  targetId: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}
