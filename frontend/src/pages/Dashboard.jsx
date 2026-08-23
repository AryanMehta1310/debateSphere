import React, { useState } from 'react';
import { User, Mail, Calendar, Key, ShieldCheck, CheckCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMeApi } from '../services/authService';
import Alert from '../components/common/Alert';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState('');
  const [testing, setTesting] = useState(false);

  const handleTestAuth = async () => {
    setTesting(true);
    setTestError('');
    try {
      const res = await getMeApi();
      setTestResult(res);
    } catch (err) {
      setTestError(err.response?.data?.message || 'Protected route verification failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800 }}>
          User Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Welcome back to DebateSphere, <strong>{user?.name}</strong>!
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* User Info Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                color: '#fff',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{user?.name}</h2>
              <span className="badge badge-emerald">Authenticated</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
              <Mail size={18} color="var(--accent-primary)" />
              <span>Email: <strong>{user?.email}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
              <Calendar size={18} color="var(--accent-primary)" />
              <span>Joined: <strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
              <Key size={18} color="var(--accent-primary)" />
              <span>JWT Status: <strong style={{ color: '#10b981' }}>Active Token Present</strong></span>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button onClick={logout} className="btn btn-secondary btn-block">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Phase 1 Verification Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <ShieldCheck size={24} color="var(--accent-primary)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700 }}>
              Phase 1 Authentication Test
            </h3>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Verify that your JWT token correctly authorizes access to protected backend endpoints via <code>authMiddleware.js</code>.
          </p>

          <button onClick={handleTestAuth} className="btn btn-outline btn-block" disabled={testing}>
            {testing ? 'Verifying Token...' : 'Test GET /api/auth/me Endpoint'}
          </button>

          {testError && (
            <div style={{ marginTop: '1rem' }}>
              <Alert type="danger" message={testError} />
            </div>
          )}

          {testResult && (
            <div style={{ marginTop: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6ee7b7', fontWeight: 600, marginBottom: '0.5rem' }}>
                <CheckCircle size={16} /> Protected API Response Success!
              </div>
              <pre style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', overflowX: 'auto', color: '#f8fafc' }}>
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
