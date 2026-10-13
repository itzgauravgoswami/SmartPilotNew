const BASE_URL = import.meta.env.VITE_API_URL || '';

const handleResponse = async (response) => {
  let resData = {};
  try {
    resData = await response.json();
  } catch (_) {
    // Handle non-JSON response body safely
  }

  if (!response.ok) {
    if (response.status === 401) {
      setToken(null);
      setLoggedIn(false);
    }
    throw new Error(resData.message || `Request failed with status ${response.status}`);
  }
  return resData;
};

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

    return handleResponse(response);
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

    return handleResponse(response);
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

    return handleResponse(response);
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

    return handleResponse(response);
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
