import React, { useState } from 'react';
import { db } from '../services/firebase';
import { User, AppView } from '../types';
import Button from './Button';
import { AppLogo } from './AppLogo';

interface AuthViewProps {
    setUser: (u: User | null) => void;
    setView: (v: AppView) => void;
    addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ setUser, setView, addToast }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            addToast('Please enter both email and password', 'error');
            return;
        }
        setLoading(true);
        try {
            let u: User | null = null;
            if (mode === 'login') {
                u = await db.login(email, password);
                addToast('Welcome back!', 'success');
            } else {
                u = await db.register(email, password);
                addToast('Account created successfully!', 'success');
            }

            if (u) {
                setUser(u);
                // Determine next view
                if (!u.username) setView(AppView.SETUP_USERNAME);
                else if (!u.collegeId) setView(AppView.SETUP_COLLEGE);
                else setView(AppView.HOME);
            }
        } catch (e: any) {
            console.error("Auth error:", e);
            const errorCode = e.code;
            let msg = e.message || 'Authentication failed';

            // Map common Firebase errors to user-friendly messages using error codes
            switch (errorCode) {
                case 'auth/user-not-found':
                    msg = 'No account found with this email. Please create an account.';
                    break;
                case 'auth/wrong-password':
                    msg = 'Incorrect password. Please try again.';
                    break;
                case 'auth/invalid-credential':
                    msg = 'Invalid email or password. Please try again.';
                    break;
                case 'auth/email-already-in-use':
                    msg = 'This email is already registered. Please login instead.';
                    break;
                case 'auth/weak-password':
                    msg = 'Password must be at least 6 characters long.';
                    break;
                case 'auth/invalid-email':
                    msg = 'Please enter a valid email address.';
                    break;
                case 'auth/too-many-requests':
                    msg = 'Too many failed attempts. Please try again later.';
                    break;
                case 'auth/network-request-failed':
                    msg = 'Network error. Please check your connection.';
                    break;
                case 'auth/user-disabled':
                    msg = 'This account has been disabled. Please contact support.';
                    break;
                case 'auth/operation-not-allowed':
                    msg = 'Email/password authentication is not enabled. Please contact support.';
                    break;
                default:
                    // Fallback to string matching if code is missing but message has info
                    if (msg.includes('Database error')) {
                        msg = 'Server error. Please try again or contact support.';
                    } else if (msg.includes('Failed to create user profile')) {
                        msg = 'Account created but profile setup failed. Please contact support.';
                    }
                    break;
            }

            addToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleAuth();
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
            {/* Sophisticated Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-[400px] animate-slide-up z-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 mb-6 rotate-1 drop-shadow-xl">
                        <AppLogo className="w-full h-full" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">UniConfess</h1>
                    <p className="text-slate-400 font-medium mt-2">Campus stories, shared anonymously.</p>
                </div>

                <div className="premium-card p-10 rounded-[2.5rem]">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">{mode === 'login' ? 'Welcome Back' : 'Join Your Campus'}</h2>
                    <div className="space-y-4">
                        <div className="relative">
                            <i className="far fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                            <input
                                type="email"
                                placeholder="Campus Email"
                                className="premium-input pl-12"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyPress={handleKeyPress}
                                autoComplete="email"
                            />
                        </div>
                        <div className="relative">
                            <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                            <input
                                type="password"
                                placeholder="Password"
                                className="premium-input pl-12"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            />
                        </div>

                        <Button
                            className="w-full py-4 text-sm font-bold rounded-2xl shadow-glow mt-4 bg-orange-600 hover:bg-orange-700 text-white transition-all active:scale-95"
                            onClick={handleAuth}
                            isLoading={loading}
                        >
                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                        </Button>

                        <div className="mt-8 text-center">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setMode(mode === 'login' ? 'signup' : 'login');
                                    setEmail('');
                                    setPassword('');
                                }}
                                className="text-slate-400 text-sm hover:text-orange-600 transition-colors font-semibold"
                            >
                                {mode === 'login' ? <span>New here? <span className="text-orange-600 underline underline-offset-4">Create Account</span></span> : <span>Already have an account? <span className="text-orange-600 underline underline-offset-4">Login</span></span>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-12 text-slate-300 text-[10px] font-bold tracking-[0.2em] uppercase">Built for Campus Privacy</p>
        </div>
    );
}
