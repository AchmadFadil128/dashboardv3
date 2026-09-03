const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { normalizeItem, normalizeList } = require('../utils/normalizeUrl');

const writingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  shortDescription: z.string().optional(),
  dateCreate: z.string().optional(),
  status: z.string().optional(),
  urlFile: z.string().optional(),
});

module.exports = async (req, url) => {
  const path = url.pathname;

  if (req.method === 'GET' && path === '/api/writings') {
    try {
      const writings = await prisma.writing.findMany({
        orderBy: { dateCreate: 'desc' }
      });
      return Response.json({ success: true, data: normalizeList(writings, ['urlFile']) });
    } catch (error) {
      console.error('Fetch writings error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  const matchId = path.match(/^\/api\/writings\/([^\/]+)$/);
  if (req.method === 'GET' && matchId) {
    try {
      const writing = await prisma.writing.findUnique({
        where: { id: matchId[1] }
      });
      if (!writing) {
        return Response.json({ success: false, error: 'Writing not found' }, { status: 404 });
      }
      return Response.json({ success: true, data: normalizeItem(writing, ['urlFile']) });
    } catch (error) {
      console.error('Fetch writing error:', error);
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

  if (req.method === 'POST' && path === '/api/writings') {
    try {
      const body = await req.json();
      const validatedData = writingSchema.parse(body);

      const writing = await prisma.writing.create({
        data: {
          name: validatedData.name,
          shortDescription: validatedData.shortDescription || '',
          dateCreate: validatedData.dateCreate ? new Date(validatedData.dateCreate) : new Date(),
          status: validatedData.status || 'Draft',
          urlFile: validatedData.urlFile || ''
        }
      });

      return Response.json({ success: true, data: normalizeItem(writing, ['urlFile']) }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json({ success: false, error: error.errors }, { status: 400 });
      }
      console.error('Create writing error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  if (req.method === 'PUT' && matchId) {
    try {
      const body = await req.json();
      const validatedData = writingSchema.partial().parse(body);

      const updateData = { ...validatedData };
      if (updateData.dateCreate) {
        updateData.dateCreate = new Date(updateData.dateCreate);
      }

      const writing = await prisma.writing.update({
        where: { id: matchId[1] },
        data: updateData
      });

      return Response.json({ success: true, data: normalizeItem(writing, ['urlFile']) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json({ success: false, error: error.errors }, { status: 400 });
      }
      if (error.code === 'P2025') {
        return Response.json({ success: false, error: 'Writing not found' }, { status: 404 });
      }
      console.error('Update writing error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  if (req.method === 'DELETE' && matchId) {
    try {
      await prisma.writing.delete({
        where: { id: matchId[1] }
      });
      return Response.json({ success: true, data: null });
    } catch (error) {
      if (error.code === 'P2025') {
        return Response.json({ success: false, error: 'Writing not found' }, { status: 404 });
      }
      console.error('Delete writing error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  return Response.json({ success: false, error: 'Not found' }, { status: 404 });
};
