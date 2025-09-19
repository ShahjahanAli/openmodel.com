'use client';

import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { ArrowLeft, Send, User, Plus, Bot } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/ui/Logo';

interface AIModel {
  _id: string;
  name: string;
  provider: string;
  modelId: string;
  description?: string;
  endpoint?: string;
  serverType?: string;
  isActive: boolean;
  createdAt: string;
}

function ChatPageContent() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const [userModels, setUserModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [messages, setMessages] = useState<Array<{
    id: string, 
    role: 'user' | 'assistant', 
    content: string, 
    timestamp: Date,
    responseTime?: number,
    tokenCount?: number,
    tokensPerSecond?: number
  }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch user's models
  useEffect(() => {
    const fetchModels = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const data = await response.json();
          const models = data.models || []; // Extract models array from response
          setUserModels(models);
          
          // If a model ID is provided in search params, find that model
          const modelId = searchParamsHook.get('model');
          if (modelId) {
            const foundModel = models.find((model: AIModel) => model._id === modelId);
            if (foundModel) {
              setSelectedModel(foundModel);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };

    if (user?.id) {
      fetchModels();
    }
  }, [user?.id, searchParamsHook]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedModel || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          modelId: selectedModel._id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: data.response,
          timestamp: new Date(),
          responseTime: data.metrics?.responseTime,
          tokenCount: data.metrics?.tokenCount,
          tokensPerSecond: data.metrics?.tokensPerSecond
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorData = await response.json();
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: `Error: ${errorData.error || 'Failed to get response'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  // Handle model selection
  const handleModelChange = (modelId: string) => {
    const model = userModels.find(m => m._id === modelId);
    setSelectedModel(model || null);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-1 sm:space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Logo size="md" className="text-blue-600" />
              <span className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">OpenModel</span>
            </div>
            <div className="flex items-center space-x-4">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: 'w-7 h-7 sm:w-8 sm:h-8'
                  }
                }}
                afterSignOutUrl="/"
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto flex h-[calc(100vh-70px)] sm:h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="hidden lg:flex w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col">
          {/* Model Selection */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3">
              Select Model
            </h2>
            <select 
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
              value={selectedModel?._id || ''}
              onChange={(e) => handleModelChange(e.target.value)}
            >
              <option value="">Choose a model...</option>
              {userModels.map((model: AIModel) => (
                <option key={model._id} value={model._id.toString()}>
                  {model.name} ({model.provider === 'openai' ? 'OpenAI' :
                                 model.provider === 'anthropic' ? 'Anthropic' :
                                 model.provider === 'google' ? 'Google' :
                                 'Custom'})
                </option>
              ))}
            </select>
            {userModels.length === 0 && (
              <div className="mt-2 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  No models available
                </p>
                <Link href="/dashboard/models/new">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs">
                    Add Model
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Chat History */}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                Recent Chats
              </h3>
              <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg cursor-pointer">
                <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
                  New Chat
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Start a new conversation
                </p>
              </div>
              <div className="p-2 sm:p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                  React Development Help
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  2 hours ago
                </p>
              </div>
              <div className="p-2 sm:p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                  Code Review
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Yesterday
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Model Selector */}
          <div className="lg:hidden p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center space-x-3">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">
                Model:
              </h3>
              <select 
                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
                value={selectedModel?._id || ''}
                onChange={(e) => handleModelChange(e.target.value)}
              >
                <option value="">Choose a model...</option>
                {userModels.map((model: AIModel) => (
                  <option key={model._id} value={model._id.toString()}>
                    {model.name} ({model.provider === 'openai' ? 'OpenAI' :
                                   model.provider === 'anthropic' ? 'Anthropic' :
                                   model.provider === 'google' ? 'Google' :
                                   'Custom'})
                  </option>
                ))}
              </select>
            </div>
            {userModels.length === 0 && (
              <div className="mt-2 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  No models available
                </p>
                <Link href="/dashboard/models/new">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs">
                    Add Model
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Chat Header */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 dark:text-white">
              Chat with AI
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Select a model to start chatting
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 ? (
                /* Welcome Message */
                <div className="text-center py-6 sm:py-8 lg:py-12">
                  <Bot className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-slate-400 mx-auto mb-3 sm:mb-4" />
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                    Welcome to OpenModel Chat
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 px-4">
                    {selectedModel ? `Chat with ${selectedModel.name}` : 'Select an AI model and start a conversation'}
                  </p>
                  {/* Example Prompts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto px-4">
                    <button 
                      onClick={() => setInputMessage("Explain quantum computing in simple terms")}
                      className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <h3 className="text-sm sm:text-base font-medium text-slate-900 dark:text-white mb-1">Explain a concept</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">&quot;Explain quantum computing in simple terms&quot;</p>
                    </button>
                    <button 
                      onClick={() => setInputMessage("Write a Python function to sort a list")}
                      className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <h3 className="text-sm sm:text-base font-medium text-slate-900 dark:text-white mb-1">Write code</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">&quot;Write a Python function to sort a list&quot;</p>
                    </button>
                    <button 
                      onClick={() => setInputMessage("Write a short story about a robot")}
                      className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <h3 className="text-sm sm:text-base font-medium text-slate-900 dark:text-white mb-1">Creative writing</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">&quot;Write a short story about a robot&quot;</p>
                    </button>
                    <button 
                      onClick={() => setInputMessage("Help me debug this JavaScript error")}
                      className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <h3 className="text-sm sm:text-base font-medium text-slate-900 dark:text-white mb-1">Problem solving</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">&quot;Help me debug this JavaScript error&quot;</p>
                    </button>
                  </div>
                </div>
              ) : (
                /* Chat Messages */
                <div className="space-y-4 sm:space-y-6">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[80%] sm:max-w-[70%] lg:max-w-[60%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} space-x-3 sm:space-x-4`}>
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                            message.role === 'user' 
                              ? 'bg-blue-500 dark:bg-blue-600' 
                              : 'bg-green-500 dark:bg-green-600'
                          }`}>
                            {message.role === 'user' ? (
                              <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            ) : (
                              <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            )}
                          </div>
                        </div>
                        
                        {/* Message Content */}
                        <div className="flex flex-col min-w-0">
                          <div className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-4 ${
                            message.role === 'user'
                              ? 'bg-blue-500 dark:bg-blue-600 text-white'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white'
                          }`}>
                            <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                            {/* Response metrics for assistant messages */}
                            {message.role === 'assistant' && message.responseTime && message.tokensPerSecond && (
                              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                  RESPONDED IN {Math.round(message.responseTime * 1000)}MS ({Math.round(message.tokensPerSecond)} TOKENS/SEC)
                                </p>
                              </div>
                            )}
                          </div>
                          <p className={`text-xs text-slate-500 dark:text-slate-400 mt-1 ${
                            message.role === 'user' ? 'text-right' : 'text-left'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex max-w-[80%] sm:max-w-[70%] lg:max-w-[60%] flex-row space-x-3 sm:space-x-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          </div>
                        </div>
                        
                        {/* Loading Message */}
                        <div className="flex flex-col min-w-0">
                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 sm:px-5 sm:py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">AI is thinking...</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end space-x-2 sm:space-x-3 lg:space-x-4">
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={handleTextareaChange}
                      onKeyPress={handleKeyPress}
                      placeholder={selectedModel ? "Type your message here..." : "Select a model to start chatting..."}
                      rows={1}
                      disabled={!selectedModel || isLoading}
                      className="w-full px-4 py-3 sm:px-5 sm:py-4 pr-12 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                    <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {inputMessage.length > 0 && `${inputMessage.length} chars`}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !selectedModel || isLoading}
                  className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:hover:shadow-lg"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedModel ? 'Press Enter to send, Shift+Enter for new line' : 'Please select a model to start chatting'}
                </p>
                {selectedModel && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedModel.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
