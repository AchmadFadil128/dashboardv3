const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const writingRoutes = require('./routes/writings');
const certificationRoutes = require('./routes/certifications');
const uploadRoutes = require('./routes/upload');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

// Proxy /uploads to SeaweedFS Filer
const filerUrl = process.env.SEAWEEDFS_FILER_URL || 'http://localhost:8888';
app.use(createProxyMiddleware({
  target: filerUrl,
  changeOrigin: true,
  pathFilter: '/uploads',
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/writings', writingRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/upload', uploadRoutes);

// Admin Panel Routes (EJS) - Simple client-side auth via localStorage
app.get('/login', (req, res) => res.render('login'));
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
app.use((req, res, next) => {
  res.status(404).render('login'); // Just redirect or show a basic error, but since we don't have an error view, redirect to login or dashboard
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
