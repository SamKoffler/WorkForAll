import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../stores/authStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

let socket: Socket | null = null

export function getSocket(): Socket | null {
    return socket
}

export function connectSocket(): Socket | null {
    const token = useAuthStore.getState().token

    if (!token) {
        console.log('No token, cannot connect socket')
        return null
    }

    if (socket?.connected) {
        return socket
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
    })

    socket.on('connect', () => {
        console.log('Socket connected')
    })

    socket.on('disconnect', () => {
        console.log('Socket disconnected')
    })

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
    })

    return socket
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}

export function joinConversation(conversationId: string) {
    socket?.emit('join_conversation', conversationId)
}

export function leaveConversation(conversationId: string) {
    socket?.emit('leave_conversation', conversationId)
}

export function emitTyping(conversationId: string, isTyping: boolean) {
    socket?.emit(isTyping ? 'typing_start' : 'typing_stop', conversationId)
}
