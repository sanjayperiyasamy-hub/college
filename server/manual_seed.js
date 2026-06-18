const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function seed() {
    await prisma.facultyProfile.deleteMany();
    await prisma.note.deleteMany();
    await prisma.event.deleteMany();
    await prisma.bus.deleteMany();
    await prisma.stop.deleteMany();
    await prisma.busRoute.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.create({ data: { email: 'admin@college.edu', name: 'Admin User', role: 'ADMIN', passwordHash } });
    const student1 = await prisma.user.create({ data: { email: 'student@college.edu', name: 'Student 1', role: 'STUDENT', passwordHash } });
    const route = await prisma.busRoute.create({ data: { name: 'Campus Loop' } });
    const stop2 = await prisma.stop.create({ data: { name: 'Science Building', lat: 37.7750, lng: -122.4180, routeId: route.id } });

    for (let i = 1; i <= 6; i++) {
        await prisma.bus.create({
            data: { name: `Bus ${i}`, routeId: route.id, currentLat: 37.77495 + (i * 0.001), currentLng: -122.4185 - (i * 0.001), nextStopId: stop2.id, status: 'ON_TIME' }
        });
    }
    console.log('Seeded manually without Express');
}
seed();
