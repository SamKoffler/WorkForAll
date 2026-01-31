import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Users, Heart, Shield, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { LocationInput } from '../components/LocationInput'

export function Welcome() {
    const navigate = useNavigate()
    const { createGuestSession, setLocation } = useAuthStore()
    const [step, setStep] = useState<'choice' | 'location'>('choice')
    const [userType, setUserType] = useState<'WORKER' | 'EMPLOYER' | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleUserTypeSelect = (type: 'WORKER' | 'EMPLOYER') => {
        setUserType(type)
        setStep('location')
    }

    const handleLocationSet = async (location: {
        latitude: number | null
        longitude: number | null
        city: string | null
        zipCode: string | null
    }) => {
        setIsLoading(true)
        try {
            // Create a guest session with location
            await createGuestSession(userType!, location)
            navigate('/jobs')
        } catch (error) {
            console.error('Failed to create session:', error)
            // Still set location and navigate
            setLocation(location)
            navigate('/jobs')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
            {/* Header */}
            <header className="py-6 px-4">
                <div className="max-w-7xl mx-auto flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-2xl text-gray-900">Work For All</span>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {step === 'choice' && (
                    <>
                        {/* Hero Section */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                                Find Local Work.<br />
                                <span className="text-primary-600">Build Your Future.</span>
                            </h1>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Connect with your community. Find real work opportunities nearby.
                                No complicated signups, just honest work.
                            </p>
                        </div>

                        {/* Choice Cards */}
                        <div className="max-w-2xl mx-auto mb-16">
                            <h2 className="text-2xl font-semibold text-center text-gray-900 mb-6">
                                What are you looking for?
                            </h2>

                            <div className="grid md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleUserTypeSelect('WORKER')}
                                    className="card-hover p-6 text-left group"
                                >
                                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                                        <Briefcase className="w-7 h-7 text-primary-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        I'm Looking for Work
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Find local jobs that match your skills. Get paid for honest work.
                                    </p>
                                    <span className="inline-flex items-center gap-2 text-primary-600 font-medium">
                                        Find Jobs <ArrowRight className="w-4 h-4" />
                                    </span>
                                </button>

                                <button
                                    onClick={() => handleUserTypeSelect('EMPLOYER')}
                                    className="card-hover p-6 text-left group"
                                >
                                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                                        <Users className="w-7 h-7 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        I'm Looking for Workers
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Find reliable help for your projects. Support your community.
                                    </p>
                                    <span className="inline-flex items-center gap-2 text-green-600 font-medium">
                                        Post a Job <ArrowRight className="w-4 h-4" />
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            <div className="text-center p-6">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Community First</h3>
                                <p className="text-sm text-gray-600">
                                    Built to help people find dignified work and build connections.
                                </p>
                            </div>

                            <div className="text-center p-6">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Trust Through Reviews</h3>
                                <p className="text-sm text-gray-600">
                                    Build your reputation with honest reviews from real people.
                                </p>
                            </div>

                            <div className="text-center p-6">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Briefcase className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Simple & Free</h3>
                                <p className="text-sm text-gray-600">
                                    No complicated signups. No hidden fees. Just work.
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {step === 'location' && (
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={() => setStep('choice')}
                            className="text-primary-600 font-medium mb-6 flex items-center gap-1"
                        >
                            ← Back
                        </button>

                        <div className="card p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {userType === 'WORKER' ? 'Find Jobs Near You' : 'Post Jobs in Your Area'}
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Share your location so we can show you relevant opportunities.
                            </p>

                            <LocationInput onLocationSet={handleLocationSet} />

                            {isLoading && (
                                <div className="text-center mt-4">
                                    <span className="text-gray-600">Setting up...</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t mt-16 py-8 px-4">
                <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} Work For All. Built with ❤️ for the community.</p>
                </div>
            </footer>
        </div>
    )
}
