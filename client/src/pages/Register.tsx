import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Phone, Eye, EyeOff, Users } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { Alert } from '../components/Alert'

type UserType = 'WORKER' | 'EMPLOYER' | 'BOTH'

export function Register() {
    const navigate = useNavigate()
    const { register, isAuthenticated } = useAuthStore()

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        userType: 'WORKER' as UserType,
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Redirect if already logged in
    if (isAuthenticated) {
        navigate('/jobs')
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setIsLoading(true)

        try {
            await register({
                name: formData.name,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                password: formData.password,
                userType: formData.userType,
            })
            navigate('/jobs')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const userTypeOptions = [
        { value: 'WORKER', label: 'Looking for Work', desc: 'Find jobs in your area' },
        { value: 'EMPLOYER', label: 'Hiring Workers', desc: 'Post jobs and hire' },
        { value: 'BOTH', label: 'Both', desc: 'Work and hire' },
    ]

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
            <div className="max-w-md w-full mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-gray-600 mt-2">Join the Work For All community</p>
                </div>

                <div className="card p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* User Type Selection */}
                        <div>
                            <label className="label">I am...</label>
                            <div className="grid grid-cols-3 gap-2">
                                {userTypeOptions.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, userType: option.value as UserType }))}
                                        className={`p-3 rounded-lg border-2 text-center transition-colors ${formData.userType === option.value
                                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Users className={`w-5 h-5 mx-auto mb-1 ${formData.userType === option.value ? 'text-primary-600' : 'text-gray-400'
                                            }`} />
                                        <p className="text-sm font-medium">{option.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="label">Full Name *</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your name"
                                    required
                                    className="input pl-10"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="label">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="email@example.com"
                                    className="input pl-10"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Optional - for account recovery</p>
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="label">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="(555) 123-4567"
                                    className="input pl-10"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Optional - to receive job alerts</p>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="label">Password *</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="At least 6 characters"
                                    required
                                    className="input pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="label">Confirm Password *</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Enter password again"
                                    required
                                    className="input pl-10"
                                />
                            </div>
                        </div>

                        {error && <Alert type="error">{error}</Alert>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full"
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-xs text-center text-gray-500 mt-6">
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    )
}
