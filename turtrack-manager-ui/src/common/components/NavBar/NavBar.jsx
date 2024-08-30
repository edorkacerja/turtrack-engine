import { Link } from 'react-router-dom';
import "./NavBar.scss"

const NavBar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/" className="logo-link">TurTrack Manager</Link>
            </div>
            <ul className="navbar-links">
                <li><Link to="/" className="nav-link">Jobs</Link></li>
                <li><Link to="/kafka-ui" className="nav-link">Kafka UI</Link></li>
                {/*<li><Link to="/jobs/create" className="nav-link">Create Job</Link></li>*/}
            </ul>
        </nav>
    );
};

export default NavBar;