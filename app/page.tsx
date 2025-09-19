import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Bot, MessageSquare, Zap, Shield, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-600" />
          <span className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">OpenModel</span>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
          <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
            <button className="px-2 py-1.5 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 text-xs sm:text-sm lg:text-base text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
            <button className="px-3 py-1.5 sm:px-4 sm:py-1.5 lg:px-6 lg:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm lg:text-base">
              Get Started
            </button>
          </SignUpButton>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-20">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 lg:mb-6 leading-tight px-2">
            Your AI Chat
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Engine</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 lg:mb-8 max-w-3xl mx-auto px-3 sm:px-4">
            Create, manage, and chat with multiple AI models in one powerful platform. 
            Connect your favorite AI providers and build amazing conversational experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-center px-3 sm:px-4">
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base lg:text-lg font-semibold">
                <span>Start Building</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
              </button>
            </SignUpButton>
            <Link href="#features">
              <button className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm sm:text-base lg:text-lg font-semibold">
                Learn More
              </button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-12 sm:mt-16 lg:mt-32 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-3 sm:px-4">
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Multi-Model Chat
            </h3>
            <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-400">
              Chat with multiple AI models simultaneously. Compare responses and find the perfect model for your needs.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Easy Integration
            </h3>
            <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-400">
              Connect OpenAI, Anthropic, Google, or your custom models with just a few clicks. No complex setup required.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg sm:col-span-2 lg:col-span-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Secure & Private
            </h3>
            <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-400">
              Your API keys and conversations are encrypted and secure. Full control over your data and privacy.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 sm:mt-16 lg:mt-32 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-12 text-white mx-3 sm:mx-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-3 sm:mb-4 px-2">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl mb-4 sm:mb-6 lg:mb-8 opacity-90 px-2">
            Join thousands of developers already using OpenModel to power their AI applications.
          </p>
          <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
            <button className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-white text-blue-600 rounded-lg hover:bg-slate-100 transition-colors text-sm sm:text-base lg:text-lg font-semibold">
              Get Started Free
            </button>
          </SignUpButton>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 mt-8 sm:mt-12 lg:mt-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
              <span className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 dark:text-white">OpenModel</span>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-slate-600 dark:text-slate-400">
              © 2024 OpenModel. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
