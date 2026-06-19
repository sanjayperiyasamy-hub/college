import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Bus, Calendar, Users, BookOpen, MessageSquare, Menu, LogOut, Loader2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

import AdminPanel from './AdminPanel';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = (import.meta.env.VITE_API_BASE || '') + '/api';
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      return { success: true };
    } catch (err) {
      return { success: false, code: err.response?.data?.error };
    }
  };
  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('user'); localStorage.removeItem('token');
  };
  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
};

// --- SCREENS ---

const Dashboard = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="animate-enter">
    <h1 className="title" style={{ fontSize: '2rem' }}>Nagarathinam Angalammal Arts and Science College</h1>
    <p style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
      Affiliated with Madurai Kamaraj University and established by the Nagarathinam Angalammal Educational Trust.
    </p>
    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
      📍 S.NO 32/1, Fourwaytrack, Airport, Valayankulam Village, Perungudi, Madurai Tamil Nadu, India — 625022
    </p>
    <div className="grid-2">
      <div className="glass-panel">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bus /> Campus Transit</h3>
        <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Total of 6 buses active across all routes.</p>
      </div>
      <div className="glass-panel">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar /> Active Semesters & Events</h3>
        <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Updates and tracking enabled for admin.</p>
      </div>
    </div>
  </motion.div>
);

const BusTracking = () => {
  const [buses, setBuses] = useState([]);
  const [stops, setStops] = useState([]);
  useEffect(() => {
    const fetchBuses = () => {
      axios.get(`${API_BASE}/buses`).then(res => setBuses(res.data));
    };
    axios.get(`${API_BASE}/buses/stops`).then(res => setStops(res.data));
    fetchBuses();
    const int = setInterval(fetchBuses, 3000);
    return () => clearInterval(int);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="title">Live Bus Tracking</h1>
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <MapContainer center={[9.9252, 78.1198]} zoom={12} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {stops.map(stop => (
            <Marker key={stop.id} position={[stop.lat, stop.lng]}>
              <Popup>{stop.name}</Popup>
            </Marker>
          ))}
          {buses.map(bus => (
            <Marker key={bus.id} position={[bus.currentLat, bus.currentLng]}>
              <Popup>🚌 {bus.name} ({bus.status})</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </motion.div>
  );
};

const Events = () => {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    axios.get(`${API_BASE}/events`).then(res => setEvents(res.data));
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="title">Campus Events</h1>
      <div className="grid-2">
        {events.map(e => (
          <div key={e.id} className="glass-panel">
            <span className="badge">{e.category}</span>
            <h3 style={{ margin: '1rem 0 0.5rem 0' }}>{e.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{new Date(e.date).toLocaleString()} • {e.location}</p>
            <p style={{ marginTop: '1rem' }}>{e.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  useEffect(() => { axios.get(`${API_BASE}/faculty`).then(res => setFaculty(res.data)); }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="title">Faculty Directory</h1>
      <div className="grid-2">
        {faculty.map(f => (
          <div key={f.id} className="glass-panel">
            <h3>{f.user?.name}</h3>
            <p style={{ color: 'var(--accent)', fontWeight: 600 }}>{f.title} - {f.department}</p>
            <div style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
              <p>📍 Office: {f.officeHours}</p>
              <p>📧 {f.contactEmail}</p>
              <p>📞 {f.contactPhone}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { token, user } = useContext(AuthContext);

  useEffect(() => { fetchNotes() }, []);
  const fetchNotes = () => axios.get(`${API_BASE}/notes`).then(res => setNotes(res.data));

  const submit = async (e) => {
    e.preventDefault();
    await axios.post(`${API_BASE}/notes`, { title, content, courseCode: 'GEN101' }, { headers: { Authorization: `Bearer ${token}` } });
    setTitle(''); setContent('');
    fetchNotes();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="title">Notes Feed</h1>
      <div className="grid-2">
        <div>
          {user?.role === 'ADMIN' ? (
            <form className="glass-panel" onSubmit={submit}>
              <h3>Share a Note</h3>
              <input placeholder="Note Title" value={title} onChange={e => setTitle(e.target.value)} required style={{ marginTop: '1rem' }} />
              <textarea placeholder="Markdown content..." value={content} onChange={e => setContent(e.target.value)} required rows={4} />
              <button type="submit">Publish Note</button>
            </form>
          ) : (
            <div className="glass-panel">
              <h3>View Notes</h3>
              <p style={{ color: 'var(--text-secondary)' }}>You can view uploaded notes here. Only administrators can publish new notes directly into the system feed.</p>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notes.map(n => (
            <div key={n.id} className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h4>{n.title}</h4>
                <span className="badge">{n.courseCode}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>By {n.author?.name} on {new Date(n.createdAt).toLocaleDateString()}</p>
              <p>{n.content}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const AIChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hello! I am your college assistant. How can I help you today?' }]);
  const [input, setInput] = useState('');

  const send = async () => {
    if (!input) return;
    const q = input;
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    const res = await axios.post(`${API_BASE}/ai/chat`, { prompt: q });
    setMessages(prev => [...prev, { role: 'ai', text: res.data.reply }]);
  };

  return (
    <div className="chatbot-bubble">
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel" style={{ width: '350px', height: '450px', marginBottom: '1rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>AI Companion</h3>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'ai' ? 'flex-start' : 'flex-end', background: m.role === 'ai' ? 'rgba(255,255,255,0.1)' : 'var(--accent)', padding: '0.5rem 1rem', borderRadius: '1rem' }}>{m.text}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()} placeholder="Ask something..." style={{ margin: 0 }} />
              <button onClick={send}>Send</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setOpen(!open)} style={{ width: '60px', height: '60px', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.5)' }}>
        <MessageSquare size={24} />
      </button>
    </div>
  );
};

const AuthPage = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('student@college.edu');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) return;

    if (res.code === 'DATABASE_EMPTY' || res.code === 'USER_NOT_FOUND') {
      const why = res.code === 'DATABASE_EMPTY' ? 'Database empty' : 'First user not found';
      setError(`${why}. Initializing system...`);
      try {
        await axios.post(`${API_BASE}/debug/seed`);
        setError('System initialized! Please login again.');
      } catch {
        setError('Initialization failed. Check server logs.');
      }
    } else if (res.code === 'INVALID_PASSWORD') {
      setError('Incorrect password. Try password123');
    } else {
      setError('Login failed. Ensure server is running.');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <form onSubmit={handleLogin} className="glass-panel" style={{ width: '400px' }}>
        <h2 className="title" style={{ fontSize: '1.4rem', textAlign: 'center' }}>Nagarathinam Angalammal<br />Arts and Science College</h2>
        {error && <p style={{ color: 'var(--accent)', marginBottom: '1rem', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '4px' }}>{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" style={{ width: '100%' }}>Login Area</button>
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>
            <strong>Demo Credentials:</strong><br />
            admin@college.edu / password123
          </p>
          <button type="button" onClick={() => axios.post(`${API_BASE}/debug/seed`).then(() => setError('System seeded manually!'))} style={{ background: 'transparent', color: 'var(--accent)', fontSize: '0.7rem', width: '100%', border: 'none', textDecoration: 'underline', marginTop: '0.5rem', cursor: 'pointer' }}>
            Force Manual Database Seed
          </button>
        </div>
      </form>
    </div>
  );
};

const Layout = ({ children }) => {
  const loc = useLocation();
  const { logout, user } = useContext(AuthContext);
  const links = [
    { name: 'Dashboard', path: '/', icon: <Menu size={20} /> },
    { name: 'Bus Tracking', path: '/buses', icon: <Bus size={20} /> },
    { name: 'Events', path: '/events', icon: <Calendar size={20} /> },
    { name: 'Faculty', path: '/faculty', icon: <Users size={20} /> },
    { name: 'Notes', path: '/notes', icon: <BookOpen size={20} /> },
  ];
  if (user?.role === 'ADMIN') {
    links.push({ name: 'Admin Control', path: '/admin', icon: <Settings size={20} /> });
  }

  return (
    <div style={{ display: 'flex' }}>
      <div className="sidebar">
        <h2 style={{ padding: '0 1rem', color: 'white', marginBottom: '2rem' }}>CC Platform</h2>
        {links.map(l => (
          <Link key={l.path} to={l.path} className={`nav-link ${loc.pathname === l.path ? 'active' : ''}`}>
            {l.icon} {l.name}
          </Link>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {user?.name} ({user?.role})
        </div>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>
      <div className="main-content">
        {children}
      </div>
      <AIChatbot />
    </div>
  );
};

const AppContent = () => {
  const { user, token } = useContext(AuthContext);
  if (!user) return <AuthPage />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/buses" element={<BusTracking />} />
        <Route path="/events" element={<Events />} />
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/admin" element={<AdminPanel token={token} />} />
      </Routes>
    </Layout>
  );
};

export default function App() { return <AuthProvider><Router><AppContent /></Router></AuthProvider>; }
