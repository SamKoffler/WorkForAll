import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ArrowLeft, MapPin } from 'lucide-react'
import { jobsApi } from '../lib/api'
import { SkillSelector } from '../components/SkillSelector'
import { Alert } from '../components/Alert'
import { useAuthStore } from '../stores/authStore'

interface JobFormData {
    title: string
    description: string
    payAmount: number
    payType: 'HOURLY' | 'DAILY' | 'FIXED'
    durationHours?: number
    durationDays?: number
    startDate: string
    startTime?: string
    address?: string
    city: string
    zipCode?: string
    workersNeeded: number
    providesTransportation: boolean
}

export function PostJob() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { location, user } = useAuthStore()
    const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])

    const { register, handleSubmit, watch, formState: { errors } } = useForm<JobFormData>({
        defaultValues: {
            payType: 'HOURLY',
            workersNeeded: 1,
            providesTransportation: false,
            city: location.city || '',
            zipCode: location.zipCode || '',
        },
    })

    const payType = watch('payType')

    const mutation = useMutation({
        mutationFn: (data: JobFormData & { skillIds: string[] }) => jobsApi.create({
            ...data,
            latitude: location.latitude || 0,
            longitude: location.longitude || 0,
        }),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] })
            queryClient.invalidateQueries({ queryKey: ['myJobs'] })
            navigate(`/jobs/${response.data.data.job.id}`)
        },
    })

    const onSubmit = (data: JobFormData) => {
        mutation.mutate({
            ...data,
            skillIds: selectedSkillIds,
        })
    }

    // Redirect if not an employer
    if (user && user.userType === 'WORKER') {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <Alert type="info" title="Employer Account Required">
                    <p className="mb-4">
                        You need an employer account to post jobs. You can update your account type in your profile settings.
                    </p>
                    <button
                        onClick={() => navigate('/profile/edit')}
                        className="btn-primary btn-sm"
                    >
                        Update Profile
                    </button>
                </Alert>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a New Job</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Job Details Card */}
                <div className="card p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Job Details</h2>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="title" className="label">Job Title *</label>
                            <input
                                type="text"
                                id="title"
                                {...register('title', { required: 'Job title is required' })}
                                placeholder="e.g., Help Moving Furniture"
                                className="input"
                            />
                            {errors.title && (
                                <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="description" className="label">Description *</label>
                            <textarea
                                id="description"
                                {...register('description', { required: 'Description is required' })}
                                placeholder="Describe the job, what workers will be doing, any requirements..."
                                className="input min-h-[120px]"
                            />
                            {errors.description && (
                                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="label">Skills/Categories</label>
                            <SkillSelector
                                selectedIds={selectedSkillIds}
                                onChange={setSelectedSkillIds}
                                maxSelections={5}
                            />
                        </div>
                    </div>
                </div>

                {/* Pay & Duration Card */}
                <div className="card p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Pay & Duration</h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="payAmount" className="label">Pay Amount *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        id="payAmount"
                                        {...register('payAmount', {
                                            required: 'Pay amount is required',
                                            min: { value: 1, message: 'Must be at least $1' }
                                        })}
                                        placeholder="25"
                                        className="input pl-7"
                                        step="0.01"
                                    />
                                </div>
                                {errors.payAmount && (
                                    <p className="text-sm text-red-600 mt-1">{errors.payAmount.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="payType" className="label">Pay Type *</label>
                                <select
                                    id="payType"
                                    {...register('payType')}
                                    className="input"
                                >
                                    <option value="HOURLY">Per Hour</option>
                                    <option value="DAILY">Per Day</option>
                                    <option value="FIXED">Fixed Total</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="durationHours" className="label">Duration (hours)</label>
                                <input
                                    type="number"
                                    id="durationHours"
                                    {...register('durationHours', { min: 1 })}
                                    placeholder="4"
                                    className="input"
                                />
                            </div>

                            <div>
                                <label htmlFor="workersNeeded" className="label">Workers Needed *</label>
                                <input
                                    type="number"
                                    id="workersNeeded"
                                    {...register('workersNeeded', {
                                        required: true,
                                        min: { value: 1, message: 'Need at least 1 worker' }
                                    })}
                                    placeholder="1"
                                    className="input"
                                    min="1"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schedule Card */}
                <div className="card p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Schedule</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="label">Start Date *</label>
                            <input
                                type="date"
                                id="startDate"
                                {...register('startDate', { required: 'Start date is required' })}
                                className="input"
                                min={new Date().toISOString().split('T')[0]}
                            />
                            {errors.startDate && (
                                <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="startTime" className="label">Start Time</label>
                            <input
                                type="time"
                                id="startTime"
                                {...register('startTime')}
                                className="input"
                            />
                        </div>
                    </div>
                </div>

                {/* Location Card */}
                <div className="card p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Location</h2>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="address" className="label">Street Address</label>
                            <input
                                type="text"
                                id="address"
                                {...register('address')}
                                placeholder="123 Main St"
                                className="input"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="city" className="label">City *</label>
                                <input
                                    type="text"
                                    id="city"
                                    {...register('city', { required: 'City is required' })}
                                    placeholder="San Francisco"
                                    className="input"
                                />
                                {errors.city && (
                                    <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="zipCode" className="label">ZIP Code</label>
                                <input
                                    type="text"
                                    id="zipCode"
                                    {...register('zipCode')}
                                    placeholder="94102"
                                    className="input"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <input
                                type="checkbox"
                                id="providesTransportation"
                                {...register('providesTransportation')}
                                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="providesTransportation" className="text-gray-700">
                                <span className="font-medium">I will provide transportation</span>
                                <p className="text-sm text-gray-500">
                                    Check this if you can pick up workers or provide rides to the job site
                                </p>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Error message */}
                {mutation.isError && (
                    <Alert type="error">
                        Failed to post job. Please check your details and try again.
                    </Alert>
                )}

                {/* Submit */}
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
                        disabled={mutation.isPending}
                        className="btn-primary flex-1"
                    >
                        {mutation.isPending ? 'Posting...' : 'Post Job'}
                    </button>
                </div>
            </form>
        </div>
    )
}
