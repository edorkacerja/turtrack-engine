import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobs, setCurrentPage, updateJobStatus, updateJobProgress } from '../../redux/jobsSlice.js';
import JobList from '../../components/JobList/JobList.jsx';
import JobSearch from '../../components/JobSearch/JobSearch.jsx';
import JobFilters from '../../components/JobFilters/JobFilters.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import "./JobsDashboard.scss"

const JobsDashboard = () => {
    const dispatch = useDispatch();
    const { jobs, status, error, currentPage, itemsPerPage, totalPages } = useSelector((state) => state.jobs);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});
    const [sortBy, setSortBy] = useState('dateStarted');

    useEffect(() => {
        dispatch(fetchJobs());
    }, [dispatch, currentPage]);

    useEffect(() => {
        const interval = setInterval(() => {
            jobs.forEach(job => {
                if (job.status === 'running') {
                    const newProcessed = Math.min(job.processedItems + Math.floor(Math.random() * 5), job.totalItems);
                    const newFailed = Math.floor(Math.random() * 2);
                    dispatch(updateJobProgress({ id: job.id, processedItems: newProcessed, failedItems: job.failedItems + newFailed }));
                }
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [dispatch, jobs]);

    const handleSearch = (term) => {
        setSearchTerm(term);
        // Implement search logic here
    };

    const handleFilter = (newFilters) => {
        setFilters(newFilters);
        // Implement filter logic here
    };

    const handleSort = (key) => {
        setSortBy(key);
        // Implement sort logic here
    };

    const handlePageChange = (page) => {
        dispatch(setCurrentPage(page));
    };

    const handleJobAction = (jobId, action) => {
        let newStatus;
        switch (action) {
            case 'start':
            case 'resume':
                newStatus = 'running';
                break;
            case 'pause':
                newStatus = 'paused';
                break;
            case 'stop':
                newStatus = 'stopped';
                break;
        }
        dispatch(updateJobStatus({ jobId, status: newStatus }));
    };

    if (status === 'loading') return <div>Loading...</div>;
    if (status === 'failed') return <div>Error: {error}</div>;

    return (
        <div className="jobs-dashboard container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-4">Jobs Dashboard</h1>
            {/*<JobSearch onSearch={handleSearch} />*/}
            {/*<JobFilters onFilter={handleFilter} />*/}
            <JobList
                jobs={jobs}
                onSort={handleSort}
                sortBy={sortBy}
                onJobAction={handleJobAction}
            />
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default JobsDashboard;