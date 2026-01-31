import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
    MapPin, Clock, DollarSign, Users, Truck, Calendar,
    Star, MessageSquare, ArrowLeft, CheckCircle, XCircle,
    Building, Phone
} from 'lucide-react'
import { jobsApi, applicationsApi, messagesApi } from '../lib/api'
import { LoadingPage } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { Modal } from '../components/Modal'
import { useAuthStore } from '../stores/authStore'
import type { Job } from '../types'

export function JobDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user, isAuthenticated } = useAuthStore()
    const [showApplyModal, setShowApplyModal] = useState(false)
    const [coverNote, setCoverNote] = useState('')

    const { data, isLoading, error } = useQuery({
        queryKey: ['job', id],
        queryFn: () => jobsApi.get(id!),
        enabled: !!id,
    })

    const job: Job | null = data?.data?.data?.job || null

    const applyMutation = useMutation({
        mutationFn: () => applicationsApi.apply({ jobId: id, coverNote }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job', id] })
            queryClient.invalidateQueries({ queryKey: ['myApplications'] })
            setShowApplyModal(false)
        },
    })

    const startConversationMutation = useMutation({
        mutationFn: () => messagesApi.startConversation({
            jobId: id,
            otherUserId: job?.employerId
        }),
        onSuccess: (response) => {
            const conversationId = response.data.data.conversation.id
            navigate(`/messages/${conversationId}`)
        },
    })

    if (isLoading) {
        return <LoadingPage />
    }

    if (error || !job) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8">
                <Alert type="error">Job not found or has been removed.</Alert>
                <Link to="/jobs" className="btn-secondary mt-4">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Jobs
                </Link>
            </div>
        )
    }

    const formatPay = () => {
        const amount = job.payAmount.toFixed(0)
        switch (job.payType) {
            case 'HOURLY': return `$${amount}/hr`
            case 'DAILY': return `$${amount}/day`
            case 'FIXED': return `$${amount} total`
        }
    }

    const formatDuration = () => {
        if (job.durationHours) return `${job.durationHours} hour${job.durationHours > 1 ? 's' : ''}`
        if (job.durationDays) return `${job.durationDays} day${job.durationDays > 1 ? 's' : ''}`
        return 'Flexible'
    }

    const canApply = isAuthenticated &&
        job.status === 'OPEN' &&
        !job.hasApplied &&
        job.employerId !== user?.id

    const isOwner = job.employerId === user?.id
    const isAccepted = job.applicationStatus === 'ACCEPTED'

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Back button */}
            <Link
                to="/jobs"
                className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to jobs
            </Link>

            {/* Main card */}
            <div className="card">
                {/* Header */}
                <div className="p-6 border-b">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                {job.status !== 'OPEN' && (
                                    <span className={`badge ${job.status === 'COMPLETED' ? 'badge-success' :
                                            job.status === 'FILLED' ? 'badge-warning' :
                                                'badge-gray'
                                        }`}>
                                        {job.status.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>

                            {/* Employer info */}
                            <Link
                                to={`/user/${job.employerId}`}
                                className="flex items-center gap-3 group"
                            >
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <Building className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 group-hover:text-primary-600">
                                        {job.employer.name}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        {job.employer.isVerified && (
                                            <span className="badge-success text-xs">Verified</span>
                                        )}
                                        {job.employerRating && (
                                            <div className="flex items-center gap-0.5">
                                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                                <span>{job.employerRating.toFixed(1)}</span>
                                                <span className="text-gray-400">
                                                    ({job.employerReviewCount} review{job.employerReviewCount !== 1 ? 's' : ''})
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Pay highlight */}
                        <div className="text-right">
                            <p className="text-3xl font-bold text-green-600">{formatPay()}</p>
                            <p className="text-sm text-gray-500">{formatDuration()}</p>
                        </div>
                    </div>
                </div>

                {/* Details grid */}
                <div className="p-6 border-b bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Date</p>
                                <p className="font-medium">{format(new Date(job.startDate), 'MMM d, yyyy')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Time</p>
                                <p className="font-medium">{job.startTime || 'Flexible'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Workers</p>
                                <p className="font-medium">{job.workersHired}/{job.workersNeeded} hired</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Truck className={`w-5 h-5 ${job.providesTransportation ? 'text-green-500' : 'text-gray-400'}`} />
                            <div>
                                <p className="text-xs text-gray-500">Transport</p>
                                <p className="font-medium">
                                    {job.providesTransportation ? 'Provided' : 'Not provided'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="p-6 border-b">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="font-medium text-gray-900">{job.city}</p>
                            {job.address && <p className="text-gray-600">{job.address}</p>}
                            {job.zipCode && <p className="text-sm text-gray-500">ZIP: {job.zipCode}</p>}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="p-6 border-b">
                    <h2 className="font-semibold text-gray-900 mb-3">About This Job</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                </div>

                {/* Skills */}
                {job.skills.length > 0 && (
                    <div className="p-6 border-b">
                        <h2 className="font-semibold text-gray-900 mb-3">Skills Needed</h2>
                        <div className="flex flex-wrap gap-2">
                            {job.skills.map((skill) => (
                                <span key={skill.id} className="badge-primary">
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Contact info (shown after acceptance) */}
                {isAccepted && job.employer.phone && (
                    <div className="p-6 border-b bg-green-50">
                        <Alert type="success" title="You've been accepted!">
                            <p className="mb-2">Contact the employer to coordinate:</p>
                            <a
                                href={`tel:${job.employer.phone}`}
                                className="inline-flex items-center gap-2 font-medium text-green-700"
                            >
                                <Phone className="w-4 h-4" />
                                {job.employer.phone}
                            </a>
                        </Alert>
                    </div>
                )}

                {/* Actions */}
                <div className="p-6">
                    {!isAuthenticated && (
                        <div className="space-y-3">
                            <p className="text-gray-600 text-center mb-4">
                                Create a profile to apply for this job
                            </p>
                            <Link to="/register?type=worker" className="btn-primary w-full">
                                Sign Up to Apply
                            </Link>
                            <Link to="/login" className="btn-secondary w-full">
                                Already have an account? Log In
                            </Link>
                        </div>
                    )}

                    {isAuthenticated && !isOwner && (
                        <div className="space-y-3">
                            {job.hasApplied ? (
                                <div className="flex items-center justify-center gap-2 py-3">
                                    {job.applicationStatus === 'PENDING' && (
                                        <>
                                            <Clock className="w-5 h-5 text-yellow-500" />
                                            <span className="text-yellow-700 font-medium">Application pending</span>
                                        </>
                                    )}
                                    {job.applicationStatus === 'ACCEPTED' && (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <span className="text-green-700 font-medium">You're hired!</span>
                                        </>
                                    )}
                                    {job.applicationStatus === 'REJECTED' && (
                                        <>
                                            <XCircle className="w-5 h-5 text-red-500" />
                                            <span className="text-red-700 font-medium">Application not accepted</span>
                                        </>
                                    )}
                                </div>
                            ) : canApply ? (
                                <button
                                    onClick={() => setShowApplyModal(true)}
                                    className="btn-primary btn-lg w-full"
                                >
                                    Apply for This Job
                                </button>
                            ) : (
                                <p className="text-center text-gray-500">
                                    This job is no longer accepting applications
                                </p>
                            )}

                            {isAccepted && (
                                <button
                                    onClick={() => startConversationMutation.mutate()}
                                    disabled={startConversationMutation.isPending}
                                    className="btn-secondary w-full"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Message Employer
                                </button>
                            )}
                        </div>
                    )}

                    {isOwner && (
                        <div className="space-y-3">
                            <Link to={`/my-jobs`} className="btn-primary w-full">
                                Manage This Job
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Apply Modal */}
            <Modal
                isOpen={showApplyModal}
                onClose={() => setShowApplyModal(false)}
                title="Apply for This Job"
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="coverNote" className="label">
                            Message to employer (optional)
                        </label>
                        <textarea
                            id="coverNote"
                            value={coverNote}
                            onChange={(e) => setCoverNote(e.target.value)}
                            placeholder="Tell them a bit about yourself and why you'd be great for this job..."
                            className="input min-h-[100px]"
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {coverNote.length}/500 characters
                        </p>
                    </div>

                    {applyMutation.isError && (
                        <Alert type="error">
                            Failed to submit application. Please try again.
                        </Alert>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowApplyModal(false)}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => applyMutation.mutate()}
                            disabled={applyMutation.isPending}
                            className="btn-primary flex-1"
                        >
                            {applyMutation.isPending ? 'Applying...' : 'Submit Application'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
