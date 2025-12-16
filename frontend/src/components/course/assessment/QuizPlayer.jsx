import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

/**
 * QuizPlayer - Simple quiz taking component
 *
 * Follows VideoPlayer pattern: single responsibility, clean interface, error handling.
 * No over-engineering: just load questions, accept answers, submit quiz.
 */
const QuizPlayer = ({
  lesson,
  onSubmit,
  onProgress,
  className = ''
}) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load quiz questions when lesson changes
  useEffect(() => {
    if (lesson?.id) {
      loadQuizQuestions();
    }
  }, [lesson?.id]);

  // Load questions from backend
  const loadQuizQuestions = useCallback(async () => {
    if (!lesson?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Use existing courses API to get lesson details with questions
      const response = await fetch(`/api/courses/lessons/${lesson.id}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load quiz questions');
      }

      const lessonData = await response.json();

      // Extract quiz questions (assuming they're included in lesson data)
      if (lessonData.quiz_questions) {
        setQuestions(lessonData.quiz_questions);
      } else {
        // If no questions, show message
        setQuestions([]);
      }
    } catch (err) {
      console.error('Error loading quiz questions:', err);
      setError('Failed to load quiz questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [lesson?.id]);

  // Handle answer selection
  const handleAnswerSelect = useCallback((questionId, answerId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));

    // Report progress if callback provided
    if (onProgress) {
      onProgress({
        questionId,
        answerId,
        totalQuestions: questions.length,
        answeredQuestions: Object.keys({ ...answers, [questionId]: answerId }).length
      });
    }
  }, [answers, questions.length, onProgress]);

  // Navigate to next question
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  // Navigate to previous question
  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Submit quiz
  const submitQuiz = useCallback(async () => {
    if (!lesson?.id || submitting) return;

    setSubmitting(true);

    try {
      // Prepare submission data
      const submissionData = {
        lesson: lesson.id,
        answers: answers,
        submitted_at: new Date().toISOString()
      };

      // Submit to backend
      const response = await fetch('/api/progress/quiz-submissions/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();

      // Call onSubmit callback
      if (onSubmit) {
        onSubmit({
          success: true,
          score: result.score,
          maxScore: result.max_score,
          percentage: result.percentage,
          passed: result.passed,
          answers: answers
        });
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to submit quiz. Please try again.');

      // Call onSubmit with error
      if (onSubmit) {
        onSubmit({
          success: false,
          error: err.message,
          answers: answers
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [lesson?.id, answers, submitting, onSubmit]);

  // Check if quiz is complete (all questions answered)
  const isQuizComplete = useCallback(() => {
    return questions.length > 0 &&
           questions.every(question => answers[question.id] !== undefined);
  }, [questions, answers]);

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading quiz questions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">Quiz Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadQuizQuestions}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No questions state
  if (questions.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-600 text-xl">📝</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quiz Questions</h3>
          <p className="text-gray-600">This quiz doesn't have any questions yet.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredQuestions = Object.keys(answers).length;
  const progressPercentage = (answeredQuestions / questions.length) * 100;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Quiz Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Quiz</h3>
          <div className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 text-center">
          {answeredQuestions} of {questions.length} questions answered
        </div>
      </div>

      {/* Question Content */}
      <div className="p-6">
        {currentQuestion && (
          <div>
            {/* Question Text */}
            <h4 className="text-lg font-medium text-gray-900 mb-6">
              {currentQuestion.question_text}
            </h4>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.answers && currentQuestion.answers.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                  className={`w-full p-4 text-left border rounded-lg transition-all duration-200 ${
                    answers[currentQuestion.id] === answer.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                      answers[currentQuestion.id] === answer.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQuestion.id] === answer.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                    <span className="text-gray-900">{answer.answer_text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          {/* Previous Button */}
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Question Indicators */}
          <div className="flex gap-1">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600'
                    : answers[questions[index]?.id]
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Next/Submit Button */}
          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={submitQuiz}
              disabled={!isQuizComplete() || submitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Quiz
                </>
              )}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

QuizPlayer.propTypes = {
  lesson: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    content_type: PropTypes.string
  }).isRequired,
  onSubmit: PropTypes.func,
  onProgress: PropTypes.func,
  className: PropTypes.string,
};

export default QuizPlayer;
