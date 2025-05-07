import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Styled Navbar that inherits the design language */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-gradient-to-r from-indigo-900/90 to-cyan-600/90 backdrop-blur-sm shadow-lg py-3' 
          : 'bg-gradient-to-r from-indigo-900 to-cyan-600 py-4'
      }`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="text-white font-bold text-2xl tracking-wide relative group">
            Do-It
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-500 group-hover:w-full"></span>
          </Link>
          
          <div className="flex items-center">
            <Link to="/login" className="text-white/90 hover:text-white transition-colors font-medium px-5 relative group">
              Log In
              <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              to="/register" 
              className="bg-white text-indigo-800 px-6 py-2.5 rounded-full font-medium hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <div className="min-h-[calc(100vh-140px)] relative">
          <div className="absolute top-0 left-0 w-full h-full bg-indigo-900 clip-diagonal"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-500 to-cyan-600 clip-reverse-diagonal"></div>
          <div className="absolute inset-0 z-10 pointer-events-none">
            <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path 
                d="M0,0 L100,0 L100,45 C75,65 50,35 25,55 L0,35 Z" 
                fill="url(#grad)" 
                className="drop-shadow-xl"
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0891b2" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.9" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Content container */}
          <div className="container mx-auto px-6 py-12 sm:py-16 relative z-20">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Image section */}
              <div className="w-full lg:w-1/2 order-2 lg:order-1">
                <div className="relative max-w-lg mx-auto lg:mx-0 transform transition-all duration-500 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-purple-500/30 rounded-xl blur-xl -z-10 transform rotate-2"></div>
                  <img 
                    src="/src/assets/planning(1).png" 
                    alt="Task management illustration" 
                    className="w-full h-auto object-contain rounded-xl shadow-2xl" 
                    style={{
                      maxHeight: '60vh',
                      transform: 'perspective(1000px) rotateY(2deg)',
                    }}
                  />
                </div>
              </div>
              
              {/* Text content */}
              <div className="w-full lg:w-1/2 order-1 lg:order-2 lg:pl-8">
                <div className="max-w-xl mx-auto lg:mx-0">
                  <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-4">
                    Task Management Reimagined
                  </span>
                  
                  <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
                    Manage Your Work <span className="text-cyan-100 relative inline-block">
                      with precision
                      <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8">
                        <path d="M1 5.5C20 2.5 50 1.5 100 5.5C150 9.5 180 7.5 199 4.5" stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none" strokeLinecap="round"/>
                      </svg>
                    </span>
                  </h1>
                  
                  <p className="text-xl text-white/90 leading-relaxed mb-8">
                    A smarter task manager that adapts to your workflow, helping you stay organized and productive.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 mb-8">
                    <Link 
                      to="/signup" 
                      className="bg-white text-indigo-800 px-7 py-3 rounded-full font-medium hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 shadow-lg"
                    >
                      Get Started
                    </Link>
                    <Link 
                      to="/features" 
                      className="text-white px-7 py-3 border-2 border-white/80 rounded-full hover:bg-white/10 transition-all duration-300"
                    >
                      Learn More
                    </Link>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white flex items-center justify-center text-white font-bold text-xs">
                          {i}
                        </div>
                      ))}
                    </div>
                    <p className="text-white/80 text-sm">Join thousands of productive teams</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern, styled footer that inherits the design language */}
      <footer className="bg-gradient-to-r from-indigo-900 to-cyan-700 text-white py-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-indigo-400 opacity-50"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full opacity-10 blur-3xl"></div>
        
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <span className="font-bold text-xl mr-2">Do-It</span>
              <span className="text-white/60 text-sm">© {new Date().getFullYear()}</span>
            </div>
            
            <div className="flex gap-6">
              <a href="#" className="text-white/80 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-white/80 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-white/80 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Add the clip path styles */}
      <style jsx="true">{`
        .clip-diagonal {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 40%);
        }
        .clip-reverse-diagonal {
          clip-path: polygon(0 40%, 100% 100%, 0 100%);
        }
        @media (max-width: 1024px) {
          .clip-diagonal {
            clip-path: polygon(0 0, 100% 0, 100% 65%, 0 85%);
          }
          .clip-reverse-diagonal {
            clip-path: polygon(0 85%, 100% 65%, 100% 100%, 0 100%);
          }
        }
        @media (max-width: 640px) {
          .clip-diagonal {
            clip-path: polygon(0 0, 100% 0, 100% 75%, 0 90%);
          }
          .clip-reverse-diagonal {
            clip-path: polygon(0 90%, 100% 75%, 100% 100%, 0 100%);
          }
        }
      `}</style>
    </div>
  );
}