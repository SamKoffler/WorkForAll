import { Outlet, Link, useLocation } from 'react-router-dom'
import {
    Briefcase,
    User,
    MessageSquare,
    Bell,
    PlusCircle,
    Search,
    Menu,
    X,
    Home,
    FileText,
    LogOut
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { messagesApi, notificationsApi } from '../lib/api'

export function Layout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const location = useLocation()
    const { user, isAuthenticated, logout } = useAuthStore()

    // Fetch unread counts
    const { data: unreadMessages } = useQuery({
        queryKey: ['unreadMessages'],
        queryFn: () => messagesApi.unreadCount(),
        enabled: isAuthenticated,
        refetchInterval: 30000,
    })

    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationsApi.list({ unreadOnly: true }),
        enabled: isAuthenticated,
        refetchInterval: 30000,
    })

    const unreadMessageCount = unreadMessages?.data?.data?.unreadCount || 0
    const unreadNotificationCount = notifications?.data?.data?.unreadCount || 0

    useEffect(() => {
        setMobileMenuOpen(false)
    }, [location])

    const isActive = (path: string) => location.pathname === path

    const navLinks = [
        { path: '/jobs', icon: Search, label: 'Find Work' },
        ...(user?.userType === 'EMPLOYER' || user?.userType === 'BOTH' ? [
            { path: '/post-job', icon: PlusCircle, label: 'Post Job' },
            { path: '/my-jobs', icon: Briefcase, label: 'My Jobs' },
        ] : []),
        ...(user?.userType === 'WORKER' || user?.userType === 'BOTH' ? [
            { path: '/my-applications', icon: FileText, label: 'Applications' },
        ] : []),
    ]

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/jobs" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-gray-900">Work For All</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(link.path)
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <link.icon className="w-4 h-4" />
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Right side icons */}
                        <div className="flex items-center gap-2">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/messages"
                                        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                                        aria-label="Messages"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        {unreadMessageCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                                            </span>
                                        )}
                                    </Link>
                                    <Link
                                        to="/notifications"
                                        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                                        aria-label="Notifications"
                                    >
                                        <Bell className="w-5 h-5" />
                                        {unreadNotificationCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                                            </span>
                                        )}
                                    </Link>
                                    <Link
                                        to="/profile"
                                        className={`p-2 rounded-lg transition-colors
                      ${isActive('/profile')
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-gray-600 hover:bg-gray-100'}`}
                                        aria-label="Profile"
                                    >
                                        <User className="w-5 h-5" />
                                    </Link>
                                </>
                            ) : (
                                <div className="hidden md:flex items-center gap-2">
                                    <Link to="/login" className="btn-secondary btn-sm">
                                        Log In
                                    </Link>
                                    <Link to="/register" className="btn-primary btn-sm">
                                        Sign Up
                                    </Link>
                                </div>
                            )}

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t bg-white">
                        <nav className="px-4 py-2 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                    ${isActive(link.path)
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <link.icon className="w-5 h-5" />
                                    {link.label}
                                </Link>
                            ))}

                            {!isAuthenticated && (
                                <div className="pt-2 space-y-2 border-t mt-2">
                                    <Link to="/login" className="btn-secondary w-full">
                                        Log In
                                    </Link>
                                    <Link to="/register" className="btn-primary w-full">
                                        Sign Up
                                    </Link>
                                </div>
                            )}

                            {isAuthenticated && (
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Log Out
                                </button>
                            )}
                        </nav>
                    </div>
                )}
            </header>

            {/* Main content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Mobile bottom navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
                <div className="flex items-center justify-around py-2">
                    <Link
                        to="/jobs"
                        className={`flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium
              ${isActive('/jobs') ? 'text-primary-600' : 'text-gray-500'}`}
                    >
                        <Search className="w-5 h-5" />
                        <span>Jobs</span>
                    </Link>

                    {isAuthenticated && (user?.userType === 'EMPLOYER' || user?.userType === 'BOTH') && (
                        <Link
                            to="/post-job"
                            className={`flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium
                ${isActive('/post-job') ? 'text-primary-600' : 'text-gray-500'}`}
                        >
                            <PlusCircle className="w-5 h-5" />
                            <span>Post</span>
                        </Link>
                    )}

                    {isAuthenticated && (
                        <>
                            <Link
                                to="/messages"
                                className={`relative flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium
                  ${isActive('/messages') ? 'text-primary-600' : 'text-gray-500'}`}
                            >
                                <MessageSquare className="w-5 h-5" />
                                <span>Messages</span>
                                {unreadMessageCount > 0 && (
                                    <span className="absolute top-0 right-2 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                                    </span>
                                )}
                            </Link>
                            <Link
                                to="/profile"
                                className={`flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium
                  ${isActive('/profile') ? 'text-primary-600' : 'text-gray-500'}`}
                            >
                                <User className="w-5 h-5" />
                                <span>Profile</span>
                            </Link>
                        </>
                    )}

                    {!isAuthenticated && (
                        <Link
                            to="/login"
                            className="flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium text-gray-500"
                        >
                            <User className="w-5 h-5" />
                            <span>Log In</span>
                        </Link>
                    )}
                </div>
            </nav>

            {/* Spacer for bottom nav on mobile */}
            <div className="md:hidden h-16" />
        </div>
    )
}
