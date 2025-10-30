/**
 * Test Suite for Interview Quiz AI Integration
 * Tests quiz generation, result saving, and assessment retrieval with AI
 */

import { auth } from '@clerk/nextjs/server';
import { setMockResponse, setMockError, resetMocks } from '@/__mocks__/@google/generative-ai';
import { mockPrismaClient, resetAllMocks } from '@/__mocks__/prismaClient';

// Mock the dependencies
jest.mock('@/lib/prisma', () => require('@/__mocks__/prismaClient'));
jest.mock('@google/generative-ai');

// Import after mocking
const { generateQuiz, saveQuizResult, getAssessments } = require('@/actions/interview');

describe('Interview Quiz AI Integration Tests', () => {
  const mockUserId = 'clerk-user-123';
  const mockUser = {
    id: 'user-123',
    clerkUserId: mockUserId,
    industry: 'Software Development',
    skills: ['JavaScript', 'React', 'Node.js'],
  };

  beforeEach(() => {
    resetMocks();
    resetAllMocks();
    jest.clearAllMocks();
    auth.mockResolvedValue({ userId: mockUserId });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('generateQuiz', () => {
    const mockQuizResponse = {
      questions: [
        {
          question: 'What is the virtual DOM in React?',
          options: [
            'A copy of the real DOM',
            'A JavaScript object representation of the DOM',
            'A database',
            'A server',
          ],
          correctAnswer: 'A JavaScript object representation of the DOM',
          explanation: 'The virtual DOM is a lightweight copy of the DOM in memory.',
        },
        {
          question: 'What is Node.js?',
          options: [
            'A programming language',
            'A runtime environment',
            'A database',
            'A framework',
          ],
          correctAnswer: 'A runtime environment',
          explanation: 'Node.js is a JavaScript runtime built on Chrome\'s V8 engine.',
        },
      ],
    };

    it('should successfully generate quiz questions with AI', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockResponse(JSON.stringify(mockQuizResponse));

      // Act
      const result = await generateQuiz();

      // Assert
      expect(result).toEqual(mockQuizResponse.questions);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('question');
      expect(result[0]).toHaveProperty('options');
      expect(result[0]).toHaveProperty('correctAnswer');
      expect(result[0]).toHaveProperty('explanation');
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      auth.mockResolvedValue({ userId: null });

      // Act & Assert
      await expect(generateQuiz()).rejects.toThrow('Unauthorized');
    });

    it('should throw error when user is not found', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(generateQuiz()).rejects.toThrow('User not found');
    });

    it('should handle AI response with markdown code blocks', async () => {
      // Arrange
      const responseWithMarkdown = `\`\`\`json
${JSON.stringify(mockQuizResponse)}
\`\`\``;
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockResponse(responseWithMarkdown);

      // Act
      const result = await generateQuiz();

      // Assert
      expect(result).toEqual(mockQuizResponse.questions);
    });

    it('should handle AI generation failure', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockError(new Error('AI service error'));

      // Act & Assert
      await expect(generateQuiz()).rejects.toThrow('Failed to generate quiz questions');
    });

    it('should handle invalid JSON response from AI', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockResponse('Invalid JSON response');

      // Act & Assert
      await expect(generateQuiz()).rejects.toThrow();
    });

    it('should generate quiz for user without skills', async () => {
      // Arrange
      const userWithoutSkills = {
        ...mockUser,
        skills: null,
      };
      mockPrismaClient.user.findUnique.mockResolvedValue(userWithoutSkills);
      setMockResponse(JSON.stringify(mockQuizResponse));

      // Act
      const result = await generateQuiz();

      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual(mockQuizResponse.questions);
    });

    it('should generate quiz with user skills included in prompt', async () => {
      // Arrange
      const userWithMultipleSkills = {
        ...mockUser,
        skills: ['Python', 'Django', 'PostgreSQL', 'AWS'],
      };
      mockPrismaClient.user.findUnique.mockResolvedValue(userWithMultipleSkills);
      setMockResponse(JSON.stringify(mockQuizResponse));

      // Act
      const result = await generateQuiz();

      // Assert
      expect(result).toBeDefined();
      const { mockGenerateContent } = require('@/__mocks__/@google/generative-ai');
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe('saveQuizResult', () => {
    const mockQuestions = [
      {
        question: 'What is React?',
        correctAnswer: 'A JavaScript library',
        explanation: 'React is a library for building UIs',
      },
      {
        question: 'What is Node.js?',
        correctAnswer: 'A runtime environment',
        explanation: 'Node.js runs JavaScript on the server',
      },
      {
        question: 'What is TypeScript?',
        correctAnswer: 'A superset of JavaScript',
        explanation: 'TypeScript adds static typing to JavaScript',
      },
    ];

    const mockAnswers = ['A JavaScript library', 'A framework', 'A superset of JavaScript'];
    const score = 66.67; // 2 out of 3 correct

    it('should successfully save quiz result with improvement tips', async () => {
      // Arrange
      const mockImprovementTip = 'Focus on understanding the differences between frameworks and runtime environments.';
      const mockAssessment = {
        id: 'assessment-123',
        userId: mockUser.id,
        quizScore: score,
        category: 'Technical',
        improvementTip: mockImprovementTip,
        createdAt: new Date(),
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockResponse(mockImprovementTip);
      mockPrismaClient.assessment.create.mockResolvedValue(mockAssessment);

      // Act
      const result = await saveQuizResult(mockQuestions, mockAnswers, score);

      // Assert
      expect(result).toEqual(mockAssessment);
      expect(result.improvementTip).toBe(mockImprovementTip);
      expect(mockPrismaClient.assessment.create).toHaveBeenCalled();
    });

    it('should save quiz result without improvement tip when all answers are correct', async () => {
      // Arrange
      const perfectAnswers = [
        'A JavaScript library',
        'A runtime environment',
        'A superset of JavaScript',
      ];
      const perfectScore = 100;
      const mockAssessment = {
        id: 'assessment-123',
        userId: mockUser.id,
        quizScore: perfectScore,
        improvementTip: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.assessment.create.mockResolvedValue(mockAssessment);

      // Act
      const result = await saveQuizResult(mockQuestions, perfectAnswers, perfectScore);

      // Assert
      expect(result).toEqual(mockAssessment);
      expect(result.improvementTip).toBeNull();
      // AI should not be called for improvement tip
      const { mockGenerateContent } = require('@/__mocks__/@google/generative-ai');
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      auth.mockResolvedValue({ userId: null });

      // Act & Assert
      await expect(saveQuizResult(mockQuestions, mockAnswers, score)).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should throw error when user is not found', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(saveQuizResult(mockQuestions, mockAnswers, score)).rejects.toThrow(
        'User not found'
      );
    });

    it('should save result even if improvement tip generation fails', async () => {
      // Arrange
      const mockAssessment = {
        id: 'assessment-123',
        userId: mockUser.id,
        quizScore: score,
        improvementTip: null,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockError(new Error('AI service error'));
      mockPrismaClient.assessment.create.mockResolvedValue(mockAssessment);

      // Act
      const result = await saveQuizResult(mockQuestions, mockAnswers, score);

      // Assert
      expect(result).toEqual(mockAssessment);
      expect(mockPrismaClient.assessment.create).toHaveBeenCalled();
    });

    it('should throw error when database save fails', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockResponse('Improvement tip');
      mockPrismaClient.assessment.create.mockRejectedValue(
        new Error('Database error')
      );

      // Act & Assert
      await expect(saveQuizResult(mockQuestions, mockAnswers, score)).rejects.toThrow(
        'Failed to save quiz result'
      );
    });

    it('should correctly identify wrong answers for improvement tip', async () => {
      // Arrange
      const allWrongAnswers = ['Wrong 1', 'Wrong 2', 'Wrong 3'];
      const mockImprovementTip = 'Review the fundamentals of web development.';

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockResponse(mockImprovementTip);
      mockPrismaClient.assessment.create.mockResolvedValue({
        id: 'assessment-123',
        improvementTip: mockImprovementTip,
      });

      // Act
      const result = await saveQuizResult(mockQuestions, allWrongAnswers, 0);

      // Assert
      expect(result.improvementTip).toBe(mockImprovementTip);
      const { mockGenerateContent } = require('@/__mocks__/@google/generative-ai');
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe('getAssessments', () => {
    it('should retrieve all assessments for authenticated user', async () => {
      // Arrange
      const mockAssessments = [
        {
          id: 'assessment-1',
          userId: mockUser.id,
          quizScore: 80,
          category: 'Technical',
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'assessment-2',
          userId: mockUser.id,
          quizScore: 90,
          category: 'Technical',
          createdAt: new Date('2025-01-05'),
        },
      ];

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.assessment.findMany.mockResolvedValue(mockAssessments);

      // Act
      const result = await getAssessments();

      // Assert
      expect(result).toEqual(mockAssessments);
      expect(mockPrismaClient.assessment.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array when user has no assessments', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.assessment.findMany.mockResolvedValue([]);

      // Act
      const result = await getAssessments();

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      auth.mockResolvedValue({ userId: null });

      // Act & Assert
      await expect(getAssessments()).rejects.toThrow('Unauthorized');
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.assessment.findMany.mockRejectedValue(
        new Error('Database error')
      );

      // Act & Assert
      await expect(getAssessments()).rejects.toThrow('Failed to fetch assessments');
    });
  });

  describe('AI Integration Performance', () => {
    it('should handle large quiz generation request', async () => {
      // Arrange
      const largeQuizResponse = {
        questions: Array.from({ length: 50 }, (_, i) => ({
          question: `Question ${i + 1}`,
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
          explanation: `Explanation ${i + 1}`,
        })),
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockResponse(JSON.stringify(largeQuizResponse));

      // Act
      const result = await generateQuiz();

      // Assert
      expect(result).toHaveLength(50);
    });

    it('should handle concurrent quiz generation requests', async () => {
      // Arrange
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      setMockResponse(JSON.stringify({ questions: [] }));

      // Act
      const promises = Array.from({ length: 5 }, () => generateQuiz());
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(5);
    });
  });
});
