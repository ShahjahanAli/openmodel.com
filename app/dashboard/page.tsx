import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Bot, Plus, MessageSquare, Settings, LogOut, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import AIModel from '@/models/AIModel';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch user's models
  let userModels = [];
  try {
    await connectDB();
    userModels = await AIModel.find({ userId, isActive: true }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error fetching models:', error);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Manage your AI models and start conversations
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Link href="/dashboard/models/new" className="group">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                    Add AI Model
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                    Connect a new AI model
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/chat" className="group">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                    Start Chat
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                    Begin a new conversation
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/settings" className="group">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                  <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                    Settings
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                    Manage your account
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Models */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                  Your AI Models
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
                  Manage and configure your connected AI models
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-end space-x-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {userModels.length} model{userModels.length !== 1 ? 's' : ''}
                </span>
                <Link href="/dashboard/models/new">
                  <button className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs sm:text-sm">
                    Add Model
                  </button>
                </Link>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {userModels.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Bot className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No models yet
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4">
                  Get started by adding your first AI model
                </p>
                <Link href="/dashboard/models/new">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
                    Add Your First Model
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {userModels.map((model: any) => (
                  <div key={model._id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-slate-600">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 dark:text-white truncate">
                            {model.name}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                              model.provider === 'openai' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              model.provider === 'anthropic' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                              model.provider === 'google' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            }`}>
                              {model.provider === 'openai' ? 'OpenAI' :
                               model.provider === 'anthropic' ? 'Anthropic' :
                               model.provider === 'google' ? 'Google' :
                               'Custom'}
                            </span>
                            {model.serverType && (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 whitespace-nowrap">
                                {model.serverType.includes('docker') ? '🐳 Docker' : '🏠 Local'}
                              </span>
                            )}
                          </div>
                        </div>
                        {model.description && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                            {model.description}
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-slate-500 dark:text-slate-400">
                          <span className="truncate">Model: {model.modelId}</span>
                          {model.endpoint && (
                            <span className="truncate hidden sm:inline">Endpoint: {model.endpoint}</span>
                          )}
                          <span className="whitespace-nowrap">Created: {new Date(model.createdAt).toLocaleDateString()}</span>
                        </div>
                        {model.endpoint && (
                          <div className="sm:hidden mt-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                              Endpoint: {model.endpoint}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2">
                        <Link href={`/dashboard/chat?model=${model._id}`} className="flex-1 sm:flex-none">
                          <button className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs sm:text-sm">
                            Chat
                          </button>
                        </Link>
                        <div className="flex items-center space-x-1">
                          <Link href={`/dashboard/models/${model._id}/edit`}>
                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                              <Edit className="h-4 w-4" />
                            </button>
                          </Link>
                          <button className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
