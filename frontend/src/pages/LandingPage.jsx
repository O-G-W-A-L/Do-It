import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Do-It</h1>
        <div className="space-x-4">
          <Link to="/login" className="text-blue-600 hover:underline">Log In</Link>
          <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded">Register</Link>
        </div>
      </header>

      <main className="p-10">
        <section className="text-center my-10">
          <h2 className="text-4xl font-extrabold">Do It. Achieve Focus, Master Your Tasks.</h2>
          <p className="text-lg mt-4">A smarter, context-aware task manager that works with you.</p>
          <img src="/assets/hero.png" alt="App showcase" className="mx-auto mt-6 rounded-xl" />
        </section>

        <section className="my-16">
          <h3 className="text-2xl font-bold mb-6 text-center">Wonderful Features</h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <Feature title="Intelligent Prioritization" />
            <Feature title="Deep Work Integration" />
            <Feature title="Context-Aware Grouping" />
          </div>
        </section>

        <section className="text-center my-16">
          <h3 className="text-xl font-semibold mb-2">What early users say</h3>
          <blockquote className="italic text-gray-700">"Changed how I manage my day. Love the focus mode!"</blockquote>
        </section>

        <div className="text-center mt-16">
          <Link to="/signup" className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg">
            Get Started
          </Link>
        </div>
      </main>

      <footer className="bg-gray-100 p-4 text-center text-sm">
        © {new Date().getFullYear()} Do-It. All rights reserved. · <Link to="/privacy" className="underline">Privacy</Link> · <Link to="/terms" className="underline">Terms</Link>
      </footer>
    </div>
  );
}

function Feature({ title }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition">
      <h4 className="font-semibold text-lg mb-2">{title}</h4>
      <p className="text-sm text-gray-600">Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
    </div>
  );
}

