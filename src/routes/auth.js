const { z } = require('zod');
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

module.exports = async (req, url) => {
  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    try {
      const body = await req.json();
      const validatedData = loginSchema.parse(body);

      const user = await prisma.adminUser.findUnique({
        where: { username: validatedData.username }
      });

      if (!user) {
        return Response.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
      }

      const isValidPassword = await Bun.password.verify(validatedData.password, user.passwordHash);

      if (!isValidPassword) {
        return Response.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        Bun.env.JWT_SECRET,
        { expiresIn: Bun.env.JWT_EXPIRES_IN || '7d' }
      );

      return Response.json({ success: true, data: { token } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json({ success: false, error: error.errors[0].message }, { status: 400 });
      }
      console.error('Login error:', error);
      return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  }

  return Response.json({ success: false, error: 'Not found' }, { status: 404 });
};
