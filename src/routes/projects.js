const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authenticateToken } = require('../middleware/auth');
const { normalizeItem, normalizeList } = require('../utils/normalizeUrl');

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  pictureUrl: z.string().optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  dateCreate: z.string().optional(), // Expected format: YYYY-MM-DD
  status: z.string().optional(),
  otherPictures: z.any().optional(), // Array or JSON string
  techStack: z.any().optional(), // Array or JSON string
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

// Public GET routes
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { dateCreate: 'desc' }
    });
    res.json({ success: true, data: normalizeList(projects, ['pictureUrl']) });
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id }
    });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, data: normalizeItem(project, ['pictureUrl']) });
  } catch (error) {
    console.error('Fetch project error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Protected routes
router.use(authenticateToken);

router.post('/', async (req, res) => {
  try {
    const validatedData = projectSchema.parse(req.body);
    
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        pictureUrl: validatedData.pictureUrl || '',
        shortDescription: validatedData.shortDescription || '',
        longDescription: validatedData.longDescription || '',
        dateCreate: validatedData.dateCreate ? new Date(validatedData.dateCreate) : new Date(),
        status: validatedData.status || 'Planned',
        otherPictures: formatJsonField(validatedData.otherPictures),
        techStack: formatJsonField(validatedData.techStack)
      }
    });

    res.status(201).json({ success: true, data: normalizeItem(project, ['pictureUrl']) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Create project error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const validatedData = projectSchema.partial().parse(req.body);
    
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
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ success: true, data: normalizeItem(project, ['pictureUrl']) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    console.error('Update project error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.project.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, data: null });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
