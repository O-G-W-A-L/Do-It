import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code, Users, Award, Zap, Menu, X, CheckCircle, Play, Pause } from 'lucide-react';
import Footer from '../components/Footer';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Progressive scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);

      // Parallax elements
      document.documentElement.style.setProperty('--scroll-y', `${scrollY}px`);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);



  // Minimal, impactful features
  const features = [
    {
      icon: Code,
      title: 'Build Real Products',
      description: 'Not just tutorials. Ship actual applications that solve real problems.',
      metrics: '200+ production apps built'
    },
    {
      icon: Users,
      title: 'Expert Pair Programming',
      description: 'Weekly live coding sessions with senior engineers from top companies.',
      metrics: '1:1 mentorship ratio'
    },
    {
      icon: Award,
      title: 'Career Acceleration',
      description: 'Proven track record of 3x faster career growth versus traditional learning.',
      metrics: '94% placement rate'
    },
    {
      icon: Zap,
      title: 'Intensive Learning',
      description: 'Deep work sessions that mirror real-world development environments.',
      metrics: '40hrs to first deploy'
    }
  ];

  const testimonials = [
    {
      name: 'Hunter Amos',
      previous: 'Barista',
      current: 'Frontend Engineer @ Stripe',
      duration: '6 months',
      achievement: '3x salary increase'
    },
    {
      name: 'Jonathan Ogwal',
      previous: 'Teacher',
      current: 'Fullstack Developer @ Airbnb',
      duration: '8 months',
      achievement: 'Lead 3 projects'
    },
    {
      name: 'Abigail Hunter',
      previous: 'Sales',
      current: 'DevOps Engineer @ Netflix',
      duration: '7 months',
      achievement: 'Senior role in 1 year'
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Enhanced Navigation - Ultra minimal */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="font-bold text-2xl text-gray-900 tracking-tight">
              Do-It
            </Link>

            {/* Desktop Navigation - Ultra minimal */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/login" className="text-gray-600 hover:text-brand-blue transition-colors text-sm font-medium">Login</Link>
              <Link
                to="/register"
                className="bg-brand-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-light transition-all duration-300 text-sm"
              >
                Start Learning
              </Link>
            </div>

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Ultra clean with gradient background */}
      <section className="min-h-screen relative flex items-center justify-center overflow-hidden">
        {/* Beige Background */}
        <div className="absolute inset-0 bg-amber-50"></div>



        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          {/* Main Headline - Powerful and direct */}
          <h1 className="font-bold text-5xl md:text-7xl lg:text-8xl text-gray-900 mb-8 tracking-tight leading-tight">
            F**K OVER<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">LEARNING.</span><br />
            START<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-900">BUILDING.</span>
          </h1>

          {/* Subheadline - Minimal and impactful */}
          <p className="text-xl md:text-2xl text-gray-700 mb-12 font-light max-w-2xl mx-auto leading-relaxed">
            Transform from tutorial follower to product builder in weeks, not years.
          </p>

          {/* Single CTA - Focused */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="bg-white text-gray-900 px-12 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-2xl"
            >
              Apply Now
            </Link>
          </div>

          {/* Social Proof - Minimal stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">2.3x</div>
              <div className="text-gray-600 text-sm mt-1">Faster career growth</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">94%</div>
              <div className="text-gray-600 text-sm mt-1">Placement rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">$128k</div>
              <div className="text-gray-600 text-sm mt-1">Average salary</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-900 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-900 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Methodology Section - Clean and structured */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-bold text-4xl md:text-5xl text-gray-900 mb-6 tracking-tight">
              The Anti-Bootcamp
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We replaced endless lectures with real work. You'll build, deploy, and maintain actual products from day one.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white border border-gray-200 rounded-2xl p-8 hover:border-gray-300 transition-all duration-500 hover:-translate-y-2"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-xl text-gray-900 mb-4 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {feature.description}
                </p>
                <div className="text-sm font-medium text-gray-900">
                  {feature.metrics}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section - Dynamic testimonials */}
      <section id="courses" className="py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-bold text-4xl md:text-5xl text-gray-900 mb-6 tracking-tight">
              Real Transformations
            </h2>
          </div>

          <div className="relative h-96">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-500 ${
                  index === activeTestimonial ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
              >
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 h-full">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="text-6xl font-bold text-gray-900 mb-8">"</div>
                      <p className="text-2xl text-gray-700 leading-relaxed mb-8">
                        Went from {testimonial.previous} to {testimonial.current} in {testimonial.duration}.
                      </p>
                    </div>
                    <div>
                      <div className="font-bold text-xl text-gray-900 mb-2">
                        {testimonial.name}
                      </div>
                      <div className="text-gray-600 mb-2">
                        {testimonial.current}
                      </div>
                      <div className="text-gray-900 font-medium">
                        {testimonial.achievement}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial Navigation */}
          <div className="flex justify-center mt-8 space-x-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeTestimonial ? 'bg-gray-900' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Minimal and powerful */}
      <section className="py-32 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-bold text-4xl md:text-5xl text-white mb-8 tracking-tight">
            Ready to Build Your Future?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join the next cohort of builders. Limited to 25 students for maximum impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="bg-white text-gray-900 px-12 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105"
            >
              Apply for Cohort
            </Link>
            <div className="text-gray-400 text-sm">
              Applications close in 3 days
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
