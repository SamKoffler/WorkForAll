import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create default skills/tags
    const skills = [
        { name: 'Painting', category: 'skilled', icon: 'paint-brush' },
        { name: 'Moving', category: 'labor', icon: 'truck' },
        { name: 'Cleaning', category: 'service', icon: 'sparkles' },
        { name: 'Yard Work', category: 'labor', icon: 'leaf' },
        { name: 'Construction', category: 'skilled', icon: 'hammer' },
        { name: 'General Labor', category: 'labor', icon: 'wrench' },
        { name: 'Landscaping', category: 'labor', icon: 'tree' },
        { name: 'Demolition', category: 'labor', icon: 'home' },
        { name: 'Delivery', category: 'service', icon: 'package' },
        { name: 'Assembly', category: 'skilled', icon: 'tool' },
        { name: 'Hauling', category: 'labor', icon: 'truck' },
        { name: 'Organizing', category: 'service', icon: 'folder' },
        { name: 'Event Setup', category: 'service', icon: 'calendar' },
        { name: 'Warehouse', category: 'labor', icon: 'box' },
        { name: 'Handyman', category: 'skilled', icon: 'wrench' },
    ];

    for (const skill of skills) {
        await prisma.skill.upsert({
            where: { name: skill.name },
            update: {},
            create: skill,
        });
    }

    console.log(`✅ Created ${skills.length} skills`);

    // Hash password for demo accounts
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create employer account: employer@workforall.com
    const employer = await prisma.user.upsert({
        where: { email: 'employer@workforall.com' },
        update: {},
        create: {
            email: 'employer@workforall.com',
            passwordHash,
            name: 'Sarah Mitchell',
            phone: '555-234-5678',
            userType: 'EMPLOYER',
            city: 'San Francisco',
            zipCode: '94102',
            latitude: 37.7749,
            longitude: -122.4194,
            bio: 'Property manager and small business owner. I frequently need help with moving, cleaning, and maintenance projects. Fair pay and respectful work environment guaranteed.',
            isVerified: true,
        },
    });
    console.log(`✅ Created employer: ${employer.email}`);

    // Create worker account: worker@workforall.com
    const worker = await prisma.user.upsert({
        where: { email: 'worker@workforall.com' },
        update: {},
        create: {
            email: 'worker@workforall.com',
            passwordHash,
            name: 'Marcus Thompson',
            phone: '555-345-6789',
            userType: 'WORKER',
            city: 'San Francisco',
            zipCode: '94103',
            latitude: 37.7739,
            longitude: -122.4094,
            bio: 'Hardworking and reliable. 5+ years experience in moving, general labor, and warehouse work. Available for day jobs and short-term projects. I have my own transportation.',
            hasTransportation: true,
            needsTransportation: false,
            isVerified: true,
            skills: {
                connect: [
                    { name: 'Moving' },
                    { name: 'General Labor' },
                    { name: 'Warehouse' },
                    { name: 'Hauling' },
                    { name: 'Assembly' },
                ],
            },
        },
    });
    console.log(`✅ Created worker: ${worker.email}`);

    // Get skill references for job creation
    const movingSkill = await prisma.skill.findUnique({ where: { name: 'Moving' } });
    const cleaningSkill = await prisma.skill.findUnique({ where: { name: 'Cleaning' } });
    const paintingSkill = await prisma.skill.findUnique({ where: { name: 'Painting' } });
    const yardWorkSkill = await prisma.skill.findUnique({ where: { name: 'Yard Work' } });
    const generalLaborSkill = await prisma.skill.findUnique({ where: { name: 'General Labor' } });
    const eventSetupSkill = await prisma.skill.findUnique({ where: { name: 'Event Setup' } });
    const handymanSkill = await prisma.skill.findUnique({ where: { name: 'Handyman' } });
    const warehouseSkill = await prisma.skill.findUnique({ where: { name: 'Warehouse' } });

    // Create dates for jobs
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    dayAfterTomorrow.setHours(8, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(8, 0, 0, 0);

    const twoWeeksOut = new Date();
    twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
    twoWeeksOut.setHours(10, 0, 0, 0);

    // Job 1: Moving Help (OPEN)
    const job1 = await prisma.job.create({
        data: {
            title: 'Help Moving Apartment - 2 Workers Needed',
            description: 'Moving from a 2-bedroom apartment on the 3rd floor to a moving truck. Need 2 strong workers who can lift heavy furniture including a couch, queen bed, dresser, and boxes. Elevator available. Water and snacks provided. Estimated 4 hours of work.',
            payAmount: 28,
            payType: 'HOURLY',
            durationHours: 4,
            startDate: tomorrow,
            startTime: '09:00',
            latitude: 37.7849,
            longitude: -122.4094,
            address: '456 Valencia St, Apt 3B',
            city: 'San Francisco',
            zipCode: '94103',
            workersNeeded: 2,
            providesTransportation: false,
            employerId: employer.id,
            status: 'OPEN',
            skills: {
                connect: [{ id: movingSkill!.id }, { id: generalLaborSkill!.id }],
            },
        },
    });

    // Job 2: Deep Cleaning (OPEN)
    const job2 = await prisma.job.create({
        data: {
            title: 'Post-Renovation Deep Cleaning',
            description: 'Need thorough cleaning of a 1,200 sq ft office space after renovation. Includes dusting, vacuuming, mopping, window cleaning, and removing construction debris. All cleaning supplies and equipment provided. Must be detail-oriented.',
            payAmount: 200,
            payType: 'FIXED',
            durationHours: 6,
            startDate: dayAfterTomorrow,
            startTime: '10:00',
            latitude: 37.7899,
            longitude: -122.3994,
            address: '789 Mission St, Suite 200',
            city: 'San Francisco',
            zipCode: '94103',
            workersNeeded: 2,
            providesTransportation: false,
            employerId: employer.id,
            status: 'OPEN',
            skills: {
                connect: [{ id: cleaningSkill!.id }],
            },
        },
    });

    // Job 3: Yard Work (OPEN)
    const job3 = await prisma.job.create({
        data: {
            title: 'Backyard Cleanup and Landscaping',
            description: 'Need help cleaning up an overgrown backyard. Tasks include mowing lawn, trimming hedges, raking leaves, and hauling green waste to the curb. Tools provided. Great for someone who enjoys outdoor work.',
            payAmount: 25,
            payType: 'HOURLY',
            durationHours: 5,
            startDate: nextWeek,
            startTime: '08:00',
            latitude: 37.7649,
            longitude: -122.4294,
            address: '123 Oak St',
            city: 'San Francisco',
            zipCode: '94117',
            workersNeeded: 1,
            providesTransportation: true,
            employerId: employer.id,
            status: 'OPEN',
            skills: {
                connect: [{ id: yardWorkSkill!.id }],
            },
        },
    });

    // Job 4: Event Setup (OPEN)
    const job4 = await prisma.job.create({
        data: {
            title: 'Corporate Event Setup - Tables & Chairs',
            description: 'Setting up for a corporate event at a downtown venue. Need to arrange 50 tables and 200 chairs, set up a small stage, and help with decoration placement. Event starts at 6pm, setup must be complete by 5pm.',
            payAmount: 22,
            payType: 'HOURLY',
            durationHours: 4,
            startDate: twoWeeksOut,
            startTime: '13:00',
            latitude: 37.7879,
            longitude: -122.4074,
            address: '50 Fremont St',
            city: 'San Francisco',
            zipCode: '94105',
            workersNeeded: 3,
            providesTransportation: false,
            employerId: employer.id,
            status: 'OPEN',
            skills: {
                connect: [{ id: eventSetupSkill!.id }, { id: generalLaborSkill!.id }],
            },
        },
    });

    // Job 5: Painting (OPEN)
    const job5 = await prisma.job.create({
        data: {
            title: 'Interior Painting - 2 Rooms',
            description: 'Looking for experienced painters to paint 2 bedrooms (approx 12x12 each). Walls need one coat of primer and two coats of paint. All paint and supplies provided. Must have painting experience.',
            payAmount: 30,
            payType: 'HOURLY',
            durationDays: 1,
            startDate: nextWeek,
            startTime: '09:00',
            latitude: 37.7719,
            longitude: -122.4374,
            address: '890 Haight St',
            city: 'San Francisco',
            zipCode: '94117',
            workersNeeded: 2,
            providesTransportation: false,
            employerId: employer.id,
            status: 'OPEN',
            skills: {
                connect: [{ id: paintingSkill!.id }],
            },
        },
    });

    // Job 6: Warehouse Work (OPEN)
    const job6 = await prisma.job.create({
        data: {
            title: 'Warehouse Inventory & Organization',
            description: 'Help needed organizing a small warehouse. Tasks include sorting inventory, labeling boxes, and reorganizing shelving units. Must be able to lift up to 50 lbs. Climate-controlled facility.',
            payAmount: 20,
            payType: 'HOURLY',
            durationHours: 8,
            startDate: dayAfterTomorrow,
            startTime: '07:00',
            latitude: 37.7599,
            longitude: -122.3894,
            address: '1500 Evans Ave',
            city: 'San Francisco',
            zipCode: '94124',
            workersNeeded: 2,
            providesTransportation: true,
            employerId: employer.id,
            status: 'OPEN',
            skills: {
                connect: [{ id: warehouseSkill!.id }, { id: generalLaborSkill!.id }],
            },
        },
    });

    // Job 7: Handyman Work (OPEN)
    const job7 = await prisma.job.create({
        data: {
            title: 'Minor Home Repairs - Handyman Needed',
            description: 'Need a skilled handyman for various small repairs: fix a leaky faucet, patch drywall holes, install a ceiling fan, and adjust cabinet doors. Must have own basic tools. Experience required.',
            payAmount: 35,
            payType: 'HOURLY',
            durationHours: 4,
            startDate: twoWeeksOut,
            startTime: '10:00',
            latitude: 37.7829,
            longitude: -122.4194,
            address: '234 Polk St',
            city: 'San Francisco',
            zipCode: '94102',
            workersNeeded: 1,
            providesTransportation: false,
            employerId: employer.id,
            status: 'OPEN',
            skills: {
                connect: [{ id: handymanSkill!.id }],
            },
        },
    });

    console.log(`✅ Created 7 job postings for employer`);

    // Create job applications from worker
    // Application 1: Applied to Moving job (PENDING)
    await prisma.jobApplication.create({
        data: {
            jobId: job1.id,
            workerId: worker.id,
            status: 'PENDING',
            coverNote: 'Hi! I have 5 years of moving experience and can definitely help with your apartment move. I\'m strong, reliable, and always show up on time. Looking forward to hearing from you!',
        },
    });

    // Application 2: Applied to Warehouse job (ACCEPTED)
    await prisma.jobApplication.create({
        data: {
            jobId: job6.id,
            workerId: worker.id,
            status: 'ACCEPTED',
            coverNote: 'I have extensive warehouse experience including inventory management and organization. I\'m comfortable with heavy lifting and can work efficiently. Would love to help out!',
        },
    });

    console.log(`✅ Created 2 job applications for worker`);

    // Create a conversation between employer and worker
    const conversation = await prisma.conversation.create({
        data: {
            jobId: job6.id,
            participants: {
                create: [
                    { userId: employer.id },
                    { userId: worker.id },
                ],
            },
        },
    });

    // Add messages to the conversation
    await prisma.message.create({
        data: {
            conversationId: conversation.id,
            senderId: employer.id,
            receiverId: worker.id,
            content: 'Hi Marcus! Thanks for applying to the warehouse job. Your experience looks great. Are you available to start at 7am sharp?',
            isRead: true,
        },
    });

    await prisma.message.create({
        data: {
            conversationId: conversation.id,
            senderId: worker.id,
            receiverId: employer.id,
            content: 'Hi Sarah! Yes, absolutely. I\'m an early riser and 7am works perfectly for me. Should I bring any specific gear or clothing?',
            isRead: true,
        },
    });

    await prisma.message.create({
        data: {
            conversationId: conversation.id,
            senderId: employer.id,
            receiverId: worker.id,
            content: 'Just wear comfortable clothes and closed-toe shoes. We\'ll provide gloves and any other equipment. See you there!',
            isRead: false,
        },
    });

    console.log(`✅ Created conversation with messages`);

    // Create notifications for worker
    await prisma.notification.create({
        data: {
            userId: worker.id,
            type: 'APPLICATION_ACCEPTED',
            title: 'Application Accepted!',
            message: 'Your application for "Warehouse Inventory & Organization" has been accepted by Sarah Mitchell.',
            isRead: false,
            data: { jobId: job6.id },
        },
    });

    await prisma.notification.create({
        data: {
            userId: worker.id,
            type: 'NEW_MESSAGE',
            title: 'New Message',
            message: 'Sarah Mitchell sent you a message about "Warehouse Inventory & Organization".',
            isRead: false,
            data: { conversationId: conversation.id },
        },
    });

    // Create notifications for employer
    await prisma.notification.create({
        data: {
            userId: employer.id,
            type: 'APPLICATION_RECEIVED',
            title: 'New Application',
            message: 'Marcus Thompson applied for "Help Moving Apartment - 2 Workers Needed".',
            isRead: false,
            data: { jobId: job1.id },
        },
    });

    console.log(`✅ Created notifications`);

    // Create a past completed job with review
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);

    const completedJob = await prisma.job.create({
        data: {
            title: 'Office Furniture Assembly',
            description: 'Assembled 10 desks and office chairs for a new startup office.',
            payAmount: 180,
            payType: 'FIXED',
            durationHours: 6,
            startDate: pastDate,
            startTime: '09:00',
            latitude: 37.7879,
            longitude: -122.4024,
            address: '100 Spear St',
            city: 'San Francisco',
            zipCode: '94105',
            workersNeeded: 1,
            workersHired: 1,
            providesTransportation: false,
            employerId: employer.id,
            status: 'COMPLETED',
            skills: {
                connect: [{ id: generalLaborSkill!.id }],
            },
        },
    });

    // Create completed application
    await prisma.jobApplication.create({
        data: {
            jobId: completedJob.id,
            workerId: worker.id,
            status: 'COMPLETED',
            coverNote: 'I have experience with furniture assembly and can work efficiently.',
        },
    });

    // Create reviews
    await prisma.review.create({
        data: {
            authorId: employer.id,
            subjectId: worker.id,
            rating: 5,
            comment: 'Marcus did an excellent job! He was punctual, professional, and assembled all the furniture perfectly. Highly recommend!',
            reviewType: 'EMPLOYER_TO_WORKER',
            jobId: completedJob.id,
        },
    });

    await prisma.review.create({
        data: {
            authorId: worker.id,
            subjectId: employer.id,
            rating: 5,
            comment: 'Great employer! Sarah was very clear about expectations, provided all necessary tools, and paid promptly. Would definitely work for her again.',
            reviewType: 'WORKER_TO_EMPLOYER',
            jobId: completedJob.id,
        },
    });

    console.log(`✅ Created completed job with reviews`);

    console.log('🎉 Seeding complete!');
    console.log('');
    console.log('📧 Demo Accounts:');
    console.log('   Employer: employer@workforall.com / password123');
    console.log('   Worker:   worker@workforall.com / password123');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
