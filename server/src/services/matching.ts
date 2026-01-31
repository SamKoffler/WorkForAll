// Job matching and ranking algorithm

interface JobWithSkills {
    id: string;
    latitude: number;
    longitude: number;
    providesTransportation: boolean;
    skills: { id: string }[];
}

interface UserContext {
    userSkillIds: string[];
    userLatitude: number | null;
    userLongitude: number | null;
    userNeedsTransportation: boolean;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

// Calculate skill match score (0-100)
function calculateSkillScore(jobSkillIds: string[], userSkillIds: string[]): number {
    if (jobSkillIds.length === 0) return 50; // Neutral if no skills required
    if (userSkillIds.length === 0) return 30; // Lower score if user has no skills listed

    const matchingSkills = jobSkillIds.filter(id => userSkillIds.includes(id));
    return (matchingSkills.length / jobSkillIds.length) * 100;
}

// Calculate distance score (0-100, higher is closer)
function calculateDistanceScore(
    jobLat: number,
    jobLon: number,
    userLat: number | null,
    userLon: number | null
): number {
    if (userLat === null || userLon === null) return 50; // Neutral if no location

    const distance = calculateDistance(userLat, userLon, jobLat, jobLon);

    // Score decreases with distance
    // 0-1 mile: 100, 1-5 miles: 80-100, 5-10 miles: 50-80, 10-25 miles: 20-50, 25+ miles: 0-20
    if (distance <= 1) return 100;
    if (distance <= 5) return 100 - (distance - 1) * 5;
    if (distance <= 10) return 80 - (distance - 5) * 6;
    if (distance <= 25) return 50 - (distance - 10) * 2;
    return Math.max(0, 20 - (distance - 25) * 0.5);
}

// Calculate transportation compatibility score (0-100)
function calculateTransportationScore(
    jobProvidesTransport: boolean,
    userNeedsTransport: boolean
): number {
    if (!userNeedsTransport) return 100; // User has transportation, can take any job
    if (jobProvidesTransport) return 100; // Job provides what user needs
    return 30; // User needs transport but job doesn't provide it
}

// Main scoring function
export function calculateJobScore(
    job: JobWithSkills,
    userContext: UserContext
): number {
    const jobSkillIds = job.skills.map(s => s.id);

    const skillScore = calculateSkillScore(jobSkillIds, userContext.userSkillIds);
    const distanceScore = calculateDistanceScore(
        job.latitude,
        job.longitude,
        userContext.userLatitude,
        userContext.userLongitude
    );
    const transportScore = calculateTransportationScore(
        job.providesTransportation,
        userContext.userNeedsTransportation
    );

    // Weighted average
    // Skills: 40%, Distance: 35%, Transportation: 25%
    const totalScore =
        skillScore * 0.4 +
        distanceScore * 0.35 +
        transportScore * 0.25;

    return Math.round(totalScore);
}

// Find matching workers for a job (for Teli notifications)
export async function findMatchingWorkers(
    jobId: string,
    prisma: any,
    minScore: number = 50
): Promise<{ userId: string; score: number }[]> {
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { skills: true },
    });

    if (!job) return [];

    // Get all workers with their skills and location
    const workers = await prisma.user.findMany({
        where: {
            userType: { in: ['WORKER', 'BOTH'] },
            id: { not: job.employerId },
        },
        include: { skills: true },
    });

    const matchingWorkers: { userId: string; score: number }[] = [];

    for (const worker of workers) {
        const score = calculateJobScore(job, {
            userSkillIds: worker.skills.map((s: any) => s.id),
            userLatitude: worker.latitude,
            userLongitude: worker.longitude,
            userNeedsTransportation: worker.needsTransportation,
        });

        if (score >= minScore) {
            matchingWorkers.push({ userId: worker.id, score });
        }
    }

    // Sort by score descending
    matchingWorkers.sort((a, b) => b.score - a.score);

    return matchingWorkers;
}
