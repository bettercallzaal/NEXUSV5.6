import axios from 'axios';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  message: string;
  error?: string;
}

/**
 * Service for handling chat interactions with OpenAI API
 */
export const chatService = {
  /**
   * Send a message to the OpenAI API and get a response
   * @param messages - Array of previous messages for context
   * @param query - The user's current query
   * @returns ChatResponse with message or error
   */
  async sendMessage(messages: ChatMessage[], query: string): Promise<ChatResponse> {
    try {
      // Prepare the messages for the API call
      const apiMessages = [
        ...messages,
        { role: 'user', content: query }
      ];

      // Add a system message if one doesn't exist
      if (!apiMessages.some(msg => msg.role === 'system')) {
        apiMessages.unshift({
          role: 'system',
          content: 'You are NexusAI, a helpful assistant for the ZAO Nexus portal. ' +
            'You help users find links, understand categories, and navigate the platform. ' +
            'Keep responses concise and focused on helping users find information in the Nexus database.'
        });
      }

      // Make the API call
      const response = await axios.post('/api/chat', {
        messages: apiMessages
      });

      return {
        message: response.data.message
      };
    } catch (error) {
      console.error('Error in chat service:', error);
      return {
        message: '',
        error: 'Failed to get response from AI. Please try again later.'
      };
    }
  },

  /**
   * Search for links related to a query
   * @param query - The search query
   * @returns ChatResponse with search results or error
   */
  async searchLinks(query: string): Promise<ChatResponse> {
    try {
      const response = await axios.post('/api/search', {
        query
      });

      return {
        message: response.data.results
      };
    } catch (error) {
      console.error('Error in link search:', error);
      return {
        message: '',
        error: 'Failed to search for links. Please try again later.'
      };
    }
  }
};

export type { ChatMessage, ChatResponse };
