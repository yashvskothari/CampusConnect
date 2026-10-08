import { CATEGORIES } from '../types';

/** The catch-all option shown at the end of the category list and of every skill list. */
export const OTHER = 'Other';

type RealCategory = Exclude<(typeof CATEGORIES)[number], typeof OTHER>;

/**
 * Skills / services offered under each category.
 * To add one, just add a string to the right list — "Other" is appended automatically.
 */
export const SKILLS_BY_CATEGORY: Record<RealCategory, string[]> = {
  'Web Development': ['Frontend Development', 'Backend Development', 'Full Stack Development', 'WordPress', 'Landing Page', 'Website Bug Fixing', 'API Integration', 'Portfolio Website'],
  'Software Development': ['Desktop Application', 'Python Scripting', 'Java Development', 'C / C++ Development', 'Automation & Bots', 'Software Testing / QA', 'Database Design', 'Code Review'],
  'Mobile Development': ['Android App', 'iOS App', 'Flutter', 'React Native', 'App Bug Fixing', 'App UI Implementation'],
  'AI & Machine Learning': ['Machine Learning Model', 'Chatbot Development', 'Computer Vision', 'NLP / Text Analysis', 'Prompt Engineering', 'Data Labeling'],
  'Data & Analytics': ['Data Cleaning', 'Data Visualization', 'Excel / Google Sheets', 'Power BI / Tableau', 'SQL Queries', 'Statistical Analysis', 'Web Scraping'],
  'Cloud & DevOps': ['AWS', 'Azure / Google Cloud', 'Docker & Kubernetes', 'CI/CD Pipelines', 'Server Setup', 'Deployment Help'],
  'Cybersecurity': ['Security Audit', 'Penetration Testing', 'Vulnerability Assessment', 'Security Awareness Training'],
  'UI/UX & Design': ['UI Design', 'UX Research', 'Wireframing & Prototyping', 'Figma Design', 'Mobile App Design', 'Website Redesign'],
  'Graphic Design': ['Logo Design', 'Poster & Flyer', 'Social Media Graphics', 'Branding & Identity', 'Illustration', 'Packaging Design', 'Infographics'],
  'Video & Animation': ['Video Editing', '2D Animation', '3D Animation', 'Motion Graphics', 'Reels / Shorts Editing', 'Explainer Video'],
  'Photography': ['Event Photography', 'Product Photography', 'Portrait Photography', 'Photo Editing & Retouching'],
  'Writing & Content': ['Blog / Article Writing', 'Copywriting', 'Technical Writing', 'Proofreading & Editing', 'Resume / CV Writing', 'Script Writing', 'Academic Writing Help'],
  'Translation & Languages': ['Hindi ↔ English Translation', 'Document Translation', 'Transcription', 'Subtitling', 'Language Tutoring'],
  'Digital Marketing': ['SEO', 'Social Media Marketing', 'Email Marketing', 'Google / Meta Ads', 'Content Marketing', 'Market Research'],
  'Sales & Business': ['Business Plan', 'Lead Generation', 'Market Analysis', 'Pitch Deck', 'Customer Outreach'],
  'Finance & Accounting': ['Bookkeeping', 'Financial Modeling', 'Tax Filing Help', 'Budgeting', 'Invoice Management'],
  'Administrative Services': ['Data Entry', 'Virtual Assistant', 'Email & Calendar Management', 'Research Assistance', 'Form Filling'],
  'Education & Tutoring': ['Mathematics Tutoring', 'Science Tutoring', 'Programming Tutoring', 'Exam Preparation', 'Study Notes', 'Test Paper Creation'],
  'Engineering & Architecture': ['CAD Drawing', 'Architectural Design', '3D Modeling', 'Circuit Design', 'Mechanical Design', 'Structural Design'],
  'Music & Audio': ['Music Composition', 'Audio Editing', 'Voice Over', 'Podcast Editing', 'Mixing & Mastering'],
  'Legal & Professional Services': ['Contract Drafting', 'Legal Research', 'Policy Writing', 'Compliance Documents'],
  'HR & Recruitment': ['Resume Screening', 'Job Description Writing', 'Candidate Sourcing', 'Interview Scheduling'],
  'E-commerce': ['Online Store Setup', 'Product Listing', 'Product Descriptions', 'Shopify / WooCommerce', 'Marketplace Management'],
  'Social Media': ['Content Creation', 'Page Management', 'Content Calendar', 'Community Management', 'Influencer Outreach'],
  'Presentations & Documents': ['PowerPoint Presentation', 'Pitch Deck Design', 'Report Formatting', 'PDF / Document Design', 'Typing & Formatting'],
  'AR/VR & Emerging Technology': ['AR Filters', 'VR Experience', 'Unity Development', 'Blockchain / Web3', 'IoT Projects'],
  'Personal & Creative Services': ['Handmade Crafts', 'Calligraphy', 'Invitation Design', 'Gift Customization', 'Event Planning Help'],
};

/** Skill choices for a category, always ending with "Other". */
export function getSkillOptions(category: string): string[] {
  const list = (SKILLS_BY_CATEGORY as Record<string, string[] | undefined>)[category] ?? [];
  return [...list, OTHER];
}
