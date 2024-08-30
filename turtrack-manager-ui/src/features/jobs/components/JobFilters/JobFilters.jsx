import React, { useState } from 'react';

const JobFilters = ({ onFilter }) => {
    const [filters, setFilters] = useState({
        status: '',
        dateRange: '',
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    const applyFilters = () => {
        onFilter(filters);
    };

    return (
        <div className="mb-4 flex items-center space-x-4">
            <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">All Statuses</option>
                <option value="running">Running</option>
                <option value="paused">Paused</option>
                <option value="stopped">Stopped</option>
            </select>
            <select
                name="dateRange"
                value={filters.dateRange}
                onChange={handleFilterChange}
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
            </select>
            <button
                onClick={applyFilters}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
                Apply Filters
            </button>
        </div>
    );
};

export default JobFilters;