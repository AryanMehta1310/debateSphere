import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, ArrowLeft, MessageSquare, FileText } from 'lucide-react';
import { createDebateApi } from '../services/debateService';
import Alert from '../components/common/Alert';

const CreateDebate = () => {
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.topic.trim() || !formData.description.trim()) {
      setError('Please provide both topic and description for the debate');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await createDebateApi(formData.topic.trim(), formData.description.trim());
      if (res.success && res.debate) {
        navigate(`/debate/${res.debate.roomCode}`);
      } else {
        setError(res.message || 'Failed to create debate room');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error creating debate room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/debates" className="btn btn-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} /> Back to All Debates
        </Link>
      </div>

      <div className="card">
        <div className="auth-header" style={{ textAling: 'left', marginBottom: '1.5rem' }}>
          <h2 className="auth-title" style={{ fontSize: '1.6rem' }}>Create Debate Room</h2>
          <p className="auth-subtitle">Set up a new debate topic and invite participants</p>
        </div>

        {error && <Alert type="danger" message={error} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="topic">
              Debate Topic
            </label>
            <div style={{ position: 'relative' }}>
              <MessageSquare
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '12px',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                id="topic"
                type="text"
                name="topic"
                className="form-control"
                placeholder="e.g. Is AI beneficial for education?"
                style={{ paddingLeft: '2.5rem' }}
                value={formData.topic}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">
              Debate Description
            </label>
            <div style={{ position: 'relative' }}>
              <FileText
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '12px',
                  color: 'var(--text-muted)',
                }}
              />
              <textarea
                id="description"
                name="description"
                className="form-control"
                rows="4"
                placeholder="Describe the main guidelines or discussion points..."
                style={{ paddingLeft: '2.5rem', resize: 'vertical' }}
                value={formData.description}
                onChange={handleChange}
                required
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '1.5rem' }}
          >
            {loading ? (
              <div className="spinner" />
            ) : (
              <>
                <PlusCircle size={18} /> Create Debate Room
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateDebate;
