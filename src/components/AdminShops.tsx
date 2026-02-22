import React, { useState } from 'react';
import { register } from '../api/authApi';
import { AdminShopList } from './AdminShopList';

interface AdminShopsProps {
    token: string;
}

export const AdminShops: React.FC<AdminShopsProps> = ({ token }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [shopName, setShopName] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [address, setAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await register(token, {
                username,
                password,
                email,
                shopName,
                gstNumber,
                address,
                contactNumber,
                logoUrl
            });
            setSuccess(`Shop "${shopName}" created successfully!`);
            setUsername('');
            setPassword('');
            setEmail('');
            setShopName('');
            setGstNumber('');
            setAddress('');
            setContactNumber('');
            setLogoUrl('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error creating shop');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>Shop Management</h2>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <button
                        onClick={() => setActiveTab('create')}
                        style={{
                            padding: '0.5rem 1rem', background: activeTab === 'create' ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                            color: activeTab === 'create' ? '#d4af37' : '#8A9BB3', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s ease'
                        }}
                    >
                        Create Shop
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        style={{
                            padding: '0.5rem 1rem', background: activeTab === 'list' ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                            color: activeTab === 'list' ? '#d4af37' : '#8A9BB3', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s ease'
                        }}
                    >
                        All Shops
                    </button>
                </div>
            </div>

            {activeTab === 'create' ? (
                <div style={{ background: '#1e2532', borderRadius: '12px', padding: '2rem', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '600px' }}>
                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {error && <div style={{ color: '#F56565', background: 'rgba(245, 101, 101, 0.1)', padding: '0.8rem', borderRadius: '8px' }}>{error}</div>}
                        {success && <div style={{ color: '#48BB78', background: 'rgba(72, 187, 120, 0.1)', padding: '0.8rem', borderRadius: '8px' }}>{success}</div>}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#A0ABC0' }}>Username *</label>
                                <input value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#A0ABC0' }}>Password *</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#A0ABC0' }}>Email Address *</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#A0ABC0' }}>Shop Name *</label>
                            <input value={shopName} onChange={e => setShopName(e.target.value)} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#A0ABC0' }}>GST Number</label>
                                <input value={gstNumber} onChange={e => setGstNumber(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#A0ABC0' }}>Contact Number</label>
                                <input value={contactNumber} onChange={e => setContactNumber(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#A0ABC0' }}>Address</label>
                            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'vertical' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#A0ABC0' }}>Logo URL</label>
                            <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                            {logoUrl && (
                                <div style={{ marginTop: '0.5rem', width: '64px', height: '64px', background: '#fff', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={logoUrl} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #a67c00 100%)', color: '#fff', padding: '1rem', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '1rem' }}>
                            {loading ? 'Creating...' : '+ Create Shop'}
                        </button>
                    </form>
                </div>
            ) : (
                <div style={{ margin: '-2rem' }}>
                    <AdminShopList token={token} />
                </div>
            )}
        </div>
    );
};
