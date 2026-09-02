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

    const isImage = req.file.mimetype.startsWith('image/');
    let ext = path.extname(req.file.originalname);
    let finalBuffer = req.file.buffer;
    let size = req.file.size;
    let uniqueFilename = '';

    if (isImage) {
      ext = '.webp';
      uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(UPLOAD_DIR, uniqueFilename);

      const image = new Bun.Image(req.file.buffer);
      await image.webp({ quality: 80 }).write(filePath);

      const stats = await fs.promises.stat(filePath);
      size = stats.size;
    } else {
      uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(UPLOAD_DIR, uniqueFilename);

      // Write file to local disk
      await fs.promises.writeFile(filePath, finalBuffer);
    }

    // Return public-facing URL
    const publicUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
    const url = `${publicUrl}/uploads/${uniqueFilename}`;

    res.json({
      success: true,
      data: {
        fileId: uniqueFilename,
        fileName: uniqueFilename,
        url: url,
        size: size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

module.exports = router;
