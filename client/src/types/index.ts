export interface User {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    userType: 'WORKER' | 'EMPLOYER' | 'BOTH'
    bio?: string | null
    avatarUrl?: string | null
    skills?: Skill[]
    hasTransportation?: boolean
    needsTransportation?: boolean
    city?: string | null
    zipCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isVerified?: boolean
    createdAt?: string
    averageRating?: number | null
    reviewCount?: number
    isGuest?: boolean
}

export interface Skill {
    id: string
    name: string
    category: string
    icon?: string
}

export interface Job {
    id: string
    title: string
    description: string
    payAmount: number
    payType: 'HOURLY' | 'DAILY' | 'FIXED'
    durationHours?: number | null
    durationDays?: number | null
    startDate: string
    endDate?: string | null
    startTime?: string | null
    latitude: number
    longitude: number
    address?: string | null
    city: string
    zipCode?: string | null
    workersNeeded: number
    workersHired: number
    providesTransportation: boolean
    status: 'OPEN' | 'FILLED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    employer: User
    employerId: string
    skills: Skill[]
    createdAt: string
    matchScore?: number
    employerRating?: number | null
    employerReviewCount?: number
    hasApplied?: boolean
    applicationStatus?: string | null
    _count?: {
        applications: number
    }
}

export interface JobApplication {
    id: string
    jobId: string
    workerId: string
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'COMPLETED'
    coverNote?: string | null
    createdAt: string
    job?: Job
    worker?: User & {
        averageRating?: number | null
        reviewCount?: number
    }
}

export interface Review {
    id: string
    rating: number
    comment?: string | null
    authorId: string
    subjectId: string
    reviewType: 'WORKER_TO_EMPLOYER' | 'EMPLOYER_TO_WORKER'
    jobId?: string | null
    createdAt: string
    author?: User
    subject?: User
}

export interface Conversation {
    id: string
    jobId?: string | null
    otherUser?: User
    lastMessage?: {
        content: string
        createdAt: string
        isFromMe: boolean
    } | null
    updatedAt: string
}

export interface Message {
    id: string
    content: string
    conversationId: string
    senderId: string
    receiverId: string
    isRead: boolean
    createdAt: string
    sender?: User
}

export interface Notification {
    id: string
    userId: string
    type: string
    title: string
    message: string
    data?: any
    isRead: boolean
    createdAt: string
}
