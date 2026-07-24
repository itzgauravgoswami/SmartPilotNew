const BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = {
  post: async (path, data) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/api${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.message || 'API request failed');
    }
    return resData;
  },

  get: async (path) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/api${path}`, {
      method: 'GET',
      headers,
    });

    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.message || 'API request failed');
    }
    return resData;
  },

  put: async (path, data) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/api${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.message || 'API request failed');
    }
    return resData;
  },

  delete: async (path) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/api${path}`, {
      method: 'DELETE',
      headers,
    });

    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.message || 'API request failed');
    }
    return resData;
  },
};

export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function setLoggedIn(loggedIn) {
  localStorage.setItem('loggedIn', loggedIn ? 'true' : 'false');
}
