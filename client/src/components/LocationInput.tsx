import { MapPin, Navigation } from 'lucide-react'
import { useState } from 'react'

interface LocationInputProps {
    onLocationSet: (location: {
        latitude: number | null
        longitude: number | null
        city: string | null
        zipCode: string | null
    }) => void
    initialCity?: string
    initialZipCode?: string
}

export function LocationInput({ onLocationSet, initialCity, initialZipCode }: LocationInputProps) {
    const [mode, setMode] = useState<'auto' | 'manual'>('auto')
    const [city, setCity] = useState(initialCity || '')
    const [zipCode, setZipCode] = useState(initialZipCode || '')
    const [isLocating, setIsLocating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const requestLocation = async () => {
        setIsLocating(true)
        setError(null)

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                })
            })

            const { latitude, longitude } = position.coords

            // Try to get city name from coordinates using a reverse geocoding service
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                )
                const data = await response.json()
                const cityName = data.address?.city || data.address?.town || data.address?.village || ''
                const zip = data.address?.postcode || ''

                onLocationSet({
                    latitude,
                    longitude,
                    city: cityName,
                    zipCode: zip,
                })
            } catch {
                // If geocoding fails, just use coordinates
                onLocationSet({
                    latitude,
                    longitude,
                    city: null,
                    zipCode: null,
                })
            }
        } catch (err: any) {
            setError(
                err.code === 1
                    ? 'Location access denied. Please enter your location manually.'
                    : 'Could not get your location. Please enter it manually.'
            )
            setMode('manual')
        } finally {
            setIsLocating(false)
        }
    }

    const handleManualSubmit = () => {
        if (!city && !zipCode) {
            setError('Please enter a city or ZIP code')
            return
        }

        onLocationSet({
            latitude: null,
            longitude: null,
            city: city || null,
            zipCode: zipCode || null,
        })
    }

    return (
        <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setMode('auto')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors
            ${mode === 'auto'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'}`}
                >
                    <Navigation className="w-5 h-5" />
                    <span className="font-medium">Use My Location</span>
                </button>
                <button
                    type="button"
                    onClick={() => setMode('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors
            ${mode === 'manual'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'}`}
                >
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">Enter Manually</span>
                </button>
            </div>

            {/* Auto location */}
            {mode === 'auto' && (
                <div className="text-center py-4">
                    <button
                        type="button"
                        onClick={requestLocation}
                        disabled={isLocating}
                        className="btn-primary btn-lg"
                    >
                        {isLocating ? (
                            <>
                                <span className="animate-spin">◌</span>
                                Getting Location...
                            </>
                        ) : (
                            <>
                                <Navigation className="w-5 h-5" />
                                Get My Location
                            </>
                        )}
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                        We'll find jobs near you
                    </p>
                </div>
            )}

            {/* Manual entry */}
            {mode === 'manual' && (
                <div className="space-y-3">
                    <div>
                        <label htmlFor="city" className="label">City</label>
                        <input
                            type="text"
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g., San Francisco"
                            className="input"
                        />
                    </div>
                    <div className="text-center text-gray-400 text-sm">or</div>
                    <div>
                        <label htmlFor="zipCode" className="label">ZIP Code</label>
                        <input
                            type="text"
                            id="zipCode"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            placeholder="e.g., 94102"
                            className="input"
                            maxLength={10}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleManualSubmit}
                        className="btn-primary w-full"
                    >
                        Continue
                    </button>
                </div>
            )}

            {/* Error message */}
            {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
            )}
        </div>
    )
}
