const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const http       = require('http');
const { Server } = require('socket.io');

dotenv.config();

const db             = require('./config/db');
const authRoutes     = require('./routes/authRoutes');
const taskRoutes     = require('./routes/taskRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const goalRoutes = require('./routes/goalRoutes');
const noteRoutes = require('./routes/noteRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const aiRoutes = require('./routes/aiRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
// ── Serve Frontend Files ──────────────────────────────
// app.use(express.static('frontend'));

// ── Serve Frontend ────────────────────────────────────
app.use(express.static('frontend'));

// ── Catch-all: serve index for direct page access ─────
app.get('/pages/:page', (req, res) => {
  res.sendFile(req.params.page, {
    root    : `${__dirname}/../frontend/pages`,
    dotfiles: 'deny'
  });
});

// ── Serve face-api.js models ──────────────────────────
app.use('/models',  express.static('frontend/assets/models'));
app.use('/faceapi', express.static('node_modules/face-api.js/dist'));
app.use('/socketio', express.static('node_modules/socket.io/client-dist'));


app.use('/api/auth',     authRoutes);
app.use('/api/tasks',    taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/sessions', sessionRoutes);

app.get('/', (req, res) => {
  res.json({ message: '🎓 Smart Study Assistant API is running!' });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});