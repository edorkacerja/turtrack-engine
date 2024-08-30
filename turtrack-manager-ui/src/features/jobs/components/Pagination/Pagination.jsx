import React from 'react';
import { Pagination as MuiPagination } from '@mui/material';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const handleChange = (event, value) => {
        onPageChange(value);
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
            sx={{ marginTop: 4, display: 'flex', justifyContent: 'center' }}
        />
    );
};

export default Pagination;