import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';

const schema = yup.object({
  username:  yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
  email:     yup.string().email('Must be a valid email').required('Email is required'),
  password1: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
  password2: yup.string()
    .oneOf([yup.ref('password1')], 'Passwords must match').required('Please confirm your password'),
});

export default function RegisterPage() {
  const { register: reg, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });
  const { signup, error, infoMessage } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async data => {
    setSubmitting(true);
    await signup(data.username, data.email, data.password1, data.password2);
    setSubmitting(false);
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
            {/* Illustration section - Top on mobile, left on desktop */}
            <div className="w-full lg:w-1/2 order-1 mb-10 lg:mb-0 z-10 px-4 lg:pr-12">
              <div 
                className="max-w-xs sm:max-w-sm mx-auto lg:max-w-lg transform transition-all duration-500 hover:scale-[1.02]"
                style={{ 
                  perspective: '1000px',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 rounded-2xl rotate-2 scale-105 opacity-50 blur-xl"></div>
                  <div 
                    className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 relative transform hover:rotate-y-2 transition-transform duration-500"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="flex items-center justify-center">
                      <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-cyan-100 to-indigo-100 flex items-center justify-center">
                        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-cyan-600/20 to-indigo-600/20 flex items-center justify-center">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-cyan-600/30 to-indigo-600/30 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-700" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-5">
                      <h3 className="text-lg sm:text-xl font-semibold text-cyan-800">Join Our Community</h3>
                      <p className="text-gray-600 mt-2 text-sm sm:text-base">Create an account to access all features and start organizing your tasks</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Diagonal divider for large screens */}
            <div className="hidden lg:block absolute inset-0 pointer-events-none">
              <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon 
                  points="0,0 50,0 0,100 0,0" 
                  className="fill-current text-indigo-100"
                />
              </svg>
            </div>
            
            {/* Form section - Bottom on mobile, right on desktop */}
            <div className="w-full lg:w-1/2 order-2 z-10 px-4 lg:pl-12">
              <div className="max-w-md mx-auto">
                {/* Form header with gradient text */}
                <div className="mb-8">
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-center lg:text-left">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-700 to-indigo-900">
                      Create Account
                    </span>
                  </h1>
                  <p className="text-gray-600 text-center lg:text-left">Join thousands of users organizing their work</p>
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
                
                {/* Registration form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {[
                    { name: 'username', label: 'Username', type: 'text', placeholder: 'Choose a username' },
                    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'your@email.com' },
                    { name: 'password1', label: 'Password', type: 'password', placeholder: 'Create a password' },
                    { name: 'password2', label: 'Confirm Password', type: 'password', placeholder: 'Confirm your password' }
                  ].map((field, index) => (
                    <div key={index} className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 block">{field.label}</label>
                      <input
                        type={field.type}
                        {...reg(field.name)}
                        className="w-full px-5 py-4 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                        placeholder={field.placeholder}
                      />
                      {errors[field.name] && (
                        <span className="text-red-500 text-sm pl-4">{errors[field.name].message}</span>
                      )}
                    </div>
                  ))}
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full py-4 px-6 rounded-full font-medium text-white bg-gradient-to-r from-cyan-700 to-indigo-900 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 ${
                        submitting ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {submitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </div>
                  
                  <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <Link to="/login" className="text-cyan-700 hover:text-cyan-900 font-medium transition-colors">
                        Log in
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