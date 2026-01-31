import { Star } from 'lucide-react'

interface StarRatingProps {
    rating: number
    onChange?: (rating: number) => void
    readonly?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export function StarRating({ rating, onChange, readonly = false, size = 'md' }: StarRatingProps) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    }

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => !readonly && onChange?.(star)}
                    disabled={readonly}
                    className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                    <Star
                        className={`${sizes[size]} ${star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-200 text-gray-200'
                            }`}
                    />
                </button>
            ))}
        </div>
    )
}
