const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authenticateToken } = require('../middleware/auth');
const { normalizeItem, normalizeList } = require('../utils/normalizeUrl');

const writingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  shortDescription: z.string().optional(),
  dateCreate: z.string().optional(),
  status: z.string().optional(),
  urlFile: z.string().optional(),
});

// Public GET routes
router.get('/', async (req, res) => {
  try {
    const writings = await prisma.writing.findMany({
      orderBy: { dateCreate: 'desc' }
    });
    res.json({ success: true, data: normalizeList(writings, ['urlFile']) });
  } catch (error) {
    console.error('Fetch writings error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const writing = await prisma.writing.findUnique({
      where: { id: req.params.id }
    });
    if (!writing) {
      return res.status(404).json({ success: false, error: 'Writing not found' });
    }
    res.json({ success: true, data: normalizeItem(writing, ['urlFile']) });
  } catch (error) {
    console.error('Fetch writing error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Protected routes
router.use(authenticateToken);

router.post('/', async (req, res) => {
  try {
    const validatedData = writingSchema.parse(req.body);
    
    const writing = await prisma.writing.create({
      data: {
        name: validatedData.name,
        shortDescription: validatedData.shortDescription || '',
        dateCreate: validatedData.dateCreate ? new Date(validatedData.dateCreate) : new Date(),
        status: validatedData.status || 'Draft',
        urlFile: validatedData.urlFile || ''
      }
    });

    res.status(201).json({ success: true, data: normalizeItem(writing, ['urlFile']) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Create writing error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const validatedData = writingSchema.partial().parse(req.body);
    
    const updateData = { ...validatedData };
    if (updateData.dateCreate) {
      updateData.dateCreate = new Date(updateData.dateCreate);
    }

    const writing = await prisma.writing.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ success: true, data: normalizeItem(writing, ['urlFile']) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Writing not found' });
    }
    console.error('Update writing error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.writing.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, data: null });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Writing not found' });
    }
    console.error('Delete writing error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
