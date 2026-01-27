import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from './services/supabaseService'; // Correct import
import { onAuthStateChanged } from 'firebase/auth'; // Firebase Auth Listener
import { useClerk } from '@clerk/clerk-react'; // Keep useClerk for signOut cleanup if needed
import { supabase } from './services/supabaseClient';
import { polishConfession } from './services/geminiService';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { User, Confession, College, Message, AppView, Toast, ToastType, Comment, Notification as AppNotification, Report, Club, ClubPost, ClubChannel, ClubMessage } from './types';
import Button from './components/Button';
import AdminPanel from './components/admin/AdminPanel';
import { AppLogo } from './components/AppLogo';
import { AuthView } from './components/AuthView';
import { SetupCollegeView } from './components/SetupCollegeView';
import ConfirmModal from './components/ConfirmModal';

// Performance Optimized Imports
import ConfessionItem from './components/feed/ConfessionItem';
import CommentsSheet from './components/modals/CommentsSheet';
import ClubCommentsSheet from './components/modals/ClubCommentsSheet';
import NotificationsView from './components/views/NotificationsView';
import AdminCampusSwitcher from './components/feed/AdminCampusSwitcher';
import { GamesView } from './components/PlayZone';

const NavIcon = ({ active, icon, label, onClick, badge }: any) => (
    <button
        onClick={onClick}
        className={`w-full group relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-black uppercase tracking-widest text-[10px] ${active ? 'bg-slate-900 dark:bg-slate-800 text-amber-500 shadow-xl shadow-black/10' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
    >
        <div className={`relative z-10 text-xl w-6 flex justify-center items-center transition-all duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
            {badge > 0 && <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center font-black shadow-lg shadow-amber-500/30 animate-buzz">{badge}</span>}
        </div>
        <span className={`hidden lg:block relative z-10 transition-all duration-300`}>{label}</span>
        {active && <div className="absolute left-0 w-1 h-6 bg-amber-500 rounded-r-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>}
    </button>
);

// --- Extracted Components (Moved to separate files) ---

// --- Extracted Components ---



interface EditProfileViewProps {
    user: User;
    onSave: (updates: Partial<User>) => void;
    onCancel: () => void;
}

const ManageAccountView = ({ user, onSave, onDelete, onCancel, confirmAction }: { user: User, onSave: (updates: Partial<User>) => Promise<void>, onDelete: () => Promise<void>, onCancel: () => void, confirmAction: (title: string, msg: string, onConfirm: () => void, type?: 'danger' | 'info') => void }) => {
    const [bio, setBio] = useState(user.bio || '');
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden animate-scale-in flex flex-col border border-slate-50 dark:border-slate-800">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={onCancel} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white active:scale-95 transition-all">
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">Identity Settings</h3>
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-3 block">Display Name</label>
                        <input
                            className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all duration-300 text-sm font-bold text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            placeholder="Enter your name..."
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Personal Buzz (Bio)</label>
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-700">{bio.length}/160</span>
                        </div>
                        <textarea
                            className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[24px] px-5 py-4 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all duration-300 text-[14px] font-bold min-h-[140px] resize-none leading-relaxed text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                            placeholder="Drop a vibe about yourself..."
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            maxLength={160}
                        />
                    </div>

                    <button
                        className="w-full bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs py-5 rounded-2xl shadow-xl shadow-black/5 dark:shadow-amber-500/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                        onClick={async () => {
                            setSaving(true);
                            await onSave({ bio, displayName });
                            setSaving(false);
                        }}
                        disabled={saving}
                    >
                        {saving ? <i className="fas fa-bolt fa-spin text-amber-500 dark:text-slate-950"></i> : <i className="fas fa-check text-[10px] text-amber-500 dark:text-slate-950"></i>}
                        {saving ? 'Syncing...' : 'Update Vibe'}
                    </button>

                    <div className="pt-8 border-t border-slate-50 dark:border-slate-800">
                        <h4 className="text-rose-500 font-black text-[10px] uppercase tracking-[0.3em] mb-4">Danger Zone</h4>
                        <div className="p-6 bg-rose-50 dark:bg-rose-900/10 rounded-[28px] border border-rose-100 dark:border-rose-900/30">
                            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold leading-relaxed mb-6">
                                Proceed with caution. Deleting your account will wipe your buzzes, messages, and campus presence permanently.
                            </p>
                            <button
                                onClick={async () => {
                                    confirmAction(
                                        "Delete Account?",
                                        "ARE YOU SURE? This will permanently delete your account and all your confessions, messages, and comments. This cannot be undone.",
                                        async () => {
                                            setDeleting(true);
                                            await onDelete();
                                            setDeleting(false);
                                        },
                                        'danger'
                                    );
                                }}
                                disabled={deleting}
                                className="w-full text-white bg-rose-500 hover:bg-rose-600 text-[10px] font-black uppercase tracking-widest py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                            >
                                <i className="fas fa-trash-alt"></i>
                                {deleting ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SettingsView = ({ user, onClose, onLogout, setSubView, confirmAction }: { user: User, onClose: () => void, onLogout: () => void, setSubView: (v: 'manage' | 'avatar' | null) => void, confirmAction: (title: string, msg: string, onConfirm: () => void, type?: 'danger' | 'info') => void }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm mx-auto overflow-hidden animate-scale-in flex flex-col border border-slate-50 dark:border-slate-800">
            <div className="p-8 pb-4 flex items-center justify-between">
                <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Vibe Control</h3>
                <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 active:scale-95 transition-all outline-none">
                    <i className="fas fa-times"></i>
                </button>
            </div>

            <div className="p-6 pt-2 space-y-3">
                <button
                    onClick={() => setSubView('avatar')}
                    className="w-full flex items-center gap-4 p-5 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group outline-none"
                >
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm border border-amber-100 dark:border-amber-900/50">
                        <i className="far fa-user-circle text-xl"></i>
                    </div>
                    <div className="text-left flex-1">
                        <p className="font-black text-[13px] text-slate-900 dark:text-white uppercase tracking-wide">Avatar Preset</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Change your look</p>
                    </div>
                    <i className="fas fa-chevron-right text-slate-300 dark:text-slate-700 text-xs transition-transform group-hover:translate-x-1"></i>
                </button>

                <button
                    onClick={() => setSubView('manage')}
                    className="w-full flex items-center gap-4 p-5 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group outline-none"
                >
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-800">
                        <i className="fas fa-id-card text-xl"></i>
                    </div>
                    <div className="text-left flex-1">
                        <p className="font-black text-[13px] text-slate-900 dark:text-white uppercase tracking-wide">Identity Meta</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Bio & Security</p>
                    </div>
                    <i className="fas fa-chevron-right text-slate-300 dark:text-slate-700 text-xs transition-transform group-hover:translate-x-1"></i>
                </button>

                <button
                    onClick={() => setSubView('report')}
                    className="w-full flex items-center gap-4 p-5 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group outline-none"
                >
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm border border-slate-100 dark:border-slate-800 group-hover:text-amber-500 transition-colors">
                        <i className="fas fa-bug text-xl"></i>
                    </div>
                    <div className="text-left flex-1">
                        <p className="font-black text-[13px] text-slate-900 dark:text-white uppercase tracking-wide">Report a Problem</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Found a bug? Tell us</p>
                    </div>
                    <i className="fas fa-chevron-right text-slate-300 dark:text-slate-700 text-xs transition-transform group-hover:translate-x-1"></i>
                </button>

                <div className="pt-6 mt-4 border-t border-slate-50 dark:border-slate-800">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-4 p-5 rounded-3xl bg-rose-50/50 dark:bg-rose-900/10 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 dark:text-rose-400 transition-all group active:scale-95 border border-rose-100/50 dark:border-rose-900/30 outline-none"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-rose-500 shadow-sm border border-rose-100 dark:border-rose-900/50">
                            <i className="fas fa-power-off"></i>
                        </div>
                        <p className="font-black uppercase tracking-[0.2em] text-[10px]">End Session</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

const EditProfileView: React.FC<EditProfileViewProps> = ({ user, onSave, onCancel }) => {
    const [selectedUrl, setSelectedUrl] = useState<string>(user.avatarUrl || '');
    const seeds = ['Felix', 'Aneka', 'Zack', 'Midnight', 'Bear', 'Tech', 'Chill', 'Vibe', 'Cool', 'Snap', 'Luna', 'Max', 'Sam', 'Leo', 'Mia'];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden animate-scale-in flex flex-col border border-slate-50 dark:border-slate-800">
            <div className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={onCancel} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white active:scale-95 transition-all outline-none">
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">Identity Mask</h3>
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest pl-14">Choose your campus aesthetic</p>
            </div>

            <div className="p-8 pt-2 flex flex-col items-center space-y-10">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-[36px] p-[4px] bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rotate-3 shadow-2xl shadow-amber-500/20 group-hover:rotate-0 transition-all duration-500">
                        <div className="bg-white dark:bg-slate-950 p-[3px] rounded-[32px] w-full h-full -rotate-3 group-hover:rotate-0 transition-all duration-500">
                            <img
                                src={selectedUrl || `https://ui-avatars.com/api/?name=${user.username || 'User'}`}
                                className="w-full h-full object-cover rounded-[29px]"
                                alt="Avatar Preview"
                            />
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-slate-900 dark:bg-amber-500 text-amber-500 dark:text-slate-950 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-950">
                        <i className="fas fa-sparkles text-sm"></i>
                    </div>
                </div>

                <div className="w-full space-y-8">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-3">Custom Vibe (Image URL)</label>
                        <input
                            className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all duration-300 text-sm font-bold text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
                            placeholder="Paste custom link..."
                            value={selectedUrl}
                            onChange={e => setSelectedUrl(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4">Quick Vibe Presets</label>
                        <div className="w-full overflow-x-auto no-scrollbar py-2">
                            <div className="flex gap-4 px-1">
                                {seeds.map(s => {
                                    const url = `https://api.dicebear.com/9.x/avataaars/svg?seed=${s}&backgroundColor=f8fafc`;
                                    return (
                                        <div
                                            key={s}
                                            onClick={() => setSelectedUrl(url)}
                                            className={`w-14 h-14 flex-shrink-0 rounded-[20px] cursor-pointer transition-all duration-300 p-[3px] shadow-sm ${selectedUrl === url ? 'bg-amber-500 scale-110 shadow-amber-500/20' : 'bg-slate-100/50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105'}`}
                                        >
                                            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[17px] overflow-hidden">
                                                <img src={url} className="w-full h-full object-cover" alt={`Preset ${s}`} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex w-full gap-3 pt-4">
                    <button
                        className="flex-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black uppercase tracking-widest text-[10px] py-4.5 rounded-2xl transition-all active:scale-95 outline-none border border-transparent dark:border-slate-700"
                        onClick={onCancel}
                    >
                        Back
                    </button>
                    <button
                        className="flex-[2] bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-black uppercase tracking-widest text-[10px] py-4.5 rounded-2xl shadow-xl shadow-black/5 dark:shadow-amber-500/10 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale outline-none"
                        onClick={() => onSave({ avatarUrl: selectedUrl })}
                        disabled={!selectedUrl}
                    >
                        Apply Identity
                    </button>
                </div>
            </div>
        </div>
    );
};



interface PostViewProps {
    onPostSuccess?: (c: Confession) => void;
    user: User | null;
    adminCollegeId: string | null;
    navigateTo: (view: AppView, context?: { selectedUser?: User | null, adminTab?: any }) => void;
    goBack: () => void;
    addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    defaultVisibility?: 'campus' | 'open';
}

const ReportIssueSheet = ({ user, onClose, addToast }: { user: User, onClose: () => void, addToast: any }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setLoading(true);
        try {
            await db.createIssueReport(user.id, user.username || 'Anonymous', content);
            addToast('Bug report sent to Hive HQ! 🐝', 'success');
            onClose();
        } catch (e) {
            addToast('Failed to send report.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden animate-scale-in flex flex-col border border-slate-50 dark:border-slate-800">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white active:scale-95 transition-all">
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight text-gradient-rose">Report Problem</h3>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl mb-8 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                        Something not buzzing right? Tell us everything. Our hive engineers will investigate ASAP.
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Bug Protocol Details</label>
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-700">{content.length}/1000</span>
                        </div>
                        <textarea
                            className="w-full bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[24px] px-5 py-4 focus:bg-white dark:focus:bg-slate-950 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5 outline-none transition-all duration-300 text-[14px] font-bold min-h-[200px] resize-none leading-relaxed text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
                            placeholder="Describe the issue... (e.g. 'Feed is not loading correctly', 'Chat messages are delayed')"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            maxLength={1000}
                            autoFocus
                        />
                    </div>

                    <button
                        className="w-full bg-slate-900 dark:bg-rose-500 hover:bg-slate-800 dark:hover:bg-rose-400 text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs py-5 rounded-2xl shadow-xl shadow-black/5 dark:shadow-rose-500/10 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-30"
                        onClick={handleSubmit}
                        disabled={loading || !content.trim()}
                    >
                        {loading ? <i className="fas fa-bolt fa-spin text-amber-500 dark:text-slate-950"></i> : <i className="fas fa-paper-plane text-[10px] text-amber-500 dark:text-slate-950"></i>}
                        {loading ? 'Transmitting...' : 'Dispatch Report'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ReportModalProps {
    onClose: () => void;
    onSubmit: (reason: string) => void;
}

const PrivacyPolicyView = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 w-full h-full overflow-hidden animate-scale-in flex flex-col">
            <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
                        <i className="fas fa-shield-alt"></i>
                    </div>
                    <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">Privacy Policy</h3>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 active:scale-95 transition-all outline-none">
                    <i className="fas fa-times"></i>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-600 dark:text-slate-400">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">UniBee – Your Privacy Matters</p>
                    <p className="text-xs leading-relaxed font-bold">UniBee (“we”, “our”, “us”) respects your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use the UniBee mobile application.</p>
                </div>

                <section>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-[10px] mb-3">1. Information We Collect</h4>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-300 mb-1">a) Account Information</p>
                            <p className="text-[11px] leading-relaxed">User ID, Username, Email address (if provided), College ID, Profile details (bio, avatar)</p>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-300 mb-1">b) User Content</p>
                            <p className="text-[11px] leading-relaxed">Confessions posted by users, Comments and likes, Messages sent within the app. <span className="text-amber-500 font-bold italic">Anonymous confessions do not publicly display your identity.</span></p>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-300 mb-1">c) Device & App Information</p>
                            <p className="text-[11px] leading-relaxed">Firebase Cloud Messaging (FCM) token (for notifications), App usage data (basic analytics)</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-[10px] mb-3">2. How We Use Your Information</h4>
                    <p className="text-[11px] leading-relaxed">We use your data to: Provide core app functionality, Show confessions relevant to your college, Send notifications for new confessions, likes, or messages, Maintain app security and prevent abuse. <span className="font-black text-slate-900 dark:text-white uppercase">We do not sell your personal data.</span></p>
                </section>

                <section>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-[10px] mb-3">3. Notifications</h4>
                    <p className="text-[11px] leading-relaxed">UniBee uses Firebase Cloud Messaging (FCM) to send notifications. You can disable notifications anytime from your device settings.</p>
                </section>

                <section>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-[10px] mb-3">4. Data Storage & Security</h4>
                    <ul className="list-disc list-inside text-[11px] space-y-1">
                        <li>User data is securely stored on Supabase servers.</li>
                        <li>Notifications are handled via Firebase.</li>
                        <li>Sensitive credentials and admin keys are never exposed to users.</li>
                        <li>We take reasonable steps to protect your data, but no system is 100% secure.</li>
                    </ul>
                </section>

                <section>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-[10px] mb-3">5. Data Sharing</h4>
                    <p className="text-[11px] leading-relaxed">We do not share your personal data with third parties, except: When required by law, To comply with legal obligations.</p>
                </section>

                <section>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-[10px] mb-3">6. Children’s Privacy</h4>
                    <p className="text-[11px] leading-relaxed">UniBee is intended for users 16 years or older. We do not knowingly collect data from children under 16.</p>
                </section>

                <section>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-[10px] mb-3">7. Your Rights</h4>
                    <p className="text-[11px] leading-relaxed">You have the right to: Access your data, Update or delete your account, Request data removal. You can contact us for any privacy-related requests.</p>
                </section>

                <section>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-[10px] mb-3">8. Changes to This Policy</h4>
                    <p className="text-[11px] leading-relaxed">We may update this Privacy Policy from time to time. Any changes will be reflected on this page.</p>
                </section>

                <section>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-[10px] mb-3">9. Child Safety & CSAE Policy</h4>
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mb-2 uppercase tracking-widest">Zero Tolerance Policy</p>
                        <p className="text-[11px] leading-relaxed mb-3 font-medium text-slate-700 dark:text-slate-300">
                            Uniconfess strictly prohibits any form of <strong>Child Sexual Abuse and Exploitation (CSAE)</strong>. We are committed to maintaining a safe environment for all users.
                        </p>
                        <ul className="list-disc list-inside text-[11px] space-y-2 text-slate-600 dark:text-slate-400 mb-4">
                            <li><strong>Sexual content involving minors</strong> is strictly forbidden.</li>
                            <li><strong>Any form of exploitation, abuse, or grooming</strong> will result in an immediate permanent ban.</li>
                            <li><strong>Sharing, requesting, or promoting</strong> inappropriate content related to minors is prohibited.</li>
                        </ul>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 italic leading-relaxed">
                            Any content found violating these rules will be immediately removed. Users involved may be permanently banned and reported to relevant authorities (NCMEC/Cyber Tipline) when required.
                        </p>
                    </div>
                </section>

                <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">10. Contact Us & Reporting</p>
                    <div className="flex flex-col gap-3">
                        <p className="text-[11px] leading-relaxed">Users can report inappropriate content directly through the app using the "Report" button on any post, or by contacting us strictly for safety issues:</p>
                        <div className="flex items-center gap-2 text-primary-600 font-bold text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl w-fit">
                            <i className="far fa-envelope"></i>
                            <span>uniconfess.app@gmail.com</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-950/50">
                <button
                    onClick={onClose}
                    className="w-full bg-slate-900 dark:bg-slate-800 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-xl active:scale-95 transition-all"
                >
                    Acknowledge
                </button>
            </div>
        </div>
    );
};

const UnderConstructionView = ({ title, onClose }: { title: string, onClose: () => void }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm mx-auto overflow-hidden animate-scale-in flex flex-col border border-slate-50 dark:border-slate-800">
            <div className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-[32px] flex items-center justify-center text-amber-500 text-3xl mb-6 shadow-xl shadow-amber-500/10 rotate-3">
                    <i className="fas fa-tools"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{title}</h3>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">Under Construction</p>

                <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl mb-8 border border-slate-100 dark:border-slate-800 w-full">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
                        Our bees are working hard to build this feature! Check back soon for the campus rankings and top buzzers.
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl transition-all active:scale-95"
                >
                    Got it!
                </button>
            </div>
        </div>
    );
};

const ReportModal = ({ onClose, onSubmit }: ReportModalProps) => {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                    <i className="fas fa-flag"></i>
                </div>
                <h3 className="text-2xl font-black text-center text-slate-900 mb-2">Report Post</h3>
                <p className="text-center text-slate-500 text-sm mb-6 leading-relaxed">Help us keep the campus safe. Why are you reporting this?</p>

                <textarea
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-100 outline-none resize-none h-32 mb-6 placeholder:text-slate-400 text-slate-800"
                    placeholder="e.g., Harassment, Hate speech, Spam..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    autoFocus
                />

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                    <button
                        onClick={() => { if (reason.trim()) onSubmit(reason); }}
                        disabled={!reason.trim()}
                        className="flex-1 py-3.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        Submit Report
                    </button>
                </div>
            </div>
        </div>
    );
};

const PostView = ({ onPostSuccess, user, adminCollegeId, navigateTo, goBack, addToast, defaultVisibility = 'campus' }: PostViewProps) => {
    const [text, setText] = useState('');
    const [anon, setAnon] = useState(false);
    const [visibility, setVisibility] = useState<'campus' | 'open'>(defaultVisibility);
    const [posting, setPosting] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const charLimit = 800;
    const progress = (text.length / charLimit) * 100;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (images.length + files.length > 4) {
            addToast("Maximum 4 photos allowed", "error");
            return;
        }

        files.forEach((file: File) => {
            if (file.size > 5 * 1024 * 1024) {
                addToast(`Image ${file.name} too large (max 5MB)`, "error");
                return;
            }
            setImages(prev => [...prev, file]);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePost = async () => {
        if (!text.trim() && images.length === 0) return;
        if (!user) return;

        if (user.isBanned) {
            addToast("Restricted account. Cannot post.", "error");
            setTimeout(() => goBack(), 500);
            return;
        }

        setPosting(true);
        try {
            const imageUrls: string[] = [];
            for (const img of images) {
                const path = `confessions/${user.id}-${Date.now()}-${img.name}`;
                const url = await db.uploadFile('confessions', path, img);
                imageUrls.push(url);
            }

            const targetCollegeId = adminCollegeId || user.collegeId || 'general';
            const data = await db.createConfession(user.id, user.username || 'User', text, targetCollegeId, anon, user.avatarUrl, visibility, imageUrls);
            const newConfession = { ...data, timestamp: Number(data.timestamp), likes: [], __local: true };
            setText('');
            addToast("Confession shared!", "success");
            if (onPostSuccess) onPostSuccess(newConfession);
            setTimeout(() => goBack(), 100);
        } catch (e: any) {
            console.error('Post error:', e);
            addToast(`Failed to post: ${e.message || 'Unknown error'}`, "error");
        } finally {
            setPosting(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center p-4 sm:p-6 lg:p-8 animate-slide-up">
            <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
                {/* Simple Header */}
                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                    <button
                        onClick={goBack}
                        className="p-2 -ml-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">New Confession</h3>
                    <button
                        onClick={handlePost}
                        disabled={(!text.trim() && images.length === 0) || posting}
                        className="bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 px-5 py-2 rounded-full font-bold text-sm transition-all disabled:opacity-40 shadow-lg shadow-black/10 dark:shadow-amber-500/10"
                    >
                        {posting ? 'Sharing...' : 'Share'}
                    </button>
                </div>

                <div className="p-6">
                    {/* Identity Toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-2xl mb-6">
                        <button
                            onClick={() => setAnon(false)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${!anon ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            <img src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.username || 'U'}`} className="w-5 h-5 rounded-full" />
                            Public
                        </button>
                        <button
                            onClick={() => setAnon(true)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${anon ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <i className="fas fa-mask text-[10px]"></i>
                            Anonymous
                        </button>
                    </div>

                    <textarea
                        className="w-full min-h-[120px] bg-transparent text-base sm:text-lg font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none resize-none leading-relaxed"
                        placeholder="What's on your mind?"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        maxLength={charLimit}
                        autoFocus
                    />

                    {imagePreviews.length > 0 && (
                        <div className={`grid gap-2 mt-4 mb-6 ${imagePreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {imagePreviews.map((src, idx) => (
                                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 group">
                                    <img src={src} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all shadow-lg border border-white/20"
                                    >
                                        <i className="fas fa-times text-xs"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Character Bar */}
                    <div className="mt-4 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${progress > 90 ? 'bg-rose-500' : 'bg-amber-500'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                multiple
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={images.length >= 4}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all disabled:opacity-30 relative active:scale-90"
                            >
                                <i className="far fa-image text-xl"></i>
                                {images.length > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 animate-pop">
                                        {images.length}
                                    </span>
                                )}
                            </button>
                        </div>
                        <span className={`text-[10px] font-bold ${progress > 90 ? 'text-rose-500' : 'text-slate-400'}`}>
                            {text.length} / {charLimit}
                        </span>
                    </div>

                    {/* Visibility Selection */}
                    <div className="mt-8">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Share to</span>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setVisibility('campus')}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all ${visibility === 'campus' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200 dark:hover:border-slate-600'}`}
                            >
                                <i className="fas fa-university text-xs"></i>
                                <span className="font-bold text-[10px] sm:text-xs">My Campus</span>
                            </button>
                            <button
                                onClick={() => setVisibility('open')}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all ${visibility === 'open' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200 dark:hover:border-slate-600'}`}
                            >
                                <i className="fas fa-globe text-xs"></i>
                                <span className="font-bold text-[10px] sm:text-xs">Global Feed</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-60 text-center">
                UniConfess Safe Space • Anonymity Guaranteed
            </p>
        </div>
    );
};

interface SearchViewProps {
    user: User | null;
    setSelectedUser: (u: User) => void;
    navigateTo: (v: AppView, context?: { selectedUser?: User | null, adminTab?: any }) => void;
}

const SearchView = ({ user, setSelectedUser, navigateTo }: SearchViewProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const searchCache = useRef<Record<string, User[]>>({});

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }

        if (searchCache.current[query.toLowerCase()]) {
            setResults(searchCache.current[query.toLowerCase()]);
            return;
        }

        setLoading(true);
        const timer = setTimeout(async () => {
            const lowerQ = query.toLowerCase();
            const users = await db.searchUsers(lowerQ);
            const filtered = users.filter(u => u.id !== user?.id);

            searchCache.current[lowerQ] = filtered;
            setResults(filtered);
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, user]);

    return (
        <div className="animate-fade-in min-h-screen bg-slate-50/50">
            {/* Bright Floating Search Header */}
            <div className="sticky top-0 z-30 pt-2 px-4 pb-4 bg-gradient-to-b from-white via-white/95 to-transparent dark:from-slate-900 dark:via-slate-900/95">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-slate-100 dark:border-slate-700 overflow-hidden p-1 flex items-center transition-all focus-within:ring-2 focus-within:ring-slate-100 dark:focus-within:ring-slate-700">
                    <div className="w-10 h-10 flex items-center justify-center text-slate-400">
                        <i className="fas fa-search text-sm"></i>
                    </div>
                    <input
                        type="text"
                        className="flex-1 h-10 bg-transparent outline-none text-slate-900 dark:text-white font-medium placeholder:text-slate-400 text-sm"
                        placeholder="Search students, colleges..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {loading && <i className="fas fa-spinner animate-spin text-primary-500 mr-2"></i>}
                    {query && !loading && (
                        <button onClick={() => setQuery('')} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors">
                            <i className="fas fa-times-circle"></i>
                        </button>
                    )}
                </div>
            </div>

            <div className="px-4 pb-20 space-y-2">
                {query && results.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center opacity-60">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 text-2xl mb-4">
                            <i className="far fa-sad-tear"></i>
                        </div>
                        <p className="font-bold text-slate-700 mb-1">No results found</p>
                        <p className="text-xs text-slate-400">Try a different name or keyword</p>
                    </div>
                )}

                {!query && (
                    <div className="py-12 text-center opacity-50">
                        <i className="fas fa-search text-4xl text-slate-200 mb-3 block"></i>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type to search</p>
                    </div>
                )}

                {results.map((u, i) => (
                    <div
                        key={u.id}
                        onClick={() => { navigateTo(AppView.USER_PROFILE, { selectedUser: u }); }}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer active:scale-95 transition-all animate-stagger-up hover:shadow-sm"
                        style={{ animationDelay: `${i * 50}ms` }}
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                            <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.username || 'User'}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white text-sm truncate">{u.displayName || u.username}</span>
                                {u.isAdmin && <i className="fas fa-badge-check text-primary-500 text-[10px]"></i>}
                            </div>
                            <p className="text-slate-500 text-xs truncate font-medium">@{u.username}</p>
                        </div>
                        <i className="fas fa-chevron-right text-slate-300 text-xs"></i>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface MessagesViewProps {
    user: User | null;
    setSelectedUser: (u: User) => void;
    navigateTo: (v: AppView, context?: { selectedUser?: User | null, adminTab?: any }) => void;
    confirmAction: (title: string, message: string, onConfirm: () => void, type?: 'danger' | 'info') => void;
    campusStudents: User[];
    handleProfileClick: (userId: string, isAnonymous: boolean) => void;
}

const MessagesView = ({ user, setSelectedUser, navigateTo, confirmAction, campusStudents, handleProfileClick }: MessagesViewProps) => {
    const [inbox, setInbox] = useState<{ requests: string[], accepted: string[] }>({ requests: [], accepted: [] });
    const [profiles, setProfiles] = useState<Record<string, User>>({});
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [tab, setTab] = useState<'primary' | 'requests'>('primary');
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    const [, setTick] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(timer);
    }, []);

    const getLastActiveLabel = (timestamp?: number) => {
        if (!timestamp) return 'Offline';
        const diff = Date.now() - timestamp;
        if (diff < 5 * 60 * 1000) return 'Active now';
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    useEffect(() => {
        if (!user) return;
        const fetchInbox = async () => {
            const res = await db.getInbox(user.id);
            setInbox(res);
            const counts = await db.getUnreadCountsPerPeer(user.id);
            setUnreadCounts(counts);
            const ids = Array.from(new Set([...res.accepted, ...res.requests]));
            const profs: Record<string, User> = {};
            for (const id of ids) { const u = await db.getUser(id); if (u) profs[id] = u; }
            setProfiles(profs);
        };
        fetchInbox();
        const interval = setInterval(fetchInbox, 5000);
        return () => clearInterval(interval);
    }, [user]);

    const activeList = tab === 'primary' ? inbox.accepted : inbox.requests;

    const handleDeleteChat = (id: string, name: string) => {
        confirmAction(
            "Delete Conversation?",
            `Delete chat with ${name}? This will remove it from your inbox.`,
            async () => {
                await db.rejectChat(user!.id, id);
                setInbox(prev => ({
                    ...prev,
                    accepted: prev.accepted.filter(aid => aid !== id),
                    requests: prev.requests.filter(rid => rid !== id)
                }));
                setMenuOpenId(null);
            },
            'danger'
        );
    };

    return (
        <div className="animate-fade-in min-h-screen bg-slate-50/30 dark:bg-slate-950/30 pb-safe" onClick={() => setMenuOpenId(null)}>
            {/* Premium Glass Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="px-5 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                            <i className="fas fa-bolt text-sm"></i>
                        </div>
                        <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Bee Hub</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigateTo(AppView.SEARCH)}
                            className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95"
                        >
                            <i className="far fa-edit text-lg"></i>
                        </button>
                    </div>
                </div>

            </div>

            {/* Active Users Scroller */}
            {
                campusStudents.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 py-4 border-b border-slate-100/50 dark:border-slate-800/50">
                        <div className="px-5 mb-3 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campus Pulse</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,191,0,0.8)]"></div>
                                <span className="text-[10px] font-bold text-amber-600">Live</span>
                            </div>
                        </div>
                        <div className="flex gap-4 overflow-x-auto px-5 no-scrollbar scroll-smooth">
                            {campusStudents.map((student) => {
                                const isOnline = Date.now() - (student.lastActive || 0) < 5 * 60 * 1000;
                                return (
                                    <button
                                        key={student.id}
                                        onClick={() => handleProfileClick(student.id, false)}
                                        className="flex flex-col items-center gap-2 flex-shrink-0 group"
                                    >
                                        <div className="relative">
                                            <div className={`w-16 h-16 rounded-3xl p-[2.5px] rotate-3 group-hover:rotate-0 transition-all duration-300 ${isOnline ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-amber-500/20' : 'bg-slate-200'}`}>
                                                <div className="w-full h-full rounded-[22px] border-2 border-white overflow-hidden bg-white">
                                                    <img
                                                        src={student.avatarUrl || `https://ui-avatars.com/api/?name=${student.username || 'U'}&background=random`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                            {isOnline && (
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border shadow-sm">
                                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 tracking-tight max-w-[64px] truncate">
                                            {student.username || 'Student'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )
            }

            {/* Inbox Tabs (if requests exist) */}
            {
                inbox.requests.length > 0 && (
                    <div className="flex px-5 mt-4 mb-2 gap-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <button
                            onClick={() => setTab('primary')}
                            className={`pb-3 text-xs font-black transition-all relative uppercase tracking-widest ${tab === 'primary' ? 'text-slate-900' : 'text-slate-400'}`}
                        >
                            Conversations
                            {tab === 'primary' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-t-full shadow-[0_-2px_6px_rgba(255,191,0,0.5)]"></div>}
                        </button>
                        <button
                            onClick={() => setTab('requests')}
                            className={`pb-3 text-xs font-black transition-all relative uppercase tracking-widest ${tab === 'requests' ? 'text-slate-900' : 'text-slate-400'}`}
                        >
                            Requests
                            {inbox.requests.length > 0 && (
                                <span className="ml-2 bg-amber-500 text-black text-[9px] px-2 py-0.5 rounded-full font-black">{inbox.requests.length}</span>
                            )}
                            {tab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-t-full"></div>}
                        </button>
                    </div>
                )
            }

            {/* Conversation List */}
            <div className="px-5 py-2 space-y-1 pb-24">
                {activeList.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center text-slate-300 text-3xl mb-6">
                            <i className="far fa-comment-dots"></i>
                        </div>
                        <h3 className="font-black text-slate-900 text-lg mb-2">No Buzzes yet</h3>
                        <p className="text-slate-500 text-xs max-w-[200px] font-medium leading-relaxed">Spark a conversation by visiting a profile and sending a buzz.</p>
                        <button
                            onClick={() => navigateTo(AppView.SEARCH)}
                            className="mt-6 px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg active:scale-95 transition-all"
                        >
                            Find Students
                        </button>
                    </div>
                ) : (
                    activeList.map(id => {
                        const u = profiles[id];
                        if (!u) return null;
                        const unread = unreadCounts[id] || 0;
                        const isOnline = Date.now() - (u.lastActive || 0) < 5 * 60 * 1000;

                        return (
                            <div
                                key={id}
                                className="flex items-center gap-4 py-3.5 px-3 -mx-3 cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 transition-all group relative rounded-[2rem] hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                                onClick={() => { setSelectedUser(u); navigateTo(AppView.CHAT_DETAIL, { selectedUser: u }); }}
                            >
                                <div className="relative">
                                    <div className={`w-14 h-14 rounded-2xl border ${unread > 0 ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-100'} p-0.5 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                                        <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.username}`} className="w-full h-full object-cover rounded-[14px]" />
                                    </div>
                                    {isOnline && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className={`text-sm tracking-tight truncate ${unread > 0 ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                                            {u.displayName || u.username}
                                        </h4>
                                        <span className={`text-[9px] ${unread > 0 ? 'font-black text-amber-600' : 'font-bold text-slate-400 uppercase tracking-widest'}`}>
                                            {getLastActiveLabel(u.lastActive)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-xs truncate ${unread > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
                                            {unread > 0 ? `${unread} new buzzes` : `@${u.username}`}
                                        </p>
                                        {unread > 0 && (
                                            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-buzz shadow-[0_0_8px_rgba(255,191,0,0.6)]"></div>
                                        )}
                                    </div>
                                </div>

                                {/* Options Trigger */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === id ? null : id); }}
                                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 active:scale-90 transition-all"
                                >
                                    <i className="fas fa-ellipsis-h text-xs"></i>
                                </button>

                                {/* Dropdown */}
                                {menuOpenId === id && (
                                    <div className="absolute right-4 top-14 bg-white shadow-2xl rounded-2xl z-10 border border-slate-100 py-2 w-40 animate-scale-in origin-top-right ring-1 ring-black/5">
                                        <button
                                            className="w-full text-left px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors uppercase tracking-widest"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteChat(id, u.username); }}
                                        >
                                            <i className="far fa-trash-alt mr-2"></i> Delete Chat
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div >
    );
};

interface ChatDetailViewProps {
    user: User | null;
    selectedUser: User | null;
    goBack: () => void;
    navigateTo: (v: AppView, context?: { selectedUser?: User | null, adminTab?: any }) => void;
    onMessagesRead?: () => void;
    confirmAction: (title: string, message: string, onConfirm: () => void, type?: 'danger' | 'info') => void;
}

const ChatDetailView = ({ user, selectedUser, goBack, navigateTo, onMessagesRead, confirmAction }: ChatDetailViewProps) => {
    const [msgText, setMsgText] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [isRequest, setIsRequest] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [activeMsgId, setActiveMsgId] = useState<string | null>(null);

    const handleUnsend = async (msgId: string) => {
        try {
            await db.unsendMessage(msgId);
            setMessages(prev => prev.filter(m => m.id !== msgId));
            setActiveMsgId(null);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (!user) return;
        if (selectedUser) setIsBlocked(user.blockedUsers?.includes(selectedUser.id) || false);

        const fetchMsgs = async () => {
            if (!selectedUser) return;
            const msgs = await db.getMessages(user.id, selectedUser.id);
            setMessages(msgs);
            await db.markAsRead(user.id, selectedUser.id);
            const inbox = await db.getInbox(user.id);
            setIsRequest(inbox.requests.includes(selectedUser.id));
            if (onMessagesRead) onMessagesRead();
        };

        fetchMsgs();

        let sub: any;
        if (selectedUser) {
            sub = db.subscribeToMessages(user.id, (event, payload) => {
                if (event === 'INSERT') {
                    const newMsg = payload as Message;
                    if (newMsg.senderId === selectedUser.id) {
                        setMessages(prev => {
                            if (prev.find(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                        db.markAsRead(user.id, selectedUser.id);
                        if (onMessagesRead) onMessagesRead();
                    }
                } else if (event === 'DELETE') {
                    const { id } = payload as { id: string };
                    setMessages(prev => prev.filter(m => m.id !== id));
                }
            });
        }

        const interval = setInterval(fetchMsgs, 10000);
        return () => { sub?.unsubscribe(); clearInterval(interval); };
    }, [user?.id, selectedUser?.id, user?.blockedUsers]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSend = async (overrideTxt?: string) => {
        const txt = overrideTxt || msgText;
        if (!txt.trim() || !user || !selectedUser || isBlocked) return;

        if (!overrideTxt) setMsgText('');

        const tempId = 'temp-' + Date.now();
        const optimisticMsg: Message = {
            id: tempId,
            senderId: user.id,
            receiverId: selectedUser.id,
            content: txt,
            timestamp: Date.now(),
            read: false
        };

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            await db.sendMessage(user.id, selectedUser.id, txt);
        } catch (e: any) {
            setMessages(prev => prev.filter(m => m.id !== tempId)); // remove optimistic on fail
        }
    };

    const handleBlock = async () => {
        if (!user || !selectedUser) return;
        if (isBlocked) {
            await db.unblockUser(user.id, selectedUser.id);
            setIsBlocked(false);
        } else {
            confirmAction(
                "Block User?",
                `Block ${selectedUser.displayName || selectedUser.username}? You won't see messages from each other.`,
                async () => {
                    await db.blockUser(user.id, selectedUser.id);
                    setIsBlocked(true);
                },
                'danger'
            );
        }
    };

    if (!selectedUser) return null;
    const targetName = selectedUser.displayName || selectedUser.username;
    const targetAvatar = selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${selectedUser.username}`;

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 fixed inset-0 z-50 lg:relative lg:inset-auto animate-fade-in">
            {/* Premium Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-4 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <button onClick={goBack} className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white transition-all active:scale-90 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full">
                        <i className="fas fa-chevron-left text-lg"></i>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <img src={targetAvatar} className="w-full h-full object-cover" />
                        </div>
                        <div className="leading-tight">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">{targetName}</h4>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Active Buzz</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleBlock} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 ${isBlocked ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <i className={`fas ${isBlocked ? 'fa-user-slash' : 'fa-info-circle'}`}></i>
                    </button>
                </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 pb-32 scrollbar-hide">
                <div className="flex flex-col items-center py-8 mb-4">
                    <div className="w-20 h-20 rounded-[2.5rem] border-4 border-white shadow-xl overflow-hidden mb-4">
                        <img src={targetAvatar} className="w-full h-full object-cover" />
                    </div>
                    <h5 className="font-black text-slate-900 text-lg">{targetName}</h5>
                    <p className="text-slate-400 text-xs font-bold mb-4">India · Engineering</p>
                    <button
                        onClick={() => navigateTo(AppView.USER_PROFILE, { selectedUser })}
                        className="px-6 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        View Profile
                    </button>
                </div>

                {isBlocked && (
                    <div className="bg-rose-50/50 text-rose-600 p-6 rounded-[2rem] text-center text-sm font-black mb-4 border border-rose-100 animate-shake">
                        <i className="fas fa-ban mb-2 text-xl block"></i>
                        Student blocked. Unblock to continue the buzz.
                    </div>
                )}

                {isRequest && !isBlocked && (
                    <div className="border border-amber-100 p-8 rounded-[2.5rem] text-center mb-8 mx-2 bg-amber-50 shadow-xl shadow-amber-500/5 animate-slide-up">
                        <div className="w-12 h-12 bg-amber-500 text-black rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl shadow-lg shadow-amber-500/20">
                            <i className="fas fa-bolt"></i>
                        </div>
                        <p className="font-black text-slate-900 text-xl mb-2 tracking-tight">Incoming Buzz!</p>
                        <p className="text-slate-500 text-xs mb-6 font-medium leading-relaxed">{selectedUser.username} wants to spark a conversation with you.</p>
                        <div className="flex gap-3">
                            <button className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white text-slate-500 border border-slate-200 active:scale-95 transition-all" onClick={async () => { await db.rejectChat(user!.id, selectedUser.id); goBack(); }}>Ignore</button>
                            <button className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-amber-500 text-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all" onClick={async () => { await db.acceptChat(user!.id, selectedUser.id); setIsRequest(false); }}>Accept Buzz</button>
                        </div>
                    </div>
                )}

                {messages.map((m, idx) => {
                    const isMe = m.senderId === user?.id;
                    return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in mb-1`}>
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                <div
                                    onClick={() => setActiveMsgId(activeMsgId === m.id ? null : m.id)}
                                    className={`px-5 py-3.5 rounded-[26px] text-sm leading-relaxed cursor-pointer transition-all active:scale-95 shadow-sm relative ${isMe
                                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 rounded-tr-md font-black'
                                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-md border border-slate-100 dark:border-slate-700 font-bold'
                                        }`}
                                >
                                    {m.content}
                                </div>
                                {isMe && activeMsgId === m.id && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleUnsend(m.id); }}
                                        className="text-[9px] font-bold uppercase tracking-widest text-rose-500 mt-2 bg-white px-3 py-1.5 rounded-full animate-scale-in border border-rose-50 shadow-sm"
                                    >
                                        <i className="far fa-trash-alt mr-2"></i> Delete Message
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} className="h-4"></div>
            </div>

            {/* Input Bar */}
            {!isRequest && !isBlocked && (
                <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 pb-safe fixed bottom-0 left-0 right-0 z-40 md:absolute">
                    <div className="max-w-4xl mx-auto flex gap-3 items-center">
                        <div className="flex-1 flex gap-3 items-center bg-slate-100/60 dark:bg-slate-800/60 rounded-[2rem] px-5 py-2 ring-1 ring-slate-200/50 dark:ring-slate-700/50 focus-within:ring-amber-500/30 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
                            <button className="text-slate-400 hover:text-amber-500 transition-colors">
                                <i className="far fa-smile text-lg"></i>
                            </button>
                            <input
                                className="flex-1 bg-transparent border-none outline-none text-[15px] py-1.5 placeholder:text-slate-400 font-bold text-slate-900 dark:text-white"
                                placeholder="Write a buzz..."
                                value={msgText}
                                onChange={e => setMsgText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                            />
                            {msgText.trim() ? (
                                <button onClick={() => handleSend()} className="text-amber-600 font-black text-xs uppercase tracking-widest px-2 animate-scale-in">
                                    Send
                                </button>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleSend('⚡')}
                                        className="text-amber-500 hover:scale-125 transition-transform active:scale-90 p-1"
                                    >
                                        <i className="fas fa-bolt text-lg"></i>
                                    </button>
                                    <button
                                        onClick={() => handleSend('❤️')}
                                        className="text-rose-500 hover:scale-125 transition-transform active:scale-90 p-1"
                                    >
                                        <i className="fas fa-heart text-lg"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


interface UserListSheetProps {
    title: string;
    userIds: string[];
    onClose: () => void;
    onUserClick: (id: string) => void;
}

const CreateClubModal = ({ user, targetCollegeId, onClose, onSuccess, addToast }: { user: User, targetCollegeId: string, onClose: () => void, onSuccess: () => void, addToast: any }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [visibility, setVisibility] = useState<'campus' | 'global'>('campus');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!targetCollegeId) {
            addToast('Club creation failed: College undefined', 'error');
            return;
        }

        if (!name.trim() || !description.trim()) {
            addToast('Please fill all fields', 'error');
            return;
        }
        setLoading(true);
        try {
            await db.createClub(user.id, name.trim(), description.trim(), targetCollegeId, isPrivate, visibility);
            addToast('Club created successfully! 🐝', 'success');
            onSuccess();
        } catch (e: any) {
            console.error("Error creating club:", e);
            addToast(`Failed: ${e.message || 'Unknown error'}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-md p-8 relative border border-slate-100 dark:border-slate-800 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight text-gradient-amber">Birth a Club</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Start your own hive</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center active:scale-90 transition-all">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Club Name</label>
                        <input
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                            placeholder="e.g. Coding Wizards"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Description</label>
                        <textarea
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] px-5 py-4 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 min-h-[120px] resize-none"
                            placeholder="What's the buzz about?"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs font-black text-slate-900 dark:text-white block">Club Visibility</span>
                                <span className="text-[10px] font-bold text-slate-400">{visibility === 'campus' ? 'Only your university' : 'Entire world can join'}</span>
                            </div>
                            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-inner">
                                <button
                                    onClick={() => setVisibility('campus')}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${visibility === 'campus' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'}`}
                                >
                                    Campus
                                </button>
                                <button
                                    onClick={() => setVisibility('global')}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${visibility === 'global' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400'}`}
                                >
                                    World
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
                            <div>
                                <span className="text-xs font-black text-slate-900 dark:text-white block">Private Club</span>
                                <span className="text-[10px] font-bold text-slate-400">Owner must approve members</span>
                            </div>
                            <button
                                onClick={() => setIsPrivate(!isPrivate)}
                                className={`w-12 h-7 rounded-full transition-all relative ${isPrivate ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${isPrivate ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full bg-slate-900 text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl shadow-xl shadow-black/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <i className="fas fa-bolt fa-spin text-amber-500"></i> : <i className="fas fa-plus text-amber-500"></i>}
                        {loading ? 'Creating...' : 'Create Club'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ClubsView = ({ user, navigateTo, confirmAction, addToast, goBack, adminCollegeId }: { user: User, navigateTo: (v: AppView, ctx?: any) => void, confirmAction: any, addToast: any, goBack: () => void, adminCollegeId: string | null }) => {
    const [tab, setTab] = useState<'my' | 'campus' | 'world'>('my');
    const [clubs, setClubs] = useState<Club[]>([]);
    const [myClubs, setMyClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const targetCollegeId = adminCollegeId || user.collegeId;

    const fetchClubs = useCallback(async () => {
        if (!targetCollegeId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const allClubs = await db.getClubs(targetCollegeId);
            const userClubs = await db.getUserClubs(user.id);
            setClubs(allClubs);
            setMyClubs(userClubs);
        } catch (e) {
            addToast('Failed to load clubs', 'error');
        } finally {
            setLoading(false);
        }
    }, [user.id, targetCollegeId, addToast]);

    useEffect(() => {
        fetchClubs();
    }, [fetchClubs]);

    const activeClubs = (() => {
        let filtered: Club[] = [];
        if (tab === 'my') {
            filtered = myClubs;
        } else if (tab === 'campus') {
            filtered = clubs.filter(c => c.visibility === 'campus' && c.collegeId === targetCollegeId);
        } else if (tab === 'world') {
            filtered = clubs.filter(c => c.visibility === 'global');
        }
        return filtered.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    })();

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 animate-fade-in pb-20 lg:pb-0">
            {/* Professional Glass Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-6 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            Active Hives
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Campus Communities</p>
                    </div>

                    <button
                        onClick={() => targetCollegeId ? setShowCreateModal(true) : addToast('Campus not identified', 'error')}
                        className="group flex items-center gap-2 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-lg shadow-black/10 dark:shadow-amber-500/10 active:scale-95 transition-all"
                    >
                        <i className="fas fa-plus text-xs group-hover:rotate-90 transition-transform"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Found Hive</span>
                    </button>
                </div>

                {/* Modern Search & Filter */}
                <div className="flex flex-col gap-4">
                    <div className="relative group">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 transition-colors group-focus-within:text-amber-500"></i>
                        <input
                            type="text"
                            placeholder="Find your community..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-900/50 border border-transparent dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/20 transition-all"
                        />
                    </div>

                    <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setTab('my')}
                            className={`flex-1 min-w-[80px] px-4 py-2.5 rounded-[12px] text-[9px] font-black uppercase tracking-widest transition-all ${tab === 'my' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-amber-500 shadow-sm' : 'text-slate-400 dark:text-slate-600'}`}
                        >
                            Joined
                        </button>
                        <button
                            onClick={() => setTab('campus')}
                            className={`flex-1 min-w-[80px] px-4 py-2.5 rounded-[12px] text-[9px] font-black uppercase tracking-widest transition-all ${tab === 'campus' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-amber-500 shadow-sm' : 'text-slate-400 dark:text-slate-600'}`}
                        >
                            Campus
                        </button>
                        <button
                            onClick={() => setTab('world')}
                            className={`flex-1 min-w-[80px] px-4 py-2.5 rounded-[12px] text-[9px] font-black uppercase tracking-widest transition-all ${tab === 'world' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-amber-500 shadow-sm' : 'text-slate-400 dark:text-slate-600'}`}
                        >
                            World
                        </button>
                    </div>
                </div>
            </div>

            {/* Clubs Grid */}
            <div className="px-6 py-8">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 animate-pulse"></div>
                        ))}
                    </div>
                ) : activeClubs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-700 text-2xl mb-6 ring-1 ring-slate-200/50 dark:ring-slate-800">
                            <i className="fas fa-compass"></i>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">No Hives Found</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">Adjust your search or founder a new one!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeClubs.map((club, idx) => (
                            <button
                                key={club.id}
                                onClick={() => navigateTo(AppView.CLUB_DETAIL, { clubId: club.id })}
                                className="group relative bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 hover:border-amber-500/20 rounded-[2.5rem] p-4 flex items-center gap-4 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5 active:scale-[0.98] animate-stagger-up"
                                style={{ animationDelay: `${idx * 40}ms` }}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-14 h-14 rounded-[20px] overflow-hidden border-2 border-white dark:border-slate-800 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                        <img src={club.avatarUrl} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center text-[8px] text-white">
                                        <i className="fas fa-check"></i>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-black text-[14px] text-slate-900 dark:text-white truncate uppercase tracking-tight">{club.name}</h3>
                                        {club.isPrivate && <i className="fas fa-lock text-[10px] text-slate-300 dark:text-slate-700"></i>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md">
                                            {club.memberCount} Members
                                        </span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1.5 ${club.visibility === 'global' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                            <i className={`fas ${club.visibility === 'global' ? 'fa-globe' : 'fa-building-columns'} text-[8px]`}></i>
                                            {club.visibility === 'global' ? 'World' : 'Campus'}
                                        </span>
                                        {club.ownerId === user.id && (
                                            <span className="text-[8px] font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-widest">You Lead</span>
                                        )}
                                    </div>
                                </div>

                                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:bg-amber-500 group-hover:text-amber-950 transition-all">
                                    <i className="fas fa-chevron-right text-[10px]"></i>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateClubModal
                    user={user}
                    targetCollegeId={targetCollegeId || ''}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { setShowCreateModal(false); fetchClubs(); }}
                    addToast={addToast}
                />
            )}
        </div>
    );
};

const ClubDetailView = ({ user, clubId, goBack, addToast, confirmAction, onReply }: { user: User, clubId: string, goBack: () => void, addToast: any, confirmAction: any, onReply: (id: string) => void }) => {
    const [club, setClub] = useState<Club | null>(null);
    const [members, setMembers] = useState<User[]>([]);
    const [posts, setPosts] = useState<ClubPost[]>([]);
    const [postContent, setPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [isAnonPost, setIsAnonPost] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showMembers, setShowMembers] = useState(false);
    const [requests, setRequests] = useState<User[]>([]);
    const [requestStatus, setRequestStatus] = useState<'none' | 'pending'>('none');
    const [viewMode, setViewMode] = useState<'buzz' | 'chat'>('chat'); // Fixed to chat
    const [channels, setChannels] = useState<ClubChannel[]>([]);
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ClubMessage[]>([]);
    const [msgContent, setMsgContent] = useState('');
    const [isSendingMsg, setIsSendingMsg] = useState(false);
    const [activeMsgId, setActiveMsgId] = useState<string | null>(null);
    const [showClubInfo, setShowClubInfo] = useState(false); // For WhatsApp-style group info
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const c = await db.getClub(clubId);
            if (c) {
                setClub(c);
                const mems = await db.getClubMembers(clubId);
                setMembers(mems);

                const isMem = mems.some(m => m.id === user.id);
                setIsMember(isMem);

                if (c.ownerId === user.id) {
                    const reqs = await db.getClubJoinRequests(clubId);
                    setRequests(reqs);
                }
            }
        } catch (e) {
            console.error("Error fetching club data:", e);
        } finally {
            setLoading(false);
        }
    }, [clubId, user.id]);

    const fetchChannels = useCallback(async () => {
        if (!isMember) return;
        try {
            let chs = await db.getClubChannels(clubId);

            // Auto-repair: If no channels exist and user is owner OR if it's general club, create #general
            if (chs.length === 0 && (club?.ownerId === user.id || club?.isPrivate === false)) {
                console.log('No channels found, creating #general for club:', clubId);
                const gen = await db.createClubChannel(clubId, 'general', 'General discussion', true);
                chs = [gen];
            }

            setChannels(chs);

            // Set active channel if none selected or current one no longer exists
            if (chs.length > 0) {
                // Force select first channel if none active
                if (!activeChannelId) {
                    setActiveChannelId(chs[0].id);
                } else if (!chs.find(c => c.id === activeChannelId)) {
                    setActiveChannelId(chs[0].id);
                }
            }
        } catch (e) {
            console.error("Error fetching channels:", e);
        }
    }, [clubId, isMember, activeChannelId, club?.ownerId, club?.isPrivate, user.id]);

    const fetchMessages = useCallback(async (channelId: string) => {
        try {
            const msgs = await db.getClubMessages(channelId);
            setMessages(msgs);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (e) {
            console.error("Error fetching messages:", e);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Helper to check pending status specifically
    useEffect(() => {
        const checkStatus = async () => {
            // Quick dirty check for pending status if not member
            if (!isMember && club?.isPrivate) {
                // We don't have a direct method yet.
                // Let's add it or infer. 
                // Actually, let's just use getClubJoinRequests if we are owner. 
                // If we are USER, we don't know. 
                // Let's assume for now the user remembers. 
                // Or better, add `getJoinRequestStatus` to service.
                const status = await db.checkClubStatus(user.id, clubId);
                if (status === 'pending') {
                    setRequestStatus('pending');
                }
            }
        }
        checkStatus();
    }, [isMember, club, user.id, clubId]);

    useEffect(() => {
        if (isMember) fetchChannels();
    }, [isMember, fetchChannels]);

    // Realtime channel messages
    useEffect(() => {
        if (isMember && activeChannelId) {
            fetchMessages(activeChannelId);
            const sub = db.subscribeToClubMessages(activeChannelId, (event, data) => {
                if (event === 'INSERT') {
                    setMessages(prev => {
                        if (prev.find(m => m.id === data.id)) return prev;
                        return [...prev, data];
                    });
                    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                } else if (event === 'DELETE') {
                    setMessages(prev => prev.filter(m => m.id !== data.id));
                }
            });
            return () => sub.unsubscribe();
        }
    }, [activeChannelId, isMember, fetchMessages]);


    const handleJoin = async () => {
        try {
            // Check if private
            const status = club?.isPrivate ? 'pending' : 'active';
            await db.joinClub(user.id, clubId, status);

            if (status === 'pending') {
                addToast('Request sent to Captain! 🔒', 'success');
                setRequestStatus('pending');
            } else {
                addToast('Joined the club! 🐝', 'success');
                fetchData();
            }
        } catch (e) {
            addToast('Already requested or joined', 'info');
            setRequestStatus('pending'); // Assume duplicate means pending
        }
    };

    const handleLeave = async () => {
        confirmAction(
            "Leave Club?",
            "Are you sure you want to exit this hive?",
            async () => {
                try {
                    await db.leaveClub(user.id, clubId);
                    addToast('Left the club', 'info');
                    fetchData();
                } catch (e) {
                    addToast('Failed to leave', 'error');
                }
            }
        );
    };

    const handleDeleteClub = async () => {
        confirmAction(
            "Delete Club?",
            "Are you sure you want to delete this hive? This action cannot be undone.",
            async () => {
                try {
                    await db.deleteClub(clubId);
                    addToast('Club deleted successfully', 'success');
                    goBack();
                } catch (e) {
                    console.error("Failed to delete club:", e);
                    addToast('Failed to delete club', 'error');
                }
            },
            'danger'
        );
    };

    const handleApprove = async (targetUserId: string) => {
        try {
            await db.approveJoinRequest(clubId, targetUserId);
            addToast('Member approved', 'success');
            fetchData();
        } catch (e) { addToast('Failed to approve', 'error'); }
    };

    const handleReject = async (targetUserId: string) => {
        try {
            await db.rejectJoinRequest(clubId, targetUserId);
            addToast('Request rejected', 'info');
            fetchData();
        } catch (e) { addToast('Failed to reject', 'error'); }
    };

    const handleRemoveMember = async (targetUserId: string, name: string) => {
        confirmAction(
            "Remove Member?",
            `Are you sure you want to remove ${name} from the club?`,
            async () => {
                try {
                    await db.removeClubMember(clubId, targetUserId);
                    addToast('Member removed', 'success');
                    fetchData();
                } catch (e) {
                    addToast('Failed to remove member', 'error');
                }
            },
            'danger'
        );
    };

    const handlePost = async () => {
        if (!postContent.trim()) {
            addToast('Content cannot be empty', 'info');
            return;
        }
        setIsPosting(true);
        console.log('Sending post to club:', clubId);
        try {
            await db.createClubPost(user.id, user.username || 'User', clubId, postContent, isAnonPost, user.avatarUrl);
            setPostContent('');
            addToast('Buzz posted to the hive! 🐝', 'success');
        } catch (e: any) {
            console.error('Club post error:', e);
            addToast(`Failed to post: ${e.message || 'Unknown error'}`, 'error');
        } finally {
            setIsPosting(false);
        }
    };

    const handleLikePost = async (postId: string) => {
        try {
            await db.toggleClubPostLike(postId, user.id);
        } catch (e) { }
    };

    const handleDeletePost = async (postId: string) => {
        confirmAction(
            "Delete Post?",
            "This will remove the buzz forever.",
            async () => {
                try {
                    await db.deleteClubPost(postId);
                    addToast('Post removed', 'info');
                } catch (e) { addToast('Failed to delete', 'error'); }
            }
        );
    };

    const handleSendMessage = async () => {
        if (!msgContent.trim()) {
            addToast('Message cannot be empty', 'info');
            return;
        }
        if (!activeChannelId) {
            addToast('No active channel selected', 'error');
            return;
        }
        setIsSendingMsg(true);
        console.log('Sending message to channel:', activeChannelId);
        try {
            await db.sendClubMessage(activeChannelId, user.id, user.username || 'User', msgContent, user.avatarUrl);
            setMsgContent('');
        } catch (e: any) {
            console.error('Chat message error:', e);
            addToast(`Failed to send: ${e.message || 'Unknown error'}`, 'error');
        } finally {
            setIsSendingMsg(false);
        }
    };

    const handleCreateChannel = async () => {
        const name = prompt("Enter channel name (e.g. random):");
        if (!name) return;
        const cleanName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        try {
            await db.createClubChannel(clubId, cleanName);
            fetchChannels();
            addToast(`Channel #${cleanName} created`, 'success');
        } catch (e) {
            addToast('Failed to create channel', 'error');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full opacity-40">
            <i className="fas fa-bolt fa-spin text-4xl text-amber-500 mb-4"></i>
            <p className="font-bold uppercase tracking-widest text-[10px]">Syncing Hive...</p>
        </div>
    );

    if (!club) return <div className="p-10 text-center font-bold text-slate-400 uppercase tracking-widest h-screen flex flex-col justify-center items-center gap-4 bg-white"><i className="fas fa-search text-3xl opacity-20"></i> Club not found</div>;

    const isOwner = club.ownerId === user.id;

    return (
        <div className="flex flex-col h-[calc(100dvh-64px)] lg:h-full bg-slate-50 dark:bg-slate-900 animate-fade-in relative z-[60] overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-[70] bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                    <button onClick={goBack} className="w-10 h-10 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <div
                        onClick={() => isMember && setShowClubInfo(true)}
                        className={`flex items-center gap-3 cursor-pointer min-w-0 transition-opacity ${isMember ? 'active:opacity-70' : ''}`}
                    >
                        <div className="w-10 h-10 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm">
                            <img src={club.avatarUrl} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate leading-tight">{club.name}</h4>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                {isMember ? `${members.length} Members Online` : 'Locked Group'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => { fetchData(); fetchChannels(); }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 active:scale-95 transition-all"
                    >
                        <i className="fas fa-redo-alt text-xs"></i>
                    </button>
                    <button
                        onClick={() => setShowClubInfo(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 active:scale-95 transition-all"
                    >
                        <i className="fas fa-info-circle text-sm"></i>
                    </button>
                </div>
            </div>

            {/* Main Chat Interface */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 relative overflow-hidden">
                {!isMember ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-200 dark:text-slate-700">
                            <i className="fas fa-lock text-4xl"></i>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Private Group</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-sm font-bold text-center max-w-xs leading-relaxed mb-8">
                            Join this club to start buzzing with other members in this group!
                        </p>
                        <button
                            onClick={handleJoin}
                            className="w-full max-w-sm bg-amber-500 text-slate-900 font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                        >
                            {requestStatus === 'pending' ? 'Request Sent...' : 'Request to Join'}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col no-scrollbar">
                            {!activeChannelId ? (
                                <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                                    <i className="fas fa-circle-notch fa-spin text-2xl text-amber-500"></i>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="mx-auto my-auto bg-white/60 dark:bg-slate-900/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">
                                        Messages are end-to-end encrypted for your safety.
                                    </p>
                                </div>
                            ) : (
                                messages.map((m, idx) => {
                                    const isMe = m.userId === user.id;
                                    const showAvatar = idx === 0 || messages[idx - 1].userId !== m.userId;
                                    const isActive = activeMsgId === m.id;

                                    return (
                                        <div key={m.id} className={`flex gap-3 animate-fade-in ${isMe ? 'flex-row-reverse' : ''}`}>
                                            {!isMe && (
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden shadow-sm" style={{ opacity: showAvatar ? 1 : 0 }}>
                                                    <img src={m.userAvatar || `https://ui-avatars.com/api/?name=${m.username}`} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                {!isMe && showAvatar && (
                                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">
                                                        {m.username}
                                                    </span>
                                                )}
                                                <div
                                                    onClick={() => isMe && setActiveMsgId(isActive ? null : m.id)}
                                                    className={`px-4 py-3 rounded-[24px] text-[15px] font-medium shadow-sm border cursor-pointer transition-all active:scale-[0.98] hover:shadow-md ${isMe ? 'bg-slate-900 border-slate-900 text-white rounded-tr-[4px]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-[4px]'}`}>
                                                    {m.content}
                                                    <div className="flex justify-end mt-1.5 -mb-0.5">
                                                        <span className={`text-[8px] font-black uppercase tracking-widest ${isMe ? 'text-white/40' : 'text-slate-400'}`}>
                                                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isMe && isActive && (
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            confirmAction(
                                                                "Delete Message?",
                                                                "Remove this message for everyone?",
                                                                async () => {
                                                                    try {
                                                                        await db.deleteClubMessage(m.id);
                                                                        setMessages(prev => prev.filter(msg => msg.id !== m.id));
                                                                        setActiveMsgId(null);
                                                                    } catch (e) {
                                                                        addToast('Failed to delete', 'error');
                                                                    }
                                                                }
                                                            );
                                                        }}
                                                        className="text-[9px] font-bold uppercase tracking-widest text-rose-500 mt-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full animate-scale-in border border-rose-50 dark:border-rose-900/30 shadow-sm"
                                                    >
                                                        <i className="far fa-trash-alt mr-2"></i> Delete Message
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={scrollRef} />
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-end gap-3 pb-safe">
                            <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-3xl px-4 py-2 flex items-end gap-3 border border-slate-200 dark:border-slate-800 focus-within:border-amber-500/50 transition-all">
                                <textarea
                                    value={msgContent}
                                    onChange={(e) => setMsgContent(e.target.value.substring(0, 800))}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Buzz with your hive..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold py-2 text-slate-800 dark:text-white resize-none max-h-32 min-h-[40px]"
                                    rows={1}
                                    maxLength={800}
                                />
                            </div>
                            <button
                                onClick={handleSendMessage}
                                disabled={!msgContent.trim() || isSendingMsg}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all text-white ${msgContent.trim() ? 'bg-slate-900 dark:bg-slate-800 text-amber-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}
                            >
                                <i className={`fas ${isSendingMsg ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'} text-lg`}></i>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Group Info Modal - Slack Replacement */}
            {showClubInfo && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowClubInfo(false)}></div>
                    <div className="bg-white dark:bg-slate-950 w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] sm:rounded-[40px] rounded-t-[40px] relative animate-slide-up flex flex-col overflow-hidden shadow-2xl border-t border-slate-100 dark:border-slate-800">
                        {/* Club Identity */}
                        <div className="relative h-60 flex-shrink-0">
                            <img src={club.avatarUrl} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute top-6 left-6 flex items-center gap-4">
                                <button onClick={() => setShowClubInfo(false)} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/20">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="absolute bottom-6 left-8 right-8">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{club.name}</h3>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">{members.length} Members in the Hive</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                            <div className="mb-8">
                                <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Mission Objective</h5>
                                <p className="text-slate-900 dark:text-white font-bold leading-relaxed">{club.description || 'No detailed mission protocols set yet.'}</p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hive Members</h5>
                                    {isOwner && requests.length > 0 && (
                                        <div className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-md animate-pulse uppercase">
                                            {requests.length} New Requests
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {members.map(m => (
                                        <div key={m.id} className="flex items-center gap-4 p-2 rounded-2xl">
                                            <img src={m.avatarUrl || `https://ui-avatars.com/api/?name=${m.username}`} className="w-10 h-10 rounded-xl object-cover bg-slate-100" />
                                            <div className="flex-1">
                                                <p className="font-black text-sm text-slate-900 dark:text-white tracking-tight">{m.displayName || m.username}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.id === club.ownerId ? 'Captain' : 'Member'}</p>
                                            </div>
                                            {isOwner && m.id !== user.id && (
                                                <button onClick={() => handleRemoveMember(m.id, m.displayName || m.username || 'User')} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                                    <i className="fas fa-user-minus text-xs"></i>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pending for Captain */}
                            {isOwner && requests.length > 0 && (
                                <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                                    <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">Pending Access</h5>
                                    <div className="space-y-3">
                                        {requests.map(req => (
                                            <div key={req.id} className="flex items-center gap-3">
                                                <img src={req.avatarUrl} className="w-9 h-9 rounded-xl object-cover" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-xs text-slate-900 dark:text-white truncate">{req.displayName || req.username}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleReject(req.id)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center"><i className="fas fa-times text-xs"></i></button>
                                                    <button onClick={() => handleApprove(req.id)} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center"><i className="fas fa-check text-xs"></i></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!isOwner ? (
                                <button onClick={handleLeave} className="w-full py-4 text-rose-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 border border-rose-100 dark:border-rose-900/30 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950 transition-all">
                                    <i className="fas fa-sign-out-alt"></i> Leave Group
                                </button>
                            ) : (
                                <button onClick={handleDeleteClub} className="w-full py-4 text-rose-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 border border-rose-100 dark:border-rose-900/30 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950 transition-all mt-4">
                                    <i className="fas fa-trash-alt"></i> Delete Group
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const UserListSheet = ({ title, userIds, onClose, onUserClick }: UserListSheetProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const profiles: User[] = [];
            for (const id of userIds) {
                const u = await db.getUser(id);
                if (u) profiles.push(u);
            }
            setUsers(profiles);
            setLoading(false);
        };
        fetchUsers();
    }, [userIds]);

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up relative flex flex-col max-h-[80vh] border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-10">
                    <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">{title}</h3>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                        <i className="fas fa-times text-sm"></i>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <i className="fas fa-circle-notch animate-spin text-amber-500 text-2xl"></i>
                            <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-600 tracking-widest">Finding matches...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center opacity-60">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 text-2xl mb-4">
                                <i className="far fa-user"></i>
                            </div>
                            <p className="font-bold text-slate-700 dark:text-slate-300">No users found</p>
                        </div>
                    ) : (
                        users.map((u, i) => (
                            <div
                                key={u.id}
                                onClick={() => { onUserClick(u.id); onClose(); }}
                                className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all rounded-3xl animate-stagger-up group"
                                style={{ animationDelay: `${i * 40}ms` }}
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-50 dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
                                    <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.username}`} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-slate-900 dark:text-white text-sm truncate">{u.displayName || u.username}</span>
                                        {u.isAdmin && <i className="fas fa-badge-check text-amber-500 text-[10px]"></i>}
                                    </div>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs truncate font-medium">@{u.username}</p>
                                </div>
                                <i className="fas fa-chevron-right text-slate-200 dark:text-slate-800 text-xs transition-transform group-hover:translate-x-1"></i>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

interface ProfileViewProps {
    user: User;
    setUser: (u: User | null) => void;
    navigateTo: (v: AppView, context?: { selectedUser?: User | null, adminTab?: any }) => void;
    confessions: Confession[];
    colleges: College[];
    onDelete: (confession: Confession) => void;
    onLike: (id: string, undo?: boolean) => void;
    onAccountDelete: () => Promise<void>;
    onUpdateProfile: (updates: Partial<User>) => Promise<void>;
    confirmAction: (title: string, msg: string, onConfirm: () => void, type?: 'danger' | 'info') => void;
    onProfileClick: (userId: string, isAnonymous: boolean) => void;
    addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    onReport: (id: string) => void;
}

const ProfileView = ({ user, setUser, navigateTo, confessions, colleges, onDelete, onLike, onAccountDelete, onUpdateProfile, confirmAction, onProfileClick, addToast, onReport }: ProfileViewProps) => {
    const [userPosts, setUserPosts] = useState<Confession[]>([]);
    const [tab, setTab] = useState<'Posts' | 'Replies' | 'Likes'>('Posts');
    const [showSettings, setShowSettings] = useState(false);
    const [settingsView, setSettingsView] = useState<'manage' | 'avatar' | 'report' | null>(null);
    const [listModal, setListModal] = useState<{ title: string; ids: string[] } | null>(null);

    const collegeName = colleges.find(c => c.id === user.collegeId)?.name || 'Campus Student';

    useEffect(() => {
        const fetch = async () => {
            const data = await db.getConfessionsByUser(user.id);
            setUserPosts(data);
        };
        fetch();
    }, [user.id]);

    return (
        <div className="bg-white dark:bg-slate-950 min-h-screen pb-safe animate-fade-in">
            {/* Premium Profile Header */}
            <div className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-30 flex items-center justify-between px-5 h-16 border-b border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 dark:bg-amber-500 rounded-lg flex items-center justify-center text-white dark:text-slate-950">
                        <i className="fas fa-bolt text-xs text-amber-500 dark:text-slate-950"></i>
                    </div>
                    <h1 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">{user.username}</h1>
                </div>

                <div className="flex items-center gap-2">
                    {user.isAdmin && (
                        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-amber-200 dark:border-amber-900/50">
                            <i className="fas fa-badge-check text-[10px]"></i>
                            <span className="text-[9px] font-black uppercase tracking-widest">Admin</span>
                        </div>
                    )}
                    <button onClick={() => setShowSettings(true)} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-90">
                        <i className="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>

            {/* Profile Content Wrapper */}
            <div className="pt-8 pb-10 px-6">
                <div className="flex flex-col items-center text-center">
                    {/* Avatar with UniBuzz Squircle styling */}
                    <div className="relative mb-6">
                        <div className="w-28 h-28 rounded-[32px] p-[3px] bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rotate-3 shadow-2xl shadow-amber-500/20">
                            <div className="bg-white dark:bg-slate-950 p-[3px] rounded-[29px] w-full h-full -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                <img
                                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username || 'User'}`}
                                    className="w-full h-full object-cover rounded-[26px]"
                                />
                            </div>
                        </div>
                        {user.isAdmin && (
                            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[10px] w-7 h-7 flex items-center justify-center rounded-2xl border-4 border-white dark:border-slate-950 shadow-lg animate-buzz">
                                <i className="fas fa-bolt"></i>
                            </div>
                        )}
                    </div>

                    {/* Identify Info */}
                    <div className="mb-6">
                        <h2 className="font-black text-2xl text-slate-900 dark:text-white mb-2 tracking-tight">{user.displayName || user.username}</h2>
                        <div className="flex items-center gap-2 justify-center">
                            <span className="px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                                <i className="fas fa-university mr-1.5 text-amber-500"></i>
                                {collegeName}
                            </span>
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="max-w-xs mb-8">
                        <p className="text-[14px] text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
                            {user.bio || 'Student at ' + collegeName + '. ⚡'}
                        </p>
                    </div>

                    {/* Stats Dashboard - Instagram Style but Modern */}
                    <div className="grid grid-cols-3 gap-8 w-full max-w-sm px-4 mb-8">
                        <button className="flex flex-col items-center group transition-all" onClick={() => setTab('Posts')}>
                            <span className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-none mb-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-500">{userPosts.length}</span>
                            <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">Buzzes</span>
                        </button>
                        <button className="flex flex-col items-center group transition-all" onClick={() => setListModal({ title: 'Followers', ids: user.followers || [] })}>
                            <span className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-none mb-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-500">{(user.followers || []).length}</span>
                            <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">Students</span>
                        </button>
                        <button className="flex flex-col items-center group transition-all" onClick={() => setListModal({ title: 'Following', ids: user.following || [] })}>
                            <span className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-none mb-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-500">{(user.following || []).length}</span>
                            <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">Following</span>
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 w-full max-w-sm">
                        <button
                            onClick={() => { setSettingsView(null); setShowSettings(true); }}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest py-3.5 rounded-2xl transition-all active:scale-95 border border-transparent dark:border-slate-700"
                        >
                            Edit Profile
                        </button>
                        {(user.isAdmin || user.email === 'admin@yug.com') && (
                            <button
                                onClick={() => navigateTo(AppView.ADMIN)}
                                className="w-14 bg-slate-900 dark:bg-amber-500 text-amber-500 dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 flex items-center justify-center rounded-2xl transition-all shadow-lg shadow-black/5 dark:shadow-amber-500/10 active:scale-95"
                            >
                                <i className="fas fa-shield-alt"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="sticky top-16 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-20 border-b border-slate-50 dark:border-slate-800 flex px-2 h-14 items-center">
                <button
                    onClick={() => setTab('Posts')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative h-full ${tab === 'Posts' ? 'text-slate-900 dark:text-white opacity-100' : 'text-slate-400 dark:text-slate-600 opacity-60'}`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">My Buzzes</span>
                    {tab === 'Posts' && <div className="absolute bottom-0 w-12 h-[3px] bg-amber-500 rounded-t-full"></div>}
                </button>
                <div className="w-[1px] h-4 bg-slate-100 dark:bg-slate-800"></div>
                <button
                    onClick={() => setTab('Likes')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative h-full ${tab === 'Likes' ? 'text-slate-900 dark:text-white opacity-100' : 'text-slate-400 dark:text-slate-600 opacity-60'}`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">Liked</span>
                    {tab === 'Likes' && <div className="absolute bottom-0 w-12 h-[3px] bg-amber-500 rounded-t-full"></div>}
                </button>
            </div>

            {listModal && (
                <UserListSheet
                    title={listModal.title}
                    userIds={listModal.ids}
                    onClose={() => setListModal(null)}
                    onUserClick={(id) => onProfileClick(id, false)}
                />
            )}

            {showSettings && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}>
                    {settingsView === null && (
                        <SettingsView
                            user={user}
                            onClose={() => setShowSettings(false)}
                            setSubView={setSettingsView}
                            onLogout={async () => {
                                await db.logout();
                                window.location.reload();
                            }}
                            confirmAction={confirmAction}
                        />
                    )}
                    {settingsView === 'avatar' && (
                        <EditProfileView
                            user={user}
                            onSave={async (updates) => {
                                await onUpdateProfile(updates);
                                setSettingsView(null);
                            }}
                            onCancel={() => setSettingsView(null)}
                        />
                    )}
                    {settingsView === 'manage' && (
                        <ManageAccountView
                            user={user}
                            onSave={async (updates) => {
                                await onUpdateProfile(updates);
                                setSettingsView(null);
                            }}
                            onDelete={onAccountDelete}
                            onCancel={() => setSettingsView(null)}
                            confirmAction={confirmAction}
                        />
                    )}
                    {settingsView === 'report' && (
                        <ReportIssueSheet
                            user={user}
                            onClose={() => setSettingsView(null)}
                            addToast={addToast}
                        />
                    )}
                </div>
            )}

            <div className="space-y-4">
                {userPosts.length === 0 ? (
                    <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 border-dashed">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-700 text-2xl">
                            <i className="far fa-newspaper"></i>
                        </div>
                        <p className="text-slate-900 dark:text-white font-bold">No posts yet</p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">When you share a confession, it will appear here.</p>
                    </div>
                ) : (
                    userPosts.map(c => (
                        <div key={c.id}>
                            <ConfessionItem
                                confession={c}
                                currentUser={user}
                                onDelete={onDelete}
                                onLike={onLike}
                                onReply={() => { }}
                                onProfileClick={onProfileClick}
                                onReport={onReport}
                                hideSocials={true}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

interface UserProfileViewProps {
    selectedUser: User;
    currentUser: User | null;
    setSelectedUser: (u: User | null) => void;
    navigateTo: (v: AppView, context?: { selectedUser?: User | null, adminTab?: any }) => void;
    addToast: (msg: string, type?: 'success' | 'error') => void;
    confessions: Confession[];
    colleges: College[];
    onFollow: (id: string) => void;
    onProfileClick: (userId: string, isAnonymous: boolean) => void;
    onReport: (id: string) => void;
    goBack: () => void;
}

const UserProfileView = ({ selectedUser, currentUser, setSelectedUser, navigateTo, addToast, confessions: _, colleges, onFollow, onProfileClick, onReport, goBack }: UserProfileViewProps) => {
    const [userPosts, setUserPosts] = useState<Confession[]>([]);
    const [listModal, setListModal] = useState<{ title: string; ids: string[] } | null>(null);

    const isFollowing = currentUser?.following?.includes(selectedUser.id);
    const isMe = currentUser?.id === selectedUser.id;
    const collegeName = colleges.find(c => c.id === selectedUser.collegeId)?.name || 'Campus Student';

    useEffect(() => {
        const fetch = async () => {
            const data = await db.getConfessionsByUser(selectedUser.id);
            const filtered = data.filter(c => !c.isAnonymous || (currentUser && currentUser.id === c.userId));
            setUserPosts(filtered);
        };
        fetch();
    }, [selectedUser.id, currentUser]);

    return (
        <div className="bg-white dark:bg-slate-950 min-h-screen pb-safe animate-fade-in fixed inset-0 z-50 overflow-y-auto">
            {/* Top Navigation */}
            <div className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-30 flex items-center justify-between px-4 h-16 border-b border-slate-50 dark:border-slate-800">
                <button onClick={goBack} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-90">
                    <i className="fas fa-chevron-left text-lg"></i>
                </button>
                <div className="flex items-center gap-2">
                    <h1 className="font-black text-[13px] text-slate-900 dark:text-white tracking-tight uppercase">@{selectedUser.username}</h1>
                    {selectedUser.isAdmin && <i className="fas fa-badge-check text-amber-500 text-xs"></i>}
                </div>
                <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-90">
                    <i className="fas fa-ellipsis-h"></i>
                </button>
            </div>

            {/* Profile Header */}
            <div className="pt-10 pb-12 px-6 flex flex-col items-center">
                <div className="relative mb-6">
                    <div className="w-28 h-28 rounded-[32px] p-[3.5px] bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rotate-3 shadow-2xl shadow-amber-500/20">
                        <div className="bg-white dark:bg-slate-950 p-[3px] rounded-[29px] w-full h-full -rotate-3">
                            <img
                                src={selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${selectedUser.username || 'User'}`}
                                className="w-full h-full object-cover rounded-[26px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="text-center mb-6">
                    <h2 className="font-black text-2xl text-slate-900 dark:text-white mb-2 tracking-tight">
                        {selectedUser.displayName || selectedUser.username}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ring-1 ring-slate-100 dark:ring-slate-800">
                        <i className="fas fa-university text-[9px] text-amber-500"></i>
                        {collegeName}
                    </span>
                </div>

                <div className="max-w-xs text-center mb-8">
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed italic">
                        "{selectedUser.bio || 'Sharing the campus secrets... ⚡'}"
                    </p>
                </div>

                {/* Interaction Section */}
                <div className="flex flex-col gap-6 w-full max-w-sm">
                    {/* Stats Bar */}
                    <div className="grid grid-cols-2 gap-px bg-slate-100/50 dark:bg-slate-800 rounded-3xl p-1">
                        <div className="bg-white dark:bg-slate-900 rounded-l-[18px] py-4 flex flex-col items-center shadow-sm">
                            <span className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{(selectedUser.followers || []).length}</span>
                            <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest mt-0.5">Students</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-r-[18px] py-4 flex flex-col items-center shadow-sm">
                            <span className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{(selectedUser.following || []).length}</span>
                            <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest mt-0.5">Following</span>
                        </div>
                    </div>

                    <div className="flex gap-2.5">
                        <button
                            onClick={() => onFollow(selectedUser.id)}
                            className={`flex-[2] py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${isFollowing
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-none border border-transparent dark:border-slate-700'
                                : 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20'
                                }`}
                        >
                            {isFollowing ? 'Following' : 'Follow Student'}
                        </button>
                        {!isMe && (
                            <button
                                onClick={() => navigateTo(AppView.CHAT_DETAIL, { selectedUser })}
                                className="flex-1 py-4 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 rounded-2xl flex items-center justify-center transition-all active:scale-95 hover:bg-slate-800 dark:hover:bg-amber-400 shadow-lg shadow-black/10 dark:shadow-amber-500/10"
                            >
                                <i className="fas fa-bolt text-amber-500 dark:text-slate-950 text-sm"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Public Content */}
            <div className="border-t border-slate-50 dark:border-slate-800 mt-4">
                <div className="flex h-16 items-center border-b border-slate-50 dark:border-slate-800 px-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">Public Buzzes</span>
                </div>
                {userPosts.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-[24px] flex items-center justify-center text-slate-200 dark:text-slate-800 text-2xl mb-4 border border-transparent dark:border-slate-800">
                            <i className="far fa-ghost"></i>
                        </div>
                        <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest">Secrets remain hidden...</p>
                    </div>
                ) : (
                    userPosts.map(c => (
                        <ConfessionItem
                            key={c.id}
                            confession={c}
                            currentUser={currentUser}
                            onLike={() => Promise.resolve()}
                            onDelete={() => Promise.resolve()}
                            onReply={() => { }}
                            onProfileClick={() => { }}
                            onReport={onReport}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

interface LayoutProps {
    children: React.ReactNode;
    user: User | null;
    view: AppView | null;
    setView: (v: AppView) => void;
    navigateTo: (v: AppView, context?: { selectedUser?: User | null, adminTab?: any }) => void;
    unreadMsgCount: number;
    unreadNotifCount: number;
    adminCollegeId: string | null;
    addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    onPostSuccess: (c: Confession) => void;
    darkMode: boolean;
    toggleDarkMode: () => void;
    onReportProblem: () => void;
    onShowPrivacyPolicy: () => void;
    onShowLeaderboard: () => void;
}


const Layout = ({ children, user, view, setView, navigateTo, unreadMsgCount, unreadNotifCount, adminCollegeId, addToast, onPostSuccess, darkMode, toggleDarkMode, onReportProblem, onShowPrivacyPolicy, onShowLeaderboard }: LayoutProps) => {
    const { signOut } = useClerk();
    if (!user) return <>{children}</>;

    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center text-slate-900">
            {/* Desktop Sidebar - UniBuzz Style */}
            <aside className="hidden lg:flex flex-col w-[300px] h-screen border-r border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 z-20 px-8 py-10 sticky top-0">
                <div className="mb-12 flex items-center gap-4 px-2">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20 rotate-3 transition-transform hover:rotate-0">
                        <i className="fas fa-bolt text-black text-xl"></i>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-black text-2xl tracking-tight text-slate-900 dark:text-white leading-none">UniBee</h1>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mt-1">Campus Pulse</span>
                    </div>
                </div>

                {/* Desktop Search Bar */}
                <div className="mb-8 px-2">
                    <div className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all group">
                        <i className="fas fa-search text-slate-400 text-sm group-focus-within:text-amber-500 transition-colors"></i>
                        <input
                            className="bg-transparent border-none outline-none text-xs w-full placeholder:text-slate-400 font-bold text-slate-900 dark:text-white"
                            placeholder="Find students..."
                            readOnly
                            onClick={() => navigateTo(AppView.SEARCH)}
                        />
                    </div>
                </div>
                <nav className="space-y-3 flex-1">
                    <NavIcon active={view === AppView.HOME} icon={<i className="fas fa-house"></i>} label="Safe Feed" onClick={() => navigateTo(AppView.HOME)} />
                    <NavIcon active={view === AppView.CLUBS} icon={<i className="fas fa-users"></i>} label="Clubs" onClick={() => navigateTo(AppView.CLUBS)} />
                    <NavIcon active={view === AppView.GAMES} icon={<i className="fas fa-gamepad"></i>} label="Play Zone" onClick={() => navigateTo(AppView.GAMES)} />

                    <NavIcon active={view === AppView.MESSAGES} icon={<i className="fas fa-message"></i>} label="Bee Hub" onClick={() => navigateTo(AppView.MESSAGES)} badge={unreadMsgCount} />
                    <NavIcon active={view === AppView.PROFILE} icon={<i className="fas fa-user"></i>} label="My Identity" onClick={() => navigateTo(AppView.PROFILE)} />
                    {(user.isAdmin || user.email === 'admin@yug.com') && (
                        <NavIcon active={view === AppView.ADMIN} icon={<i className="fas fa-shield-halved"></i>} label="Control Center" onClick={() => navigateTo(AppView.ADMIN)} />
                    )}
                </nav>

                <div className="mt-auto px-2 space-y-2">
                    <button
                        onClick={toggleDarkMode}
                        className="w-full py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 transition-all font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95"
                    >
                        <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                        {darkMode ? 'Light Mode' : 'Night Mode'}
                    </button>
                    <button
                        onClick={async () => { await db.logout(); window.location.reload(); }}
                        className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95"
                    >
                        <i className="fas fa-power-off"></i>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="w-full lg:w-[600px] min-h-screen relative border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 pb-20 lg:pb-0">

                {/* Mobile Top Navigation - Hidden for detailed views */}
                {!([AppView.CLUB_DETAIL, AppView.CHAT_DETAIL, AppView.USER_PROFILE, AppView.ADMIN, AppView.POST, AppView.CLUBS].includes(view as any)) && (
                    <div className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-50 dark:border-slate-800 px-5 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setDrawerOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-900 active:scale-95 transition-all">
                                <i className="fas fa-bars"></i>
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20 rotate-3">
                                    <i className="fas fa-bolt text-black text-xs"></i>
                                </div>
                                <h1 className="font-black text-xl tracking-tight text-slate-900 dark:text-white">UniBee</h1>
                            </div>
                        </div>

                        {/* Top Search Bar (Mobile/Tablet) */}
                        <div className="hidden sm:flex flex-1 max-w-sm mx-4">
                            <div className="w-full bg-slate-100/60 dark:bg-slate-800/60 rounded-xl px-4 py-2 flex items-center gap-3 ring-1 ring-slate-200/50 dark:ring-slate-700/50 focus-within:ring-amber-500/30 transition-all">
                                <i className="fas fa-search text-slate-400 text-xs"></i>
                                <input
                                    className="bg-transparent border-none outline-none text-xs w-full placeholder:text-slate-400 font-bold text-slate-900 dark:text-white"
                                    placeholder="Search campus..."
                                    onClick={() => navigateTo(AppView.SEARCH)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => navigateTo(AppView.SEARCH)} className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-900 active:scale-95 transition-all">
                                <i className="fas fa-search"></i>
                            </button>
                            <button onClick={() => navigateTo(AppView.NOTIFICATIONS)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-900 active:scale-95 transition-all relative">
                                <i className={unreadNotifCount > 0 ? "fas fa-heart text-rose-500" : "fas fa-heart opacity-30"}></i>
                                {unreadNotifCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>}
                            </button>
                        </div>
                    </div>
                )}

                {children}

                {/* Side Drawer (Hamburger Menu) */}
                {drawerOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}></div>
                        <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 shadow-2xl animate-slide-right p-6 flex flex-col">
                            {/* Drawer Close Button */}
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                <i className="fas fa-times"></i>
                            </button>

                            {/* Drawer Header */}
                            <div className="mb-8 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100">
                                    <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}`} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-slate-900">{user.username}</h2>
                                    <p className="text-slate-400 text-xs">Student</p>
                                </div>
                            </div>

                            <nav className="space-y-1 flex-1">
                                <button onClick={() => { navigateTo(AppView.PROFILE); setDrawerOpen(false); }} className="w-full text-left py-3 px-4 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                                    <i className="far fa-user w-6 text-center"></i> My Profile
                                </button>
                                <button onClick={() => { navigateTo(AppView.GAMES); setDrawerOpen(false); }} className="w-full text-left py-3 px-4 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                                    <i className="fas fa-gamepad w-6 text-center"></i> Play Zone
                                </button>

                                <button onClick={() => { setDrawerOpen(false); /* Open Settings logic if needed */ }} className="w-full text-left py-3 px-4 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                                    <i className="fas fa-cog w-6 text-center"></i> Settings
                                </button>
                                <button onClick={() => { setDrawerOpen(false); onShowLeaderboard(); }} className="w-full text-left py-3 px-4 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                                    <i className="fas fa-trophy w-6 text-center text-amber-500"></i> Leaderboard
                                </button>
                                <button onClick={() => { setDrawerOpen(false); onReportProblem(); }} className="w-full text-left py-3 px-4 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                                    <i className="fas fa-bug w-6 text-center"></i> Report Problem
                                </button>
                                <button onClick={() => { setDrawerOpen(false); onShowPrivacyPolicy(); }} className="w-full text-left py-3 px-4 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                                    <i className="fas fa-user-shield w-6 text-center"></i> Privacy Policy
                                </button>
                                <button onClick={toggleDarkMode} className="w-full text-left py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3">
                                    <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'} w-6 text-center`}></i>
                                    {darkMode ? 'Light Mode' : 'Night Mode'}
                                </button>
                                {(user.isAdmin || user.email === 'admin@yug.com') && (
                                    <button onClick={() => { navigateTo(AppView.ADMIN); setDrawerOpen(false); }} className="w-full text-left py-3 px-4 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-3">
                                        <i className="fas fa-shield-alt w-6 text-center"></i> Admin
                                    </button>
                                )}
                            </nav>

                            <button onClick={async () => { await db.logout(); window.location.reload(); }} className="mt-auto w-full py-4 rounded-xl bg-slate-50 text-rose-500 font-bold flex items-center justify-center gap-2 active:scale-95">
                                <i className="fas fa-sign-out-alt"></i> Log Out
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile Bottom Navigation - UniBuzz Style */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-50 dark:border-slate-800 pb-safe">
                <nav className="flex justify-between items-center h-16 px-4">
                    {/* 1. Home */}
                    <button onClick={() => navigateTo(AppView.HOME)} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${view === AppView.HOME ? 'text-amber-500' : 'text-slate-900 dark:text-slate-500'}`}>
                        <i className={`fas fa-house text-xl`}></i>
                        <span className="text-[8px] font-black uppercase tracking-widest">Feed</span>
                    </button>

                    {/* 2. Clubs */}
                    <button onClick={() => navigateTo(AppView.CLUBS)} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${view === AppView.CLUBS ? 'text-amber-500' : 'text-slate-900 dark:text-slate-500'}`}>
                        <i className="fas fa-users text-xl"></i>
                        <span className="text-[8px] font-black uppercase tracking-widest">Clubs</span>
                    </button>

                    {/* 3. Post Center */}
                    <button onClick={() => navigateTo(AppView.POST)} className="flex-1 flex justify-center -mt-8">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 shadow-2xl shadow-amber-500/20 active:scale-90 transition-transform rotate-3 ring-4 ring-white">
                            <i className="fas fa-plus text-xl"></i>
                        </div>
                    </button>

                    {/* 4. Messages */}
                    <button onClick={() => navigateTo(AppView.MESSAGES)} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all relative ${view === AppView.MESSAGES ? 'text-amber-500' : 'text-slate-900 dark:text-slate-500'}`}>
                        <i className={`fas fa-message text-xl ${view === AppView.MESSAGES ? '' : 'opacity-40'}`}></i>
                        <span className="text-[8px] font-black uppercase tracking-widest">Hive</span>
                        {unreadMsgCount > 0 && (
                            <span className="absolute top-0 right-1/4 w-2 h-2 bg-amber-500 rounded-full animate-buzz"></span>
                        )}
                    </button>

                    {/* 5. Profile */}
                    <button onClick={() => navigateTo(AppView.PROFILE)} className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${view === AppView.PROFILE ? 'text-amber-500' : 'text-slate-900 dark:text-slate-500'}`}>
                        <div className={`w-6 h-6 rounded-lg overflow-hidden border ${view === AppView.PROFILE ? 'border-amber-500 rotate-2' : 'border-slate-200'}`}>
                            <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}`} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest">You</span>
                    </button>
                </nav>
            </div>
        </div>
    );
};







export default function App() {
    // const {user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser(); // Removed
    const { signOut } = useClerk(); // We still use this to logout from Clerk if they were verified

    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<AppView | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSystemIssueReport, setShowSystemIssueReport] = useState(false);
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const [colleges, setColleges] = useState<College[]>([]);
    const [confessions, setConfessions] = useState<Confession[]>([]);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [feedTab, setFeedTab] = useState<'campus' | 'open'>('campus');
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const [activeCommentConfessionId, setActiveCommentConfessionId] = useState<string | null>(null);
    const [activeClubPostCommentId, setActiveClubPostCommentId] = useState<string | null>(null);

    // Reporting
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportingConfessionId, setReportingConfessionId] = useState<string | null>(null);

    // Admin & filtering
    const [confessionSearch, setConfessionSearch] = useState('');
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allConf, setAllConf] = useState<Confession[]>([]);
    const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'content'>('overview');
    const [adminCollegeId, setAdminCollegeId] = useState<string | null>(null); // For admin to switch context
    const [campusStudents, setCampusStudents] = useState<User[]>([]);
    const [activeClubId, setActiveClubId] = useState<string | null>(null);

    // Username validation logic
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [debouncedUsername, setDebouncedUsername] = useState('');

    useEffect(() => {
        if (!debouncedUsername || debouncedUsername.length < 3) {
            setUsernameStatus('idle');
            return;
        }

        const check = async () => {
            setUsernameStatus('checking');
            const isAvailable = await db.isUsernameAvailable(debouncedUsername);
            setUsernameStatus(isAvailable ? 'available' : 'taken');
        };

        const timer = setTimeout(check, 500);
        return () => clearTimeout(timer);
    }, [debouncedUsername]);

    const [confirmState, setConfirmState] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, type: 'danger' | 'info' }>({
        isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'danger'
    });

    const confirmAction = useCallback((title: string, message: string, onConfirm: () => void, type: 'danger' | 'info' = 'danger') => {
        setConfirmState({ isOpen: true, title, message, onConfirm, type });
    }, []);

    // --- Advanced History-Based Navigation Logic ---

    // 1. Monitor PopState (Physical Back Button)
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const state = event.state;
            if (state && state.view !== undefined) {
                // Restore all contextual state from history
                const { view: targetView, selectedUser: targetUser, adminTab: targetAdminTab } = state;

                setView(targetView);
                setSelectedUser(targetUser ?? null);
                setAdminTab(targetAdminTab ?? 'overview');
            } else {
                // FALLBACK or ROOT EXIT:
                // If we get here, it means we've popped past our first pushState.
                // If we are already at Home or Auth, we should NOT setView again, 
                // allowing the browser to actually "go back" to whatever was before the app started (or exit).
                if (viewRef.current !== AppView.HOME && viewRef.current !== AppView.AUTH && viewRef.current !== null) {
                    setView(AppView.HOME);
                }
            }
        };

        window.addEventListener('popstate', handlePopState);

        // Initialize history state on load if empty, including current view if already set
        if (!window.history.state) {
            window.history.replaceState({ view: view || AppView.HOME }, '', '');
        }

        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigateTo = useCallback((newView: AppView, context?: { selectedUser?: User | null, adminTab?: any, clubId?: string | null }, forceReplace: boolean = false) => {
        const nextUser = context?.selectedUser !== undefined ? context.selectedUser : selectedUser;
        const nextAdminTab = context?.adminTab !== undefined ? context.adminTab : adminTab;
        const nextClubId = context?.clubId !== undefined ? context.clubId : activeClubId;

        // Prevent pushing redundant states if exactly the same
        if (window.history.state &&
            window.history.state.view === newView &&
            window.history.state.selectedUser?.id === nextUser?.id &&
            window.history.state.adminTab === nextAdminTab &&
            window.history.state.clubId === nextClubId) {
            return;
        }

        const nextState = {
            view: newView,
            selectedUser: nextUser,
            adminTab: nextAdminTab,
            clubId: nextClubId
        };

        // Home view is the exit point. 
        // If we are going TO Home, we use replaceState to avoid history loops.
        // For transitions TO any other view, we use pushState to maintain the back-flow path.
        const shouldReplace = forceReplace || newView === AppView.HOME;

        if (shouldReplace) {
            window.history.replaceState(nextState, '', '');
        } else {
            window.history.pushState(nextState, '', '');
        }

        // Update local React state
        setView(newView);
        setSelectedUser(nextUser);
        setAdminTab(nextAdminTab);
        setActiveClubId(nextClubId);
    }, [selectedUser, adminTab, activeClubId]);



    const goBack = useCallback(() => {
        if (view === AppView.HOME || view === AppView.AUTH) {
            console.warn("Back blocked: At root view");
            return;
        }
        window.history.back();
    }, [view]);

    // Keep viewRef in sync for the popstate closure
    const viewRef = useRef<AppView>(view);
    useEffect(() => { viewRef.current = view; }, [view]);

    const handleManualRefresh = async () => {
        setRefreshing(true);
        // Simulate refresh delay for UX
        await new Promise(r => setTimeout(r, 1000));
        // The realtime subscription should already be active, but we can force re-fetch if we had a method exposed.
        const c = await db.getColleges();
        setColleges(c);
        setRefreshing(false);
    };

    const { refreshing: isPullRefreshing, pullChange } = usePullToRefresh(handleManualRefresh);

    useEffect(() => {
        // Load initial data
        const loadInit = async () => {
            const c = await db.getColleges();
            setColleges(c);
        };
        loadInit();

        // Firebase Auth Listener
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Get DB user
                    let appUser = await db.getUser(firebaseUser.uid);

                    if (!appUser) {
                        // Fallback heal (simulated, usually handled in service or auth flow)
                        // But here we just wait for the db to be consistent if created elsewhere
                        // Or we can rely on db.getUser returning null for new users until setup
                    }

                    if (appUser) {
                        setUser(appUser);
                        // Only request browser-level permissions if NOT in the Flutter App
                        if (typeof window !== 'undefined' && !(window as any).FlutterNotifications) {
                            db.requestNotificationPermission(appUser.id);
                        }

                        // Navigation
                        if (!appUser.username) setView(AppView.SETUP_USERNAME);
                        else if (!appUser.collegeId && !appUser.isAdmin) setView(AppView.SETUP_COLLEGE);
                        else if (view === null || view === AppView.AUTH) setView(AppView.HOME);
                    } else {
                        // User authenticated in Firebase but no DB record yet? 
                        // This might happen during the split second of registration. 
                        // We'll let the registration flow handle the setUser/setView.
                        // Or we can try to "heal" here.
                        // For now, let's assume registration flow sets user.
                    }
                } catch (e) {
                    console.error("Sync failed", e);
                }
            } else {
                setUser(null);
                setView(AppView.AUTH);
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
        }
    }, []); // Run once on mount

    const refreshUnreadCount = useCallback(async () => {
        if (!user) return;
        const msgCount = await db.getUnreadCount(user.id);
        setUnreadMsgCount(msgCount);
        const notifCount = await db.getUnreadNotificationCount(user.id);
        setUnreadNotifCount(notifCount);
    }, [user?.id]);

    // Real-time subscription for Feed
    useEffect(() => {
        let unsubscribe: any;
        if (user || adminCollegeId) {
            const targetCollegeId = adminCollegeId || user?.collegeId;

            if (!targetCollegeId && feedTab === 'campus') {
                setConfessions([]); // Clear if no college
                return;
            }

            // Clear old confessions when switching to avoid bleed
            setConfessions([]);

            console.log(`Subscribing to ${feedTab} feed (${targetCollegeId})...`);
            unsubscribe = db.subscribeToConfessions(targetCollegeId || 'global', feedTab, (data) => {
                console.log("Received data:", data.length);
                setConfessions(prev => {
                    const locals = prev.filter(c => (c as any).__local);
                    const dbIds = new Set(data.map(c => c.id));
                    const pendingLocals = locals.filter(c => !dbIds.has(c.id));
                    return [...pendingLocals, ...data];
                });
            });
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.id, user?.collegeId, adminCollegeId, feedTab]); // More granular dependency to catch collegeId updates

    // Admin data load (still fetch once for simplicity)
    useEffect(() => {
        if (view === AppView.ADMIN) {
            const loadAdminData = async () => {
                const u = await db.getAllUsers();
                const c = await db.getAllConfessions();
                setAllUsers(u);
                setAllConf(c);
            };
            loadAdminData();
        }
    }, [view]);

    useEffect(() => {
        const fetchCampusStudents = async () => {
            const targetCollegeId = adminCollegeId || user?.collegeId;
            if (targetCollegeId) {
                const students = await db.getUsersByCollege(targetCollegeId);
                // Filter out current user from discovery scroller
                setCampusStudents(students.filter(s => s.id !== user?.id));
            } else {
                setCampusStudents([]);
            }
        };
        fetchCampusStudents();
    }, [user?.collegeId, adminCollegeId, user?.id]);

    useEffect(() => {
        if (!user) return;

        const sub = db.subscribeToNotifications(user.id, (n) => {
            setUnreadNotifCount(prev => prev + 1);

            // Play notification sound
            try {
                // Skip sound/toast for "New Confession" here (handled by global listener or native push)
                if (n.actorName === 'New Confession') return;

                const isRealAdmin = n.type === 'system' && n.actorName !== 'New Confession';
                const soundFile = isRealAdmin ? '/admin-notification.mp3' : '/notification.mp3';
                const audio = new Audio(soundFile);
                audio.play().catch(e => console.log('Audio play failed (user interaction needed first):', e));
            } catch (e) {
                console.error('Error playing notification sound:', e);
            }

            // Show System Notification (Status Bar)
            if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
                try {
                    new window.Notification(n.actorName || 'UniConfess', {
                        body: n.content,
                        icon: '/logo.svg' // Ensure this exists or use default
                    });
                } catch (e) {
                    console.error('System notification failed:', e);
                }
            }

            // Admin notifications should only appear in tray, not as in-app toasts
            // Confession toasts are handled by subscribeToNewConfessions below

        });

        // Global New Confession Toast Listener
        const subGlobalConf = db.subscribeToNewConfessions(user.collegeId, (c) => {
            if (c.userId === user.id) return;
            try {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(() => { });
            } catch (e) { }

            const senderName = c.isAnonymous ? "Someone" : (c.username || "Student");
            const snippet = c.content.length > 50 ? c.content.substring(0, 47) + "..." : c.content;
            addToast(snippet, 'info', `${senderName} posted`, c.userAvatar, true);
        });

        const subMsg = db.subscribeToMessages(user.id, async (event, payload) => {
            if (event === 'INSERT') {
                const m = payload as Message;
                const currentTotal = await db.getUnreadCount(user.id);
                setUnreadMsgCount(currentTotal);
                if (view !== AppView.CHAT_DETAIL) {
                    const sender = await db.getUser(m.senderId);
                    addToast(m.content, 'info', sender?.username || 'New Message', sender?.avatarUrl, true);
                }
            }
        });

        const poll = setInterval(refreshUnreadCount, 15000);

        // Presence Heartbeat (every 1 min)
        const heartbeat = setInterval(() => {
            if (user) db.updateUser(user.id, { lastActive: Date.now() });
        }, 60000);
        // Initial beat
        if (user) db.updateUser(user.id, { lastActive: Date.now() });

        return () => {
            sub.unsubscribe();
            subGlobalConf.unsubscribe();
            subMsg.unsubscribe();
            clearInterval(poll);
            clearInterval(heartbeat);
        };
    }, [user?.id, user?.collegeId, view, refreshUnreadCount]);

    // Manually refresh (optional now with realtime, but good fallback)
    // Manually refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const targetCollegeId = adminCollegeId || user?.collegeId;
            if (targetCollegeId) {
                const data = await db.getConfessionsByCollege(targetCollegeId);
                setConfessions(prev => {
                    // Keep locals? Usually refresh implies "get absolute truth from server"
                    // But to be safe for pending uploads, let's keep locals.
                    const locals = prev.filter(c => (c as any).__local);
                    const dbIds = new Set(data.map(c => c.id));
                    const pendingLocals = locals.filter(c => !dbIds.has(c.id));
                    return [...pendingLocals, ...data];
                });
            }
        } catch (e) {
            console.error("Refresh failed", e);
            addToast("Failed to refresh", "error");
        } finally {
            setRefreshing(false);
        }
    }

    const addToast = (message: string, type: ToastType = 'info', title?: string, avatar?: string, isRich?: boolean) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type, title, avatar, isRich }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, isRich ? 6000 : 3000);
    };

    // --- Handlers ---
    const handlePostSuccess = (c: Confession) => {
        // 1. Optimistic update
        setConfessions(prev => [c, ...prev]);
        // 2. Trigger fetch (background refresh)
        handleRefresh();
    };

    const handleLikeConfession = useCallback(async (id: string) => { if (!user) return; await db.toggleLike(id, user.id); }, [user]);
    const handleDeleteConfession = useCallback((confession: Confession) => {
        if (!user) return;
        const isAdmin = user.isAdmin || user.id === 'admin_user' || user.email === 'admin@yug.com';
        const isOwner = user.id === confession.userId;

        if (!isAdmin && !isOwner) return;

        confirmAction(
            "Delete Post?",
            "Are you sure you want to delete this confession? This action cannot be undone.",
            async () => {
                // Optimistic update
                setConfessions(prev => prev.filter(c => c.id !== confession.id));
                setAllConf(prev => prev.filter(c => c.id !== confession.id));

                try {
                    const success = await db.deleteConfession(confession);
                    if (success) {
                        if (activeCommentConfessionId === confession.id) setActiveCommentConfessionId(null);
                        addToast('Post deleted', 'success');
                    } else {
                        throw new Error('Deletion failed');
                    }
                } catch (error: any) {
                    console.error("Delete error:", error);
                    // Revert optimistic update
                    const effectiveCollegeId = adminCollegeId || user.collegeId;
                    const targetCollegeId = feedTab === 'campus' ? effectiveCollegeId : 'world';
                    // Note: feedTab check 'campus' vs 'college' might differ in state. Logic says 'campus' or 'open'.
                    // I will just re-fetch to be safe.
                    handleRefresh(); // Simplest revert
                    addToast(`Failed to delete: ${error.message || 'Unknown error'}`, 'error');
                }
            }
        );
    }, [user, feedTab, adminCollegeId, activeCommentConfessionId, view, confirmAction, handleRefresh]);

    const handleReportConfession = useCallback((id: string) => {
        setReportingConfessionId(id);
        setShowReportModal(true);
    }, []);

    const handleSubmitReport = async (reason: string) => {
        if (!user || !reportingConfessionId) return;
        try {
            await db.submitReport(reportingConfessionId, user.id, reason);
            addToast('Report submitted. Thank you.', 'success');
        } catch (e) {
            addToast('Failed to submit report.', 'error');
        }
        setShowReportModal(false);
        setReportingConfessionId(null);
    };
    const handleProfileClick = useCallback(async (userId: string, isAnonymous: boolean) => {
        if (isAnonymous) return;
        if (userId === user?.id) {
            navigateTo(AppView.PROFILE);
            return;
        }
        const target = await db.getUser(userId);
        if (target) {
            navigateTo(AppView.USER_PROFILE, { selectedUser: target });
        }
    }, [user, navigateTo]);

    const handleFollowUser = useCallback(async (targetUserId: string) => {
        if (!user) return;

        const isFollowing = user.following?.includes(targetUserId);

        // Optimistic Updates
        setUser(prev => {
            if (!prev) return null;
            const following = prev.following || [];
            return {
                ...prev,
                following: isFollowing ? following.filter(id => id !== targetUserId) : [...following, targetUserId]
            };
        });

        if (selectedUser && selectedUser.id === targetUserId) {
            setSelectedUser(prev => {
                if (!prev) return null;
                const followers = prev.followers || [];
                return {
                    ...prev,
                    followers: isFollowing ? followers.filter(id => id !== user.id) : [...followers, user.id]
                };
            });
        }

        addToast(isFollowing ? 'Unfollowed' : 'Followed', 'success');

        try {
            if (isFollowing) {
                await db.unfollowUser(user.id, targetUserId);
            } else {
                await db.followUser(user.id, targetUserId);
            }
        } catch (e) {
            console.error("Follow action failed:", e);
            addToast("Action failed. Please try again.", "error");

            // Revert state logic could go here, but for simplicity we'll rely on refresh or ignoring for now
            // In a real app we'd revert the optimistic update
            const freshUser = await db.getUser(user.id);
            setUser(freshUser);
            const freshTarget = await db.getUser(targetUserId);
            if (selectedUser && selectedUser.id === targetUserId) setSelectedUser(freshTarget);
        }
    }, [user, selectedUser]);

    // --- Views ---







    // --- Layout ---

    // --- Main Render ---

    // --- Main Render Logic ---
    let content;

    // Show skeleton loading while auth is initializing
    if (loading || view === null) {
        content = (
            <div className="min-h-screen bg-slate-50">
                <div className="w-full lg:w-[600px] mx-auto bg-white min-h-screen">
                    {/* Header Skeleton */}
                    <div className="sticky top-0 z-30 pt-4 px-4 pb-2 bg-white">
                        <div className="bg-slate-100 rounded-[2.5rem] p-6 animate-pulse">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                                    <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
                                </div>
                                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Feed Skeleton */}
                    <div className="px-4 pt-4 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                                        <div className="h-3 bg-slate-200 rounded w-24"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 bg-slate-200 rounded w-full"></div>
                                    <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                                    <div className="h-3 bg-slate-200 rounded w-4/6"></div>
                                </div>
                                <div className="flex gap-4 mt-4">
                                    <div className="h-8 bg-slate-200 rounded-full w-16"></div>
                                    <div className="h-8 bg-slate-200 rounded-full w-16"></div>
                                    <div className="h-8 bg-slate-200 rounded-full w-16"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    } else if (view === AppView.AUTH) {
        content = <AuthView setUser={setUser} setView={setView} addToast={addToast} />;
    } else if (view === AppView.SETUP_USERNAME) {
        content = (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-6 text-primary-600 text-3xl"><i className="fas fa-user-tag"></i></div>
                <h2 className="text-3xl font-black mb-2 text-slate-900">Choose a Handle</h2>
                <p className="text-slate-500 mb-8">This is how you'll be known on campus.</p>
                <div className="w-full max-w-xs relative mb-8">
                    <input
                        className={`w-full text-center text-2xl font-bold border-b-2 outline-none py-2 bg-transparent transition-colors ${usernameStatus === 'available' ? 'border-green-500' :
                            usernameStatus === 'taken' ? 'border-red-500' : 'border-slate-200 focus:border-primary-500'
                            }`}
                        placeholder="@username"
                        value={user?.username || ''}
                        onChange={e => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                            setUser(u => u ? { ...u, username: val } : null);
                            setDebouncedUsername(val);
                        }}
                    />
                    <div className="absolute top-1/2 -right-8 -translate-y-1/2">
                        {usernameStatus === 'checking' && <i className="fas fa-spinner animate-spin text-slate-400"></i>}
                        {usernameStatus === 'available' && <i className="fas fa-check-circle text-green-500"></i>}
                        {usernameStatus === 'taken' && <i className="fas fa-times-circle text-red-500"></i>}
                    </div>
                    {usernameStatus === 'taken' && <p className="text-red-500 text-xs font-bold mt-2">Handle already taken!</p>}
                    {debouncedUsername && debouncedUsername.length < 3 && <p className="text-slate-400 text-[10px] mt-2">Minimum 3 characters</p>}
                </div>
                <Button
                    className="w-full max-w-xs rounded-xl shadow-lg"
                    disabled={usernameStatus !== 'available' || !user?.username || user.username.length < 3}
                    onClick={async () => {
                        if (user?.username && usernameStatus === 'available') {
                            try {
                                await db.updateUser(user.id, { username: user.username });
                                setView(AppView.SETUP_COLLEGE);
                            } catch (e) {
                                addToast('Failed to save username. It might have been taken.', 'error');
                                setUsernameStatus('taken');
                            }
                        }
                    }}
                >
                    Continue
                </Button>
                <button
                    onClick={async () => {
                        await signOut();
                        setUser(null);
                        setView(AppView.AUTH);
                    }}
                    className="mt-10 text-rose-600 text-sm font-black transition-all uppercase tracking-widest px-8 py-3 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm active:scale-95 flex items-center gap-2 hover:bg-rose-100"
                >
                    <i className="fas fa-sign-out-alt"></i>
                    Logout
                </button>
            </div>
        );
    } else if (view === AppView.POST) {
        content = <PostView onPostSuccess={handlePostSuccess} user={user} adminCollegeId={adminCollegeId} navigateTo={navigateTo} goBack={goBack} addToast={addToast} defaultVisibility={feedTab} />;
    } else if (view === AppView.SETUP_COLLEGE) {
        content = <SetupCollegeView user={user} colleges={colleges} setColleges={setColleges} setView={setView} setUser={setUser} />;
    } else if (view === AppView.SETUP_AVATAR) {
        content = (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <EditProfileView user={user!} onSave={async (updates) => { const updated = await db.updateUser(user!.id, updates); setUser(updated); setView(AppView.HOME); }} onCancel={() => setView(AppView.HOME)} />
            </div>
        );
    } else {
        content = (
            <Layout
                user={user}
                view={view}
                setView={setView}
                navigateTo={navigateTo}
                unreadMsgCount={unreadMsgCount}
                unreadNotifCount={unreadNotifCount}
                adminCollegeId={adminCollegeId}
                addToast={addToast}
                onPostSuccess={handlePostSuccess}
                darkMode={darkMode}
                toggleDarkMode={() => setDarkMode(!darkMode)}
                onReportProblem={() => setShowSystemIssueReport(true)}
                onShowPrivacyPolicy={() => window.open('/privacy-policy.html', '_blank')}
                onShowLeaderboard={() => setShowLeaderboard(true)}
            >
                {view === AppView.HOME && (
                    <div className="animate-fade-in min-h-screen bg-slate-50/50 pb-32">
                        {refreshing && (
                            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-2xl border border-white/50 flex items-center gap-3 animate-bounce">
                                <i className="fas fa-circle-notch animate-spin text-primary-600 text-sm"></i>
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">Syncing Campus...</span>
                            </div>
                        )}

                        {/* Admin Campus Switcher */}
                        <AdminCampusSwitcher
                            user={user}
                            colleges={colleges}
                            adminCollegeId={adminCollegeId}
                            setAdminCollegeId={setAdminCollegeId}
                            addToast={addToast}
                        />

                        <div className="px-6 py-4 flex justify-center sticky top-14 z-20 bg-white/10 backdrop-blur-md">
                            <div className="bg-slate-100/80 p-1 rounded-2xl flex font-black text-[10px] uppercase tracking-widest relative ring-1 ring-slate-200/50 w-full max-w-[280px] shadow-sm">
                                <button
                                    onClick={() => setFeedTab('campus')}
                                    className={`flex-1 py-1.5 rounded-[12px] transition-all duration-300 relative z-10 ${feedTab === 'campus' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    My Campus
                                </button>
                                <button
                                    onClick={() => setFeedTab('open')}
                                    className={`flex-1 py-1.5 rounded-[12px] transition-all duration-300 relative z-10 ${feedTab === 'open' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    World
                                </button>
                            </div>
                        </div>

                        <div className="max-w-[700px] mx-auto">
                            {confessions.length === 0 ? (
                                <div className="py-24 text-center flex flex-col items-center px-10 animate-fade-in">
                                    <div className="w-20 h-20 bg-amber-50 rounded-[28px] border border-amber-100 flex items-center justify-center text-amber-500 text-3xl mb-6 shadow-xl shadow-amber-500/10 rotate-3">
                                        <i className="fas fa-bolt"></i>
                                    </div>
                                    <h3 className="font-black text-slate-900 text-xl mb-2 tracking-tight">Quiet on Campus...</h3>
                                    <p className="text-slate-400 text-xs max-w-[240px] leading-relaxed font-bold uppercase tracking-wide">Be the first to spark a bee and light up the feed.</p>
                                    <button
                                        className="mt-8 rounded-2xl px-8 py-3.5 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all hover:bg-slate-800"
                                        onClick={() => navigateTo(AppView.POST)}
                                    >
                                        Drop a Bee Post
                                    </button>
                                </div>
                            ) : (
                                confessions.map((c, index) => (
                                    <ConfessionItem
                                        key={c.id}
                                        confession={c}
                                        currentUser={user}
                                        onLike={handleLikeConfession}
                                        onDelete={handleDeleteConfession}
                                        onReply={(id) => setActiveCommentConfessionId(id)}
                                        onProfileClick={handleProfileClick}
                                        onReport={handleReportConfession}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {view === AppView.SEARCH && <SearchView user={user} setSelectedUser={setSelectedUser} navigateTo={navigateTo} />}
                {view === AppView.GAMES && <GamesView navigateTo={navigateTo} />}

                {view === AppView.CLUBS && <ClubsView user={user} navigateTo={navigateTo} confirmAction={confirmAction} addToast={addToast} goBack={goBack} adminCollegeId={adminCollegeId} />}
                {view === AppView.CLUB_DETAIL && activeClubId && <ClubDetailView user={user} clubId={activeClubId} goBack={goBack} addToast={addToast} confirmAction={confirmAction} onReply={(id) => setActiveClubPostCommentId(id)} />}
                {view === AppView.MESSAGES && <MessagesView user={user} setSelectedUser={setSelectedUser} navigateTo={navigateTo} confirmAction={confirmAction} campusStudents={campusStudents} handleProfileClick={handleProfileClick} />}
                {view === AppView.NOTIFICATIONS && (
                    <NotificationsView
                        user={user}
                        navigateTo={navigateTo}
                        setSelectedUser={setSelectedUser}
                        setUnreadNotifCount={setUnreadNotifCount}
                    />
                )}
                {view === AppView.CHAT_DETAIL && <ChatDetailView user={user} selectedUser={selectedUser} goBack={goBack} navigateTo={navigateTo} onMessagesRead={refreshUnreadCount} confirmAction={confirmAction} />}


                {view === AppView.USER_PROFILE && selectedUser && (
                    <UserProfileView
                        selectedUser={selectedUser}
                        currentUser={user}
                        setSelectedUser={setSelectedUser}
                        navigateTo={navigateTo}
                        goBack={goBack}
                        addToast={addToast}
                        confessions={confessions}
                        colleges={colleges}
                        onFollow={handleFollowUser}
                        onProfileClick={handleProfileClick}
                        onReport={handleReportConfession}
                    />
                )}

                {view === AppView.POST && (
                    <PostView
                        user={user}
                        onPostSuccess={handlePostSuccess}
                        adminCollegeId={adminCollegeId}
                        navigateTo={navigateTo}
                        goBack={goBack}
                        addToast={addToast}
                    />
                )}

                {view === AppView.PROFILE && user && (
                    <ProfileView
                        user={user}
                        navigateTo={navigateTo}
                        setUser={setUser}
                        confessions={confessions}
                        colleges={colleges}
                        onDelete={handleDeleteConfession}
                        onLike={handleLikeConfession}
                        onUpdateProfile={async (updates) => {
                            const updated = await db.updateUser(user.id, updates);
                            setUser(updated);
                            addToast('Profile updated', 'success');
                        }}
                        onAccountDelete={async () => {
                            try {
                                await db.deleteAccount(user.id);
                                addToast('Your account was successfully deleted', 'success');
                                await signOut();
                                setUser(null);
                                setView(AppView.AUTH);
                            } catch (e) {
                                addToast('Failed to delete account', 'error');
                            }
                        }}
                        confirmAction={confirmAction}
                        onProfileClick={handleProfileClick}
                        addToast={addToast}
                        onReport={handleReportConfession}
                    />
                )}

                {view === AppView.ADMIN && <AdminPanel onBack={goBack} confirmAction={confirmAction} addToast={addToast} />}
                {activeCommentConfessionId && <CommentsSheet confessionId={activeCommentConfessionId} onClose={() => setActiveCommentConfessionId(null)} confirmAction={confirmAction} addToast={addToast} />}
                {activeClubPostCommentId && <ClubCommentsSheet clubPostId={activeClubPostCommentId} onClose={() => setActiveClubPostCommentId(null)} confirmAction={confirmAction} addToast={addToast} />}
                {showReportModal && <ReportModal onClose={() => { setShowReportModal(false); setReportingConfessionId(null); }} onSubmit={handleSubmitReport} />}
                {showSystemIssueReport && user && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowSystemIssueReport(false)}>
                    <ReportIssueSheet user={user} onClose={() => setShowSystemIssueReport(false)} addToast={addToast} />
                </div>}



                {showLeaderboard && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowLeaderboard(false)}>
                    <UnderConstructionView title="Leaderboard" onClose={() => setShowLeaderboard(false)} />
                </div>}

                <ConfirmModal
                    isOpen={confirmState.isOpen}
                    title={confirmState.title}
                    message={confirmState.message}
                    onConfirm={confirmState.onConfirm}
                    onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                    type={confirmState.type}
                />
            </Layout>
        );
    }

    return (
        <>
            {content}
            {/* Standard Center-Bottom Toasts */}
            <div className="fixed bottom-24 md:bottom-10 inset-x-0 mx-auto z-[100] flex flex-col items-center gap-2 w-full max-w-[90%] pointer-events-none">
                {toasts.filter(t => !t.isRich).map(t => (
                    <div key={t.id} className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-premium font-black text-sm animate-slide-up text-center border border-white/10 flex items-center gap-3 w-fit">
                        {t.type === 'error' && <i className="fas fa-exclamation-circle text-rose-500"></i>}
                        {t.type === 'success' && <i className="fas fa-check-circle text-emerald-500"></i>}
                        {t.type === 'info' && <i className="fas fa-info-circle text-primary-500"></i>}
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>

            {/* Premium Top Rich Notifications */}
            <div className="fixed top-6 inset-x-0 mx-auto z-[101] flex flex-col items-center gap-3 w-full max-w-[360px] px-4 pointer-events-none">
                {toasts.filter(t => t.isRich).map(t => (
                    <div
                        key={t.id}
                        className="glass p-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up border border-white/20 ring-1 ring-black/5 pointer-events-auto cursor-pointer active:scale-95 transition-all"
                        onClick={() => {
                            if (t.type === 'info') navigateTo(AppView.MESSAGES);
                            else navigateTo(AppView.NOTIFICATIONS);
                            setToasts(prev => prev.filter(id => id.id !== t.id));
                        }}
                    >
                        <div className="relative">
                            <img src={t.avatar || `https://ui-avatars.com/api/?name=${t.title || 'U'}`} className="w-12 h-12 rounded-xl object-cover bg-slate-100 shadow-sm" />
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] ${t.type === 'info' ? 'bg-blue-500' : 'bg-primary-500'} text-white`}>
                                <i className={`fas ${t.type === 'info' ? 'fa-envelope' : 'fa-bell'}`}></i>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-900 text-sm truncate">{t.title || 'New Notification'}</p>
                            <p className="text-slate-500 text-xs truncate font-medium">{t.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

