const { mock } = require('bun:test');

const prismaMock = {
  project: {
    findMany: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
  writing: {
    findMany: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
  certification: {
    findMany: mock(),
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
  adminUser: {
    findUnique: mock(),
  }
};

mock.module('../config/prisma', () => {
  return prismaMock;
});

// Since the auth middleware uses jwt directly we will not mock jwt, but we will provide an env var for it.
process.env.JWT_SECRET = 'test_secret';
process.env.PORT = 4001; // Avoid port clash

module.exports = { prismaMock };
