import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiMail, FiMessageSquare, FiHelpCircle, FiFileText, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function SupportPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  
  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "To reset your password, click on the 'Forgot Password' link on the login page. You'll receive an email with instructions to create a new password."
    },
    {
      question: "Can I change my username?",
      answer: "Currently, usernames cannot be changed after account creation. This feature may be available in future updates."
    },
    {
      question: "How do I delete my account?",
      answer: "To delete your account, go to Settings > Security and scroll to the bottom where you'll find the account deletion option. Please note this action cannot be undone."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use industry-standard encryption and security practices to protect your data. Your information is stored securely and is never shared with third parties without your consent."
    },
    {
      question: "How do I report a bug?",
      answer: "You can report bugs through the contact form on this page or by emailing our support team directly. Please include as much detail as possible, including steps to reproduce the issue."
    }
  ];
  
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-indigo-700 hover:text-indigo-900 transition-colors font-medium"
        >
          <FiArrowLeft className="mr-2" /> Back
        </button>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900 to-cyan-700 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold mb-1">Support Center</h1>
            <p className="text-indigo-100 text-sm">Get help with your account and tasks</p>
          </div>
          
          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Quick help options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="bg-indigo-50 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiFileText className="text-indigo-700 w-6 h-6" />
                </div>
                <h3 className="font-medium text-indigo-900 mb-1">Documentation</h3>
                <p className="text-sm text-gray-600">Browse our detailed guides</p>
              </div>
              
              <div className="bg-cyan-50 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiMessageSquare className="text-cyan-700 w-6 h-6" />
                </div>
                <h3 className="font-medium text-cyan-900 mb-1">Live Chat</h3>
                <p className="text-sm text-gray-600">Chat with our support team</p>
              </div>
              
              <div className="bg-indigo-50 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiHelpCircle className="text-indigo-700 w-6 h-6" />
                </div>
                <h3 className="font-medium text-indigo-900 mb-1">FAQ</h3>
                <p className="text-sm text-gray-600">Find answers to common questions</p>
              </div>
            </div>
            
            {/* FAQs */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div 
                    key={index} 
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
                      onClick={() => toggleFaq(index)}
                    >
                      <span className="font-medium text-gray-800">{faq.question}</span>
                      {openFaq === index ? (
                        <FiChevronUp className="text-indigo-600" />
                      ) : (
                        <FiChevronDown className="text-gray-400" />
                      )}
                    </button>
                    
                    {openFaq === index && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-gray-600">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Contact form */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Contact Us</h2>
              
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="">Select a topic</option>
                    <option value="account">Account Issues</option>
                    <option value="billing">Billing Questions</option>
                    <option value="technical">Technical Support</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    rows="4"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-full hover:shadow-lg transition-all flex items-center"
                  >
                    <FiMail className="mr-2" /> Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}