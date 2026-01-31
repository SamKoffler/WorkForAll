import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// Get all skills/tags
router.get('/', async (req, res, next) => {
    try {
        const { category } = req.query;

        const where = category ? { category: category as string } : {};

        const skills = await prisma.skill.findMany({
            where,
            orderBy: { name: 'asc' },
        });

        // Group by category
        const grouped = skills.reduce((acc, skill) => {
            if (!acc[skill.category]) {
                acc[skill.category] = [];
            }
            acc[skill.category].push(skill);
            return acc;
        }, {} as Record<string, typeof skills>);

        res.json({
            status: 'success',
            data: {
                skills,
                grouped,
            },
        });
    } catch (error) {
        next(error);
    }
});

export { router as skillsRouter };
