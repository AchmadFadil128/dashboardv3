const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { normalizeItem, normalizeList } = require('../utils/normalizeUrl');

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  pictureUrl: z.string().optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  dateCreate: z.string().optional(),
  status: z.string().optional(),
  otherPictures: z.any().optional(),
  techStack: z.any().optional(),
  exturlproject: z.string().optional(),
});

const formatJsonField = (field) => {
  if (!field) return [];
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      return [];
    }
  }
  return field;
};

module.exports = async (req, url) => {
  const path = url.pathname;

  if (req.method === 'GET' && path === '/api/projects') {
    try {
      const projects = await prisma.project.findMany({
        orderBy: { dateCreate: 'desc' }
      });
      return Response.json({ success: true, data: normalizeList(projects, ['pictureUrl']) });
    } catch (error) {
      console.error('Fetch projects error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  const matchId = path.match(/^\/api\/projects\/([^\/]+)$/);
  if (req.method === 'GET' && matchId) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: matchId[1] }
      });
      if (!project) {
        return Response.json({ success: false, error: 'Project not found' }, { status: 404 });
      }
      return Response.json({ success: true, data: normalizeItem(project, ['pictureUrl']) });
    } catch (error) {
      console.error('Fetch project error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  // Auth needed for write ops
  try {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      requireAuth(req);
    }
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: err.message.includes('Unauthorized') ? 401 : 403 });
  }

  if (req.method === 'POST' && path === '/api/projects') {
    try {
      const body = await req.json();
      const validatedData = projectSchema.parse(body);

      const project = await prisma.project.create({
        data: {
          name: validatedData.name,
          pictureUrl: validatedData.pictureUrl || '',
          shortDescription: validatedData.shortDescription || '',
          longDescription: validatedData.longDescription || '',
          dateCreate: validatedData.dateCreate ? new Date(validatedData.dateCreate) : new Date(),
          status: validatedData.status || 'Planned',
          otherPictures: formatJsonField(validatedData.otherPictures),
          techStack: formatJsonField(validatedData.techStack),
          exturlproject: validatedData.exturlproject || ''
        }
      });

      return Response.json({ success: true, data: normalizeItem(project, ['pictureUrl']) }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json({ success: false, error: error.errors }, { status: 400 });
      }
      console.error('Create project error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  if (req.method === 'PUT' && matchId) {
    try {
      const body = await req.json();
      const validatedData = projectSchema.partial().parse(body);

      const updateData = { ...validatedData };
      if (updateData.dateCreate) {
        updateData.dateCreate = new Date(updateData.dateCreate);
      }
      if (updateData.otherPictures !== undefined) {
        updateData.otherPictures = formatJsonField(updateData.otherPictures);
      }
      if (updateData.techStack !== undefined) {
        updateData.techStack = formatJsonField(updateData.techStack);
      }

      const project = await prisma.project.update({
        where: { id: matchId[1] },
        data: updateData
      });

      return Response.json({ success: true, data: normalizeItem(project, ['pictureUrl']) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json({ success: false, error: error.errors }, { status: 400 });
      }
      if (error.code === 'P2025') {
        return Response.json({ success: false, error: 'Project not found' }, { status: 404 });
      }
      console.error('Update project error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  if (req.method === 'DELETE' && matchId) {
    try {
      await prisma.project.delete({
        where: { id: matchId[1] }
      });
      return Response.json({ success: true, data: null });
    } catch (error) {
      if (error.code === 'P2025') {
        return Response.json({ success: false, error: 'Project not found' }, { status: 404 });
      }
      console.error('Delete project error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  return Response.json({ success: false, error: 'Not found' }, { status: 404 });
};
