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

Bun.env.JWT_SECRET = 'test_secret';
Bun.env.PORT = '4001';

module.exports = { prismaMock };
