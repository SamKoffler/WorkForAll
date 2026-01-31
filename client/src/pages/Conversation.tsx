import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow, format, isToday } from 'date-fns'
import { ArrowLeft, Send, Briefcase } from 'lucide-react'
import { messagesApi } from '../lib/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { useAuthStore } from '../stores/authStore'
import { getSocket, connectSocket } from '../lib/socket'
import type { Conversation, Message } from '../types'

export function ConversationPage() {
    const { conversationId } = useParams<{ conversationId: string }>()
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [newMessage, setNewMessage] = useState('')

    const { data, isLoading, error } = useQuery({
        queryKey: ['conversation', conversationId],
        queryFn: () => messagesApi.getMessages(conversationId!),
        enabled: !!conversationId,
        refetchInterval: 10000,
    })

    const sendMutation = useMutation({
        mutationFn: (content: string) =>
            messagesApi.send({ conversationId: conversationId!, content }),
        onSuccess: () => {
            setNewMessage('')
            queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
        },
    })

    const conversation: Conversation | null = data?.data?.data?.conversation || null
    const messages: Message[] = conversation?.messages || []

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    useEffect(() => {
        connectSocket()
        const socket = getSocket()

        const handleNewMessage = (message: Message) => {
            if (message.conversationId === conversationId) {
                queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
            }
        }

        socket?.on('message', handleNewMessage)
        return () => {
            socket?.off('message', handleNewMessage)
        }
    }, [conversationId, queryClient])

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sendMutation.isPending) return
        sendMutation.mutate(newMessage.trim())
    }

    const getOtherParticipant = () => {
        return conversation?.participants.find(p => p.id !== user?.id)
    }

    const formatMessageTime = (date: Date) => {
        if (isToday(date)) {
            return format(date, 'h:mm a')
        }
        return format(date, 'MMM d, h:mm a')
    }

    const otherUser = getOtherParticipant()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (error || !conversation) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                <Alert type="error">
                    Failed to load conversation. Please try again.
                </Alert>
                <Link to="/messages" className="btn-secondary mt-4">
                    Back to Messages
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
                <Link to="/messages" className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>

                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-semibold text-primary-700">
                        {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                </div>

                <div className="flex-1 min-w-0">
                    <Link to={`/user/${otherUser?.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                        {otherUser?.name || 'Unknown User'}
                    </Link>
                    {conversation.job && (
                        <Link
                            to={`/jobs/${conversation.job.id}`}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600"
                        >
                            <Briefcase className="w-3 h-3" />
                            {conversation.job.title}
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-2xl mx-auto">
                        {messages.map((message, index) => {
                            const isOwn = message.senderId === user?.id
                            const showDate = index === 0 ||
                                new Date(message.createdAt).toDateString() !==
                                new Date(messages[index - 1].createdAt).toDateString()

                            return (
                                <div key={message.id}>
                                    {showDate && (
                                        <div className="text-center text-xs text-gray-500 my-4">
                                            {isToday(new Date(message.createdAt))
                                                ? 'Today'
                                                : format(new Date(message.createdAt), 'MMMM d, yyyy')}
                                        </div>
                                    )}

                                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${isOwn
                                                    ? 'bg-primary-600 text-white rounded-br-sm'
                                                    : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                            <p className={`text-xs mt-1 ${isOwn ? 'text-primary-200' : 'text-gray-400'}`}>
                                                {formatMessageTime(new Date(message.createdAt))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="bg-white border-t p-4">
                <form onSubmit={handleSend} className="max-w-2xl mx-auto flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="input flex-1"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sendMutation.isPending}
                        className="btn-primary px-4"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
                {sendMutation.isError && (
                    <p className="text-sm text-red-600 mt-2 text-center">
                        Failed to send message. Please try again.
                    </p>
                )}
            </div>
        </div>
    )
}
