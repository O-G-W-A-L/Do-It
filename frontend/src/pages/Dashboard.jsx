import React, { useState } from 'react';
import { Calendar, Clock, Users, ChevronRight, X, Bell, Grid3X3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function CourseLanding() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const enrolledCourses = [
    {
      id: 1,
      title: 'Full-Stack Web Development',
      status: 'live',
      startDate: '2025-10-15',
      duration: '16 weeks',
      nextSession: 'Live now',
      cohortSize: 247
    },
    {
      id: 2,
      title: 'Cloud Architecture & DevOps',
      status: 'upcoming',
      startDate: '2025-11-05',
      duration: '12 weeks',
      daysUntil: 16,
      cohortSize: 189
    }
  ];

  const availableCourses = [
    {
      id: 3,
      title: 'Backend Engineering with Node.js',
      startDate: '2025-11-20',
      duration: '14 weeks',
      level: 'Intermediate',
      cohortSize: 156,
      description: 'Master server-side development, APIs, databases, and scalable architecture. Build production-ready applications.',
      notFor: 'Complete beginners without any programming experience',
      includes: ['Live coding sessions', 'Real-world projects', 'Peer code reviews', 'Industry mentorship']
    },
    {
      id: 4,
      title: 'React & Modern Frontend',
      startDate: '2025-12-02',
      duration: '10 weeks',
      level: 'Beginner to Intermediate',
      cohortSize: 203,
      description: 'Build interactive UIs with React, hooks, state management, and modern tooling. Create professional web applications.',
      notFor: 'Those looking for pure design/CSS courses without JavaScript',
      includes: ['Component architecture', '3 portfolio projects', 'Weekly pair programming', 'Career guidance']
    },
    {
      id: 5,
      title: 'Data Engineering & Analytics',
      startDate: '2025-11-28',
      duration: '15 weeks',
      level: 'Intermediate',
      cohortSize: 134,
      description: 'Work with big data pipelines, ETL processes, data warehousing, and analytics tools. Make data-driven decisions.',
      notFor: 'Those without basic SQL and programming knowledge',
      includes: ['Real datasets', 'Pipeline projects', 'Tool workshops', 'Team challenges']
    },
    {
      id: 6,
      title: 'Mobile Development with React Native',
      startDate: '2025-12-10',
      duration: '12 weeks',
      level: 'Intermediate',
      cohortSize: 178,
      description: 'Create cross-platform mobile apps for iOS and Android. Learn mobile-specific patterns and deployment.',
      notFor: 'Complete beginners or those without JavaScript basics',
      includes: ['2 full apps', 'App store deployment', 'Performance optimization', 'Group projects']
    }
  ];

  const getDaysUntil = (dateStr) => {
    const start = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-3 border-b border-gray-200' : 'bg-white py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="text-gray-900 font-bold text-2xl">Do-It</div>
          <div className="flex items-center gap-6">
            <Link to="/hub" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue transition-colors text-sm">
              <Grid3X3 className="w-4 h-4" />
              Workspace
            </Link>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full">2600 points</span>
            </div>
            <button className="text-gray-600 hover:text-brand-blue">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full bg-brand-blue flex items-center justify-center text-white font-semibold text-sm">
              JA
            </div>
          </div>
        </div>
      </header>

      {/* Hero Welcome Section */}
      <section className="bg-gray-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-cyan/30 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <p className="text-accent-cyan text-sm font-medium mb-2">Welcome to Do-It Learning</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Your Learning Journey Starts Here</h1>
          <p className="text-gray-300 text-lg">Build real skills, ship production code, advance your career.</p>
        </div>
      </section>

      {/* Greeting */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hello Jonathan Amos!</h2>
          <p className="text-gray-600">Ready to level up? Your next course is waiting.</p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* My Courses Section */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
            <button className="text-sm text-brand-blue hover:text-brand-blue-light font-medium flex items-center gap-1">
              View More <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Payment Status Banner */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div className="flex-1">
              <p className="text-green-900 font-medium text-sm">Payment up to date</p>
              <p className="text-green-700 text-sm">Your fees are current. Full access to all courses.</p>
            </div>
          </div>

          <div className="space-y-6">
            {enrolledCourses.map(course => (
              <div key={course.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                      {course.status === 'live' ? (
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Live
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          Starts in {course.daysUntil} days
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(course.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{course.cohortSize} peers</span>
                      </div>
                    </div>
                  </div>

                  <button className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors whitespace-nowrap">
                    Continue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Available Courses Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Available Courses</h2>
            <button className="text-sm text-brand-blue hover:text-brand-blue-light font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map(course => {
              const daysUntil = getDaysUntil(course.startDate);
              const canEnroll = daysUntil > 0;

              return (
                <div key={course.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 leading-tight">{course.title}</h3>

                    <div className="space-y-2.5 mb-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Starts {formatDate(course.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{course.cohortSize} enrolled</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm"
                      >
                        View Details
                      </button>
                      {canEnroll && (
                        <button className="flex-1 bg-cyan-600 text-white py-2 rounded-lg font-medium hover:bg-cyan-700 transition-colors text-sm">
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCourse(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{selectedCourse.title}</h2>
              <button onClick={() => setSelectedCourse(null)} className="text-slate-500 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                  <p className="text-xs text-slate-500 mb-1">Starts</p>
                  <p className="text-sm font-semibold text-slate-900">{formatDate(selectedCourse.startDate)}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                  <p className="text-xs text-slate-500 mb-1">Duration</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedCourse.duration}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Users className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                  <p className="text-xs text-slate-500 mb-1">Cohort</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedCourse.cohortSize} peers</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-2">About this course</h3>
                <p className="text-slate-600 leading-relaxed">{selectedCourse.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">What's included</h3>
                <div className="space-y-2">
                  {selectedCourse.includes.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-cyan-600 mt-0.5">✓</span>
                      <span className="text-slate-600 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-semibold text-amber-900 mb-1 text-sm">Not suitable if:</h3>
                <p className="text-amber-800 text-sm">{selectedCourse.notFor}</p>
              </div>

              <button className="w-full bg-cyan-600 text-white py-3 rounded-lg font-medium hover:bg-cyan-700 transition-colors">
                Enroll in This Course
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
