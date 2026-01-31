import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, MapPin, SlidersHorizontal } from 'lucide-react'
import { jobsApi } from '../lib/api'
import { JobCard } from '../components/JobCard'
import { LoadingPage } from '../components/LoadingSpinner'
import { useAuthStore } from '../stores/authStore'
import type { Job } from '../types'

export function JobList() {
    const { location } = useAuthStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('match')
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({
        providesTransportation: false,
        city: location.city || '',
    })

    const { data, isLoading, error } = useQuery({
        queryKey: ['jobs', location, sortBy, filters],
        queryFn: () => jobsApi.list({
            latitude: location.latitude,
            longitude: location.longitude,
            city: filters.city || undefined,
            sortBy,
            providesTransportation: filters.providesTransportation || undefined,
        }),
    })

    const jobs: Job[] = data?.data?.data?.jobs || []

    // Filter by search query
    const filteredJobs = searchQuery
        ? jobs.filter(job =>
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.skills.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : jobs

    if (isLoading) {
        return <LoadingPage />
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Find Work</h1>
                {location.city && (
                    <p className="text-gray-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Jobs near {location.city}
                    </p>
                )}
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search jobs, skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-10"
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="input w-auto"
                    >
                        <option value="match">Best Match</option>
                        <option value="date">Newest</option>
                        <option value="pay">Highest Pay</option>
                        <option value="distance">Closest</option>
                    </select>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-secondary ${showFilters ? 'bg-gray-100' : ''}`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="card p-4 mb-6">
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Location</label>
                            <input
                                type="text"
                                placeholder="City or ZIP"
                                value={filters.city}
                                onChange={(e) => setFilters(f => ({ ...f, city: e.target.value }))}
                                className="input"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="transport"
                                checked={filters.providesTransportation}
                                onChange={(e) => setFilters(f => ({ ...f, providesTransportation: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="transport" className="text-sm text-gray-700">
                                Transportation provided only
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {error ? (
                <div className="text-center py-12">
                    <p className="text-red-600 mb-4">Failed to load jobs. Please try again.</p>
                    <button onClick={() => window.location.reload()} className="btn-secondary">
                        Retry
                    </button>
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="text-center py-12 card">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600 mb-4">
                        {searchQuery
                            ? `No jobs match "${searchQuery}". Try a different search.`
                            : 'No jobs available in your area right now. Check back soon!'
                        }
                    </p>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="btn-secondary"
                        >
                            Clear Search
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <p className="text-sm text-gray-600 mb-4">
                        {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
                    </p>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredJobs.map((job) => (
                            <JobCard key={job.id} job={job} />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
