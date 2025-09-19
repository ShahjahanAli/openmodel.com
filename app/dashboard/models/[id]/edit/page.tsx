'use client';

import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { ArrowLeft, Bot, Key, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditModelPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const params = useParams();
  const modelId = params.id as string;
  
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
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing model data
  useEffect(() => {
    const fetchModel = async () => {
      if (!user?.id || !modelId) return;
      
      try {
        const response = await fetch(`/api/models/${modelId}`);
        if (response.ok) {
          const data = await response.json();
          const model = data.model;
          
          setFormData({
            name: model.name || '',
            description: model.description || '',
            provider: model.provider || '',
            modelId: model.modelId || '',
            apiKey: model.apiKey || '',
            endpoint: model.endpoint || '',
            serverType: model.serverType || ''
          });
          
          setSelectedProvider(model.provider || '');
          setIsDockerServer(model.endpoint?.includes('localhost') || model.endpoint?.includes('127.0.0.1') || false);
        } else {
          setSubmitError('Failed to load model data');
        }
      } catch (error) {
        console.error('Error fetching model:', error);
        setSubmitError('Failed to load model data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded && isSignedIn && user?.id) {
      fetchModel();
    }
  }, [isLoaded, isSignedIn, user?.id, modelId]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isLoading) {
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
    if (!endpoint) return;
    
    setIsLoadingModels(true);
    setModelError('');
    
    try {
      let modelsEndpoint = '';
      
      if (serverType === 'ollama') {
        modelsEndpoint = `${endpoint.replace('/api/generate', '')}/api/tags`;
      } else if (serverType === 'lmstudio') {
        modelsEndpoint = `${endpoint}/v1/models`;
      } else if (serverType === 'textgenerationwebui') {
        modelsEndpoint = `${endpoint}/v1/models`;
      } else {
        // Try OpenAI-compatible endpoint
        modelsEndpoint = `${endpoint}/v1/models`;
      }
      
      const response = await fetch(modelsEndpoint);
      
      if (response.ok) {
        const data = await response.json();
        let models: string[] = [];
        
        if (serverType === 'ollama') {
          models = data.models?.map((model: any) => model.name) || [];
        } else {
          models = data.data?.map((model: any) => model.id) || [];
        }
        
        setAvailableModels(models);
        if (models.length === 0) {
          setModelError('No models found on this server');
        }
      } else {
        setModelError('Failed to fetch models from server');
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModelError('Failed to connect to server');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-fetch models when endpoint changes for custom providers
    if (name === 'endpoint' && selectedProvider === 'custom') {
      const serverType = formData.serverType;
      if (value && serverType) {
        fetchAvailableModels(value, serverType);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const response = await fetch(`/api/models/${modelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitSuccess('Model updated successfully!');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        const errorData = await response.json();
        setSubmitError(errorData.error || 'Failed to update model');
      }
    } catch (error) {
      console.error('Error updating model:', error);
      setSubmitError('Failed to update model');
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
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200 dark:border-slate-700">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Edit AI Model
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
              Update your AI model configuration
            </p>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-6">
            {/* Provider Selection */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">
                Choose AI Provider
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <button
                  onClick={() => handleProviderSelect('openai')}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                    selectedProvider === 'openai'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">OpenAI</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">GPT-4, GPT-3.5</p>
                  </div>
                </button>

                <button
                  onClick={() => handleProviderSelect('anthropic')}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                    selectedProvider === 'anthropic'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">Anthropic</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Claude 3</p>
                  </div>
                </button>

                <button
                  onClick={() => handleProviderSelect('google')}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                    selectedProvider === 'google'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">Google</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gemini Pro</p>
                  </div>
                </button>

                <button
                  onClick={() => handleProviderSelect('custom')}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                    selectedProvider === 'custom'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">Custom</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Local AI</p>
                  </div>
                </button>
              </div>
            </div>

            {selectedProvider && (
              <div className="space-y-4 sm:space-y-6">
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <h3 className="text-sm sm:text-base font-medium text-slate-900 dark:text-white mb-3 sm:mb-4">
                    {selectedProvider === 'openai' && 'OpenAI Configuration'}
                    {selectedProvider === 'anthropic' && 'Anthropic Configuration'}
                    {selectedProvider === 'google' && 'Google Configuration'}
                    {selectedProvider === 'custom' && 'Custom AI Server Configuration'}
                  </h3>
                  
                  <div className="space-y-4">
                    {selectedProvider === 'openai' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            API Key
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              name="apiKey"
                              value={formData.apiKey}
                              onChange={handleInputChange}
                              placeholder="sk-..."
                              className="w-full px-3 py-2 pl-10 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                              required
                            />
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Model ID
                          </label>
                          <select
                            name="modelId"
                            value={formData.modelId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                            required
                          >
                            <option value="">Select a model...</option>
                            <option value="gpt-4o">GPT-4o (Latest)</option>
                            <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-effective)</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K</option>
                          </select>
                        </div>
                      </>
                    )}

                    {selectedProvider === 'anthropic' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            API Key
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              name="apiKey"
                              value={formData.apiKey}
                              onChange={handleInputChange}
                              placeholder="sk-ant-..."
                              className="w-full px-3 py-2 pl-10 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                              required
                            />
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Model ID
                          </label>
                          <select
                            name="modelId"
                            value={formData.modelId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                            required
                          >
                            <option value="">Select a model...</option>
                            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Latest)</option>
                            <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>
                            <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                            <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                            <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                          </select>
                        </div>
                      </>
                    )}

                    {selectedProvider === 'google' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            API Key
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              name="apiKey"
                              value={formData.apiKey}
                              onChange={handleInputChange}
                              placeholder="AIza..."
                              className="w-full px-3 py-2 pl-10 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                              required
                            />
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Model ID
                          </label>
                          <select
                            name="modelId"
                            value={formData.modelId}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                            required
                          >
                            <option value="">Select a model...</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Latest)</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                            <option value="gemini-pro">Gemini Pro</option>
                            <option value="gemini-pro-vision">Gemini Pro Vision</option>
                          </select>
                        </div>
                      </>
                    )}

                    {selectedProvider === 'custom' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Server Type
                          </label>
                          <select
                            name="serverType"
                            value={formData.serverType}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                            required
                          >
                            <option value="">Select server type...</option>
                            <option value="ollama">Ollama</option>
                            <option value="lmstudio">LM Studio</option>
                            <option value="textgenerationwebui">Text Generation WebUI</option>
                            <option value="openai-compatible">OpenAI Compatible</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Endpoint URL
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              name="endpoint"
                              value={formData.endpoint}
                              onChange={handleInputChange}
                              placeholder="http://localhost:11434/api/generate"
                              className="w-full px-3 py-2 pl-10 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                              required
                            />
                            <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            API Key (Optional)
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              name="apiKey"
                              value={formData.apiKey}
                              onChange={handleInputChange}
                              placeholder="Optional API key"
                              className="w-full px-3 py-2 pl-10 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                            />
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Model ID
                          </label>
                          <div className="flex space-x-2">
                            <select
                              name="modelId"
                              value={formData.modelId}
                              onChange={handleInputChange}
                              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm sm:text-base"
                              required
                            >
                              <option value="">Select a model...</option>
                              {availableModels.map((model) => (
                                <option key={model} value={model}>
                                  {model}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => fetchAvailableModels(formData.endpoint, formData.serverType)}
                              disabled={!formData.endpoint || !formData.serverType || isLoadingModels}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              {isLoadingModels ? 'Loading...' : 'Refresh'}
                            </button>
                          </div>
                          {modelError && (
                            <p className="text-red-500 text-xs mt-1">{modelError}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  defaultChecked={true}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Active (model is available for use)
                </label>
              </div>

              {submitError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{submitError}</p>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-600 dark:text-green-400 text-sm">{submitSuccess}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="submit"
                  disabled={!selectedProvider || isSubmitting}
                  className="flex-1 px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
                >
                  {isSubmitting ? 'Updating...' : 'Update Model'}
                </button>
                <Link href="/dashboard" className="flex-1 sm:flex-none">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-4 py-2 sm:py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm sm:text-base font-medium"
                  >
                    Cancel
                  </button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
