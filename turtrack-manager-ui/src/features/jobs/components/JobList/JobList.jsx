import React, {useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    LinearProgress, IconButton, Tooltip, Typography, Chip, Box,
    TablePagination, TableSortLabel
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    CalendarToday as CalendarIcon,
    AccessTime as ClockIcon
} from '@mui/icons-material';
import {
    fetchJobs,
    setCurrentPage,
    setItemsPerPage,
    setSorting,
    updateJobProgress,
    updateJobStatus
} from '../../redux/jobsSlice';
import { getStatusColor, getJobTypeColor, formatDate } from '../../utils/jobUtils';
import ProgressBar from "@ramonak/react-progress-bar";

const JobList = () => {
    const dispatch = useDispatch();
    const { jobs, status, error, currentPage, itemsPerPage, totalElements, sortBy, sortDirection } = useSelector(state => state.jobs);


    useEffect(() => {
        dispatch(fetchJobs());
    }, [dispatch, currentPage, sortBy, sortDirection]);

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


    const handleChangePage = (event, newPage) => {
        dispatch(setCurrentPage(newPage));
    };

    const handleChangeRowsPerPage = (event) => {
        const newItemsPerPage = parseInt(event.target.value, 10);
        dispatch(setItemsPerPage(newItemsPerPage));
        dispatch(setCurrentPage(0));
    };

    const handleSort = (column) => {
        const isAsc = sortBy === column && sortDirection === 'asc';
        dispatch(setSorting({ sortBy: column, sortDirection: isAsc ? 'desc' : 'asc' }));
    };

    const handleJobAction = (jobId, action) => {
        dispatch(updateJobStatus({ jobId, status: action }))
            .then(() => dispatch(fetchJobs()));  // Re-fetch jobs after status update
    };

    const renderActionButtons = (job) => {
        const actionMap = {
            'RUNNING': {
                icon: <StopIcon />,
                color: "error",
                tooltip: "Stop",
                action: "STOPPED"
            },
            'STOPPED': {
                icon: <PlayIcon />,
                color: "success",
                tooltip: "Start",
                action: "RUNNING"
            }
        };
        const { icon, color, tooltip, action } = actionMap[job.status] || {};
        return (
            icon && (
                <Tooltip title={tooltip}>
                    <IconButton onClick={() => handleJobAction(job.id, action)} color={color} size="small">
                        {icon}
                    </IconButton>
                </Tooltip>
            )
        );
    };

    const renderProgress = ({ totalItems, completedItems, failedItems = 0, percentCompleted, isRunning }) => {
        if (!totalItems || !percentCompleted) return <Typography variant="body2" color="text.secondary">Progress not available</Typography>;

        return (
            <Box sx={{ width: '100%', mt: 1 }}>
                <ProgressBar
                    completed={percentCompleted}
                    customLabel={`${percentCompleted.toFixed(1)}%`}
                    bgColor="#4caf50"
                    baseBgColor="#ffcccb"
                    height="20px"
                    width="100%"
                    borderRadius="10px"
                    labelAlignment="center"
                    labelColor="#ffffff"
                    labelSize="14px"
                    animateOnRender={true}
                    maxCompleted={100}
                    customLabelStyles={{
                        fontWeight: 'bold',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                    }}
                    barContainerClassName={isRunning ? "running" : ""}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="success.main">Succeeded: {completedItems}</Typography>
                    <Typography variant="body2" color="error.main">Failed: {failedItems}</Typography>
                    <Typography variant="body2" color="text.secondary">Total: {totalItems}</Typography>
                </Box>
            </Box>
        );
    };


    const renderDateTime = (startedAt) => {
        const { date, time } = formatDate(startedAt);
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{date}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ClockIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{time}</Typography>
                </Box>
            </Box>
        );
    };

    if (status === 'loading') return <LinearProgress />;
    if (status === 'failed') return <Typography color="error">Error: {error}</Typography>;

    return (
        <Paper>
            <TableContainer>
                <Table aria-label="job list">
                    <TableHead>
                        <TableRow>
                            {['id', 'createdAt', 'status', 'jobType', 'startedAt', 'completedAt'].map((column) => (
                                <TableCell key={column}>
                                    <TableSortLabel
                                        active={sortBy === column}
                                        direction={sortBy === column ? sortDirection : 'asc'}
                                        onClick={() => handleSort(column)}
                                    >
                                        {column.charAt(0).toUpperCase() + column.slice(1)}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                            <TableCell>Progress</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {jobs.map((job) => (
                            <TableRow key={job.id}>
                                <TableCell>{job.id}</TableCell>
                                <TableCell>{renderDateTime(job.createdAt)}</TableCell>
                                <TableCell>
                                    <Chip label={job.status} color={getStatusColor(job.status)} size="small" />
                                </TableCell>
                                <TableCell>
                                    <Chip label={job.jobType} sx={{ backgroundColor: getJobTypeColor(job.jobType), color: 'white' }} size="small" />
                                </TableCell>
                                <TableCell>{renderDateTime(job.startedAt)}</TableCell>
                                <TableCell>{renderDateTime(job.finishedAt)}</TableCell>
                                <TableCell>{renderProgress(job)}</TableCell>
                                <TableCell>{renderActionButtons(job)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalElements}
                rowsPerPage={itemsPerPage}
                page={currentPage}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
};

export default JobList;
