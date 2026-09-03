const { join } = require('path');
const jwt = require('jsonwebtoken');
const prisma = require('./config/prisma');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const writingRoutes = require('./routes/writings');
const certificationRoutes = require('./routes/certifications');
const uploadRoutes = require('./routes/upload');

const PORT = Number(Bun.env.PORT ?? 4000);
const uploadsDir = join(__dirname, '../uploads');

// Utility for CORS headers
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

const server = Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Global Error Handler boundary
    try {
      // CORS Preflight
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(req.headers.get("Origin") ?? undefined)
        });
      }

      // Add CORS headers to all responses
      const withCors = (res) => {
        const origin = req.headers.get("Origin") ?? undefined;
        const headers = corsHeaders(origin);
        for (const [key, value] of Object.entries(headers)) {
          res.headers.set(key, value);
        }
        return res;
      };

      // 1. Health Check
      if (req.method === 'GET' && path === '/health') {
        try {
          await prisma.$queryRawUnsafe('SELECT 1');
          return withCors(Response.json({ status: 'ok', db: 'connected' }));
        } catch {
          return withCors(Response.json({ status: 'error', db: 'disconnected' }, { status: 503 }));
        }
      }

      // 2. Static Uploads
      if (req.method === 'GET' && path.startsWith('/uploads/')) {
        const filename = path.replace('/uploads/', '');
        const file = Bun.file(join(uploadsDir, filename));
        if (await file.exists()) {
          return withCors(new Response(file));
        }
        return withCors(new Response('Not Found', { status: 404 }));
      }

      // 4. Swagger Docs
      if (req.method === 'GET' && path === '/api-docs/swagger.json') {
        return withCors(new Response(Bun.file(join(__dirname, 'swagger.json'))));
      }
      if (req.method === 'GET' && path === '/api-docs') {
        return withCors(new Response(Bun.file(join(__dirname, 'public/swagger.html')), { headers: { 'Content-Type': 'text/html' } }));
      }

      // 3. API Routes
      if (path.startsWith('/api/')) {
        if (path.startsWith('/api/auth')) return withCors(await authRoutes(req, url));
        if (path.startsWith('/api/projects')) return withCors(await projectRoutes(req, url));
        if (path.startsWith('/api/writings')) return withCors(await writingRoutes(req, url));
        if (path.startsWith('/api/certifications')) return withCors(await certificationRoutes(req, url));
        if (path.startsWith('/api/upload')) return withCors(await uploadRoutes(req, url));

        return withCors(Response.json({ success: false, error: 'Not found' }, { status: 404 }));
      }

      // 5. Dashboard Authentication
      if (path.startsWith('/dashboard')) {
        const cookieHeader = req.headers.get('cookie') || '';
        const tokenCookie = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('token='));
        const token = tokenCookie ? tokenCookie.substring(6) : null;

        if (!token) return Response.redirect('/login');
        try {
          jwt.verify(token, Bun.env.JWT_SECRET);
        } catch {
          return Response.redirect('/login');
        }
      }

      // 6. Basic HTML Routes
      if (req.method === 'GET') {
        if (path === '/') return Response.redirect('/login');

        const htmlHeaders = { 'Content-Type': 'text/html' };
        if (path === '/login') return new Response("<h1>Login Page</h1>", { headers: htmlHeaders });
        if (path === '/dashboard') return new Response("<h1>Dashboard</h1>", { headers: htmlHeaders });
      }

      // 7. Global 404
      return new Response('<h1>404 — Page Not Found</h1><p><a href="/dashboard">Go to Dashboard</a></p>', {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });

    } catch (err) {
      console.error('[Global Error]', err.stack);
      const isApi = path.startsWith('/api/');
      if (isApi) {
        return Response.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
      }
      return new Response('<h1>Internal Server Error</h1>', { status: 500, headers: { 'Content-Type': 'text/html' } });
    }
  }
});

console.log(`Server is running on port ${server.port}`);
