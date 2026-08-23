import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare, Vote, Award, Clock, Brain, ArrowRight, CheckCircle2, Server, Code, Database, Radio, Cpu, Lock, HelpCircle } from 'lucide-react';
import { checkServerStatusApi } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [serverStatus, setServerStatus] = useState({ loading: true, online: false, message: '' });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await checkServerStatusApi();
        setServerStatus({
          loading: false,
          online: true,
          message: res.status || 'Server Online',
        });
      } catch (err) {
        setServerStatus({
          loading: false,
          online: false,
          message: 'Backend Offline',
        });
      }
    };

    fetchStatus();
  }, []);

  const handleStartDebating = () => {
    if (isAuthenticated) {
      navigate('/debates');
    } else {
      navigate('/register');
    }
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">
            Think. Argue. Prove.
          </h1>

          <p className="hero-subtitle">
            DebateSphere is an AI-assisted online debate platform where ideas compete, audiences decide, and AI helps you improve.
          </p>

          <div className="hero-actions">
            <button onClick={handleStartDebating} className="btn btn-primary" style={{ padding: '0.7rem 1.6rem', fontSize: '1rem' }}>
              Start Debating <ArrowRight size={18} />
            </button>
            <button onClick={scrollToHowItWorks} className="btn btn-secondary" style={{ padding: '0.7rem 1.5rem', fontSize: '1rem' }}>
              How It Works
            </button>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: serverStatus.online ? '#238636' : '#d29922' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Backend API: <strong>{serverStatus.loading ? 'Checking...' : serverStatus.message}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Key Features Section: Why DebateSphere? */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why DebateSphere?</h2>
            <p className="section-subtitle">Designed to elevate intellectual discussion and critical argument skills</p>
          </div>

          <div className="features-grid">
            <div className="card feature-card">
              <div className="feature-icon-wrapper">
                <Sparkles size={20} />
              </div>
              <h3 className="feature-card-title">1. AI-Powered Topics</h3>
              <p className="feature-card-desc">
                Generate interesting debate topics with AI.
              </p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon-wrapper">
                <MessageSquare size={20} />
              </div>
              <h3 className="feature-card-title">2. Real-Time Debates</h3>
              <p className="feature-card-desc">
                Participate in live discussions with other users.
              </p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon-wrapper">
                <Vote size={20} />
              </div>
              <h3 className="feature-card-title">3. Audience Voting</h3>
              <p className="feature-card-desc">
                Let the audience decide which arguments are stronger.
              </p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon-wrapper">
                <Award size={20} />
              </div>
              <h3 className="feature-card-title">4. Competitive Scoring</h3>
              <p className="feature-card-desc">
                Earn points based on audience votes.
              </p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon-wrapper">
                <Clock size={20} />
              </div>
              <h3 className="feature-card-title">5. Timed Arguments</h3>
              <p className="feature-card-desc">
                Make your point within a limited time.
              </p>
            </div>

            <div className="card feature-card">
              <div className="feature-icon-wrapper">
                <Brain size={20} />
              </div>
              <h3 className="feature-card-title">6. AI Feedback</h3>
              <p className="feature-card-desc">
                Get personalized feedback on your debating performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Four simple steps to participate in online debates</p>
          </div>

          <div className="steps-grid">
            <div className="card step-card">
              <div className="step-number">01</div>
              <h3 className="step-title">Join a Debate</h3>
              <p className="step-desc">
                Browse waiting debate rooms or enter a unique room code to get started.
              </p>
            </div>

            <div className="card step-card">
              <div className="step-number">02</div>
              <h3 className="step-title">Present Your Argument</h3>
              <p className="step-desc">
                Submit structured points and defend your stance against fellow debaters.
              </p>
            </div>

            <div className="card step-card">
              <div className="step-number">03</div>
              <h3 className="step-title">Audience Votes</h3>
              <p className="step-desc">
                Peer participants vote on compelling arguments and evidence.
              </p>
            </div>

            <div className="card step-card">
              <div className="step-number">04</div>
              <h3 className="step-title">Get Your Result</h3>
              <p className="step-desc">
                See the final debate standings and automated AI analysis summary.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Project Section */}
      <section className="why-project-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Built to Make Debating Better</h2>
            <p className="section-subtitle">Core academic and skill-building objectives</p>
          </div>

          <div className="purpose-grid">
            <div className="card purpose-card">
              <div className="purpose-bullet">✓</div>
              <div className="purpose-text">Improve communication skills</div>
            </div>

            <div className="card purpose-card">
              <div className="purpose-bullet">✓</div>
              <div className="purpose-text">Develop critical thinking</div>
            </div>

            <div className="card purpose-card">
              <div className="purpose-bullet">✓</div>
              <div className="purpose-text">Learn to defend ideas</div>
            </div>

            <div className="card purpose-card">
              <div className="purpose-bullet">✓</div>
              <div className="purpose-text">Receive useful AI feedback</div>
            </div>

            <div className="card purpose-card">
              <div className="purpose-bullet">✓</div>
              <div className="purpose-text">Practice debating in a competitive environment</div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section: Built With */}
      <section className="tech-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Built With</h2>
            <p className="section-subtitle">Core technologies powering DebateSphere</p>
          </div>

          <div className="tech-grid">
            <div className="card tech-card">
              <Code size={22} style={{ color: 'var(--accent-light)', marginBottom: '0.5rem' }} />
              <div className="tech-label">Frontend</div>
              <div className="tech-value">React.js</div>
            </div>

            <div className="card tech-card">
              <Server size={22} style={{ color: 'var(--accent-light)', marginBottom: '0.5rem' }} />
              <div className="tech-label">Backend</div>
              <div className="tech-value">Node.js</div>
            </div>

            <div className="card tech-card">
              <Server size={22} style={{ color: 'var(--accent-light)', marginBottom: '0.5rem' }} />
              <div className="tech-label">Framework</div>
              <div className="tech-value">Express.js</div>
            </div>

            <div className="card tech-card">
              <Database size={22} style={{ color: 'var(--accent-light)', marginBottom: '0.5rem' }} />
              <div className="tech-label">Database</div>
              <div className="tech-value">MongoDB</div>
            </div>

            <div className="card tech-card">
              <Radio size={22} style={{ color: 'var(--accent-light)', marginBottom: '0.5rem' }} />
              <div className="tech-label">Real-Time</div>
              <div className="tech-value">Socket.io</div>
            </div>

            <div className="card tech-card">
              <Cpu size={22} style={{ color: 'var(--accent-light)', marginBottom: '0.5rem' }} />
              <div className="tech-label">AI Integration</div>
              <div className="tech-value">Google Gemini API</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Put Your Ideas to the Test?</h2>
            <p className="cta-desc">
              Join DebateSphere today and participate in structured, real-time debates.
            </p>
            <button onClick={handleStartDebating} className="btn btn-primary" style={{ padding: '0.75rem 1.8rem', fontSize: '1.05rem' }}>
              Start Debating <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
