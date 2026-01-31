import { PrismaClient } from '@prisma/client';

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

    // Create sample users for development
    if (process.env.NODE_ENV === 'development') {
        // Sample employer
        const employer = await prisma.user.upsert({
            where: { email: 'employer@example.com' },
            update: {},
            create: {
                email: 'employer@example.com',
                name: 'John Smith',
                phone: '555-123-4567',
                userType: 'EMPLOYER',
                city: 'San Francisco',
                zipCode: '94102',
                latitude: 37.7749,
                longitude: -122.4194,
                isVerified: true,
            },
        });

        // Sample worker
        const worker = await prisma.user.upsert({
            where: { email: 'worker@example.com' },
            update: {},
            create: {
                email: 'worker@example.com',
                name: 'Mike Johnson',
                userType: 'WORKER',
                city: 'San Francisco',
                zipCode: '94103',
                latitude: 37.7749,
                longitude: -122.4094,
                hasTransportation: false,
                needsTransportation: true,
                skills: {
                    connect: [
                        { name: 'Moving' },
                        { name: 'General Labor' },
                        { name: 'Cleaning' },
                    ],
                },
            },
        });

        // Sample jobs
        const paintingSkill = await prisma.skill.findUnique({ where: { name: 'Painting' } });
        const movingSkill = await prisma.skill.findUnique({ where: { name: 'Moving' } });
        const cleaningSkill = await prisma.skill.findUnique({ where: { name: 'Cleaning' } });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(8, 0, 0, 0);

        await prisma.job.create({
            data: {
                title: 'Help Moving Furniture',
                description: 'Need 2 strong workers to help move furniture from a 2-bedroom apartment to a moving truck. Light refreshments provided.',
                payAmount: 25,
                payType: 'HOURLY',
                durationHours: 4,
                startDate: tomorrow,
                startTime: '09:00',
                latitude: 37.7849,
                longitude: -122.4094,
                address: '123 Market St',
                city: 'San Francisco',
                zipCode: '94102',
                workersNeeded: 2,
                providesTransportation: false,
                employerId: employer.id,
                skills: {
                    connect: [{ id: movingSkill!.id }],
                },
            },
        });

        await prisma.job.create({
            data: {
                title: 'Exterior House Painting',
                description: 'Looking for experienced painters to help paint the exterior of a single-story house. All supplies provided.',
                payAmount: 30,
                payType: 'HOURLY',
                durationDays: 2,
                startDate: nextWeek,
                startTime: '08:00',
                latitude: 37.7649,
                longitude: -122.4294,
                address: '456 Oak St',
                city: 'San Francisco',
                zipCode: '94117',
                workersNeeded: 3,
                providesTransportation: true,
                employerId: employer.id,
                skills: {
                    connect: [{ id: paintingSkill!.id }],
                },
            },
        });

        await prisma.job.create({
            data: {
                title: 'Office Deep Cleaning',
                description: 'Need thorough cleaning of a small office space after renovation. Cleaning supplies provided.',
                payAmount: 150,
                payType: 'FIXED',
                durationHours: 6,
                startDate: tomorrow,
                startTime: '10:00',
                latitude: 37.7899,
                longitude: -122.3994,
                address: '789 Mission St',
                city: 'San Francisco',
                zipCode: '94103',
                workersNeeded: 1,
                providesTransportation: false,
                employerId: employer.id,
                skills: {
                    connect: [{ id: cleaningSkill!.id }],
                },
            },
        });

        console.log('✅ Created sample users and jobs');
    }

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
