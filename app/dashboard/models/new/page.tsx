'use client';

import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { ArrowLeft, Bot, Key, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewModelPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider: '',
    modelId: '',
    apiKey: '',
    endpoint: '',
    serverType: ''
  });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string>('');
  const [isDockerServer, setIsDockerServer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
    setFormData(prev => ({ ...prev, provider }));
  };

  const fetchAvailableModels = async (endpoint: string, serverType: string) => {
    setIsLoadingModels(true);
    setModelError('');
    setAvailableModels([]);

    try {
      let modelsEndpoint: string;
      let requestMethod: string = 'GET';
      let requestBody: any = null;
      
      // Determine the models endpoint and method based on server type
      if (serverType.includes('ollama')) {
        // Ollama uses GET /api/tags
        modelsEndpoint = endpoint.replace('/api/generate', '/api/tags');
        requestMethod = 'GET';
      } else {
        // OpenAI-compatible servers (LM Studio, Text Generation WebUI)
        // Try different endpoints and methods
        const possibleEndpoints = [
          endpoint.replace('/chat/completions', '/models'),
          endpoint.replace('/v1/chat/completions', '/v1/models'),
          endpoint.replace('/chat/completions', '/v1/models'),
          endpoint.replace('/v1/chat/completions', '/models')
        ];
        
        // Try the first endpoint first
        modelsEndpoint = possibleEndpoints[0];
        requestMethod = 'GET';
      }

      const headers: any = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(modelsEndpoint, {
        method: requestMethod,
        headers,
        body: requestBody ? JSON.stringify(requestBody) : undefined,
      });

      if (!response.ok) {
        // If GET fails, try alternative approaches
        if (response.status === 405 && !serverType.includes('ollama')) {
          console.log('GET failed, trying alternative methods...');
          
          // Try POST method
          try {
            const postResponse = await fetch(modelsEndpoint, {
              method: 'POST',
              headers,
              body: JSON.stringify({}),
            });
            
            if (postResponse.ok) {
              const postData = await postResponse.json();
              const models = postData.data?.map((model: any) => model.id) || postData.models?.map((model: any) => model.name) || [];
              setAvailableModels(models);
              if (models.length === 0) {
                setModelError('No models found. Make sure you have loaded models in your local AI server.');
              }
              return;
            }
          } catch (postError) {
            console.log('POST method also failed:', postError);
          }
          
          // Try different endpoint variations
          const alternativeEndpoints = [
            endpoint.replace('/chat/completions', '/models'),
            endpoint.replace('/v1/chat/completions', '/v1/models'),
            endpoint.replace('/chat/completions', '/v1/models'),
            endpoint.replace('/v1/chat/completions', '/models'),
            endpoint.replace('/chat/completions', '/api/models'),
            endpoint.replace('/v1/chat/completions', '/api/models')
          ];
          
          for (const altEndpoint of alternativeEndpoints) {
            if (altEndpoint === modelsEndpoint) continue; // Skip already tried endpoint
            
            try {
              console.log(`Trying alternative endpoint: ${altEndpoint}`);
              const altResponse = await fetch(altEndpoint, {
                method: 'GET',
                headers,
              });
              
              if (altResponse.ok) {
                const altData = await altResponse.json();
                const models = altData.data?.map((model: any) => model.id) || altData.models?.map((model: any) => model.name) || [];
                setAvailableModels(models);
                if (models.length === 0) {
                  setModelError('No models found. Make sure you have loaded models in your local AI server.');
                }
                return;
              }
            } catch (altError) {
              console.log(`Alternative endpoint ${altEndpoint} failed:`, altError);
            }
          }
        }
        
        throw new Error(`Server responded with status: ${response.status}. Make sure your AI server is running and accessible.`);
      }

      const data = await response.json();
      let models: string[] = [];

      if (serverType.includes('ollama')) {
        // Ollama returns { models: [{ name: "model-name", ... }] }
        models = data.models?.map((model: any) => model.name) || [];
      } else {
        // OpenAI-compatible returns { data: [{ id: "model-id", ... }] }
        models = data.data?.map((model: any) => model.id) || data.models?.map((model: any) => model.name) || [];
      }

      setAvailableModels(models);
      
      if (models.length === 0) {
        setModelError('No models found. Make sure you have loaded models in your local AI server.');
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      let helpfulMessage = '';
      if (errorMessage.includes('405')) {
        helpfulMessage = ' The server doesn\'t support the models endpoint. Try using "Custom Model (Manual Entry)" instead.';
      } else if (errorMessage.includes('Connection refused') || errorMessage.includes('Failed to fetch')) {
        helpfulMessage = ' Make sure your AI server is running and accessible at the specified endpoint.';
      } else if (errorMessage.includes('404')) {
        helpfulMessage = ' The models endpoint was not found. Your server might not support model listing.';
      }
      
      setModelError(`Failed to fetch models: ${errorMessage}.${helpfulMessage}`);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      // Validate form data
      if (!formData.name || !formData.provider || !formData.modelId) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.provider === 'custom' && !formData.endpoint) {
        throw new Error('Please provide an endpoint URL for custom providers');
      }

      // Prepare the model data
      const modelData = {
        name: formData.name,
        description: formData.description,
        provider: formData.provider,
        modelId: formData.modelId,
        apiKey: formData.apiKey,
        endpoint: formData.endpoint,
        serverType: formData.serverType,
        userId: user?.id, // Use Clerk User ID
        isActive: true,
        createdAt: new Date().toISOString()
      };

      // Submit to API
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modelData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create model');
      }

      const result = await response.json();
      setSubmitSuccess('Model created successfully! Redirecting to dashboard...');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error creating model:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create model');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Add AI Model
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Connect a new AI model to start chatting
          </p>
        </div>

        {/* Model Provider Selection */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Choose Provider
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <button 
              type="button"
              onClick={() => handleProviderSelect('openai')}
              className={`p-3 sm:p-4 border rounded-lg transition-colors text-left ${
                selectedProvider === 'openai' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-slate-200 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white text-sm sm:text-base">OpenAI</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">GPT-4, GPT-3.5</p>
                </div>
              </div>
            </button>

            <button 
              type="button"
              onClick={() => handleProviderSelect('anthropic')}
              className={`p-3 sm:p-4 border rounded-lg transition-colors text-left ${
                selectedProvider === 'anthropic' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-slate-200 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white text-sm sm:text-base">Anthropic</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Claude 3</p>
                </div>
              </div>
            </button>

            <button 
              type="button"
              onClick={() => handleProviderSelect('google')}
              className={`p-3 sm:p-4 border rounded-lg transition-colors text-left ${
                selectedProvider === 'google' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-slate-200 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white text-sm sm:text-base">Google</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Gemini Pro</p>
                </div>
              </div>
            </button>

            <button 
              type="button"
              onClick={() => handleProviderSelect('custom')}
              className={`p-3 sm:p-4 border rounded-lg transition-colors text-left ${
                selectedProvider === 'custom' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-slate-200 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white text-sm sm:text-base">Custom</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Your own API</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Model Configuration Form */}
        {selectedProvider && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Model Configuration
            </h2>
            
            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200 text-sm">{submitSuccess}</p>
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">{submitError}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Model Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., My GPT-4 Assistant"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what this model is for..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Model ID
                  </label>
                  {selectedProvider === 'custom' && formData.serverType && formData.endpoint && (
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => fetchAvailableModels(formData.endpoint, formData.serverType)}
                        disabled={isLoadingModels}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoadingModels ? 'Refreshing...' : '🔄 Refresh Models'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await fetch(formData.endpoint, {
                              method: 'GET',
                              headers: { 'Content-Type': 'application/json' }
                            });
                            if (response.ok) {
                              setModelError('✅ Server is accessible!');
                            } else {
                              setModelError(`❌ Server responded with status: ${response.status}`);
                            }
                          } catch (error) {
                            setModelError(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                          }
                        }}
                        className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                      >
                        🔍 Test Connection
                      </button>
                    </div>
                  )}
                </div>
                <select
                  name="modelId"
                  value={formData.modelId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                  required
                >
                  <option value="">Select a model</option>
                  {selectedProvider === 'openai' && (
                    <>
                      <optgroup label="GPT-4 Models">
                        <option value="gpt-4o">GPT-4o (Latest)</option>
                        <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-effective)</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                      </optgroup>
                      <optgroup label="GPT-3.5 Models">
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </optgroup>
                      <optgroup label="Specialized Models">
                        <option value="gpt-4o-2024-05-13">GPT-4o (2024-05-13)</option>
                        <option value="gpt-4-turbo-2024-04-09">GPT-4 Turbo (2024-04-09)</option>
                        <option value="gpt-4-2024-02-27">GPT-4 (2024-02-27)</option>
                        <option value="gpt-3.5-turbo-0125">GPT-3.5 Turbo (0125)</option>
                      </optgroup>
                    </>
                  )}
                  {selectedProvider === 'anthropic' && (
                    <>
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Latest)</option>
                      <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      <option value="claude-3-haiku">Claude 3 Haiku</option>
                    </>
                  )}
                  {selectedProvider === 'google' && (
                    <>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Latest)</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                      <option value="gemini-pro">Gemini Pro</option>
                      <option value="gemini-pro-vision">Gemini Pro Vision</option>
                    </>
                  )}
                  {selectedProvider === 'custom' && (
                    <>
                      {isLoadingModels ? (
                        <option value="" disabled>Loading models from server...</option>
                      ) : availableModels.length > 0 ? (
                        availableModels.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {modelError || 'No models available - select a server first'}
                        </option>
                      )}
                      <option value="custom-model">Custom Model (Manual Entry)</option>
                    </>
                  )}
                </select>
                {selectedProvider === 'custom' && modelError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {modelError}
                  </p>
                )}
                {selectedProvider === 'custom' && availableModels.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✅ Found {availableModels.length} model(s) from your local server
                  </p>
                )}
              </div>

              {selectedProvider === 'custom' && formData.modelId === 'custom-model' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Custom Model Name
                  </label>
                  <input
                    type="text"
                    name="customModelName"
                    placeholder="Enter your custom model name (e.g., llama2:7b, mistral:7b)"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                    onChange={(e) => {
                      const customName = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        modelId: customName || 'custom-model' 
                      }));
                    }}
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Enter the exact model name as it appears in your local AI server
                  </p>
                </div>
              )}

              {/* Provider-specific information */}
              {selectedProvider === 'openai' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                    🤖 OpenAI Models Information
                  </h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                    <p><strong>GPT-4o:</strong> Latest model with improved performance and lower costs</p>
                    <p><strong>GPT-4o Mini:</strong> Fast, cost-effective model for most tasks</p>
                    <p><strong>GPT-4 Turbo:</strong> High-performance model with large context window</p>
                    <p><strong>GPT-3.5 Turbo:</strong> Fast and economical for simple tasks</p>
                  </div>
                </div>
              )}

              {selectedProvider !== 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    API Key
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      name="apiKey"
                      value={formData.apiKey}
                      onChange={handleInputChange}
                      placeholder="Enter your API key"
                      className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                      required
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {selectedProvider === 'openai' 
                      ? 'Get your API key from https://platform.openai.com/api-keys. Your key will be encrypted and stored securely.'
                      : selectedProvider === 'anthropic'
                      ? 'Get your API key from https://console.anthropic.com/. Your key will be encrypted and stored securely.'
                      : selectedProvider === 'google'
                      ? 'Get your API key from Google AI Studio. Your key will be encrypted and stored securely.'
                      : 'Your API key will be encrypted and stored securely'
                    }
                  </p>
                </div>
              )}

              {selectedProvider === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Local AI Server
                    </label>
                    <select 
                      name="serverType"
                      onChange={async (e) => {
                        const serverType = e.target.value;
                        const baseEndpoints = {
                          'lm-studio': 'http://localhost:1234/v1/chat/completions',
                          'ollama': 'http://localhost:11434/api/generate',
                          'text-generation-webui': 'http://localhost:5000/v1/chat/completions',
                          'docker-ollama': 'http://host.docker.internal:11434/api/generate',
                          'docker-lm-studio': 'http://host.docker.internal:1234/v1/chat/completions',
                          'docker-text-generation-webui': 'http://host.docker.internal:5000/v1/chat/completions',
                          'custom': ''
                        };
                        const endpoint = baseEndpoints[serverType as keyof typeof baseEndpoints] || '';
                        
                        setFormData(prev => ({ 
                          ...prev, 
                          endpoint,
                          serverType,
                          modelId: '' // Reset model selection
                        }));

                        // Fetch available models if server type is selected
                        if (serverType && endpoint) {
                          await fetchAvailableModels(endpoint, serverType);
                        } else {
                          setAvailableModels([]);
                          setModelError('');
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                    >
                      <option value="">Select your local AI server</option>
                      <optgroup label="Native Installation">
                        <option value="lm-studio">LM Studio (localhost:1234)</option>
                        <option value="ollama">Ollama (localhost:11434)</option>
                        <option value="text-generation-webui">Text Generation WebUI (localhost:5000)</option>
                      </optgroup>
                      <optgroup label="Docker Containers">
                        <option value="docker-lm-studio">🐳 LM Studio Docker (localhost:1234)</option>
                        <option value="docker-ollama">🐳 Ollama Docker (localhost:11434)</option>
                        <option value="docker-text-generation-webui">🐳 Text Generation WebUI Docker (localhost:5000)</option>
                      </optgroup>
                      <option value="custom">Custom Server</option>
                    </select>
                  </div>

                  {/* Docker Configuration */}
                  {(formData.serverType?.startsWith('docker-') || isDockerServer) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                        🐳 Docker Configuration
                      </h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                            Container Port Mapping
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., 11434:11434 (host:container)"
                            className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-blue-800/50 dark:text-white text-sm"
                          />
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Ensure the container port is mapped to localhost. For Docker-to-Docker communication, use <code>host.docker.internal</code>
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                            Docker Run Command
                          </label>
                          <div className="bg-slate-800 text-green-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                            {formData.serverType === 'docker-ollama' && (
                              <div>
                                <div className="text-slate-400"># Pull and run Ollama in Docker</div>
                                <div>docker run -d -p 11434:11434 --name ollama ollama/ollama</div>
                                <div className="text-slate-400 mt-2"># Pull a model</div>
                                <div>docker exec -it ollama ollama pull llama2</div>
                                <div className="text-slate-400 mt-2"># Access from host: localhost:11434</div>
                                <div className="text-slate-400"># Access from Docker: host.docker.internal:11434</div>
                              </div>
                            )}
                            {formData.serverType === 'docker-lm-studio' && (
                              <div>
                                <div className="text-slate-400"># Run LM Studio compatible server</div>
                                <div>docker run -d -p 1234:1234 --name lm-studio-server \\</div>
                                <div className="ml-4">-v /path/to/models:/models \\</div>
                                <div className="ml-4">your-lm-studio-image</div>
                                <div className="text-slate-400 mt-2"># Access from host: localhost:1234</div>
                                <div className="text-slate-400"># Access from Docker: host.docker.internal:1234</div>
                              </div>
                            )}
                            {formData.serverType === 'docker-text-generation-webui' && (
                              <div>
                                <div className="text-slate-400"># Run Text Generation WebUI</div>
                                <div>docker run -d -p 5000:5000 --name textgen \\</div>
                                <div className="ml-4">-v /path/to/models:/models \\</div>
                                <div className="ml-4">--gpus all \\</div>
                                <div className="ml-4">ghcr.io/oobabooga/text-generation-webui</div>
                                <div className="text-slate-400 mt-2"># Access from host: localhost:5000</div>
                                <div className="text-slate-400"># Access from Docker: host.docker.internal:5000</div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="docker-checkbox"
                            checked={isDockerServer}
                            onChange={(e) => setIsDockerServer(e.target.checked)}
                            className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="docker-checkbox" className="text-sm text-blue-800 dark:text-blue-200">
                            I'm using Docker containers for my AI server
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Endpoint URL
                    </label>
                    <input
                      type="url"
                      name="endpoint"
                      value={formData.endpoint}
                      onChange={handleInputChange}
                      placeholder="http://localhost:1234/v1/chat/completions"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                      required
                    />
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Common endpoints:
                      <br />• LM Studio: http://localhost:1234/v1/chat/completions
                      <br />• Ollama: http://localhost:11434/api/generate
                      <br />• Text Generation WebUI: http://localhost:5000/v1/chat/completions
                      <br />• Docker (from host): Same as above
                      <br />• Docker (from container): http://host.docker.internal:PORT
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      API Key (Optional for local servers)
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        name="apiKey"
                        value={formData.apiKey}
                        onChange={handleInputChange}
                        placeholder="Leave empty for local servers"
                        className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Most local AI servers don't require an API key
                    </p>
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating Model...</span>
                    </>
                  ) : (
                    <span>Add Model</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {!selectedProvider && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Select a Provider
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Choose an AI provider above to configure your model
              </p>
              
              {/* Local AI Setup Guide */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-left max-w-2xl mx-auto">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  🏠 Using Local AI Models?
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  Connect your local AI models from LM Studio, Ollama, or other local servers:
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• <strong>LM Studio:</strong> Download from lmstudio.ai, load a model, and start local server</li>
                  <li>• <strong>Ollama:</strong> Install from ollama.ai, run <code>ollama serve</code> and pull models</li>
                  <li>• <strong>Text Generation WebUI:</strong> Install from github.com/oobabooga/text-generation-webui</li>
                  <li>• <strong>Docker:</strong> Use Docker containers for easy setup and isolation</li>
                </ul>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Select "Custom" provider above to configure your local AI server
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
