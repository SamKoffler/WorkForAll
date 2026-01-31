import { Link } from 'react-router-dom'
import { MapPin, Clock, DollarSign, Users, Truck, Star } from 'lucide-react'
import { format } from 'date-fns'
import type { Job } from '../types'

interface JobCardProps {
    job: Job
}

export function JobCard({ job }: JobCardProps) {
    const formatPay = () => {
        const amount = job.payAmount.toFixed(0)
        switch (job.payType) {
            case 'HOURLY':
                return `$${amount}/hr`
            case 'DAILY':
                return `$${amount}/day`
            case 'FIXED':
                return `$${amount} total`
        }
    }

    const formatDuration = () => {
        if (job.durationHours) {
            return `${job.durationHours} hour${job.durationHours > 1 ? 's' : ''}`
        }
        if (job.durationDays) {
            return `${job.durationDays} day${job.durationDays > 1 ? 's' : ''}`
        }
        return 'Flexible'
    }

    return (
        <Link to={`/jobs/${job.id}`} className="card-hover block">
            <div className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
                            {job.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">{job.employer.name}</span>
                            {job.employer.isVerified && (
                                <span className="badge-success text-[10px]">Verified</span>
                            )}
                            {job.employerRating && (
                                <div className="flex items-center gap-0.5 text-sm text-gray-600">
                                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                    <span>{job.employerRating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Match score badge */}
                    {job.matchScore !== undefined && job.matchScore > 60 && (
                        <span className="badge-primary whitespace-nowrap">
                            {job.matchScore}% match
                        </span>
                    )}
                </div>

                {/* Description preview */}
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {job.description}
                </p>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="font-medium text-green-700">{formatPay()}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{formatDuration()}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{job.city}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>
                            {job.workersHired}/{job.workersNeeded} hired
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Transportation badge */}
                        {job.providesTransportation && (
                            <span className="badge-success flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                Transport provided
                            </span>
                        )}

                        {/* Skill tags */}
                        {job.skills.slice(0, 2).map((skill) => (
                            <span key={skill.id} className="badge-gray">
                                {skill.name}
                            </span>
                        ))}
                        {job.skills.length > 2 && (
                            <span className="text-xs text-gray-500">
                                +{job.skills.length - 2} more
                            </span>
                        )}
                    </div>

                    {/* Date */}
                    <span className="text-xs text-gray-500">
                        {format(new Date(job.startDate), 'MMM d')}
                    </span>
                </div>
            </div>
        </Link>
    )
}
