'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Star, 
  User, 
  Calendar,
  Send,
  CheckCircle,
  Clock,
  MoreHorizontal,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Review {
  id: string;
  client_name: string;
  rating: number;
  review_text: string;
  review_title?: string;
  property_type?: string;
  property_value?: number;
  is_verified: boolean;
  is_featured: boolean;
  helpful_votes: number;
  response_from_appraiser?: string;
  response_date?: string;
  created_at: string;
}

interface ReviewResponseSystemProps {
  appraiser_id: string;
}

export function ReviewResponseSystem({ appraiser_id }: ReviewResponseSystemProps) {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending_response, responded
  const [sortBy, setSortBy] = useState('recent');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [appraiser_id, filter, sortBy]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      console.log('Loading reviews for appraiser:', appraiser_id);
      
      const params = new URLSearchParams({
        appraiser_id,
        verified_only: 'true',
        sort_by: sortBy
      });

      console.log('Fetching reviews with params:', params.toString());
      const response = await fetch(`/api/appraisers/reviews?${params}`);
      const result = await response.json();
      
      console.log('Reviews API response:', result);
      
      if (result.success) {
        let filteredReviews = result.data.reviews;
        console.log('Raw reviews data:', filteredReviews);
        
        // Apply response filter
        if (filter === 'pending_response') {
          filteredReviews = filteredReviews.filter((r: Review) => !r.response_from_appraiser);
        } else if (filter === 'responded') {
          filteredReviews = filteredReviews.filter((r: Review) => r.response_from_appraiser);
        }
        
        console.log('Filtered reviews for display:', filteredReviews);
        setReviews(filteredReviews);
      } else {
        console.error('Reviews API failed:', result.error);
        toast.error('Failed to load reviews: ' + result.error);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/appraisers/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: reviewId,
          response_from_appraiser: responseText.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Response submitted successfully');
        setRespondingTo(null);
        setResponseText('');
        loadReviews();
      } else {
        toast.error('Failed to submit response: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (rating: number) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const pendingCount = reviews.filter(r => !r.response_from_appraiser).length;
  const respondedCount = reviews.filter(r => r.response_from_appraiser).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('appraiserDashboard.totalReviews')}</p>
                <p className="text-2xl font-bold">{reviews.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('appraiserDashboard.pendingResponse')}</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('appraiserDashboard.responded')}</p>
                <p className="text-2xl font-bold text-green-600">{respondedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for pending responses */}
      {pendingCount > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {pendingCount} review{pendingCount !== 1 ? 's' : ''} waiting for your response. 
            Responding to reviews helps build trust with potential clients and improves your profile ranking.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Sort */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter reviews" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('appraiserDashboard.allReviews')}</SelectItem>
                  <SelectItem value="pending_response">{t('appraiserDashboard.pendingResponse')} ({pendingCount})</SelectItem>
                  <SelectItem value="responded">{t('appraiserDashboard.responded')} ({respondedCount})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="rating_high">Highest Rating</SelectItem>
                  <SelectItem value="rating_low">Lowest Rating</SelectItem>
                  <SelectItem value="helpful">Most Helpful</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('appraiserDashboard.noReviewsFound')}</h3>
              <p className="text-gray-600">
                {filter === 'pending_response' 
                  ? 'All your reviews have been responded to!'
                  : filter === 'responded'
                  ? 'No responded reviews yet.'
                  : 'No reviews available.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className={`${
              !review.response_from_appraiser ? 'ring-2 ring-orange-200 bg-orange-50' : ''
            }`}>
              <CardContent className="p-6">
                {/* Review Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.client_name}</span>
                        {review.is_verified && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                        {review.is_featured && (
                          <Badge className="text-xs">Featured</Badge>
                        )}
                        {!review.response_from_appraiser && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                            Needs Response
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        {renderStarRating(review.rating)}
                        <span>•</span>
                        <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        {review.property_type && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{review.property_type.replace('_', ' ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {review.property_value && (
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(review.property_value)}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ThumbsUp className="h-3 w-3" />
                      {review.helpful_votes}
                    </div>
                  </div>
                </div>

                {/* Review Title */}
                {review.review_title && (
                  <h4 className="font-semibold text-lg mb-2">{review.review_title}</h4>
                )}

                {/* Review Text */}
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">{review.review_text}</p>
                </div>

                {/* Existing Response */}
                {review.response_from_appraiser && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Your Response</span>
                      {review.response_date && (
                        <span className="text-xs text-blue-600">
                          {new Date(review.response_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-blue-700 text-sm">{review.response_from_appraiser}</p>
                  </div>
                )}

                {/* Response Form */}
                {!review.response_from_appraiser && (
                  <div className="mt-4 pt-4 border-t">
                    {respondingTo === review.id ? (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Write a professional response to this review..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => submitResponse(review.id)}
                            disabled={submitting || !responseText.trim()}
                            size="sm"
                          >
                            <Send className="h-3 w-3 mr-2" />
                            {submitting ? 'Submitting...' : 'Submit Response'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseText('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setRespondingTo(review.id)}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Respond to Review
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Response Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('appraiserDashboard.responseGuidelines')}</CardTitle>
          <CardDescription>
            {t('appraiserDashboard.tipsForWritingResponses')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-600 mb-2">{t('appraiserDashboard.doSection')}</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• {t('appraiserDashboard.thankClient')}</li>
                <li>• {t('appraiserDashboard.addressSpecificPoints')}</li>
                <li>• {t('appraiserDashboard.maintainProfessionalTone')}</li>
                <li>• {t('appraiserDashboard.highlightCommitment')}</li>
                <li>• Invite future communication if needed</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-600 mb-2">{t('appraiserDashboard.dontSection')}</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• {t('appraiserDashboard.getDefensive')}</li>
                <li>• {t('appraiserDashboard.shareConfidentialInfo')}</li>
                <li>• {t('appraiserDashboard.makeExcuses')}</li>
                <li>• {t('appraiserDashboard.usePromotionalLanguage')}</li>
                <li>• Ignore negative feedback</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}