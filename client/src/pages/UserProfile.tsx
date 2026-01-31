import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    User, Star, MapPin, Truck, Calendar, CheckCircle,
    ArrowLeft
} from 'lucide-react'
import { format } from 'date-fns'
import { usersApi, reviewsApi } from '../lib/api'
import { LoadingPage } from '../components/LoadingSpinner'
import { StarRating } from '../components/StarRating'
import { Alert } from '../components/Alert'

export function UserProfile() {
    const { id } = useParams<{ id: string }>()

    const { data: userData, isLoading: loadingUser } = useQuery({
        queryKey: ['user', id],
        queryFn: () => usersApi.get(id!),
        enabled: !!id,
    })

    const { data: reviewsData, isLoading: loadingReviews } = useQuery({
        queryKey: ['userReviews', id],
        queryFn: () => reviewsApi.forUser(id!),
        enabled: !!id,
    })

    const user = userData?.data?.data?.user
    const reviews = reviewsData?.data?.data?.reviews || []
    const reviewStats = reviewsData?.data?.data?.stats

    if (loadingUser) {
        return <LoadingPage />
    }

    if (!user) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <Alert type="error">User not found.</Alert>
                <Link to="/jobs" className="btn-secondary mt-4">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Jobs
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Back button */}
            <Link
                to="/jobs"
                className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </Link>

            {/* Profile Header */}
            <div className="card p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {user.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <User className="w-10 h-10 text-primary-600" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                        <div className="flex items-center flex-wrap gap-2 mt-1">
                            <span className={`badge ${user.userType === 'WORKER' ? 'badge-primary' :
                                    user.userType === 'EMPLOYER' ? 'badge-success' :
                                        'badge-warning'
                                }`}>
                                {user.userType === 'BOTH' ? 'Worker & Employer' : user.userType}
                            </span>
                            {user.isVerified && (
                                <span className="badge-success flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Verified
                                </span>
                            )}
                        </div>

                        {/* Rating */}
                        {user.averageRating && (
                            <div className="flex items-center gap-2 mt-3">
                                <StarRating rating={Math.round(user.averageRating)} readonly />
                                <span className="text-gray-600">
                                    {user.averageRating.toFixed(1)} ({user.reviewCount || 0} reviews)
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="mt-6 space-y-3">
                    {user.city && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{user.city}</span>
                        </div>
                    )}

                    {user.createdAt && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Member since {format(new Date(user.createdAt), 'MMMM yyyy')}</span>
                        </div>
                    )}

                    {user.userType !== 'EMPLOYER' && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <Truck className={user.hasTransportation ? 'text-green-500' : 'text-gray-400'} />
                            <span>
                                {user.hasTransportation
                                    ? 'Has own transportation'
                                    : 'May need transportation'
                                }
                            </span>
                        </div>
                    )}
                </div>

                {/* Bio */}
                {user.bio && (
                    <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">About</h3>
                        <p className="text-gray-700">{user.bio}</p>
                    </div>
                )}

                {/* Skills */}
                {user.skills && user.skills.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {user.skills.map((skill: any) => (
                                <span key={skill.id} className="badge-primary">
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                            {user.jobsCompleted || 0}
                        </p>
                        <p className="text-sm text-gray-500">Jobs Completed</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                            {user.reviewCount || 0}
                        </p>
                        <p className="text-sm text-gray-500">Reviews</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                            {user.averageRating ? user.averageRating.toFixed(1) : '-'}
                        </p>
                        <p className="text-sm text-gray-500">Rating</p>
                    </div>
                </div>
            </div>

            {/* Reviews */}
            <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">
                    Reviews ({reviews.length})
                </h2>

                {/* Rating distribution */}
                {reviewStats && reviewStats.totalReviews > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="text-center">
                                <p className="text-4xl font-bold text-gray-900">
                                    {reviewStats.averageRating.toFixed(1)}
                                </p>
                                <StarRating rating={Math.round(reviewStats.averageRating)} readonly size="sm" />
                            </div>
                            <div className="flex-1">
                                {[5, 4, 3, 2, 1].map((stars) => {
                                    const count = reviewStats.ratingDistribution[stars] || 0
                                    const percentage = reviewStats.totalReviews > 0
                                        ? (count / reviewStats.totalReviews) * 100
                                        : 0
                                    return (
                                        <div key={stars} className="flex items-center gap-2 text-sm">
                                            <span className="w-3">{stars}</span>
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-yellow-400 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="w-8 text-gray-500">{count}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Review list */}
                {reviews.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        No reviews yet
                    </p>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review: any) => (
                            <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {review.author?.name || 'Anonymous'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(review.createdAt), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                    <StarRating rating={review.rating} readonly size="sm" />
                                </div>
                                {review.comment && (
                                    <p className="text-gray-700 ml-10">{review.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
