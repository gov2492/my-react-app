import React, { useState, useEffect } from 'react'
import { forgotPassword, verifyOtp, resetPassword } from '../api/authApi'
import { useNotifications } from '../context/NotificationContext'
import '../styles/billing-dashboard.css'

interface ForgotPasswordProps {
    onBack: () => void
}

type Step = 'IDENTIFIER' | 'OTP' | 'RESET'

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
    const { pushToast } = useNotifications()
    const [step, setStep] = useState<Step>('IDENTIFIER')
    const [identifier, setIdentifier] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Timer State
    const [timeLeft, setTimeLeft] = useState(0)

    // Validation State for Password
    const [validationBlocks, setValidationBlocks] = useState({
        length: false,
        upper: false,
        number: false,
        match: false
    })

    useEffect(() => {
        setValidationBlocks({
            length: newPassword.length >= 8,
            upper: /[A-Z]/.test(newPassword),
            number: /[0-9]/.test(newPassword),
            match: newPassword === confirmPassword && newPassword.length > 0
        })
    }, [newPassword, confirmPassword])

    useEffect(() => {
        if (timeLeft <= 0) return
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1)
        }, 1000)
        return () => clearInterval(timer)
    }, [timeLeft])

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!identifier.trim()) return

        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            await forgotPassword(identifier)
            setStep('OTP')
            setSuccess('An OTP has been sent to your registered email address.')
            setTimeLeft(60) // Start 60s countdown
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Account not found. Please check your username or email.')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP.')
            return
        }

        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            await verifyOtp(identifier, otp)
            setStep('RESET')
            setSuccess(null) // Clear success to show just instructions
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid OTP. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()

        // Strict Validation Check
        if (!validationBlocks.length || !validationBlocks.upper || !validationBlocks.number || !validationBlocks.match) {
            setError('Please meet all password requirements before proceeding.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await resetPassword(identifier, otp, newPassword)
            setSuccess('Password updated successfully. Please login.')
            pushToast({
                title: 'Password changed',
                message: 'Your password has been updated successfully.',
                type: 'SUCCESS'
            })

            // Auto-redirect to login after 2 seconds
            setTimeout(() => {
                onBack()
            }, 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password. The OTP might have expired.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-card" style={{ maxWidth: '440px' }}>
            <button
                type="button"
                onClick={onBack}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#A0ABC0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '1rem',
                    padding: 0,
                    fontSize: '0.9rem'
                }}
            >
                <span>←</span> Back to Login
            </button>

            <div className="login-header">
                <h2>{step === 'IDENTIFIER' ? 'Forgot Password' : step === 'OTP' ? 'Verify OTP' : 'Create New Password'}</h2>
                <p>
                    {step === 'IDENTIFIER' && "Enter your username or email to recover your account"}
                    {step === 'OTP' && "Enter the 6-digit verification code sent to your email"}
                    {step === 'RESET' && "Set a strong new password for your account"}
                </p>
            </div>

            {/* Step Indicators */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step === 'IDENTIFIER' ? '#d4af37' : '#32D74B' }}></div>
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step === 'IDENTIFIER' ? 'rgba(255,255,255,0.1)' : step === 'OTP' ? '#d4af37' : '#32D74B' }}></div>
                <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step === 'RESET' ? '#d4af37' : 'rgba(255,255,255,0.1)' }}></div>
            </div>

            {error && (
                <div className="error-message" style={{ marginBottom: '1.5rem' }}>
                    <span className="error-icon">⚠️</span>
                    {error}
                </div>
            )}

            {success && (
                <div style={{
                    padding: '12px 16px',
                    background: 'rgba(50, 215, 75, 0.1)',
                    borderLeft: '4px solid #32D74B',
                    borderRadius: '4px',
                    color: '#32D74B',
                    fontSize: '0.9rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>✓</span> {success}
                </div>
            )}

            {step === 'IDENTIFIER' && (
                <form onSubmit={handleSendOtp}>
                    <div className="form-group">
                        <label htmlFor="identifier">Username or Email</label>
                        <div className="input-wrapper">
                            <span className="input-icon">👤</span>
                            <input
                                id="identifier"
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="e.g. admin or admin@example.com"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <button className="login-button" type="submit" disabled={loading || !identifier.trim()} style={{ marginTop: '1rem' }}>
                        <span className="button-content">
                            {loading ? (
                                <><span className="spinner"></span>Processing...</>
                            ) : (
                                <>Send Reset Code <span className="button-arrow">→</span></>
                            )}
                        </span>
                    </button>
                </form>
            )}

            {step === 'OTP' && (
                <form onSubmit={handleVerifyOtp}>
                    <div className="form-group">
                        <label htmlFor="otp">6-Digit OTP</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🔑</span>
                            <input
                                id="otp"
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Numeric only
                                placeholder="000000"
                                style={{ letterSpacing: '8px', fontSize: '1.2rem', textAlign: 'center', fontWeight: 'bold' }}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', fontSize: '0.85rem' }}>
                            <span style={{ color: '#A0ABC0' }}>
                                {timeLeft > 0 ? `Code expires in ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : 'Code expired'}
                            </span>
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={timeLeft > 0 || loading}
                                style={{ background: 'none', border: 'none', color: timeLeft > 0 ? 'rgba(255,255,255,0.3)' : '#d4af37', cursor: timeLeft > 0 ? 'not-allowed' : 'pointer', padding: 0 }}
                            >
                                Resend OTP
                            </button>
                        </div>
                    </div>
                    <button className="login-button" type="submit" disabled={loading || otp.length !== 6 || timeLeft <= 0} style={{ marginTop: '1.5rem' }}>
                        <span className="button-content">
                            {loading ? (
                                <><span className="spinner"></span>Verifying...</>
                            ) : (
                                <>Verify OTP <span className="button-arrow">→</span></>
                            )}
                        </span>
                    </button>
                </form>
            )}

            {step === 'RESET' && (
                <form onSubmit={handleResetPassword}>
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                disabled={loading || success?.includes('successfully')}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="input-wrapper">
                            <span className="input-icon">✓</span>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                disabled={loading || success?.includes('successfully')}
                            />
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', marginTop: '1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ marginBottom: '0.5rem', color: '#A0ABC0' }}>Password Requirements:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ color: validationBlocks.length ? '#32D74B' : '#8A9BB3', display: 'flex', gap: '6px' }}>
                                <span>{validationBlocks.length ? '✓' : '○'}</span> Minimum 8 characters
                            </div>
                            <div style={{ color: validationBlocks.upper ? '#32D74B' : '#8A9BB3', display: 'flex', gap: '6px' }}>
                                <span>{validationBlocks.upper ? '✓' : '○'}</span> At least 1 uppercase letter
                            </div>
                            <div style={{ color: validationBlocks.number ? '#32D74B' : '#8A9BB3', display: 'flex', gap: '6px' }}>
                                <span>{validationBlocks.number ? '✓' : '○'}</span> At least 1 number
                            </div>
                            <div style={{ color: validationBlocks.match ? '#32D74B' : '#8A9BB3', display: 'flex', gap: '6px' }}>
                                <span>{validationBlocks.match ? '✓' : '○'}</span> Passwords must match
                            </div>
                        </div>
                    </div>

                    <button
                        className="login-button"
                        type="submit"
                        disabled={loading || !validationBlocks.length || !validationBlocks.upper || !validationBlocks.number || !validationBlocks.match || !!success}
                        style={{ marginTop: '1.5rem' }}
                    >
                        <span className="button-content">
                            {loading ? (
                                <><span className="spinner"></span>Updating...</>
                            ) : success ? (
                                <>Success ✓</>
                            ) : (
                                <>Update Password <span className="button-arrow">→</span></>
                            )}
                        </span>
                    </button>
                </form>
            )}
        </div>
    )
}
