import { User, Job, Service } from '@prisma/client';

interface MatchInput {
  user: Pick<User, 'id' | 'skills' | 'rating'>;
  jobs: (Job & { client?: { rating: number } })[];
  completedJobsCount: number;
}

export interface JobMatch {
  jobId: string;
  score: number;
  breakdown: {
    skillMatch: number;
    categoryMatch: number;
    ratingScore: number;
    experienceScore: number;
  };
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Web Development': ['javascript', 'react', 'html', 'css', 'node', 'typescript', 'web'],
  'Graphic Design': ['design', 'photoshop', 'illustrator', 'figma', 'ui', 'ux', 'graphic'],
  'Writing': ['writing', 'content', 'copywriting', 'blog', 'seo', 'article'],
  'Tutoring': ['tutoring', 'teaching', 'math', 'science', 'education', 'tutor'],
  'Video Editing': ['video', 'editing', 'premiere', 'after effects', 'motion'],
  'Data Entry': ['data', 'excel', 'spreadsheet', 'typing', 'entry'],
  'Marketing': ['marketing', 'social media', 'ads', 'campaign', 'branding'],
  'Mobile Development': ['mobile', 'android', 'ios', 'flutter', 'react native'],
};

function skillOverlap(userSkills: string[], category: string): number {
  if (userSkills.length === 0) return 0;
  const keywords = CATEGORY_KEYWORDS[category] || category.toLowerCase().split(' ');
  const normalizedSkills = userSkills.map((s) => s.toLowerCase());
  let matches = 0;
  for (const skill of normalizedSkills) {
    if (keywords.some((k) => skill.includes(k) || k.includes(skill))) {
      matches++;
    }
  }
  return Math.min(matches / userSkills.length, 1);
}

function categoryMatch(userSkills: string[], category: string): number {
  const keywords = CATEGORY_KEYWORDS[category] || [category.toLowerCase()];
  const normalizedSkills = userSkills.map((s) => s.toLowerCase());
  const hasMatch = normalizedSkills.some((skill) =>
    keywords.some((k) => skill.includes(k) || k.includes(skill))
  );
  return hasMatch ? 1 : 0.3;
}

export function calculateJobMatches({ user, jobs, completedJobsCount }: MatchInput): JobMatch[] {
  const experienceScore = Math.min(completedJobsCount / 10, 1);
  const userRatingScore = user.rating / 5;

  return jobs
    .map((job) => {
      const skillMatch = skillOverlap(user.skills, job.category);
      const catMatch = categoryMatch(user.skills, job.category);
      const ratingScore = userRatingScore;

      const score =
        skillMatch * 0.4 + catMatch * 0.3 + ratingScore * 0.2 + experienceScore * 0.1;

      return {
        jobId: job.id,
        score: Math.round(score * 100),
        breakdown: {
          skillMatch: Math.round(skillMatch * 100),
          categoryMatch: Math.round(catMatch * 100),
          ratingScore: Math.round(ratingScore * 100),
          experienceScore: Math.round(experienceScore * 100),
        },
      };
    })
    .sort((a, b) => b.score - a.score);
}

export interface BidSuggestion {
  suggestedQuote: number;
  suggestedDeliveryDays: number;
  proposalTemplate: string;
}

export function generateBidSuggestion(
  job: Job,
  freelancer: Pick<User, 'name' | 'skills' | 'rating'>,
  avgBidQuote?: number
): BidSuggestion {
  const baseQuote = avgBidQuote ?? job.budget * 0.85;
  const skillBonus = skillOverlap(freelancer.skills, job.category) * 0.1;
  const suggestedQuote = Math.round(baseQuote * (1 - skillBonus) * 100) / 100;

  const daysUntilDeadline = Math.max(
    1,
    Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
  const suggestedDeliveryDays = Math.max(1, Math.floor(daysUntilDeadline * 0.7));

  const topSkills = freelancer.skills.slice(0, 3).join(', ') || 'relevant skills';
  const proposalTemplate = `Hi! I'm ${freelancer.name}, and I'm excited about your project "${job.title}".

With expertise in ${topSkills}, I can deliver high-quality results within your timeline and budget.

Here's my approach:
1. Understand your requirements thoroughly
2. Provide regular progress updates
3. Deliver polished work on time

I'd love to discuss the details further. Looking forward to working with you!`;

  return { suggestedQuote, suggestedDeliveryDays, proposalTemplate };
}

export async function updateUserRating(userId: string, prisma: { review: { aggregate: Function } }) {
  const result = await prisma.review.aggregate({
    where: { revieweeId: userId },
    _avg: { rating: true },
  });
  return result._avg.rating ?? 0;
}
