// Mock for Google Generative AI

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn();

class GoogleGenerativeAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  getGenerativeModel(config) {
    mockGetGenerativeModel(config);
    return {
      generateContent: mockGenerateContent,
    };
  }
}

// Helper to set mock responses
const setMockResponse = (text) => {
  mockGenerateContent.mockResolvedValue({
    response: {
      text: () => text,
      candidates: [
        {
          content: {
            parts: [{ text }],
          },
        },
      ],
    },
  });
};

// Helper to set mock error
const setMockError = (error) => {
  mockGenerateContent.mockRejectedValue(error);
};

// Reset mocks
const resetMocks = () => {
  mockGenerateContent.mockReset();
  mockGetGenerativeModel.mockReset();
};

module.exports = {
  GoogleGenerativeAI,
  mockGenerateContent,
  mockGetGenerativeModel,
  setMockResponse,
  setMockError,
  resetMocks,
};
