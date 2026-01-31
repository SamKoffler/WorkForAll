import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
    Clock, CheckCircle, XCircle, FileText,
    MapPin, DollarSign, ExternalLink, X
} from 'lucide-react'
import { applicationsApi } from '../lib/api'
import { LoadingPage } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import type { JobApplication } from '../types'

export function MyApplications() {
    const queryClient = useQueryClient()

    const { data, isLoading, error } = useQuery({
        queryKey: ['myApplications'],
        queryFn: () => applicationsApi.myApplications(),
    })

    const withdrawMutation = useMutation({
        mutationFn: (id: string) => applicationsApi.withdraw(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myApplications'] })
        },
    })

    const applications: JobApplication[] = data?.data?.data?.applications || []

    if (isLoading) {
        return <LoadingPage />
    }

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'PENDING':
                return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Pending' }
            case 'ACCEPTED':
                return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Accepted' }
            case 'REJECTED':
                return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Not Selected' }
            case 'WITHDRAWN':
                return { icon: X, color: 'text-gray-500', bg: 'bg-gray-50', label: 'Withdrawn' }
            case 'COMPLETED':
                return { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Completed' }
            default:
                return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50', label: status }
        }
    }

    const groupedApplications = {
        active: applications.filter(a => ['PENDING', 'ACCEPTED'].includes(a.status)),
        past: applications.filter(a => ['REJECTED', 'WITHDRAWN', 'COMPLETED'].includes(a.status)),
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Applications</h1>

            {error && (
                <Alert type="error" className="mb-6">
                    Failed to load applications. Please try again.
                </Alert>
            )}

            {applications.length === 0 ? (
                <div className="card p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                    <p className="text-gray-600 mb-4">
                        Start applying to jobs to track your applications here.
                    </p>
                    <Link to="/jobs" className="btn-primary">
                        Find Jobs
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Active Applications */}
                    {groupedApplications.active.length > 0 && (
                        <div>
                            <h2 className="font-semibold text-gray-900 mb-4">
                                Active ({groupedApplications.active.length})
                            </h2>
                            <div className="space-y-4">
                                {groupedApplications.active.map((application) => {
                                    const status = getStatusInfo(application.status)
                                    const StatusIcon = status.icon

                                    return (
                                        <div key={application.id} className="card">
                                            <div className={`px-4 py-2 ${status.bg} border-b flex items-center gap-2`}>
                                                <StatusIcon className={`w-4 h-4 ${status.color}`} />
                                                <span className={`text-sm font-medium ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            <div className="p-4">
                                                <Link
                                                    to={`/jobs/${application.jobId}`}
                                                    className="font-semibold text-gray-900 hover:text-primary-600 text-lg"
                                                >
                                                    {application.job?.title}
                                                </Link>

                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4 text-green-600" />
                                                        ${application.job?.payAmount}/{application.job?.payType.toLowerCase()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {application.job?.city}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-500 mt-2">
                                                    Applied {format(new Date(application.createdAt), 'MMM d, yyyy')}
                                                </p>

                                                <div className="flex items-center gap-3 mt-4">
                                                    <Link
                                                        to={`/jobs/${application.jobId}`}
                                                        className="btn-secondary btn-sm"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        View Job
                                                    </Link>

                                                    {application.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => withdrawMutation.mutate(application.id)}
                                                            disabled={withdrawMutation.isPending}
                                                            className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
                                                        >
                                                            Withdraw
                                                        </button>
                                                    )}

                                                    {application.status === 'ACCEPTED' && application.job && (
                                                        <Link
                                                            to={`/messages`}
                                                            className="btn-primary btn-sm"
                                                        >
                                                            Message Employer
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Past Applications */}
                    {groupedApplications.past.length > 0 && (
                        <div>
                            <h2 className="font-semibold text-gray-900 mb-4">
                                Past ({groupedApplications.past.length})
                            </h2>
                            <div className="space-y-3">
                                {groupedApplications.past.map((application) => {
                                    const status = getStatusInfo(application.status)
                                    const StatusIcon = status.icon

                                    return (
                                        <div key={application.id} className="card p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <Link
                                                        to={`/jobs/${application.jobId}`}
                                                        className="font-medium text-gray-900 hover:text-primary-600"
                                                    >
                                                        {application.job?.title}
                                                    </Link>
                                                    <p className="text-sm text-gray-500">
                                                        {application.job?.city} • {format(new Date(application.createdAt), 'MMM d')}
                                                    </p>
                                                </div>
                                                <span className={`flex items-center gap-1 text-sm ${status.color}`}>
                                                    <StatusIcon className="w-4 h-4" />
                                                    {status.label}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
