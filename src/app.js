const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const writingRoutes = require('./routes/writings');
const certificationRoutes = require('./routes/certifications');
const uploadRoutes = require('./routes/upload');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();

// Middleware
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

// Serve uploaded files from local filesystem
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const prisma = require('./config/prisma');
    await prisma.$queryRawUnsafe('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/writings', writingRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/upload', uploadRoutes);

// Admin Panel Routes (EJS)
app.get('/login', (req, res) => res.render('login'));

// Protect all /dashboard routes with cookie-based JWT verification
app.use('/dashboard', (req, res, next) => {
  const tokenCookie = req.headers.cookie
    ?.split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('token='));
  const token = tokenCookie ? tokenCookie.substring(6) : null;
  if (!token) return res.redirect('/login');
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.redirect('/login');
  }
});

app.get('/dashboard', (req, res) => res.render('dashboard'));

// Projects UI
app.get('/dashboard/projects', (req, res) => res.render('projects/index'));
app.get('/dashboard/projects/create', (req, res) => res.render('projects/form', { id: null }));
app.get('/dashboard/projects/edit/:id', (req, res) => res.render('projects/form', { id: req.params.id }));

// Writings UI
app.get('/dashboard/writings', (req, res) => res.render('writings/index'));
app.get('/dashboard/writings/create', (req, res) => res.render('writings/form', { id: null }));
app.get('/dashboard/writings/edit/:id', (req, res) => res.render('writings/form', { id: req.params.id }));

// Certifications UI
app.get('/dashboard/certifications', (req, res) => res.render('certifications/index'));
app.get('/dashboard/certifications/create', (req, res) => res.render('certifications/form', { id: null }));
app.get('/dashboard/certifications/edit/:id', (req, res) => res.render('certifications/form', { id: req.params.id }));

// Root Redirect
app.get('/', (req, res) => {
  res.redirect('/login');
});

// 404 Handler
app.use((req, res) => {
  const isApi = req.path.startsWith('/api/');
  if (isApi) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  res.status(404).send('<h1>404 — Page Not Found</h1><p><a href="/dashboard">Go to Dashboard</a></p>');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('error', (err) => {
  console.error(`[Server Error] Failed to start server:`, err.message);
});
