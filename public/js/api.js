/**
 * API client module - handles all HTTP communication with the backend
 */
const API = (() => {
    const BASE = '/api';

    const getToken = () => localStorage.getItem('token');
    const setToken = (token) => localStorage.setItem('token', token);
    const removeToken = () => localStorage.removeItem('token');
    const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');
    const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
    const removeUser = () => localStorage.removeItem('user');

    const isLoggedIn = () => !!getToken();

    /**
     * Core fetch wrapper with auth headers
     */
    const request = async (endpoint, options = {}) => {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        const token = getToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        const response = await fetch(`${BASE}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw { status: response.status, ...data };
        }

        return data;
    };

    return {
        // Auth
        login: (body) => request('/auth/login', { method: 'POST', body }),
        register: (body) => request('/auth/register', { method: 'POST', body }),
        getMe: () => request('/auth/me'),

        // Orders
        createOrder: (body) => request('/orders', { method: 'POST', body }),
        getOrders: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return request(`/orders${query ? '?' + query : ''}`);
        },
        getOrder: (orderId) => request(`/orders/${orderId}`),
        updateStatus: (orderId, status) => request(`/orders/${orderId}/status`, { method: 'PATCH', body: { status } }),
        deleteOrder: (orderId) => request(`/orders/${orderId}`, { method: 'DELETE' }),

        // Dashboard
        getDashboard: () => request('/dashboard'),

        // Garments
        getGarments: () => request('/garments'),

        // Token management
        getToken, setToken, removeToken,
        getUser, setUser, removeUser,
        isLoggedIn,
    };
})();
