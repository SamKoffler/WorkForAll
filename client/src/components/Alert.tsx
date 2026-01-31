import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info'
    title?: string
    children: React.ReactNode
    className?: string
}

export function Alert({ type, title, children, className = '' }: AlertProps) {
    const styles = {
        success: {
            container: 'bg-green-50 border-green-200 text-green-800',
            icon: CheckCircle,
            iconColor: 'text-green-500',
        },
        error: {
            container: 'bg-red-50 border-red-200 text-red-800',
            icon: XCircle,
            iconColor: 'text-red-500',
        },
        warning: {
            container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            icon: AlertCircle,
            iconColor: 'text-yellow-500',
        },
        info: {
            container: 'bg-blue-50 border-blue-200 text-blue-800',
            icon: Info,
            iconColor: 'text-blue-500',
        },
    }

    const { container, icon: Icon, iconColor } = styles[type]

    return (
        <div className={`flex gap-3 p-4 rounded-lg border ${container} ${className}`}>
            <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
                {title && <p className="font-medium mb-1">{title}</p>}
                <div className="text-sm">{children}</div>
            </div>
        </div>
    )
}
