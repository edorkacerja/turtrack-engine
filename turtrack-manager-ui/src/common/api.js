// src/common/api.js
export const getCsrfToken = async () => {
    const response = await fetch('http://localhost:9999/csrf', {
        method: 'GET',
        credentials: 'include', // Include cookies for CSRF
    });

    if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
    }

    console.log([...response.headers]); // Logs all headers as an array

    // Assuming the CSRF token is in the response headers
    const csrfToken = response.headers.get("x-xsrf-token");
    return csrfToken;
};

export const makeRequest = async (url, method, body) => {
    const csrfToken = await getCsrfToken();

    const response = await fetch(url, {
        method: method || 'GET',
        credentials: 'include', // Include cookies for CSRF
        headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': csrfToken, // Include CSRF token in headers
        },
        body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Request failed');
    }

    return response.json();
};
