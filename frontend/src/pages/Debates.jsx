import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Users, PlusCircle, LogIn, Key, Sparkles, Shuffle } from 'lucide-react';
import { getDebatesApi, joinDebateApi, joinRandomDebateApi } from '../services/debateService';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Debates = () => {
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [directCode, setDirectCode] = useState('');
  const [joiningCode, setJoiningCode] = useState('');
  const [joiningRandom, setJoiningRandom] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchDebates = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getDebatesApi();
      if (data.success) {
        setDebates(data.debates || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load debate rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebates();
  }, []);

  const handleJoinRandom = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setJoiningRandom(true);
      setError('');
      const res = await joinRandomDebateApi();
      if (res.success && res.debate) {
        navigate(`/debate/${res.debate.roomCode}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error joining random debate');
    } finally {
      setJoiningRandom(false);
    }
  };

  const handleJoin = async (roomCode) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setJoiningCode(roomCode);
      const res = await joinDebateApi(roomCode);
      if (res.success) {
        navigate(`/debate/${roomCode}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error joining debate room');
    } finally {
      setJoiningCode('');
    }
  };

  const handleDirectJoinSubmit = (e) => {
    e.preventDefault();
    if (!directCode.trim()) return;
    handleJoin(directCode.trim().toUpperCase());
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700 }}>
            Debate Rooms
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Match with a random debate room or explore open discussions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleJoinRandom}
            className="btn btn-primary"
            disabled={joiningRandom}
            style={{ padding: '0.65rem 1.4rem', fontSize: '0.95rem' }}
          >
            {joiningRandom ? (
              <div className="spinner" />
            ) : (
              <>
                <Shuffle size={18} /> Join Random Debate
              </>
            )}
          </button>

          {isAuthenticated && (
            <Link to="/create-debate" className="btn btn-secondary">
              <PlusCircle size={16} /> Create Custom Debate
            </Link>
          )}
        </div>
      </div>

      {error && <Alert type="danger" message={error} />}

      {/* Direct Room Code Join Form */}
      <div className="card" style={{ marginBottom: '2.5rem', background: 'var(--bg-secondary)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={16} color="var(--accent-light)" /> Join via Room Code
        </h3>
        <form onSubmit={handleDirectJoinSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Enter Room Code (e.g. A1B2C3)"
            value={directCode}
            onChange={(e) => setDirectCode(e.target.value)}
            style={{ flex: '1', minWidth: '220px', textTransform: 'uppercase' }}
          />
          <button type="submit" className="btn btn-secondary">
            Join Room
          </button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching active debate rooms..." />
      ) : debates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <MessageSquare size={36} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Waiting Debates Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Click below to instantly join or create an AI-powered random debate!
          </p>
          <button onClick={handleJoinRandom} className="btn btn-primary">
            <Shuffle size={18} /> Join Random Debate
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {debates.map((debate) => (
            <div key={debate._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge">Code: {debate.roomCode}</span>
                  <span className={`badge ${debate.status === 'ready' ? 'badge-emerald' : ''}`} style={{ textTransform: 'capitalize' }}>
                    {debate.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {debate.topic}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                  {debate.description}
                </p>
              </div>

              <div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Debaters: <strong>{debate.debaters?.length || 0}/2</strong></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={14} /> {debate.participants?.length || 0} Total
                  </span>
                </div>

                <button
                  onClick={() => handleJoin(debate.roomCode)}
                  className="btn btn-primary btn-block"
                  disabled={joiningCode === debate.roomCode}
                >
                  {joiningCode === debate.roomCode ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <LogIn size={15} /> Join Room
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Debates;
