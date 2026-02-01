import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Star, Check, Loader2, AlertTriangle, Home } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const FeedbackPage = () => {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('job');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (jobId) {
      fetchJob();
    } else {
      setError('Invalid feedback link');
      setLoading(false);
    }
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select(`
          id,
          scheduled_date,
          customer_rating,
          customers (
            name
          ),
          cleaners (
            name
          )
        `)
        .eq('id', jobId)
        .single();

      if (fetchError) throw fetchError;
      
      if (data.customer_rating) {
        setSubmitted(true);
        setRating(data.customer_rating);
      }
      
      setJob(data);
    } catch (err) {
      console.error('Error fetching job:', err);
      setError('Unable to load feedback form. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      // Call the submit-feedback function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          jobId,
          rating,
          feedback: feedback.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sage" />
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="font-playfair text-2xl font-semibold text-charcoal mb-2">
            Oops!
          </h1>
          <p className="text-charcoal/60 mb-6">{error}</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="font-playfair text-2xl font-semibold text-charcoal mb-2">
            Thank You!
          </h1>
          <p className="text-charcoal/60 mb-4">
            {rating >= 4 
              ? "We're thrilled you loved your cleaning! Your feedback means the world to us."
              : "We appreciate your honest feedback. We'll use it to improve our service."
            }
          </p>
          
          {rating >= 4 && (
            <div className="bg-sage/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-charcoal mb-3">
                If you have a moment, a Google review would help others discover us! 💚
              </p>
              <a
                href="https://g.page/r/willowandwater/review"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block"
              >
                Leave a Google Review
              </a>
            </div>
          )}
          
          <Link to="/" className="text-sage hover:underline text-sm">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-playfair text-2xl font-semibold text-charcoal mb-2">
            How was your clean?
          </h1>
          <p className="text-charcoal/60 text-sm">
            {job?.customers?.name ? `Hi ${job.customers.name.split(' ')[0]}! ` : ''}
            Your feedback helps us improve.
          </p>
          {job?.scheduled_date && (
            <p className="text-charcoal/40 text-xs mt-1">
              Cleaning on {formatDate(job.scheduled_date)}
              {job?.cleaners?.name && ` by ${job.cleaners.name}`}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <p className="text-sm text-charcoal/60 mb-3">Tap to rate</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-charcoal/20'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-sage mt-2">
                {rating === 5 && "Amazing! We're so glad! 🌟"}
                {rating === 4 && "Great! Thank you! ✨"}
                {rating === 3 && "Thanks for your feedback"}
                {rating === 2 && "We'll do better next time"}
                {rating === 1 && "We're sorry to hear that"}
              </p>
            )}
          </div>

          {/* Feedback Text */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Anything you'd like to share? (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-bone border border-charcoal/10 rounded-xl font-inter
                         focus:outline-none focus:ring-2 focus:ring-sage resize-none"
              placeholder="Tell us more about your experience..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={rating === 0 || submitting}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-charcoal/40 mt-6">
          Willow & Water Organic Cleaning
        </p>
      </div>
    </div>
  );
};

export default FeedbackPage;
