import React from 'react';

export default function SupportPage() {
  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Support
      </h1>
      {/* TODO: embed ticketing widget or FAQ here */}
      <p className="text-gray-600 dark:text-gray-300">
        Need help? Reach out to our support team or browse FAQs.
      </p>
    </div>
  );
}

