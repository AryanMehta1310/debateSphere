import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div>
          <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>DebateSphere</strong>
          <span style={{ margin: '0 0.5rem', color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: 'var(--accent-light)', fontStyle: 'italic', fontSize: '0.9rem' }}>"Think. Argue. Prove."</span>
        </div>
        <div>
          <span className="badge" style={{ fontSize: '0.78rem' }}>
            Built with MERN + Socket.io + Gemini AI
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
