const API_URL = process.env.REACT_APP_API_URL;

export async function verifyAccessCode(code) {
  const res = await fetch(`${API_URL}/public/teams/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_code: code }),
  });
  if (!res.ok) throw new Error('Invalid access code');
  return res.json();
}

export async function getProducts() {
  const res = await fetch(`${API_URL}/public/products`);
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}
