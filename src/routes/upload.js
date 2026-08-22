const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

// Upload directory — lives at project root so it can be volume-mounted in Docker
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists on startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Generate unique filename
    const ext = path.extname(req.file.originalname);
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    // Write file to local disk
    await fs.promises.writeFile(filePath, req.file.buffer);

    // Return public-facing URL
    const publicUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
    const url = `${publicUrl}/uploads/${uniqueFilename}`;

    res.json({
      success: true,
      data: {
        fileId: uniqueFilename,
        fileName: uniqueFilename,
        url: url,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

module.exports = router;
