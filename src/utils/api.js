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

export async function getCart(teamId, sessionId) {
  const res = await fetch(`${API_URL}/public/cart?team_id=${teamId}&session_id=${sessionId}`);
  if (!res.ok) throw new Error('Failed to get cart');
  return res.json();
}

export async function addToCart(teamId, sessionId, variantId, quantity = 1) {
  const res = await fetch(`${API_URL}/public/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team_id: teamId, session_id: sessionId, variant_id: variantId, quantity }),
  });
  if (!res.ok) throw new Error('Failed to add to cart');
  return res.json();
}

export async function updateCartItem(itemId, quantity) {
  const res = await fetch(`${API_URL}/public/cart/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Failed to update cart item');
  return res.json();
}

export async function removeCartItem(itemId) {
  const res = await fetch(`${API_URL}/public/cart/items/${itemId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove cart item');
  return res.json();
}

export async function createPaymentIntent(data) {
  const res = await fetch(`${API_URL}/public/checkout/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create payment');
  }
  return res.json();
}

export async function confirmCheckout(data) {
  const res = await fetch(`${API_URL}/public/checkout/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Checkout failed');
  }
  return res.json();
}
