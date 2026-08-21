import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.review.deleteMany();
  await prisma.job.deleteMany();
  await prisma.service.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@campusconnect.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@campusconnect.com',
      password,
      role: Role.ADMIN,
      bio: 'Platform administrator',
      skills: ['Management', 'Support'],
    },
  });

  const client1 = await prisma.user.upsert({
    where: { email: 'client@campusconnect.com' },
    update: {},
    create: {
      name: 'Sarah Johnson',
      email: 'client@campusconnect.com',
      password,
      role: Role.CLIENT,
      bio: 'Startup founder looking for talented student freelancers',
      skills: [],
      rating: 4.5,
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'client2@campusconnect.com' },
    update: {},
    create: {
      name: 'Mike Chen',
      email: 'client2@campusconnect.com',
      password,
      role: Role.CLIENT,
      bio: 'Marketing director at a growing SaaS company',
      skills: [],
      rating: 4.2,
    },
  });

  const freelancer1 = await prisma.user.upsert({
    where: { email: 'freelancer@campusconnect.com' },
    update: {},
    create: {
      name: 'Alex Rivera',
      email: 'freelancer@campusconnect.com',
      password,
      role: Role.FREELANCER,
      bio: 'Computer Science student specializing in web development',
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'HTML', 'CSS'],
      rating: 4.8,
    },
  });

  const freelancer2 = await prisma.user.upsert({
    where: { email: 'designer@campusconnect.com' },
    update: {},
    create: {
      name: 'Emma Wilson',
      email: 'designer@campusconnect.com',
      password,
      role: Role.FREELANCER,
      bio: 'Graphic design student with a passion for UI/UX',
      skills: ['Figma', 'Photoshop', 'Illustrator', 'UI Design', 'UX Design'],
      rating: 4.6,
    },
  });

  const freelancer3 = await prisma.user.upsert({
    where: { email: 'writer@campusconnect.com' },
    update: {},
    create: {
      name: 'James Park',
      email: 'writer@campusconnect.com',
      password,
      role: Role.FREELANCER,
      bio: 'English major offering content writing and copywriting services',
      skills: ['Writing', 'Content', 'SEO', 'Copywriting', 'Blog'],
      rating: 4.4,
    },
  });

  await prisma.service.createMany({
    data: [
      { title: 'React Website Development', description: 'I will build a modern, responsive React website for your business or portfolio.', category: 'Web Development', price: 150, freelancerId: freelancer1.id },
      { title: 'Full-Stack Web App', description: 'Complete web application with React frontend and Node.js backend.', category: 'Web Development', price: 350, freelancerId: freelancer1.id },
      { title: 'Logo & Brand Identity', description: 'Professional logo design with brand guidelines and color palette.', category: 'Graphic Design', price: 75, freelancerId: freelancer2.id },
      { title: 'UI/UX Design for Mobile App', description: 'Complete mobile app UI design with prototypes in Figma.', category: 'Graphic Design', price: 200, freelancerId: freelancer2.id },
      { title: 'SEO Blog Articles', description: 'Well-researched, SEO-optimized blog articles (1000+ words each).', category: 'Writing', price: 30, freelancerId: freelancer3.id },
      { title: 'Website Copywriting', description: 'Compelling copy for landing pages, about pages, and product descriptions.', category: 'Writing', price: 50, freelancerId: freelancer3.id },
    ],
    skipDuplicates: true,
  });

  const job1 = await prisma.job.create({
    data: {
      title: 'Build a Student Portfolio Website',
      description: 'Need a clean, modern portfolio website built with React. Should include project showcase, about section, and contact form.',
      budget: 200,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      category: 'Web Development',
      clientId: client1.id,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: 'Design Social Media Graphics',
      description: 'Create 10 social media post templates for Instagram and LinkedIn for our startup launch campaign.',
      budget: 100,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      category: 'Graphic Design',
      clientId: client2.id,
    },
  });

  const job3 = await prisma.job.create({
    data: {
      title: 'Write Product Launch Blog Series',
      description: 'Write a 5-part blog series about our new SaaS product launch. SEO optimized, 1200 words each.',
      budget: 150,
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      category: 'Writing',
      clientId: client1.id,
    },
  });

  await prisma.bid.create({
    data: {
      proposal: 'I have built several portfolio websites using React and would love to help with yours!',
      quote: 180,
      deliveryDays: 10,
      jobId: job1.id,
      freelancerId: freelancer1.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 5,
      comment: 'Alex delivered an amazing website ahead of schedule. Highly recommended!',
      reviewerId: client1.id,
      revieweeId: freelancer1.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 4,
      comment: 'Great design work, very creative and responsive to feedback.',
      reviewerId: client2.id,
      revieweeId: freelancer2.id,
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: client1.id },
          { userId: freelancer1.id },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      { text: 'Hi Alex! I saw your portfolio website service and I am interested.', senderId: client1.id, conversationId: conversation.id },
      { text: 'Thanks Sarah! I would love to discuss your project requirements.', senderId: freelancer1.id, conversationId: conversation.id },
    ],
  });

  console.log('Seed completed!');
  console.log('Demo accounts (password: password123):');
  console.log('  Admin: admin@campusconnect.com');
  console.log('  Client: client@campusconnect.com');
  console.log('  Freelancer: freelancer@campusconnect.com');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
