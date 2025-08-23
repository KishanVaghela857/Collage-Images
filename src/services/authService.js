const API_URL = 'http://localhost:5000/api/auth';

export async function loginUser(credentials) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  return await res.json();
}
