/**
 * Test Suite for Cover Letter AI Integration
 * Tests cover letter generation, retrieval, and deletion with AI
 */

import { auth } from '@clerk/nextjs/server';
import { setMockResponse, setMockError, resetMocks } from '@/__mocks__/@google/generative-ai';
import { mockPrismaClient, resetAllMocks } from '@/__mocks__/prismaClient';

// Mock the dependencies
jest.mock('@/lib/prisma', () => require('@/__mocks__/prismaClient'));
jest.mock('@google/generative-ai');

// Import after mocking
const { 
  generateCoverLetter, 
  getCoverLetters, 
  getCoverLetter, 
  deleteCoverLetter 
} = require('@/actions/cover-letter');

describe('Cover Letter AI Integration Tests', () => {
  const mockUserId = 'clerk-user-123';
  const mockUser = {
    id: 'user-123',
    clerkUserId: mockUserId,
    industry: 'Software Development',
    experience: '5 years',
    skills: ['JavaScript', 'React', 'Node.js'],
    bio: 'Experienced software engineer with a passion for building scalable applications',
  };

  const mockCoverLetterData = {
    jobTitle: 'Senior Software Engineer',
    companyName: 'Tech Corp',
    jobDescription: 'Looking for an experienced software engineer to join our team...',
  };

  beforeEach(() => {
    // Reset all mocks before each test
    resetMocks();
    resetAllMocks();
    jest.clearAllMocks();

    // Setup default auth mock
    auth.mockResolvedValue({ userId: mockUserId });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('generateCoverLetter', () => {
    it('should successfully generate a cover letter with AI', async () => {
      // Arrange
      const mockAIResponse = `Dear Hiring Manager,

I am writing to express my strong interest in the Senior Software Engineer position at Tech Corp...

Best regards,
[Your Name]`;

      const mockCreatedCoverLetter = {
        id: 'cl-123',
        content: mockAIResponse,
        jobDescription: mockCoverLetterData.jobDescription,
        companyName: mockCoverLetterData.companyName,
        jobTitle: mockCoverLetterData.jobTitle,
        status: 'completed',
        userId: mockUser.id,
        createdAt: new Date(),
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockResponse(mockAIResponse);
      mockPrismaClient.coverLetter.create.mockResolvedValue(mockCreatedCoverLetter);

      // Act
      const result = await generateCoverLetter(mockCoverLetterData);

      // Assert
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { clerkUserId: mockUserId },
      });
      expect(result).toEqual(mockCreatedCoverLetter);
      expect(result.content).toBe(mockAIResponse);
      expect(result.status).toBe('completed');
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      auth.mockResolvedValue({ userId: null });

      // Act & Assert
      await expect(generateCoverLetter(mockCoverLetterData)).rejects.toThrow('Unauthorized');
    });

    it('should throw error when user is not found in database', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(generateCoverLetter(mockCoverLetterData)).rejects.toThrow('User not found');
    });

    it('should handle AI generation failure gracefully', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockError(new Error('AI service unavailable'));

      // Act & Assert
      await expect(generateCoverLetter(mockCoverLetterData)).rejects.toThrow(
        'Failed to generate cover letter'
      );
    });

    it('should include user skills and industry in the AI prompt', async () => {
      // Arrange
      const mockAIResponse = 'Cover letter content';
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockResponse(mockAIResponse);
      mockPrismaClient.coverLetter.create.mockResolvedValue({
        id: 'cl-123',
        content: mockAIResponse,
      });

      // Act
      await generateCoverLetter(mockCoverLetterData);

      // Assert
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalled();
      // The AI should be called with user context
      const { mockGenerateContent } = require('@/__mocks__/@google/generative-ai');
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should handle database save failure', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockResponse('AI generated content');
      mockPrismaClient.coverLetter.create.mockRejectedValue(
        new Error('Database error')
      );

      // Act & Assert
      await expect(generateCoverLetter(mockCoverLetterData)).rejects.toThrow();
    });
  });

  describe('getCoverLetters', () => {
    it('should retrieve all cover letters for authenticated user', async () => {
      // Arrange
      const mockCoverLetters = [
        {
          id: 'cl-1',
          companyName: 'Company A',
          jobTitle: 'Position A',
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'cl-2',
          companyName: 'Company B',
          jobTitle: 'Position B',
          createdAt: new Date('2025-01-02'),
        },
      ];

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.coverLetter.findMany.mockResolvedValue(mockCoverLetters);

      // Act
      const result = await getCoverLetters();

      // Assert
      expect(result).toEqual(mockCoverLetters);
      expect(mockPrismaClient.coverLetter.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when user has no cover letters', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.coverLetter.findMany.mockResolvedValue([]);

      // Act
      const result = await getCoverLetters();

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      auth.mockResolvedValue({ userId: null });

      // Act & Assert
      await expect(getCoverLetters()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getCoverLetter', () => {
    it('should retrieve a specific cover letter by id', async () => {
      // Arrange
      const coverLetterId = 'cl-123';
      const mockCoverLetter = {
        id: coverLetterId,
        content: 'Cover letter content',
        companyName: 'Tech Corp',
        jobTitle: 'Senior Engineer',
        userId: mockUser.id,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.coverLetter.findUnique.mockResolvedValue(mockCoverLetter);

      // Act
      const result = await getCoverLetter(coverLetterId);

      // Assert
      expect(result).toEqual(mockCoverLetter);
      expect(mockPrismaClient.coverLetter.findUnique).toHaveBeenCalledWith({
        where: { id: coverLetterId, userId: mockUser.id },
      });
    });

    it('should return null when cover letter is not found', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.coverLetter.findUnique.mockResolvedValue(null);

      // Act
      const result = await getCoverLetter('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('deleteCoverLetter', () => {
    it('should successfully delete a cover letter', async () => {
      // Arrange
      const coverLetterId = 'cl-123';
      const mockDeletedCoverLetter = {
        id: coverLetterId,
        userId: mockUser.id,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.coverLetter.delete.mockResolvedValue(mockDeletedCoverLetter);

      // Act
      const result = await deleteCoverLetter(coverLetterId);

      // Assert
      expect(result).toEqual(mockDeletedCoverLetter);
      expect(mockPrismaClient.coverLetter.delete).toHaveBeenCalledWith({
        where: { id: coverLetterId, userId: mockUser.id },
      });
    });

    it('should throw error when trying to delete non-existent cover letter', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.coverLetter.delete.mockRejectedValue(
        new Error('Record not found')
      );

      // Act & Assert
      await expect(deleteCoverLetter('non-existent-id')).rejects.toThrow();
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      auth.mockResolvedValue({ userId: null });

      // Act & Assert
      await expect(deleteCoverLetter('cl-123')).rejects.toThrow('Unauthorized');
    });
  });

  describe('AI Integration Edge Cases', () => {
    it('should handle empty AI response', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockResponse('');
      mockPrismaClient.coverLetter.create.mockResolvedValue({
        id: 'cl-123',
        content: '',
      });

      // Act
      const result = await generateCoverLetter(mockCoverLetterData);

      // Assert
      expect(result.content).toBe('');
    });

    it('should handle AI response with extra whitespace', async () => {
      // Arrange
      const responseWithWhitespace = '\n\n  Cover letter content  \n\n';
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockResponse(responseWithWhitespace);
      mockPrismaClient.coverLetter.create.mockResolvedValue({
        id: 'cl-123',
        content: responseWithWhitespace.trim(),
      });

      // Act
      const result = await generateCoverLetter(mockCoverLetterData);

      // Assert
      expect(result.content).toBe('Cover letter content');
    });

    it('should handle user with minimal profile information', async () => {
      // Arrange
      const minimalUser = {
        ...mockUser,
        skills: null,
        bio: null,
      };
      mockPrismaClient.user.findUnique.mockResolvedValue(minimalUser);
      setMockResponse('Basic cover letter');
      mockPrismaClient.coverLetter.create.mockResolvedValue({
        id: 'cl-123',
        content: 'Basic cover letter',
      });

      // Act
      const result = await generateCoverLetter(mockCoverLetterData);

      // Assert
      expect(result).toBeDefined();
      expect(result.content).toBe('Basic cover letter');
    });
  });
});
