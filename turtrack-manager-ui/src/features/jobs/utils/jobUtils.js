import { DateTime } from 'luxon';

export const getStatusColor = (status) => {
    const statusColors = {
        RUNNING: 'info',
        PAUSED: 'warning',
        STOPPED: 'error',
        FINISHED: 'success'
    };
    return statusColors[status] || 'default';
};

export const getJobTypeColor = (jobType) => {
    const jobTypeColors = {
        SEARCH: '#29615d',
        DAILY_RATE_AND_AVAILABILITY: '#a16e82',
        VEHICLE_DETAILS: '#774a5c',
        cleanup: 'warning'
    };
    return jobTypeColors[jobType] || 'default';
};
export const parseDate = (input) => {
    if (input === null || input === undefined) {
        return null;
    }

    // Handle date as an array of numbers
    if (Array.isArray(input) && input.length >= 7) {
        const [year, month, day, hour, minute, second, microsecond] = input;
        // Note: JavaScript months are 0-indexed, so we subtract 1 from the month
        return new Date(Date.UTC(year, month - 1, day, hour, minute, second, microsecond / 1000));
    }

    // If it's already a Date object, return it
    if (input instanceof Date) {
        return isNaN(input.getTime()) ? null : input;
    }

    // If it's a number, assume it's a timestamp
    if (typeof input === 'number') {
        const date = new Date(input);
        return isNaN(date.getTime()) ? null : date;
    }

    // If it's a string, try parsing as ISO 8601
    if (typeof input === 'string') {
        const date = new Date(input);
        return isNaN(date.getTime()) ? null : date;
    }

    // If it's none of the above, return null
    return null;
};

export const formatDate = (input) => {
    const date = parseDate(input);
    if (!date) return { date: 'Not available', time: 'Not available' };

    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });

    return {
        date: formattedDate,
        time: formattedTime,
    };
};


export const sortJobs = (jobs, sortBy, sortDirection) => {
    return [...jobs].sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
            case 'id':
                comparison = a.id.localeCompare(b.id);
                break;
            case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
            case 'jobtype':
                comparison = a.jobType.localeCompare(b.jobType);
                break;
            case 'startedat':
                const dateA = parseDate(a.startedAt);
                const dateB = parseDate(b.startedAt);
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                comparison = dateA.getTime() - dateB.getTime();
                break;
            default:
                comparison = 0;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
    });
};