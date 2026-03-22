export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const buildApiUrl = (path) => `${API_BASE_URL}${path}`;

export const apiFetch = async (url, options = {}, onUnauthorized) => {
  const userEmail = localStorage.getItem('userEmail');
  const headers = {
    ...(options.headers || {}),
    ...(userEmail ? { 'X-User-Email': userEmail } : {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('userEmail');
    if (onUnauthorized) onUnauthorized();
    throw new Error('Unauthorized');
  }

  return response;
};
