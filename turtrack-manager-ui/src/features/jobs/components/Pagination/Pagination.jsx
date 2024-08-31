import React from 'react';
import { Pagination as MuiPagination } from '@mui/material';
import {useDispatch, useSelector} from "react-redux";
import {setCurrentPage} from "../../redux/jobsSlice.js";

const Pagination = () => {

    const dispatch = useDispatch();
    const {currentPage, totalPages} = useSelector(state => state.jobs);

    const handleChange = (event, value) => {
        if (value !== currentPage && value > 0 && value <= totalPages) {
            dispatch(setCurrentPage(value));
        }
    };

    return (
        <MuiPagination
            count={totalPages}
            page={currentPage}
            onChange={handleChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            siblingCount={1}  // Adjust the number of sibling pages to show
            boundaryCount={2}  // Adjust the number of boundary pages to show
            sx={{ marginTop: 4, display: 'flex', justifyContent: 'center' }}
        />
    );
};

export default Pagination;
