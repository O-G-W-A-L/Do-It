import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';

const schema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });
  const { login, error, infoMessage } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async data => {
    setIsLoading(true);
    await login(data.username, data.password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 to-cyan-700 shadow-md py-4">
        <div className="container mx-auto px-6">
          <Link to="/" className="text-white font-bold text-2xl tracking-wide relative group">
            Do-It
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-500 group-hover:w-full"></span>
          </Link>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow flex items-center justify-center relative overflow-hidden py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center max-w-6xl mx-auto relative">
            {/* Illustration section - Top on mobile, right on desktop */}
            <div className="w-full lg:w-1/2 order-1 lg:order-2 mb-10 lg:mb-0 z-10 px-4 lg:pl-12">
              <div 
                className="max-w-xs sm:max-w-sm mx-auto lg:max-w-lg transform transition-all duration-500 hover:scale-[1.02]"
                style={{ 
                  perspective: '1000px',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 rounded-2xl -rotate-2 scale-105 opacity-50 blur-xl"></div>
                  <div 
                    className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 relative transform hover:rotate-y-2 transition-transform duration-500"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="flex items-center justify-center">
                      <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-indigo-100 to-cyan-100 flex items-center justify-center">
                        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-indigo-600/20 to-cyan-600/20 flex items-center justify-center">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-indigo-600/30 to-cyan-600/30 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-700" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-5">
                      <h3 className="text-lg sm:text-xl font-semibold text-indigo-800">Secure Access</h3>
                      <p className="text-gray-600 mt-2 text-sm sm:text-base">Your data is protected with industry-leading security measures</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Diagonal divider for large screens */}
            <div className="hidden lg:block absolute inset-0 pointer-events-none">
              <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon 
                  points="50,0 100,0 100,100 0,100" 
                  className="fill-current text-indigo-100"
                />
              </svg>
            </div>
            
            {/* Form section - Bottom on mobile, left on desktop */}
            <div className="w-full lg:w-1/2 order-2 lg:order-1 z-10 px-4 lg:pr-12">
              <div className="max-w-md mx-auto">
                {/* Form header with gradient text */}
                <div className="mb-8">
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-center lg:text-left">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-cyan-700">
                      Welcome Back
                    </span>
                  </h1>
                  <p className="text-gray-600 text-center lg:text-left">Log in to your account to continue</p>
                </div>
                
                {/* Alert messages */}
                {error && (
                  <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                {infoMessage && (
                  <div className="mb-6 p-3 bg-cyan-50 border-l-4 border-cyan-500 text-cyan-700 rounded-lg text-sm">
                    {infoMessage}
                  </div>
                )}
                
                {/* Login form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 block">Username</label>
                    <input
                      {...register('username')}
                      className="w-full px-5 py-4 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter your username"
                    />
                    {errors.username && (
                      <span className="text-red-500 text-sm pl-4">{errors.username.message}</span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700 block">Password</label>
                      <Link to="/forgot-password" className="text-sm text-indigo-700 hover:text-indigo-900 transition-colors">
                        Forgot Password?
                      </Link>
                    </div>
                    <input
                      type="password"
                      {...register('password')}
                      className="w-full px-5 py-4 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                    />
                    {errors.password && (
                      <span className="text-red-500 text-sm pl-4">{errors.password.message}</span>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-4 px-6 rounded-full font-medium text-white bg-gradient-to-r from-indigo-900 to-cyan-700 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 ${
                        isLoading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading ? 'Logging in...' : 'Log In'}
                    </button>
                  </div>
                  
                  <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{' '}
                      <Link to="/register" className="text-indigo-700 hover:text-indigo-900 font-medium transition-colors">
                        Sign up
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 bg-gradient-to-r from-indigo-900/10 to-cyan-700/10 border-t border-indigo-100">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-600 text-sm">© {new Date().getFullYear()} Do-It. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}