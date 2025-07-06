import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatService, ChatMessage } from '@/lib/chat-service';
import { Send, X, Minimize2, Maximize2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatBotProps {
  className?: string;
}

export function ChatBot({ className }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m NexusAI. I can help you find links or answer questions about the Nexus portal. What are you looking for today?'
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!query.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and set loading
    setQuery('');
    setIsLoading(true);

    try {
      // Get response from AI
      const response = await chatService.sendMessage(messages, query);
      
      if (response.error) {
        // Handle error
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Sorry, I encountered an error: ${response.error}` }
        ]);
      } else {
        // Add AI response to chat
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: response.message }
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an unexpected error. Please try again later.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {/* Chat button */}
      {!isOpen && (
        <Button 
          onClick={toggleChat} 
          className="rounded-full h-12 w-12 flex items-center justify-center shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          <Search className="h-5 w-5" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Chat header */}
          <div className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
            <h3 className="font-medium">NexusAI Assistant</h3>
            <div className="flex space-x-1">
              <button 
                onClick={toggleMinimize} 
                className="p-1 rounded hover:bg-blue-700"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button 
                onClick={toggleChat} 
                className="p-1 rounded hover:bg-blue-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat body */}
          {!isMinimized && (
            <>
              <div className="flex-1 p-4 overflow-y-auto max-h-[400px] min-h-[300px] w-[350px]">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "mb-3 p-3 rounded-lg",
                      message.role === 'user' 
                        ? "bg-blue-100 dark:bg-blue-900 ml-6" 
                        : "bg-gray-100 dark:bg-gray-800 mr-6"
                    )}
                  >
                    <div className="text-sm">
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mr-6 mb-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat input */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex">
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question or search..."
                  className="flex-1 mr-2"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!query.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
