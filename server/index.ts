import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import * as jsonwebtoken from 'jsonwebtoken';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

// Mock AI endpoint
app.post('/api/ai/chat', (req: Request, res: Response) => {
    const { prompt } = req.body;
    const reply = `AI Assistant: I am happy to help with your college queries! You asked: "${prompt}". (This is a generic response for demo purposes.)`;
    res.json({ reply });
});

// User Auth
app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { email, password, name, role } = req.body;
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, passwordHash, name, role }
        });
        const token = jsonwebtoken.sign({ id: user.id, role: user.role }, JWT_SECRET);
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (err) {
        res.status(400).json({ error: 'User already exists or invalid data' });
    }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
            return res.status(401).json({ error: 'DATABASE_EMPTY' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'USER_NOT_FOUND' });
        }
        if (!(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'INVALID_PASSWORD' });
        }
        const token = jsonwebtoken.sign({ id: user.id, role: user.role }, JWT_SECRET);
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Middleware for auth
const authMiddleware = (req: any, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = jsonwebtoken.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

app.put('/api/buses/:id', authMiddleware, async (req: any, res: Response) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const { routeName } = req.body;
    try {
        let route = await prisma.busRoute.findFirst({ where: { name: routeName } });
        if (!route) {
            route = await prisma.busRoute.create({ data: { name: routeName } });
        }
        const bus = await prisma.bus.update({
            where: { id: req.params.id },
            data: { routeId: route.id }
        });
        res.json(bus);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Bus Tracking Endpoint
app.get('/api/buses', async (req: Request, res: Response) => {
    // Simulate active movement for demo
    const buses = await prisma.bus.findMany({ include: { route: true } });

    // Real-time jitter for simulation if there are any
    const simulated = buses.map(bus => ({
        ...bus,
        currentLat: bus.currentLat + (Math.random() - 0.5) * 0.001,
        currentLng: bus.currentLng + (Math.random() - 0.5) * 0.001
    }));
    res.json(simulated);
});

// Get Stops
app.get('/api/buses/stops', async (req: Request, res: Response) => {
    const stops = await prisma.stop.findMany({ include: { route: true } });
    res.json(stops);
})

// Events Endpoints
app.get('/api/events', async (req: Request, res: Response) => {
    const events = await prisma.event.findMany({ orderBy: { date: 'asc' } });
    res.json(events);
});

app.post('/api/events', authMiddleware, async (req: any, res: Response) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'FACULTY') return res.status(403).json({ error: 'Forbidden' });
    const event = await prisma.event.create({ data: req.body });
    res.json(event);
});

// Faculty Directory Endpoints
app.get('/api/faculty', async (req: Request, res: Response) => {
    try {
        const faculty = await prisma.facultyProfile.findMany({
            include: { user: { select: { name: true, email: true } } }
        });
        res.json(faculty);
    } catch (err) {
        res.status(500).json({ error: 'Server error' })
    }
});

app.post('/api/faculty', authMiddleware, async (req: any, res: Response) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { email, password, name, department, title, officeHours, contactEmail, contactPhone } = req.body;
    try {
        const passwordHash = await bcrypt.hash(password || 'password123', 10);
        const newUser = await prisma.user.create({
            data: { email, passwordHash, name, role: 'FACULTY' }
        });
        const faculty = await prisma.facultyProfile.create({
            data: { userId: newUser.id, department, title, officeHours, contactEmail, contactPhone }
        });
        res.json(faculty);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Notes Sharing Endpoints
app.get('/api/notes', async (req: Request, res: Response) => {
    const notes = await prisma.note.findMany({ include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(notes);
});

app.post('/api/notes', authMiddleware, async (req: any, res: Response) => {
    try {
        const note = await prisma.note.create({
            data: {
                ...req.body,
                authorId: req.user.id
            }
        });
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Seeding logic inside API for demo convenience if no faculty
app.post('/api/debug/seed', async (req, res) => {
    try {
        await prisma.facultyProfile.deleteMany();
        await prisma.note.deleteMany();
        await prisma.event.deleteMany();
        await prisma.bus.deleteMany();
        await prisma.stop.deleteMany();
        await prisma.busRoute.deleteMany();
        await prisma.user.deleteMany();

        const passwordHash = await bcrypt.hash('password123', 10);

        // Create users
        const admin = await prisma.user.create({ data: { email: 'admin@college.edu', name: 'Admin User', role: 'ADMIN', passwordHash } });
        const faculty1 = await prisma.user.create({ data: { email: 'dr.smith@college.edu', name: 'Dr. Smith', role: 'FACULTY', passwordHash } });
        const faculty2 = await prisma.user.create({ data: { email: 'dr.jane@college.edu', name: 'Dr. Jane Doe', role: 'FACULTY', passwordHash } });
        const student1 = await prisma.user.create({ data: { email: 'student@college.edu', name: 'Student 1', role: 'STUDENT', passwordHash } });

        // Create Faculty Profiles
        await prisma.facultyProfile.createMany({
            data: [
                { userId: faculty1.id, department: 'Computer Science', title: 'Professor', officeHours: 'Mon-Wed 10AM-12PM', contactEmail: 'smith@college.edu', contactPhone: '555-0101' },
                { userId: faculty2.id, department: 'Mathematics', title: 'Associate Professor', officeHours: 'Tue-Thu 1PM-3PM', contactEmail: 'jane.doe@college.edu', contactPhone: '555-0102' },
            ]
        });

        // Create Route and Bus and Stops
        const route = await prisma.busRoute.create({ data: { name: 'Madurai Loop (Airport - College)' } });
        const stop1 = await prisma.stop.create({ data: { name: 'Valayankulam Village', lat: 9.8335, lng: 78.0934, routeId: route.id } });
        const stop2 = await prisma.stop.create({ data: { name: 'Nagarathinam Angalammal Arts and Science College', lat: 9.8519, lng: 78.0931, routeId: route.id } });
        for (let i = 1; i <= 6; i++) {
            await prisma.bus.create({
                data: { name: `Bus ${i}`, routeId: route.id, currentLat: 9.9252 - (i * 0.01), currentLng: 78.1198 - (i * 0.01), nextStopId: stop2.id }
            });
        }

        // Create Events
        await prisma.event.createMany({
            data: [
                { title: 'Tech Career Fair', description: 'Meet with top tech companies.', date: new Date('2026-10-15T10:00:00Z'), location: 'Main Hall', category: 'Career' },
                { title: 'Hackathon 2026', description: '24-hour coding competition.', date: new Date('2026-11-20T18:00:00Z'), location: 'CS Lab', category: 'Academic' }
            ]
        });

        // Create Notes
        await prisma.note.create({
            data: { title: 'CS101 Midterm Review', content: 'Notes covering Big-O and Arrays...', authorId: student1.id, courseCode: 'CS101' }
        });

        res.json({ message: "Seeded successfully" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/^(?!\/api).*/, (req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
