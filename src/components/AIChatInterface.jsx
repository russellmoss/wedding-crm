// src/components/AIChatInterface.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, MessageSquare, TrendingUp, Users, Target } from 'lucide-react';
import { askClaudeAboutCRM } from '../lib/anthropic';

const AIChatInterface = ({ sheetData, isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your CRM analytics assistant. I can help you analyze your wedding venue data. Try asking me questions like:\n\n• What's my conversion rate from leads to bookings?\n• How many leads do we get per week on average?\n• What's my most effective lead source?\n• How many weddings have we booked this year?\n\nWhat would you like to know about your business?"
    }
  ]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Suggested questions for quick access
  const suggestedQuestions = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      text: "What's my lead to booking conversion rate?",
      category: "Conversion"
    },
    {
      icon: <Users className="w-4 h-4" />,
      text: "How many leads do we get per week on average?",
      category: "Volume"
    },
    {
      icon: <Target className="w-4 h-4" />,
      text: "How many weddings have we booked this year?",
      category: "Bookings"
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      text: "What's my Hot lead to Contacted conversion rate?",
      category: "Stages"
    },
    {
      icon: <Users className="w-4 h-4" />,
      text: "What's my best performing lead stage?",
      category: "Performance"
    },
    {
      icon: <Target className="w-4 h-4" />,
      text: "How many leads are currently in my pipeline?",
      category: "Pipeline"
    }
  ];

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (questionText = currentQuestion) => {
    if (!questionText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: questionText
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentQuestion('');
    setIsLoading(true);
    setError('');

    try {
      const response = await askClaudeAboutCRM(questionText, sheetData);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `I'm sorry, I encountered an error while analyzing your data: ${err.message}. Please try again.`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setCurrentQuestion(question);
    handleSendMessage(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#3e2f1c] text-white p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: 'Cochin, serif' }}>
                CRM Analytics Assistant
              </h2>
              <p className="text-sm opacity-80">Ask me anything about your wedding venue data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'ai' && (
                <div className="w-8 h-8 bg-[#3e2f1c] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-[#3e2f1c] text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Message */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-[#3e2f1c] rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analyzing your CRM data...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && !isLoading && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Try these questions:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question.text)}
                  className="flex items-center gap-2 p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {question.icon}
                  <span className="flex-1">{question.text}</span>
                  <span className="text-xs text-gray-400">{question.category}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-2">
            <textarea
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your CRM data... (e.g., 'What's my conversion rate?')"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2f1c] focus:border-[#3e2f1c] resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!currentQuestion.trim() || isLoading}
              className="px-4 py-2 bg-[#3e2f1c] text-white rounded-lg hover:bg-[#3e2f1c]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatInterface; 