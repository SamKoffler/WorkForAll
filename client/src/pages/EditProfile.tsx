import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Camera, Save } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { skillsApi } from '../lib/api'
import { SkillSelector } from '../components/SkillSelector'
import { Alert } from '../components/Alert'
import { LoadingSpinner } from '../components/LoadingSpinner'
import type { Skill } from '../types'

type TransportationType = 'WALK' | 'BIKE' | 'PUBLIC_TRANSIT' | 'CAR'

export function EditProfile() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user, updateUser } = useAuthStore()

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        bio: '',
        transportation: 'WALK' as TransportationType,
        maxTravelDistance: 5,
        skillIds: [] as string[],
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const { data: skillsData } = useQuery({
        queryKey: ['skills'],
        queryFn: () => skillsApi.list(),
    })

    const skills: Skill[] = skillsData?.data?.data?.skills || []

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                bio: user.bio || '',
                transportation: user.transportation || 'WALK',
                maxTravelDistance: user.maxTravelDistance || 5,
                skillIds: user.skills?.map((s: any) => s.id || s.skillId) || [],
            })
        }
    }, [user])

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateUser(data),
        onSuccess: () => {
            setSuccess(true)
            queryClient.invalidateQueries({ queryKey: ['user'] })
            setTimeout(() => navigate('/profile'), 1500)
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to update profile')
        },
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'maxTravelDistance' ? parseInt(value) : value,
        }))
        setError('')
        setSuccess(false)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateMutation.mutate(formData)
    }

    const transportationOptions = [
        { value: 'WALK', label: 'Walking', icon: '🚶' },
        { value: 'BIKE', label: 'Bicycle', icon: '🚲' },
        { value: 'PUBLIC_TRANSIT', label: 'Public Transit', icon: '🚌' },
        { value: 'CAR', label: 'Car', icon: '🚗' },
    ]

    if (!user) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-3xl font-bold text-primary-700">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50"
                            >
                                <Camera className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">Change profile photo</p>
                        </div>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="card p-6 space-y-4">
                    <h2 className="font-semibold text-gray-900">Basic Information</h2>

                    <div>
                        <label htmlFor="name" className="label">Full Name *</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="input"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="label">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input"
                            placeholder="email@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="label">Phone</label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            className="input"
                            placeholder="(555) 123-4567"
                        />
                    </div>

                    <div>
                        <label htmlFor="bio" className="label">Bio</label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell employers a bit about yourself..."
                            className="input min-h-[100px]"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Keep it brief - highlight your experience and reliability
                        </p>
                    </div>
                </div>

                {/* Work Preferences */}
                <div className="card p-6 space-y-4">
                    <h2 className="font-semibold text-gray-900">Work Preferences</h2>

                    <div>
                        <label htmlFor="transportation" className="label">Transportation</label>
                        <select
                            id="transportation"
                            name="transportation"
                            value={formData.transportation}
                            onChange={handleChange}
                            className="input"
                        >
                            {transportationOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.icon} {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="maxTravelDistance" className="label">
                            Maximum Travel Distance: {formData.maxTravelDistance} miles
                        </label>
                        <input
                            id="maxTravelDistance"
                            name="maxTravelDistance"
                            type="range"
                            min="1"
                            max="50"
                            value={formData.maxTravelDistance}
                            onChange={handleChange}
                            className="w-full accent-primary-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>1 mi</span>
                            <span>50 mi</span>
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div className="card p-6 space-y-4">
                    <h2 className="font-semibold text-gray-900">Skills</h2>
                    <p className="text-sm text-gray-600">
                        Select skills that match your experience. This helps match you with relevant jobs.
                    </p>
                    <SkillSelector
                        skills={skills}
                        selectedIds={formData.skillIds}
                        onChange={(skillIds) => setFormData(prev => ({ ...prev, skillIds }))}
                    />
                </div>

                {/* Alerts */}
                {error && <Alert type="error">{error}</Alert>}
                {success && <Alert type="success">Profile updated successfully!</Alert>}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="btn-secondary flex-1"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="btn-primary flex-1"
                    >
                        {updateMutation.isPending ? (
                            <>
                                <LoadingSpinner size="sm" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
