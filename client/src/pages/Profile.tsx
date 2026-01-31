import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    User, Star, MapPin, Truck, Edit2, LogOut,
    Briefcase, FileText, CheckCircle, Settings
} from 'lucide-react'
import { authApi } from '../lib/api'
import { LoadingPage } from '../components/LoadingSpinner'
import { StarRating } from '../components/StarRating'
import { useAuthStore } from '../stores/authStore'

export function Profile() {
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()

    const { data, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => authApi.me(),
    })

    const profile = data?.data?.data?.user

    if (isLoading) {
        return <LoadingPage />
    }

    if (!profile) {
        return null
    }

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Profile Header */}
            <div className="card p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                            {profile.avatarUrl ? (
                                <img
                                    src={profile.avatarUrl}
                                    alt={profile.name}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <User className="w-10 h-10 text-primary-600" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`badge ${profile.userType === 'WORKER' ? 'badge-primary' :
                                        profile.userType === 'EMPLOYER' ? 'badge-success' :
                                            'badge-warning'
                                    }`}>
                                    {profile.userType === 'BOTH' ? 'Worker & Employer' : profile.userType}
                                </span>
                                {profile.isVerified && (
                                    <span className="badge-success flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <Link to="/profile/edit" className="btn-secondary btn-sm">
                        <Edit2 className="w-4 h-4" />
                        Edit
                    </Link>
                </div>

                {/* Rating */}
                {profile.averageRating && (
                    <div className="flex items-center gap-2 mb-4">
                        <StarRating rating={Math.round(profile.averageRating)} readonly />
                        <span className="text-gray-600">
                            {profile.averageRating.toFixed(1)} ({profile._count?.reviewsReceived || 0} reviews)
                        </span>
                    </div>
                )}

                {/* Location */}
                {profile.city && (
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.city}</span>
                    </div>
                )}

                {/* Bio */}
                {profile.bio && (
                    <p className="text-gray-700 mb-4">{profile.bio}</p>
                )}

                {/* Skills */}
                {profile.skills && profile.skills.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill: any) => (
                                <span key={skill.id} className="badge-primary">
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transportation */}
                {profile.userType !== 'EMPLOYER' && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <Truck className={profile.hasTransportation ? 'text-green-500' : 'text-gray-400'} />
                        <span>
                            {profile.hasTransportation
                                ? 'Has own transportation'
                                : 'Needs transportation'
                            }
                        </span>
                    </div>
                )}

                {/* Guest warning */}
                {profile.isGuest && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-yellow-800 text-sm">
                            <strong>You're using a guest account.</strong> Create a full account to save your profile and apply for jobs.
                        </p>
                        <Link to="/register" className="btn-primary btn-sm mt-2">
                            Create Account
                        </Link>
                    </div>
                )}
            </div>

            {/* Quick Links */}
            <div className="card divide-y mb-6">
                {(profile.userType === 'WORKER' || profile.userType === 'BOTH') && (
                    <Link
                        to="/my-applications"
                        className="flex items-center gap-3 p-4 hover:bg-gray-50"
                    >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">My Applications</p>
                            <p className="text-sm text-gray-500">Track your job applications</p>
                        </div>
                    </Link>
                )}

                {(profile.userType === 'EMPLOYER' || profile.userType === 'BOTH') && (
                    <Link
                        to="/my-jobs"
                        className="flex items-center gap-3 p-4 hover:bg-gray-50"
                    >
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">My Jobs</p>
                            <p className="text-sm text-gray-500">Manage jobs you've posted</p>
                        </div>
                    </Link>
                )}

                <Link
                    to="/profile/edit"
                    className="flex items-center gap-3 p-4 hover:bg-gray-50"
                >
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-gray-900">Settings</p>
                        <p className="text-sm text-gray-500">Update your profile and preferences</p>
                    </div>
                </Link>
            </div>

            {/* Recent Reviews */}
            {profile.reviewsReceived && profile.reviewsReceived.length > 0 && (
                <div className="card p-6 mb-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Recent Reviews</h2>
                    <div className="space-y-4">
                        {profile.reviewsReceived.slice(0, 3).map((review: any) => (
                            <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-900">
                                        {review.author?.name || 'Anonymous'}
                                    </span>
                                    <StarRating rating={review.rating} readonly size="sm" />
                                </div>
                                {review.comment && (
                                    <p className="text-gray-600 text-sm">{review.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="btn-secondary w-full text-red-600 hover:bg-red-50 hover:border-red-200"
            >
                <LogOut className="w-4 h-4" />
                Log Out
            </button>
        </div>
    )
}
