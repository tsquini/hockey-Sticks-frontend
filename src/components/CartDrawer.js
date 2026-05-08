import React, { useState } from 'react';
import { updateCartItem, removeCartItem, checkout } from '../utils/api';
import { getTeamSession, getSessionId } from '../utils/session';

export default function CartDrawer({ open, onClose, cart, onCartUpdate }) {
  const [screen, setScreen] = useState('cart');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const team = getTeamSession();

  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const total = cart.reduce((sum, i) => {
    const price = i.bulk_min_quantity && i.team_price ? parseFloat(i.team_price) : parseFloat(i.retail_price || 0);
    return sum + price * i.quantity;
  }, 0);

  async function handleQtyChange(item, delta) {
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      await removeCartItem(item.id);
    } else {
      await updateCartItem(item.id, newQty);
    }
    onCartUpdate();
  }

  async function handleRemove(item) {
    await removeCartItem(item.id);
    onCartUpdate();
  }

  function validateForm() {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Required';
    if (!form.last_name.trim()) errs.last_name = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCheckout() {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const result = await checkout({
        team_id: team.id,
        session_id: getSessionId(),
        ...form,
      });
      setOrder(result);
      setScreen('confirm');
      onCartUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (screen === 'confirm') {
      setScreen('cart');
      setForm({ first_name: '', last_name: '', email: '', phone: '' });
      setOrder(null);
    }
    onClose();
  }

  return (
    <>
      <style>{`
        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 200; opacity: 0; pointer-events: none; transition: opacity 0.25s; }
        .drawer-overlay.open { opacity: 1; pointer-events: all; }
        .drawer { position: fixed; top: 0; right: 0; height: 100vh; width: 420px; max-width: 100vw; background: #fff; z-index: 201; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); display: flex; flex-direction: column; box-shadow: -4px 0 40px rgba(0,0,0,0.12); }
        .drawer.open { transform: translateX(0); }
        .drawer-header { padding: 20px 24px; border-bottom: 1px solid #e0e0e5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .drawer-title { font-size: 17px; font-weight: 700; color: #1a1a2e; }
        .drawer-close { background: none; border: none; cursor: pointer; font-size: 22px; color: #6e6e73; padding: 4px; line-height: 1; }
        .drawer-body { flex: 1; overflow-y: auto; padding: 20px 24px; }
        .drawer-footer { padding: 20px 24px; border-top: 1px solid #e0e0e5; flex-shrink: 0; }
        .cart-empty { text-align: center; padding: 60px 0; color: #aeaeb2; font-size: 15px; }
        .cart-item { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid #f0f0f5; }
        .cart-item-img { width: 56px; height: 56px; border-radius: 10px; background: #f5f5f7; object-fit: cover; flex-shrink: 0; }
        .cart-item-info { flex: 1; min-width: 0; }
        .cart-item-name { font-size: 14px; font-weight: 600; color: #1a1a2e; margin-bottom: 2px; }
        .cart-item-variant { font-size: 12px; color: #6e6e73; margin-bottom: 6px; }
        .cart-item-price { font-size: 14px; font-weight: 700; color: #1a1a2e; }
        .cart-item-actions { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
        .qty-btn { width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid #e0e0e5; background: #fff; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #1a1a2e; line-height: 1; transition: all 0.12s; }
        .qty-btn:hover { border-color: #1a1a2e; }
        .qty-val { font-size: 14px; font-weight: 600; color: #1a1a2e; min-width: 20px; text-align: center; }
        .remove-btn { margin-left: auto; font-size: 12px; color: #aeaeb2; background: none; border: none; cursor: pointer; font-family: inherit; }
        .remove-btn:hover { color: #c0392b; }
        .cart-total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .cart-total-label { font-size: 15px; color: #6e6e73; }
        .cart-total-val { font-size: 20px; font-weight: 700; color: #1a1a2e; }
        .btn-primary { width: 100%; padding: 14px; border-radius: 12px; border: none; background: #0071e3; color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s; }
        .btn-primary:hover:not(:disabled) { opacity: 0.88; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .form-group { margin-bottom: 16px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #6e6e73; margin-bottom: 6px; }
        .form-input { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1.5px solid #e0e0e5; font-size: 15px; font-family: inherit; color: #1a1a2e; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
        .form-input:focus { border-color: #0071e3; }
        .form-input.error { border-color: #c0392b; }
        .form-error { font-size: 12px; color: #c0392b; margin-top: 4px; }
        .confirm-wrap { text-align: center; padding: 40px 0; }
        .confirm-icon { width: 56px; height: 56px; background: #e8f5e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 26px; }
        .confirm-title { font-size: 20px; font-weight: 700; color: #1a1a2e; margin-bottom: 8px; }
        .confirm-sub { font-size: 14px; color: #6e6e73; line-height: 1.5; }
        .confirm-total { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 16px 0; }
        .back-btn { background: none; border: none; cursor: pointer; font-size: 13px; color: #0071e3; font-family: inherit; padding: 0; margin-bottom: 16px; display: flex; align-items: center; gap: 4px; }
      `}</style>

      <div className={`drawer-overlay ${open ? 'open' : ''}`} onClick={handleClose} />
      <div className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">
            {screen === 'cart' && `Cart${itemCount > 0 ? ` (${itemCount})` : ''}`}
            {screen === 'checkout' && 'Your Details'}
            {screen === 'confirm' && 'Order Placed!'}
          </span>
          <button className="drawer-close" onClick={handleClose}>×</button>
        </div>

        <div className="drawer-body">
          {screen === 'cart' && (
            cart.length === 0
              ? <div className="cart-empty">Your cart is empty</div>
              : cart.map(item => {
                  const price = item.bulk_min_quantity && item.team_price ? parseFloat(item.team_price) : parseFloat(item.retail_price || 0);
                  return (
                    <div key={item.id} className="cart-item">
                      <img src={item.image_url ? `${process.env.REACT_APP_API_URL}${item.image_url}` : ""} alt={item.name} className="cart-item-img" onError={e => { e.target.style.display = 'none'; }} />
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.brand} {item.name}</div>
                        <div className="cart-item-variant">Flex {item.flex} · {item.hand === 'left' ? 'Left' : 'Right'} · {item.blade_curve}</div>
                        <div className="cart-item-price">${(price * item.quantity).toFixed(2)}</div>
                        <div className="cart-item-actions">
                          <button className="qty-btn" onClick={() => handleQtyChange(item, -1)}>−</button>
                          <span className="qty-val">{item.quantity}</span>
                          <button className="qty-btn" onClick={() => handleQtyChange(item, 1)}>+</button>
                          <button className="remove-btn" onClick={() => handleRemove(item)}>Remove</button>
                        </div>
                      </div>
                    </div>
                  );
                })
          )}

          {screen === 'checkout' && (
            <>
              <button className="back-btn" onClick={() => setScreen('cart')}>← Back to cart</button>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className={`form-input ${errors.first_name ? 'error' : ''}`} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                  {errors.first_name && <div className="form-error">{errors.first_name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className={`form-input ${errors.last_name ? 'error' : ''}`} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                  {errors.last_name && <div className="form-error">{errors.last_name}</div>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className={`form-input ${errors.email ? 'error' : ''}`} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone <span style={{ color: '#aeaeb2', fontWeight: 400 }}>(optional)</span></label>
                <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </>
          )}

          {screen === 'confirm' && (
            <div className="confirm-wrap">
              <div className="confirm-icon">✓</div>
              <div className="confirm-title">Order received!</div>
              <div className="confirm-total">${order?.total?.toFixed(2)}</div>
              <div className="confirm-sub">Thanks {form.first_name}! Your order has been placed. You'll hear from us soon.</div>
            </div>
          )}
        </div>

        <div className="drawer-footer">
          {screen === 'cart' && cart.length > 0 && (
            <>
              <div className="cart-total-row">
                <span className="cart-total-label">Total</span>
                <span className="cart-total-val">${total.toFixed(2)}</span>
              </div>
              <button className="btn-primary" onClick={() => setScreen('checkout')}>Checkout →</button>
            </>
          )}
          {screen === 'checkout' && (
            <button className="btn-primary" onClick={handleCheckout} disabled={loading}>
              {loading ? 'Placing order…' : 'Place Order →'}
            </button>
          )}
          {screen === 'confirm' && (
            <button className="btn-primary" onClick={handleClose}>Done</button>
          )}
        </div>
      </div>
    </>
  );
}
