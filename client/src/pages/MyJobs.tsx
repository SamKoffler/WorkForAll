import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
    Briefcase, Users, Clock, CheckCircle, XCircle,
    ChevronDown, ChevronUp, Star, MessageSquare, Plus
} from 'lucide-react'
import { jobsApi, applicationsApi, messagesApi } from '../lib/api'
import { LoadingPage } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { Modal } from '../components/Modal'
import { StarRating } from '../components/StarRating'
import { reviewsApi } from '../lib/api'
import type { Job, JobApplication } from '../types'

export function MyJobs() {
    const queryClient = useQueryClient()
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
    const [reviewModal, setReviewModal] = useState<{
        isOpen: boolean
        workerId: string
        workerName: string
        jobId: string
    } | null>(null)
    const [reviewRating, setReviewRating] = useState(5)
    const [reviewComment, setReviewComment] = useState('')

    const { data, isLoading, error } = useQuery({
        queryKey: ['myJobs'],
        queryFn: () => jobsApi.myJobs(),
    })

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            applicationsApi.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myJobs'] })
        },
    })

    const completeMutation = useMutation({
        mutationFn: (id: string) => applicationsApi.complete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myJobs'] })
        },
    })

    const reviewMutation = useMutation({
        mutationFn: (data: any) => reviewsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myJobs'] })
            setReviewModal(null)
            setReviewRating(5)
            setReviewComment('')
        },
    })

    const jobs: (Job & { applications: JobApplication[] })[] = data?.data?.data?.jobs || []

    if (isLoading) {
        return <LoadingPage />
    }

    const handleAccept = (applicationId: string) => {
        updateStatusMutation.mutate({ id: applicationId, status: 'ACCEPTED' })
    }

    const handleReject = (applicationId: string) => {
        updateStatusMutation.mutate({ id: applicationId, status: 'REJECTED' })
    }

    const handleComplete = (applicationId: string) => {
        completeMutation.mutate(applicationId)
    }

    const handleSubmitReview = () => {
        if (!reviewModal) return
        reviewMutation.mutate({
            subjectId: reviewModal.workerId,
            jobId: reviewModal.jobId,
            rating: reviewRating,
            comment: reviewComment,
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'OPEN':
                return <span className="badge-success">Open</span>
            case 'FILLED':
                return <span className="badge-warning">Filled</span>
            case 'COMPLETED':
                return <span className="badge-primary">Completed</span>
            case 'CANCELLED':
                return <span className="badge-gray">Cancelled</span>
            default:
                return <span className="badge-gray">{status}</span>
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
                <Link to="/post-job" className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Post New Job
                </Link>
            </div>

            {error && (
                <Alert type="error" className="mb-6">
                    Failed to load jobs. Please try again.
                </Alert>
            )}

            {jobs.length === 0 ? (
                <div className="card p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                    <p className="text-gray-600 mb-4">
                        Post your first job to find workers in your area.
                    </p>
                    <Link to="/post-job" className="btn-primary">
                        Post a Job
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => {
                        const isExpanded = expandedJobId === job.id
                        const pendingApplications = job.applications.filter(a => a.status === 'PENDING')
                        const acceptedApplications = job.applications.filter(a => a.status === 'ACCEPTED')
                        const completedApplications = job.applications.filter(a => a.status === 'COMPLETED')

                        return (
                            <div key={job.id} className="card">
                                {/* Job Header */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getStatusBadge(job.status)}
                                            </div>
                                            <Link
                                                to={`/jobs/${job.id}`}
                                                className="font-semibold text-lg text-gray-900 hover:text-primary-600"
                                            >
                                                {job.title}
                                            </Link>
                                            <p className="text-sm text-gray-600 mt-1">
                                                ${job.payAmount}/{job.payType.toLowerCase()} • {job.city} • {format(new Date(job.startDate), 'MMM d')}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <Users className="w-4 h-4" />
                                                <span>{job.workersHired}/{job.workersNeeded}</span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {job._count?.applications || 0} applicant{(job._count?.applications || 0) !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Expand/Collapse button */}
                                    {job.applications.length > 0 && (
                                        <button
                                            onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                                            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 mt-3 text-sm font-medium"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <ChevronUp className="w-4 h-4" />
                                                    Hide Applications
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-4 h-4" />
                                                    View Applications ({job.applications.length})
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Applications */}
                                {isExpanded && (
                                    <div className="border-t">
                                        {/* Pending */}
                                        {pendingApplications.length > 0 && (
                                            <div className="p-4 bg-yellow-50">
                                                <h3 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    Pending ({pendingApplications.length})
                                                </h3>
                                                <div className="space-y-3">
                                                    {pendingApplications.map((app) => (
                                                        <div key={app.id} className="bg-white rounded-lg p-3">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-3">
                                                                    <Link
                                                                        to={`/user/${app.workerId}`}
                                                                        className="font-medium text-gray-900 hover:text-primary-600"
                                                                    >
                                                                        {app.worker?.name}
                                                                    </Link>
                                                                    {app.worker?.averageRating && (
                                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                                                            {app.worker.averageRating.toFixed(1)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleAccept(app.id)}
                                                                        disabled={updateStatusMutation.isPending}
                                                                        className="btn-success btn-sm"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4" />
                                                                        Accept
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleReject(app.id)}
                                                                        disabled={updateStatusMutation.isPending}
                                                                        className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                                                                    >
                                                                        <XCircle className="w-4 h-4" />
                                                                        Decline
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {app.coverNote && (
                                                                <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                                                                    "{app.coverNote}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Accepted */}
                                        {acceptedApplications.length > 0 && (
                                            <div className="p-4 bg-green-50">
                                                <h3 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Hired ({acceptedApplications.length})
                                                </h3>
                                                <div className="space-y-3">
                                                    {acceptedApplications.map((app) => (
                                                        <div key={app.id} className="bg-white rounded-lg p-3">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <Link
                                                                    to={`/user/${app.workerId}`}
                                                                    className="font-medium text-gray-900 hover:text-primary-600"
                                                                >
                                                                    {app.worker?.name}
                                                                </Link>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleComplete(app.id)}
                                                                        disabled={completeMutation.isPending}
                                                                        className="btn-primary btn-sm"
                                                                    >
                                                                        Mark Complete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Completed */}
                                        {completedApplications.length > 0 && (
                                            <div className="p-4 bg-blue-50">
                                                <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Completed ({completedApplications.length})
                                                </h3>
                                                <div className="space-y-3">
                                                    {completedApplications.map((app) => (
                                                        <div key={app.id} className="bg-white rounded-lg p-3">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <Link
                                                                    to={`/user/${app.workerId}`}
                                                                    className="font-medium text-gray-900 hover:text-primary-600"
                                                                >
                                                                    {app.worker?.name}
                                                                </Link>
                                                                <button
                                                                    onClick={() => setReviewModal({
                                                                        isOpen: true,
                                                                        workerId: app.workerId,
                                                                        workerName: app.worker?.name || 'Worker',
                                                                        jobId: job.id,
                                                                    })}
                                                                    className="btn-secondary btn-sm"
                                                                >
                                                                    <Star className="w-4 h-4" />
                                                                    Leave Review
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Review Modal */}
            <Modal
                isOpen={!!reviewModal}
                onClose={() => setReviewModal(null)}
                title={`Review ${reviewModal?.workerName}`}
            >
                <div className="space-y-4">
                    <div>
                        <label className="label">Rating</label>
                        <StarRating rating={reviewRating} onChange={setReviewRating} size="lg" />
                    </div>

                    <div>
                        <label htmlFor="comment" className="label">Comment (optional)</label>
                        <textarea
                            id="comment"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="How was your experience working with them?"
                            className="input min-h-[100px]"
                        />
                    </div>

                    {reviewMutation.isError && (
                        <Alert type="error">Failed to submit review. Please try again.</Alert>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => setReviewModal(null)}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmitReview}
                            disabled={reviewMutation.isPending}
                            className="btn-primary flex-1"
                        >
                            {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
