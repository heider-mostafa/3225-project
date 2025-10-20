'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  Calendar, 
  User,
  Shield,
  Filter,
  SortDesc,
  MoreHorizontal,
  Quote,
  TrendingUp,
  Award,
  CheckCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface RatingBreakdown {
  rating: number;
  count: number;
  percentage: number;
}

interface ProfileReviewsTabProps {
  appraiser_id: string;
  reviews: Review[];
  average_rating: number;
  total_reviews: number;
  rating_breakdown: RatingBreakdown[];
  recent_reviews_count: number; // Reviews in last 30 days
}

export function ProfileReviewsTab({ 
  appraiser_id, 
  reviews, 
  average_rating, 
  total_reviews,
  rating_breakdown,
  recent_reviews_count 
}: ProfileReviewsTabProps) {
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = reviews;

    // Apply verified filter
    if (showOnlyVerified) {
      filtered = filtered.filter(review => review.is_verified);
    }

    // Apply rating filter
    if (selectedFilter !== 'all') {
      const rating = parseInt(selectedFilter);
      filtered = filtered.filter(review => review.rating === rating);
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'rating_high':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating_low':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        filtered.sort((a, b) => b.helpful_votes - a.helpful_votes);
        break;
      case 'featured':
        filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        break;
    }

    return filtered;
  };

  const renderRatingOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Overall Rating */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">{average_rating.toFixed(1)}</div>
          <div className="flex justify-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= average_rating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-gray-600 mb-4">Based on {total_reviews} reviews</div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{recent_reviews_count}</div>
              <div className="text-gray-600">{t('appraiserDashboard.recentReviews')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {reviews.filter(r => r.is_verified).length}
              </div>
              <div className="text-gray-600">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">
                {reviews.filter(r => r.is_featured).length}
              </div>
              <div className="text-gray-600">Featured</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Breakdown */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">{t('appraiserDashboard.ratingBreakdown')}</h3>
          <div className="space-y-3">
            {rating_breakdown.map((breakdown) => (
              <div key={breakdown.rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm font-medium">{breakdown.rating}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1">
                  <Progress value={breakdown.percentage} className="h-2" />
                </div>
                <div className="text-sm text-gray-600 w-12 text-right">
                  {breakdown.count}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Recommendation Rate</span>
              <span className="font-semibold text-green-600">
                {Math.round((reviews.filter(r => r.rating >= 4).length / total_reviews) * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFiltersAndSort = () => (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <label className="text-sm font-medium mb-2 block">{t('appraiserDashboard.filterByRating')}</label>
        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t('appraiserDashboard.allRatings')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('appraiserDashboard.allRatings')}</SelectItem>
            <SelectItem value="5">{t('appraiserDashboard.fiveStars')}</SelectItem>
            <SelectItem value="4">{t('appraiserDashboard.fourStars')}</SelectItem>
            <SelectItem value="3">{t('appraiserDashboard.threeStars')}</SelectItem>
            <SelectItem value="2">{t('appraiserDashboard.twoStars')}</SelectItem>
            <SelectItem value="1">{t('appraiserDashboard.oneStar')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <label className="text-sm font-medium mb-2 block">Sort by</label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="featured">Featured First</SelectItem>
            <SelectItem value="rating_high">Highest Rating</SelectItem>
            <SelectItem value="rating_low">Lowest Rating</SelectItem>
            <SelectItem value="helpful">Most Helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button
          variant={showOnlyVerified ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowOnlyVerified(!showOnlyVerified)}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          Verified Only
        </Button>
      </div>
    </div>
  );

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

  const renderReview = (review: Review, index: number) => (
    <Card key={review.id} className={`${review.is_featured ? 'ring-2 ring-blue-200 bg-blue-50' : ''}`}>
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
                  <Badge className="text-xs flex items-center gap-1 bg-blue-600">
                    <Award className="h-3 w-3" />
                    Featured
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
          </div>
        </div>

        {/* Review Title */}
        {review.review_title && (
          <h4 className="font-semibold text-lg mb-2">{review.review_title}</h4>
        )}

        {/* Review Text */}
        <div className="mb-4">
          <div className="relative">
            <Quote className="absolute -top-2 -left-2 h-6 w-6 text-gray-300" />
            <p className="text-gray-700 leading-relaxed pl-4">{review.review_text}</p>
          </div>
        </div>

        {/* Appraiser Response */}
        {review.response_from_appraiser && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Response from Appraiser</span>
              {review.response_date && (
                <span className="text-xs text-blue-600">
                  {new Date(review.response_date).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-blue-700 text-sm">{review.response_from_appraiser}</p>
          </div>
        )}

        {/* Review Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
              <ThumbsUp className="h-4 w-4" />
              <span>Helpful ({review.helpful_votes})</span>
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            Review #{index + 1}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const filteredReviews = getFilteredAndSortedReviews();

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      {renderRatingOverview()}

      {/* Reviews Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Client Reviews</h3>
          <div className="text-sm text-gray-600">
            {filteredReviews.length} of {total_reviews} reviews
          </div>
        </div>

        {renderFiltersAndSort()}

        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
              <p className="text-gray-600">
                {showOnlyVerified || selectedFilter !== 'all'
                  ? 'No reviews match your current filters.'
                  : 'This appraiser hasn\'t received any reviews yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review, index) => renderReview(review, index))}
          </div>
        )}
      </div>

      {/* Review Guidelines */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          All reviews are moderated for authenticity. Verified reviews come from confirmed 
          clients who have completed appraisal services. Featured reviews highlight 
          exceptional service quality.
        </AlertDescription>
      </Alert>

      {/* Performance Insights */}
      {total_reviews >= 10 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Performance Highlights</h3>
                <p className="text-green-700">Based on client feedback analysis</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-green-800">
                  {Math.round((reviews.filter(r => r.rating >= 4).length / total_reviews) * 100)}%
                </div>
                <div className="text-green-600">Recommend Rate</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-800">
                  {Math.round((reviews.filter(r => r.response_from_appraiser).length / total_reviews) * 100)}%
                </div>
                <div className="text-green-600">Response Rate</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-800">
                  {reviews.reduce((sum, r) => sum + r.helpful_votes, 0)}
                </div>
                <div className="text-green-600">Helpful Votes</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-800">
                  {new Set(reviews.map(r => r.property_type).filter(Boolean)).size}
                </div>
                <div className="text-green-600">Property Types</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}