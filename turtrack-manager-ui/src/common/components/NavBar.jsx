import { Link } from 'react-router-dom';

const NavBar = () => {
    return (
        <nav className="bg-blue-500 p-4">
            <ul className="flex space-x-4">
                <li><Link to="/" className="text-white hover:text-gray-200">Dashboard</Link></li>
                {/*<li><Link to="/jobs/create" className="text-white hover:text-gray-200">Create Job</Link></li>*/}
            </ul>
        </nav>
    );
};

export default NavBar;