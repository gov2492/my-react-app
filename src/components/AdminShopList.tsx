import React, { useEffect, useState } from 'react';
import { getUsers, deleteUser, toggleUserStatus, type UserDetails } from '../api/authApi';

interface AdminShopListProps {
    token: string;
}

export const AdminShopList: React.FC<AdminShopListProps> = ({ token }) => {
    const [users, setUsers] = useState<UserDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, [token]);

    const loadUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getUsers(token);
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error fetching shops');
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId: number, shopName: string) => {
        if (!window.confirm(`Are you sure you want to delete the shop "${shopName}"? This action will permanently remove their access.`)) {
            return;
        }

        try {
            await deleteUser(token, userId);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error deleting shop');
        }
    };

    const handleToggleStatus = async (userId: number, currentStatus: boolean, shopName: string) => {
        const action = currentStatus ? 'disable' : 'enable';
        if (!window.confirm(`Are you sure you want to ${action} the shop "${shopName}"?`)) {
            return;
        }

        try {
            const updatedUser = await toggleUserStatus(token, userId);
            setUsers(users.map(u => u.id === userId ? updatedUser : u));
        } catch (err) {
            setError(err instanceof Error ? err.message : `Error ${action}ing shop`);
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', color: '#A0ABC0' }}>Loading shops...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: '2rem' }}>
                <div style={{ color: '#F56565', background: 'rgba(245, 101, 101, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>All Onboarded Shops</h2>
                <button
                    onClick={loadUsers}
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                    Refresh List
                </button>
            </div>

            <div style={{ background: '#1e2532', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <tr>
                                <th style={{ padding: '1rem', color: '#8A9BB3', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Shop Name</th>
                                <th style={{ padding: '1rem', color: '#8A9BB3', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Username</th>
                                <th style={{ padding: '1rem', color: '#8A9BB3', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Email</th>
                                <th style={{ padding: '1rem', color: '#8A9BB3', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Role</th>
                                <th style={{ padding: '1rem', color: '#8A9BB3', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Contact</th>
                                <th style={{ padding: '1rem', color: '#8A9BB3', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s ease' }}>
                                    <td style={{ padding: '1rem', color: '#fff' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {user.logoUrl ? (
                                                <img src={user.logoUrl} alt="logo" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px' }} />
                                            ) : (
                                                <div style={{ width: '24px', height: '24px', background: 'rgba(212,175,55,0.1)', color: '#d4af37', borderRadius: '4px', display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                                                    {user.shopName.charAt(0)}
                                                </div>
                                            )}
                                            {user.shopName}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#E2E8F0' }}>{user.username}</td>
                                    <td style={{ padding: '1rem', color: '#A0ABC0' }}>{user.email || '-'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: user.role === 'admin' ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)', color: user.role === 'admin' ? '#d4af37' : '#A0ABC0' }}>
                                                {user.role}
                                            </span>
                                            {!user.enabled && (
                                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.7srem', fontWeight: 600, background: 'rgba(245, 101, 101, 0.1)', color: '#F56565' }}>
                                                    Disabled
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#A0ABC0' }}>{user.contactNumber || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {user.role !== 'admin' && (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleToggleStatus(user.id, user.enabled, user.shopName)}
                                                    style={{
                                                        background: user.enabled ? 'rgba(255, 165, 0, 0.1)' : 'rgba(72, 187, 120, 0.1)',
                                                        color: user.enabled ? '#FFA500' : '#48BB78',
                                                        border: `1px solid ${user.enabled ? 'rgba(255, 165, 0, 0.2)' : 'rgba(72, 187, 120, 0.2)'}`,
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {user.enabled ? 'Disable' : 'Enable'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id, user.shopName)}
                                                    style={{
                                                        background: 'rgba(245, 101, 101, 0.1)',
                                                        color: '#F56565',
                                                        border: '1px solid rgba(245, 101, 101, 0.2)',
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#8A9BB3' }}>
                                        No shops found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
