import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import JobsDashboard from '../features/jobs/pages/JobsDashboard';
// import JobDetails from '../features/jobs/pages/JobDetails';
// import CreateJob from '../features/jobs/pages/CreateJob';

const AppRoutes = () => {
    return (
        // <Router>
            <Routes>
                <Route path="/" element={<JobsDashboard />} />
                {/*<Route path="/jobs/create" element={<CreateJob />} />*/}
                {/*<Route path="/jobs/:id" element={<JobDetails />} />*/}
            </Routes>
        // </Router>
    );
};

export default AppRoutes;