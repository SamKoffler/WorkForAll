import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../lib/api'
import { connectSocket, disconnectSocket } from '../lib/socket'

interface User {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    userType: 'WORKER' | 'EMPLOYER' | 'BOTH'
    skills?: any[]
    hasTransportation?: boolean
    needsTransportation?: boolean
    city?: string | null
    isGuest: boolean
}

interface Location {
    latitude: number | null
    longitude: number | null
    city: string | null
    zipCode: string | null
}

interface AuthState {
    token: string | null
    user: User | null
    location: Location
    isAuthenticated: boolean
    hasLocation: boolean
    isLoading: boolean

    setLocation: (location: Location) => void
    createGuestSession: (userType: string, location: Location) => Promise<void>
    register: (data: any) => Promise<void>
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    fetchUser: () => Promise<void>
    updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            location: {
                latitude: null,
                longitude: null,
                city: null,
                zipCode: null,
            },
            isAuthenticated: false,
            hasLocation: false,
            isLoading: false,

            setLocation: (location) => {
                set({
                    location,
                    hasLocation: !!(location.latitude && location.longitude) || !!location.city || !!location.zipCode
                })
            },

            createGuestSession: async (userType, location) => {
                set({ isLoading: true })
                try {
                    const response = await authApi.guestSession({
                        userType,
                        ...location,
                    })
                    const { token, user } = response.data.data
                    set({
                        token,
                        user,
                        location,
                        isAuthenticated: true,
                        hasLocation: true,
                    })
                    connectSocket()
                } finally {
                    set({ isLoading: false })
                }
            },

            register: async (data) => {
                set({ isLoading: true })
                try {
                    const response = await authApi.register({
                        ...data,
                        ...get().location,
                        sessionToken: get().user?.isGuest ? get().token : undefined,
                    })
                    const { token, user } = response.data.data
                    set({
                        token,
                        user,
                        isAuthenticated: true,
                    })
                    connectSocket()
                } finally {
                    set({ isLoading: false })
                }
            },

            login: async (email, password) => {
                set({ isLoading: true })
                try {
                    const response = await authApi.login({ email, password })
                    const { token, user } = response.data.data
                    set({
                        token,
                        user,
                        isAuthenticated: true,
                        hasLocation: !!user.city,
                        location: {
                            latitude: user.latitude || null,
                            longitude: user.longitude || null,
                            city: user.city || null,
                            zipCode: user.zipCode || null,
                        },
                    })
                    connectSocket()
                } finally {
                    set({ isLoading: false })
                }
            },

            logout: () => {
                disconnectSocket()
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                })
            },

            fetchUser: async () => {
                const token = get().token
                if (!token) return

                try {
                    const response = await authApi.me()
                    set({ user: response.data.data.user })
                } catch (error) {
                    get().logout()
                }
            },

            updateUser: (userData) => {
                const currentUser = get().user
                if (currentUser) {
                    set({ user: { ...currentUser, ...userData } })
                }
            },
        }),
        {
            name: 'work-for-all-auth',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                location: state.location,
                isAuthenticated: state.isAuthenticated,
                hasLocation: state.hasLocation,
            }),
        }
    )
)
