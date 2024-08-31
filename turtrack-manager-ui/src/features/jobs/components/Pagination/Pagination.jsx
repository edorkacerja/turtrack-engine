import React from 'react';
import { Pagination as MuiPagination } from '@mui/material';
import { useDispatch, useSelector } from "react-redux";
import { setCurrentPage } from "../../redux/jobsSlice.js";

const Pagination = () => {
    const dispatch = useDispatch();
    const { currentPage, totalPages } = useSelector(state => state.jobs);

    const handleChange = (event, value) => {
        // Subtract 1 when dispatching to keep server-side 0-based
        if (value !== currentPage + 1 && value > 0 && value <= totalPages) {
            dispatch(setCurrentPage(value - 1));
        }
    };

    return (
        <MuiPagination
            count={totalPages}
            page={currentPage + 1}
            onChange={handleChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            siblingCount={1}
            boundaryCount={2}
            sx={{ marginTop: 4, display: 'flex', justifyContent: 'center' }}
        />
    );
};

export default Pagination;