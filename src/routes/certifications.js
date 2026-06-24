const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authenticateToken } = require('../middleware/auth');
const { normalizeItem, normalizeList } = require('../utils/normalizeUrl');

const certificationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  status: z.string().optional(),
  pictureUrl: z.string().optional(),
  issuer: z.string().optional(),
});

// Public GET routes
router.get('/', async (req, res) => {
  try {
    const certifications = await prisma.certification.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: normalizeList(certifications, ['pictureUrl']) });
  } catch (error) {
    console.error('Fetch certifications error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const certification = await prisma.certification.findUnique({
      where: { id: req.params.id }
    });
    if (!certification) {
      return res.status(404).json({ success: false, error: 'Certification not found' });
    }
    res.json({ success: true, data: normalizeItem(certification, ['pictureUrl']) });
  } catch (error) {
    console.error('Fetch certification error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Protected routes
router.use(authenticateToken);

router.post('/', async (req, res) => {
  try {
    const validatedData = certificationSchema.parse(req.body);
    
    const certification = await prisma.certification.create({
      data: {
        name: validatedData.name,
        status: validatedData.status || 'Active',
        pictureUrl: validatedData.pictureUrl || '',
        issuer: validatedData.issuer || ''
      }
    });

    res.status(201).json({ success: true, data: normalizeItem(certification, ['pictureUrl']) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Create certification error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const validatedData = certificationSchema.partial().parse(req.body);

    const certification = await prisma.certification.update({
      where: { id: req.params.id },
      data: validatedData
    });

    res.json({ success: true, data: normalizeItem(certification, ['pictureUrl']) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Certification not found' });
    }
    console.error('Update certification error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.certification.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, data: null });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Certification not found' });
    }
    console.error('Delete certification error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
