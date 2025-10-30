// Mock Prisma Client for testing

const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  resume: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  coverLetter: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  assessment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  industryInsight: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// Helper to reset all mocks
const resetAllMocks = () => {
  Object.keys(mockPrismaClient).forEach((key) => {
    if (mockPrismaClient[key] && typeof mockPrismaClient[key] === 'object') {
      Object.keys(mockPrismaClient[key]).forEach((method) => {
        if (typeof mockPrismaClient[key][method].mockReset === 'function') {
          mockPrismaClient[key][method].mockReset();
        }
      });
    }
  });
};

module.exports = {
  db: mockPrismaClient,
  mockPrismaClient,
  resetAllMocks,
};
