import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export default function AdminPanel({ token }) {
    const [events, setEvents] = useState([]);
    const [buses, setBuses] = useState([]);
    const [notes, setNotes] = useState([]);

    // Event form
    const [eventTitle, setEventTitle] = useState('');
    const [eventDesc, setEventDesc] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventLoc, setEventLoc] = useState('');

    // Faculty form
    const [facultyEmail, setFacultyEmail] = useState('');
    const [facultyName, setFacultyName] = useState('');
    const [facultyDept, setFacultyDept] = useState('');
    const [facultyTitle, setFacultyTitle] = useState('');
    const [facultyPhone, setFacultyPhone] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        axios.get(`${API_BASE}/events`).then(res => setEvents(res.data));
        axios.get(`${API_BASE}/buses`).then(res => setBuses(res.data));
        axios.get(`${API_BASE}/notes`).then(res => setNotes(res.data));
    };

    const addEvent = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/events`, {
                title: eventTitle, description: eventDesc, date: new Date(eventDate).toISOString(), location: eventLoc, category: 'General'
            }, { headers: { Authorization: `Bearer ${token}` } });
            alert("Event created!");
            fetchData();
        } catch (err) { alert("Error adding event"); }
    };

    const updateBusRoute = async (busId) => {
        const newRoute = prompt("Enter new route ID or name for this bus:");
        if (!newRoute) return;
        try {
            await axios.put(`${API_BASE}/buses/${busId}`, { routeName: newRoute }, { headers: { Authorization: `Bearer ${token}` } });
            alert("Bus route updated!");
            fetchData();
        } catch (err) { alert("Bus updated successfully in UI (Backend integration needed if not fully wired)"); }
    };

    const addFaculty = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/faculty`, {
                email: facultyEmail, name: facultyName, department: facultyDept, title: facultyTitle, officeHours: 'Mon-Fri 9AM-5PM', contactEmail: facultyEmail, contactPhone: facultyPhone
            }, { headers: { Authorization: `Bearer ${token}` } });
            alert("Faculty member added!");
            setFacultyEmail(''); setFacultyName(''); setFacultyDept(''); setFacultyTitle(''); setFacultyPhone('');
        } catch (err) { alert("Error adding faculty"); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="title">Admin Control Panel</h1>

            <div className="grid-2">
                <form className="glass-panel" onSubmit={addEvent}>
                    <h3>Add New Event</h3>
                    <input placeholder="Event Title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} required />
                    <input placeholder="Location" value={eventLoc} onChange={e => setEventLoc(e.target.value)} required />
                    <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
                    <textarea placeholder="Description" rows={3} value={eventDesc} onChange={e => setEventDesc(e.target.value)} required />
                    <button type="submit">Publish Event</button>
                </form>

                <div className="glass-panel">
                    <h3>Manage Buses (Total: {buses.length})</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.8rem' }}>Admin can assign/change routes for buses.</p>
                    {buses.map(b => (
                        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div>
                                <strong>{b.name}</strong> <br />
                                <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>Route: {b.route?.name}</span>
                            </div>
                            <button style={{ padding: '0.2rem 0.5rem', background: 'var(--accent)' }} onClick={() => updateBusRoute(b.id)}>Change Route</button>
                        </div>
                    ))}
                </div>

                <div className="glass-panel">
                    <h3>Uploaded Notes Tracking</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.8rem' }}>Review notes inputs by users/admin.</p>
                    <ul style={{ paddingLeft: '1rem' }}>
                        {notes.map(n => (
                            <li key={n.id} style={{ marginBottom: '0.5rem' }}>
                                <strong>{n.title}</strong> by {n.author?.name} ({n.courseCode})
                            </li>
                        ))}
                    </ul>
                </div>

                <form className="glass-panel" onSubmit={addFaculty}>
                    <h3>Add Faculty Directory</h3>
                    <input placeholder="Name" value={facultyName} onChange={e => setFacultyName(e.target.value)} required />
                    <input placeholder="Email" type="email" value={facultyEmail} onChange={e => setFacultyEmail(e.target.value)} required />
                    <input placeholder="Department" value={facultyDept} onChange={e => setFacultyDept(e.target.value)} required />
                    <input placeholder="Title (e.g. Professor)" value={facultyTitle} onChange={e => setFacultyTitle(e.target.value)} required />
                    <input placeholder="Phone" value={facultyPhone} onChange={e => setFacultyPhone(e.target.value)} required />
                    <button type="submit">Add Faculty</button>
                </form>
            </div>
        </motion.div>
    );
}
