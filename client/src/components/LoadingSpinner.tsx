import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    }

    return (
        <Loader2 className={`animate-spin text-primary-600 ${sizes[size]} ${className}`} />
    )
}

export function LoadingPage() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
        </div>
    )
}

export function LoadingOverlay() {
    return (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <LoadingSpinner size="lg" />
        </div>
    )
}
