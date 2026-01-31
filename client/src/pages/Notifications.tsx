import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
    Bell, Briefcase, Star, MessageSquare, CheckCircle,
    UserPlus, AlertCircle, Check, X
} from 'lucide-react'
import { notificationsApi } from '../lib/api'
import { LoadingPage } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import type { Notification } from '../types'

export function Notifications() {
    const queryClient = useQueryClient()

    const { data, isLoading, error } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationsApi.list(),
    })

    const markReadMutation = useMutation({
        mutationFn: (id: string) => notificationsApi.markRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })

    const markAllReadMutation = useMutation({
        mutationFn: () => notificationsApi.markAllRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })

    const notifications: Notification[] = data?.data?.data?.notifications || []
    const unreadCount = notifications.filter(n => !n.read).length

    if (isLoading) {
        return <LoadingPage />
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'JOB_MATCH':
                return <Briefcase className="w-5 h-5 text-primary-600" />
            case 'APPLICATION_UPDATE':
                return <CheckCircle className="w-5 h-5 text-green-600" />
            case 'NEW_APPLICATION':
                return <UserPlus className="w-5 h-5 text-blue-600" />
            case 'NEW_REVIEW':
                return <Star className="w-5 h-5 text-yellow-500" />
            case 'NEW_MESSAGE':
                return <MessageSquare className="w-5 h-5 text-purple-600" />
            default:
                return <AlertCircle className="w-5 h-5 text-gray-600" />
        }
    }

    const getLink = (notification: Notification): string => {
        switch (notification.type) {
            case 'JOB_MATCH':
            case 'NEW_APPLICATION':
                return notification.jobId ? `/jobs/${notification.jobId}` : '/jobs'
            case 'APPLICATION_UPDATE':
                return '/my-applications'
            case 'NEW_REVIEW':
                return '/profile'
            case 'NEW_MESSAGE':
                return '/messages'
            default:
                return '/notifications'
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {error && (
                <Alert type="error" className="mb-6">
                    Failed to load notifications. Please try again.
                </Alert>
            )}

            {notifications.length === 0 ? (
                <div className="card p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-600">
                        You'll receive notifications about job matches, applications, and messages here.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`card transition-colors ${notification.read ? 'bg-white' : 'bg-blue-50'
                                }`}
                        >
                            <div className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-full ${notification.read ? 'bg-gray-100' : 'bg-white'
                                        }`}>
                                        {getIcon(notification.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <Link
                                            to={getLink(notification)}
                                            className="block group"
                                        >
                                            <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'
                                                } group-hover:text-primary-600`}>
                                                {notification.content}
                                            </p>
                                        </Link>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>

                                    {!notification.read && (
                                        <button
                                            onClick={() => markReadMutation.mutate(notification.id)}
                                            disabled={markReadMutation.isPending}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                                            title="Mark as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
