import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Phone } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { Alert } from '../components/Alert'

export function Login() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, isAuthenticated } = useAuthStore()

    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        password: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Get redirect path from state
    const from = location.state?.from?.pathname || '/jobs'

    // Redirect if already logged in
    if (isAuthenticated) {
        navigate(from, { replace: true })
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            await login({
                email: loginMethod === 'email' ? formData.email : undefined,
                phone: loginMethod === 'phone' ? formData.phone : undefined,
                password: formData.password,
            })
            navigate(from, { replace: true })
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid credentials. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
            <div className="max-w-md w-full mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-600 mt-2">Sign in to your account</p>
                </div>

                <div className="card p-6">
                    {/* Login Method Toggle */}
                    <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
                        <button
                            type="button"
                            onClick={() => setLoginMethod('email')}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${loginMethod === 'email'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Mail className="w-4 h-4 inline-block mr-1" />
                            Email
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginMethod('phone')}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${loginMethod === 'phone'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Phone className="w-4 h-4 inline-block mr-1" />
                            Phone
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email or Phone */}
                        {loginMethod === 'email' ? (
                            <div>
                                <label htmlFor="email" className="label">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="email@example.com"
                                        required
                                        autoComplete="email"
                                        className="input pl-10"
                                    />
                                </div>
                            </div>
                        ) : (
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
                                        required
                                        autoComplete="tel"
                                        className="input pl-10"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="label">Password</label>
                                <button type="button" className="text-xs text-primary-600 hover:text-primary-700">
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="current-password"
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

                        {error && <Alert type="error">{error}</Alert>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Guest option */}
                <div className="mt-6 text-center">
                    <Link to="/jobs" className="text-sm text-gray-600 hover:text-gray-900">
                        Continue browsing as guest →
                    </Link>
                </div>
            </div>
        </div>
    )
}
