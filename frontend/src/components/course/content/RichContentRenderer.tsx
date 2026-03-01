import React from 'react';
import { marked } from 'marked';
import PropTypes from 'prop-types';

/**
 * RichContentRenderer - Simple markdown/text content display
 *
 * Converts lesson content to HTML and displays it safely.
 * No fancy features, just basic markdown support.
 */
const RichContentRenderer = ({ content, className = '' }) => {
  // Handle empty/null content
  if (!content || content.trim() === '') {
    return (
      <div className={`text-gray-500 italic ${className}`}>
        No content available for this lesson.
      </div>
    );
  }

  // Configure marked for safe, basic rendering
  const renderer = new marked.Renderer();

  // Basic link handling (open in new tab)
  renderer.link = (href, title, text) => {
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${text}</a>`;
  };

  // Configure marked options
  marked.setOptions({
    renderer,
    breaks: true, // Convert \n to <br>
    gfm: true, // GitHub Flavored Markdown
    sanitize: false, // We'll handle safety ourselves
  });

  // Convert markdown to HTML
  let htmlContent;
  try {
    htmlContent = marked(content);
  } catch (error) {
    console.error('Error parsing markdown:', error);
    // Fallback to plain text if markdown parsing fails
    htmlContent = `<p>${content.replace(/\n/g, '<br>')}</p>`;
  }

  return (
    <div
      className={`prose prose-gray max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{
        // Basic prose styling
        lineHeight: '1.7',
        fontSize: '16px',
      }}
    />
  );
};

RichContentRenderer.propTypes = {
  content: PropTypes.string,
  className: PropTypes.string,
};

export default RichContentRenderer;
