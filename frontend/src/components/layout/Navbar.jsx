import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, User, PlusCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleScrollToHowItWorks = () => {
    if (location.pathname !== '/') {
      navigate('/', { replace: false });
      setTimeout(() => {
        const el = document.getElementById('how-it-works');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="brand-logo">
          Debate<span className="brand-accent">Sphere</span>
        </Link>

        <nav>
          <ul className="nav-links">
            <li>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Home
              </Link>
            </li>

            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/debates" className={`nav-link ${location.pathname === '/debates' ? 'active' : ''}`}>
                    Debates
                  </Link>
                </li>
                <li>
                  <Link to="/create-debate" className={`nav-link ${location.pathname === '/create-debate' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <PlusCircle size={15} />
                    Create Debate
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <LayoutDashboard size={15} />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <span className="badge">
                    <User size={12} />
                    {user?.name}
                  </span>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <button
                    onClick={handleScrollToHowItWorks}
                    className="nav-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <Link to="/login" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
