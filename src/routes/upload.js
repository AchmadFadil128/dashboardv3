const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

module.exports = async (req, url) => {
  if (req.method === 'POST' && url.pathname === '/api/upload') {
    try {
      // Require Authentication
      try {
        requireAuth(req);
      } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: err.message.includes('Unauthorized') ? 401 : 403 });
      }

      const form = await req.formData();
      const file = form.get('file');

      if (!file || !(file instanceof File)) {
        return Response.json({ success: false, error: 'No file uploaded' }, { status: 400 });
      }

      const isImage = file.type.startsWith('image/');
      let ext = path.extname(file.name);
      let size = file.size;
      let uniqueFilename = '';

      if (isImage) {
        ext = '.webp';
        uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFilename);

        const arrayBuffer = await file.arrayBuffer();
        const image = new Bun.Image(arrayBuffer);
        await image.webp({ quality: 80 }).write(filePath);

        const stats = await fs.promises.stat(filePath);
        size = stats.size;
      } else {
        uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFilename);

        await Bun.write(filePath, file);
      }

      const publicUrl = Bun.env.PUBLIC_URL || `http://localhost:${Bun.env.PORT || 4000}`;
      const returnUrl = `${publicUrl}/uploads/${uniqueFilename}`;

      return Response.json({
        success: true,
        data: {
          fileId: uniqueFilename,
          fileName: uniqueFilename,
          url: returnUrl,
          size: size
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      return Response.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
    }
  }

  return Response.json({ success: false, error: 'Not found' }, { status: 404 });
};
