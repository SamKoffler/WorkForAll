import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, ChevronRight } from 'lucide-react'
import { messagesApi } from '../lib/api'
import { LoadingPage } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { useAuthStore } from '../stores/authStore'
import type { Conversation } from '../types'

export function Messages() {
    const { user } = useAuthStore()

    const { data, isLoading, error } = useQuery({
        queryKey: ['conversations'],
        queryFn: () => messagesApi.getConversations(),
    })

    const conversations: Conversation[] = data?.data?.data?.conversations || []

    if (isLoading) {
        return <LoadingPage />
    }

    const getOtherParticipant = (conversation: Conversation) => {
        return conversation.participants.find(p => p.id !== user?.id)
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

            {error && (
                <Alert type="error" className="mb-6">
                    Failed to load messages. Please try again.
                </Alert>
            )}

            {conversations.length === 0 ? (
                <div className="card p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                    <p className="text-gray-600 mb-4">
                        When you connect with employers or workers, your conversations will appear here.
                    </p>
                    <Link to="/jobs" className="btn-primary">
                        Browse Jobs
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {conversations.map((conversation) => {
                        const otherUser = getOtherParticipant(conversation)
                        const lastMessage = conversation.messages?.[0]
                        const hasUnread = conversation._count?.messages > 0 // Simplified unread check

                        return (
                            <Link
                                key={conversation.id}
                                to={`/messages/${conversation.id}`}
                                className="block card hover:shadow-md transition-shadow"
                            >
                                <div className="p-4 flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                                            <span className="text-lg font-semibold text-primary-700">
                                                {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                                            </span>
                                        </div>
                                        {hasUnread && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-white" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <h3 className={`font-medium truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {otherUser?.name || 'Unknown User'}
                                            </h3>
                                            {lastMessage && (
                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                                                </span>
                                            )}
                                        </div>

                                        {/* Job context */}
                                        {conversation.job && (
                                            <p className="text-xs text-primary-600 truncate">
                                                Re: {conversation.job.title}
                                            </p>
                                        )}

                                        {/* Last message preview */}
                                        {lastMessage && (
                                            <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                {lastMessage.senderId === user?.id ? 'You: ' : ''}
                                                {lastMessage.content}
                                            </p>
                                        )}
                                    </div>

                                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
