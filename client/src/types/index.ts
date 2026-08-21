export type Role = 'FREELANCER' | 'CLIENT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  bio?: string;
  skills: string[];
  avatar?: string;
  rating: number;
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
