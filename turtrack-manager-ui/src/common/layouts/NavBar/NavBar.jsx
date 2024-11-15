// src/common/layouts/NavBar/NavBar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ExternalLink, LogIn, User } from 'lucide-react';
import { selectIsAuthenticated, selectCurrentUser, logout } from '../../../features/auth/redux/authSlice';
import AuthModal from '../../components/AuthModal/AuthModal';
import "./NavBar.scss";

const NavBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user = useSelector(selectCurrentUser);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-logo">
                    <Link to="/" className="logo-link">TurTrack Manager</Link>
                </div>
                <ul className="navbar-links">
                    <li><Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Jobs</Link></li>
                    <li>
                        <a
                            href="http://localhost:8080/ui/clusters"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="nav-link"
                        >
                            Kafka UI
                            <ExternalLink className="external-link-icon" size={16} />
                        </a>
                    </li>
                </ul>
                <div className="navbar-auth">
                    {isAuthenticated ? (
                        <button
                            onClick={handleLogout}
                            className="profile-button"
                        >
                            <User />
                            <span>{user?.firstName || 'Profile'}</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="auth-button"
                        >
                            <LogIn />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
        </nav>
    );
};

export default NavBar;