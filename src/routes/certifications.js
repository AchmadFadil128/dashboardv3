const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { normalizeItem, normalizeList } = require('../utils/normalizeUrl');

const certificationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  status: z.string().optional(),
  pictureUrl: z.string().optional(),
  issuer: z.string().optional(),
});

module.exports = async (req, url) => {
  const path = url.pathname;

  if (req.method === 'GET' && path === '/api/certifications') {
    try {
      const certifications = await prisma.certification.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return Response.json({ success: true, data: normalizeList(certifications, ['pictureUrl']) });
    } catch (error) {
      console.error('Fetch certifications error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  const matchId = path.match(/^\/api\/certifications\/([^\/]+)$/);
  if (req.method === 'GET' && matchId) {
    try {
      const certification = await prisma.certification.findUnique({
        where: { id: matchId[1] }
      });
      if (!certification) {
        return Response.json({ success: false, error: 'Certification not found' }, { status: 404 });
      }
      return Response.json({ success: true, data: normalizeItem(certification, ['pictureUrl']) });
    } catch (error) {
      console.error('Fetch certification error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  try {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      requireAuth(req);
    }
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: err.message.includes('Unauthorized') ? 401 : 403 });
  }

  if (req.method === 'POST' && path === '/api/certifications') {
    try {
      const body = await req.json();
      const validatedData = certificationSchema.parse(body);

      const certification = await prisma.certification.create({
        data: {
          name: validatedData.name,
          status: validatedData.status || 'Active',
          pictureUrl: validatedData.pictureUrl || '',
          issuer: validatedData.issuer || ''
        }
      });

      return Response.json({ success: true, data: normalizeItem(certification, ['pictureUrl']) }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json({ success: false, error: error.errors }, { status: 400 });
      }
      console.error('Create certification error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  if (req.method === 'PUT' && matchId) {
    try {
      const body = await req.json();
      const validatedData = certificationSchema.partial().parse(body);

      const certification = await prisma.certification.update({
        where: { id: matchId[1] },
        data: validatedData
      });

      return Response.json({ success: true, data: normalizeItem(certification, ['pictureUrl']) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json({ success: false, error: error.errors }, { status: 400 });
      }
      if (error.code === 'P2025') {
        return Response.json({ success: false, error: 'Certification not found' }, { status: 404 });
      }
      console.error('Update certification error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  if (req.method === 'DELETE' && matchId) {
    try {
      await prisma.certification.delete({
        where: { id: matchId[1] }
      });
      return Response.json({ success: true, data: null });
    } catch (error) {
      if (error.code === 'P2025') {
        return Response.json({ success: false, error: 'Certification not found' }, { status: 404 });
      }
      console.error('Delete certification error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  return Response.json({ success: false, error: 'Not found' }, { status: 404 });
};
