// NavBar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ExternalLink, LogIn, LogOut } from 'lucide-react';
import { selectIsAuthenticated, selectCurrentUser, logout } from '../../../features/auth/redux/authSlice';
import AuthModal from '../../../features/auth/components/AuthModal/AuthModal';
import { selectSubscriptionStatus } from "../../../features/subscription/redux/subscriptionSlice.js";
import "./NavBar.scss";

const ProfileAvatar = ({ user }) => {
    if (user?.profilePicture) {
        return (
            <img
                src={user.profilePicture}
                alt={`${user.firstName}'s profile`}
                className="profile-avatar"
            />
        );
    }

    const initials = user?.firstName && user?.lastName
        ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
        : user?.firstName?.[0]?.toUpperCase() || 'U';

    return (
        <div className="profile-initials">
            {initials}
        </div>
    );
};

const ProfileDropdown = ({ user, onLogout, isOpen }) => {
    return (
        <div className={`profile-dropdown ${isOpen ? 'show' : ''}`}>
            <div className="profile-dropdown-header">
                <p className="user-name">{user.firstName} {user.lastName}</p>
                <p className="user-email">{user.email}</p>
            </div>
            <button
                onClick={onLogout}
                className="logout-button"
            >
                <LogOut size={16} />
                <span>Sign out</span>
            </button>
        </div>
    );
};

const NavBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user = useSelector(selectCurrentUser);
    const subscriptionStatus = useSelector(selectSubscriptionStatus);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:9999/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } finally {
            dispatch(logout());
            navigate('/login');
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-logo">
                    <Link to="/" className="logo-link">TurTrack Manager</Link>
                </div>
                <ul className="navbar-links">
                    <li>
                        <Link
                            to="/"
                            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                        >
                            Jobs
                        </Link>
                    </li>
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
                    {isAuthenticated && (
                        <li>
                            <Link
                                to="/pricing"
                                className={`nav-link ${location.pathname.startsWith('/pricing') ? 'active' : ''}`}
                            >
                                Pricing
                            </Link>
                        </li>
                    )}
                </ul>
                <div className="navbar-auth" ref={dropdownRef}>
                    {isAuthenticated ? (
                        <div className="profile-container">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="profile-button"
                            >
                                <ProfileAvatar user={user} />
                            </button>
                            <ProfileDropdown
                                user={user}
                                onLogout={handleLogout}
                                isOpen={isDropdownOpen}
                            />
                        </div>
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