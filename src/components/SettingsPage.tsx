import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import '../styles/settings.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080'

interface SettingsPageProps {
    token: string
    username: string
    jewellerName: string
    shopEmail: string
    shopContact: string
    shopAddress: string
    shopGst: string
    shopLogo: string
    onProfileUpdate: (data: {
        jewellerName?: string
        shopEmail?: string
        shopContact?: string
        shopAddress?: string
        shopGst?: string
    }) => void
}

export function SettingsPage({
    token,
    username,
    jewellerName,
    shopEmail,
    shopContact,
    shopAddress,
    shopGst,
    shopLogo,
    onProfileUpdate
}: SettingsPageProps) {
    const { theme, toggleTheme } = useTheme()

    // Profile form
    const [profileForm, setProfileForm] = useState({
        shopName: jewellerName,
        email: shopEmail,
        contact: shopContact,
        address: shopAddress,
        gstNumber: shopGst
    })
    const [profileSaving, setProfileSaving] = useState(false)
    const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [passwordSaving, setPasswordSaving] = useState(false)
    const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [showPasswords, setShowPasswords] = useState(false)

    const handleProfileSave = async () => {
        setProfileSaving(true)
        setProfileMsg(null)

        // Always update localStorage immediately (local-first)
        onProfileUpdate({
            jewellerName: profileForm.shopName,
            shopEmail: profileForm.email,
            shopContact: profileForm.contact,
            shopAddress: profileForm.address,
            shopGst: profileForm.gstNumber
        })

        // Sync to server concurrently
        try {
            const response = await fetch(`${API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    shopName: profileForm.shopName,
                    email: profileForm.email,
                    contactNumber: profileForm.contact,
                    address: profileForm.address,
                    gstNumber: profileForm.gstNumber
                })
            })
            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                throw new Error(err.message || 'Failed to update profile on server')
            }
            setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
        } catch (err: any) {
            setProfileMsg({ type: 'error', text: 'Saved locally but server sync failed: ' + (err.message || 'Unknown error') })
        } finally {
            setProfileSaving(false)
        }
    }

    const handlePasswordChange = async () => {
        setPasswordMsg(null)

        if (!passwordForm.currentPassword || !passwordForm.newPassword) {
            setPasswordMsg({ type: 'error', text: 'Please fill in all password fields' })
            return
        }
        if (passwordForm.newPassword.length < 6) {
            setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters' })
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'Passwords do not match' })
            return
        }

        setPasswordSaving(true)
        try {
            const response = await fetch(`${API_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            })
            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                throw new Error(err.message || 'Failed to change password')
            }
            setPasswordMsg({ type: 'success', text: 'Password changed successfully!' })
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (err: any) {
            setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password' })
        } finally {
            setPasswordSaving(false)
        }
    }

    const getInitials = (name: string) =>
        name.split(' ').map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('')

    return (
        <div className="settings-page">
            {/* Hero Header */}
            <div className="settings-hero">
                <div className="settings-hero-content">
                    <div className="settings-hero-avatar">
                        {shopLogo ? (
                            <img src={shopLogo} alt="Logo" />
                        ) : (
                            <span>{getInitials(username)}</span>
                        )}
                    </div>
                    <div className="settings-hero-info">
                        <h1>⚙️ Settings</h1>
                        <p>Manage your account, theme, and preferences</p>
                    </div>
                </div>
            </div>

            <div className="settings-grid">
                {/* ===== THEME SECTION ===== */}
                <div className="settings-card settings-card-theme">
                    <div className="settings-card-header">
                        <div className="settings-card-icon">🎨</div>
                        <div>
                            <h3>Appearance</h3>
                            <p>Customize the look and feel</p>
                        </div>
                    </div>
                    <div className="settings-card-body">
                        <div className="theme-toggle-row">
                            <div className="theme-option-info">
                                <span className="theme-icon-label">
                                    {theme === 'dark' ? '🌙' : '☀️'}
                                </span>
                                <div>
                                    <strong>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong>
                                    <p>{theme === 'dark' ? 'Easy on the eyes in low-light environments' : 'Bright and clear for daytime use'}</p>
                                </div>
                            </div>
                            <button
                                className={`theme-switch ${theme === 'light' ? 'light' : ''}`}
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                            >
                                <span className="theme-switch-thumb" />
                            </button>
                        </div>

                        <div className="theme-preview-row">
                            <div
                                className={`theme-preview-card ${theme === 'dark' ? 'active' : ''}`}
                                onClick={() => theme !== 'dark' && toggleTheme()}
                            >
                                <div className="theme-preview-swatch dark-swatch" />
                                <span>Dark</span>
                            </div>
                            <div
                                className={`theme-preview-card ${theme === 'light' ? 'active' : ''}`}
                                onClick={() => theme !== 'light' && toggleTheme()}
                            >
                                <div className="theme-preview-swatch light-swatch" />
                                <span>Light</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== PROFILE SECTION ===== */}
                <div className="settings-card settings-card-profile">
                    <div className="settings-card-header">
                        <div className="settings-card-icon">👤</div>
                        <div>
                            <h3>Edit Profile</h3>
                            <p>Update your shop details</p>
                        </div>
                    </div>
                    <div className="settings-card-body">
                        <div className="settings-form-grid">
                            <div className="settings-field">
                                <label>Shop Name</label>
                                <input
                                    type="text"
                                    value={profileForm.shopName}
                                    onChange={e => setProfileForm(f => ({ ...f, shopName: e.target.value }))}
                                    placeholder="Your shop name"
                                />
                            </div>
                            <div className="settings-field">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="shop@example.com"
                                />
                            </div>
                            <div className="settings-field">
                                <label>Contact Number</label>
                                <input
                                    type="tel"
                                    value={profileForm.contact}
                                    onChange={e => setProfileForm(f => ({ ...f, contact: e.target.value }))}
                                    placeholder="+91 XXXXX XXXXX"
                                />
                            </div>
                            <div className="settings-field">
                                <label>GST Number</label>
                                <input
                                    type="text"
                                    value={profileForm.gstNumber}
                                    onChange={e => setProfileForm(f => ({ ...f, gstNumber: e.target.value }))}
                                    placeholder="GSTIN"
                                />
                            </div>
                            <div className="settings-field full-width">
                                <label>Address</label>
                                <textarea
                                    value={profileForm.address}
                                    onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))}
                                    placeholder="Shop address"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {profileMsg && (
                            <div className={`settings-msg ${profileMsg.type}`}>
                                {profileMsg.type === 'success' ? '✅' : '❌'} {profileMsg.text}
                            </div>
                        )}

                        <div className="settings-card-actions">
                            <button className="settings-btn-primary" onClick={handleProfileSave} disabled={profileSaving}>
                                {profileSaving ? (
                                    <>
                                        <span className="settings-spinner" /> Saving...
                                    </>
                                ) : (
                                    '💾 Save Profile'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ===== PASSWORD SECTION ===== */}
                <div className="settings-card settings-card-password">
                    <div className="settings-card-header">
                        <div className="settings-card-icon">🔒</div>
                        <div>
                            <h3>Change Password</h3>
                            <p>Update your login credentials</p>
                        </div>
                    </div>
                    <div className="settings-card-body">
                        <div className="settings-form-stack">
                            <div className="settings-field">
                                <label>Current Password</label>
                                <div className="password-input-wrap">
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={passwordForm.currentPassword}
                                        onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                                        placeholder="Enter current password"
                                    />
                                </div>
                            </div>
                            <div className="settings-field">
                                <label>New Password</label>
                                <div className="password-input-wrap">
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={passwordForm.newPassword}
                                        onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                                        placeholder="Enter new password (min 6 chars)"
                                    />
                                </div>
                            </div>
                            <div className="settings-field">
                                <label>Confirm New Password</label>
                                <div className="password-input-wrap">
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={passwordForm.confirmPassword}
                                        onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                        placeholder="Re-enter new password"
                                    />
                                </div>
                            </div>

                            <label className="show-password-toggle">
                                <input
                                    type="checkbox"
                                    checked={showPasswords}
                                    onChange={e => setShowPasswords(e.target.checked)}
                                />
                                <span>Show passwords</span>
                            </label>
                        </div>

                        {passwordMsg && (
                            <div className={`settings-msg ${passwordMsg.type}`}>
                                {passwordMsg.type === 'success' ? '✅' : '❌'} {passwordMsg.text}
                            </div>
                        )}

                        <div className="settings-card-actions">
                            <button className="settings-btn-primary" onClick={handlePasswordChange} disabled={passwordSaving}>
                                {passwordSaving ? (
                                    <>
                                        <span className="settings-spinner" /> Changing...
                                    </>
                                ) : (
                                    '🔐 Change Password'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ===== ACCOUNT INFO ===== */}
                <div className="settings-card settings-card-info">
                    <div className="settings-card-header">
                        <div className="settings-card-icon">ℹ️</div>
                        <div>
                            <h3>Account Info</h3>
                            <p>Your account overview</p>
                        </div>
                    </div>
                    <div className="settings-card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Username</span>
                                <span className="info-value">{username}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Shop Name</span>
                                <span className="info-value">{jewellerName}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Email</span>
                                <span className="info-value">{shopEmail || '—'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Contact</span>
                                <span className="info-value">{shopContact || '—'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">GST</span>
                                <span className="info-value">{shopGst || '—'}</span>
                            </div>
                            <div className="info-item full-width">
                                <span className="info-label">Address</span>
                                <span className="info-value">{shopAddress || '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
