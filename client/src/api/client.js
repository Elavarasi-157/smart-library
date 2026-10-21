const API_BASE_URL = '/api';

function getAuthToken() {
  return localStorage.getItem('smart_library_token');
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      // If server returned plain text or HTML error message, parse cleanly
      data = { 
        success: res.ok, 
        message: text && text.length < 200 ? text.replace(/<[^>]*>?/gm, '').trim() : `Server returned status ${res.status}` 
      };
    }

    if (!res.ok) {
      const error = new Error(data?.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  get: (endpoint, params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return request(url, { method: 'GET' });
  },

  post: (endpoint, body = {}) => {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put: (endpoint, body = {}) => {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete: (endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  },

  upload: async (endpoint, formData) => {
    const token = getAuthToken();
    const headers = {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
      });

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: res.ok, message: text || 'Upload complete' };
      }

      if (!res.ok) {
        throw new Error(data?.message || `Upload failed with status ${res.status}`);
      }
      return data;
    } catch (err) {
      console.error(`Upload error on ${endpoint}:`, err);
      throw err;
    }
  }
};
