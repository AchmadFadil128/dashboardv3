const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Prepare filename
    const ext = path.extname(req.file.originalname);
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    
    // Create form data to send to SeaweedFS filer
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: uniqueFilename,
      contentType: req.file.mimetype,
    });

    // Upload to SeaweedFS filer (internal container URL)
    const filerUrl = process.env.SEAWEEDFS_FILER_URL || 'http://localhost:8888';
    const uploadUrl = `${filerUrl}/uploads/${uniqueFilename}`;

    const response = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    // Return public-facing URL so the file is accessible from the browser
    const publicUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
    const fileUrl = `${publicUrl}/uploads/${uniqueFilename}`;

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: uniqueFilename
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload file to SeaweedFS' });
  }
});

module.exports = router;
