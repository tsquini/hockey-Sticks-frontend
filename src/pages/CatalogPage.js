import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, addToCart, getCart } from '../utils/api';
import { getTeamSession, clearTeamSession, getSessionId } from '../utils/session';
import CartDrawer from '../components/CartDrawer';

const CATEGORY_LABELS = { youth: 'Youth', intermediate: 'Intermediate', senior: 'Senior' };
const CATEGORY_ORDER = ['youth', 'intermediate', 'senior'];
const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f0f0f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='13' fill='%23aeaeb2'%3ENo image%3C/text%3E%3C/svg%3E";

function FilterBar({ filters, setFilters, availableCategories, availableFlex }) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">Type</span>
        <div className="filter-pills">
          {['all', 'player', 'goalie'].map(t => (
            <button key={t} className={} onClick={() => setFilters(f => ({ ...f, stick_type: t }))}>
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <span className="filter-label">Category</span>
        <div className="filter-pills">
          <button
            className={`filter-pill ${filters.category === 'all' ? 'active' : ''}`}
            onClick={() => setFilters(f => ({ ...f, category: 'all' }))}
          >All</button>
          {CATEGORY_ORDER.map(cat => (
            <button
              key={cat}
              className={`filter-pill ${filters.category === cat ? 'active' : ''} ${!availableCategories.includes(cat) ? 'dimmed' : ''}`}
              onClick={() => availableCategories.includes(cat) && setFilters(f => ({ ...f, category: cat }))}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-label">Hand</span>
        <div className="filter-pills">
          {['all', 'left', 'right'].map(h => (
            <button
              key={h}
              className={`filter-pill ${filters.hand === h ? 'active' : ''}`}
              onClick={() => setFilters(f => ({ ...f, hand: h }))}
            >
              {h === 'all' ? 'All' : h.charAt(0).toUpperCase() + h.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-label">Flex</span>
        <div className="filter-pills">
          <button
            className={`filter-pill ${filters.flex === 'all' ? 'active' : ''}`}
            onClick={() => setFilters(f => ({ ...f, flex: 'all' }))}
          >All</button>
          {availableFlex.map(flex => (
            <button
              key={flex}
              className={`filter-pill ${filters.flex === flex ? 'active' : ''}`}
              onClick={() => setFilters(f => ({ ...f, flex }))}
            >
              {flex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function VariantSelector({ variants, selected, onSelect }) {
  if (!variants.length) return <p style={{ fontSize: 13, color: '#aeaeb2' }}>No variants available</p>;
  return (
    <div className="variant-selector">
      {variants.map(v => (
        <button
          key={v.id}
          className={`variant-btn ${selected?.id === v.id ? 'active' : ''} ${v.stock_quantity === 0 ? 'out' : ''}`}
          onClick={() => onSelect(v)}
          disabled={v.stock_quantity === 0}
        >
          <span className="variant-flex">{v.flex}</span>
          <span className="variant-detail">{v.hand[0].toUpperCase() === "L" ? "Left" : "Right"} · {v.blade_curve}</span>
          {v.stock_quantity === 0 && <span className="variant-oos">Out</span>}
        </button>
      ))}
    </div>
  );
}

function ProductCard({ product, activeFilters, onAddToCart }) {
  const [selectedVariant, setSelectedVariant] = useState(null);

  const visibleVariants = useMemo(() => product.variants.filter(v => {
    if (activeFilters.hand !== 'all' && v.hand !== activeFilters.hand) return false;
    if (activeFilters.flex !== 'all' && String(v.flex) !== String(activeFilters.flex)) return false;
    return true;
  }), [product.variants, activeFilters]);

  useEffect(() => {
    if (visibleVariants.length > 0) {
      setSelectedVariant(v =>
        (v && visibleVariants.find(vv => vv.id === v.id))
          ? v
          : (visibleVariants.find(vv => vv.stock_quantity > 0) || visibleVariants[0])
      );
    } else {
      setSelectedVariant(null);
    }
  }, [visibleVariants]);

  if (visibleVariants.length === 0) return null;

  return (
    <div className="product-card">
      <div className="product-img-wrap">
        <img src={product.image_url ? `${process.env.REACT_APP_API_URL}${product.image_url}` : PLACEHOLDER_IMG} alt={product.name} className="product-img" onError={e => { e.target.src = PLACEHOLDER_IMG; }} />
      </div>
      <div className="product-info">
        <p className="product-brand">{product.brand}</p>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-model">{product.model}</p>
        <div className="product-pricing">
          {product.retail_price && (
            <div className="price-retail">${parseFloat(product.retail_price).toFixed(2)}</div>
          )}
          {product.team_price && product.bulk_min_quantity && (
            <>
              <div className="price-bulk">${parseFloat(product.team_price).toFixed(2)}</div>
              <div className="price-bulk-label">{product.bulk_min_quantity}+ units to unlock bulk price</div>
              <div className="bulk-progress-wrap">
                <div className="bulk-progress-bar">
                  <div className="bulk-progress-fill" style={{ width: `${Math.min(100, Math.round(((product.bulk_ordered_all || 0) / product.bulk_min_quantity) * 100))}%` }} />
                </div>
                <div className="bulk-progress-label">
                  <span>{product.bulk_ordered_all || 0} of {product.bulk_min_quantity} ordered across all teams</span>
                  {(product.bulk_ordered_team || 0) > 0 && <span className="bulk-team-count"> · Your team: {product.bulk_ordered_team}</span>}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="product-variants-section">
          <p className="variants-heading">Select Configuration</p>
          <VariantSelector variants={visibleVariants} selected={selectedVariant} onSelect={setSelectedVariant} />
        </div>
        <button
          className="add-to-cart-btn"
          disabled={!selectedVariant || selectedVariant.stock_quantity === 0}
          onClick={() => selectedVariant && onAddToCart(selectedVariant.id)}
        >
          {!selectedVariant || selectedVariant.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ category: 'all', hand: 'all', flex: 'all', stick_type: 'all' });
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();
  const team = getTeamSession();

  async function loadCart() {
    try {
      const data = await getCart(team.id, getSessionId());
      setCartItems(data.items || []);
    } catch {}
  }

  async function handleAddToCart(variantId) {
    await addToCart(team.id, getSessionId(), variantId);
    await loadCart();
    setCartOpen(true);
  }

  useEffect(() => { loadCart(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getProducts(team?.id).then(setProducts).catch(() => setError('Failed to load products. Please refresh.')).finally(() => setLoading(false)); // eslint-disable-line react-hooks/exhaustive-deps
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSignOut() { clearTeamSession(); navigate('/'); }

  // Flex values available given current category + hand filters (ignoring flex filter itself)
  const availableFlex = useMemo(() => {
    const s = new Set();
    products.forEach(p => {
      if (filters.category !== 'all' && p.category !== filters.category) return;
      p.variants.forEach(v => {
        if (filters.hand !== 'all' && v.hand !== filters.hand) return;
        s.add(v.flex);
      });
    });
    return [...s].sort((a, b) => Number(a) - Number(b));
  }, [products, filters.category, filters.hand]);

  // Categories available given current flex + hand filters (ignoring category filter itself)
  const availableCategories = useMemo(() => {
    const cats = new Set();
    products.forEach(p => {
      const matches = p.variants.some(v => {
        if (filters.hand !== 'all' && v.hand !== filters.hand) return false;
        if (filters.flex !== 'all' && String(v.flex) !== String(filters.flex)) return false;
        return true;
      });
      if (matches) cats.add(p.category);
    });
    return [...cats];
  }, [products, filters.flex, filters.hand]);

  // Auto-clear category if it becomes unavailable
  useEffect(() => {
    if (filters.category !== 'all' && !availableCategories.includes(filters.category)) {
      setFilters(f => ({ ...f, category: 'all' }));
    }
  }, [availableCategories, filters.category]);

  // Auto-clear flex if it becomes unavailable
  useEffect(() => {
    if (filters.flex !== 'all' && !availableFlex.includes(filters.flex)) {
      setFilters(f => ({ ...f, flex: 'all' }));
    }
  }, [availableFlex, filters.flex]);

  const filtered = useMemo(() => products.filter(p => {
    if (filters.category !== 'all' && p.category !== filters.category) return false;
    if (filters.stick_type !== 'all' && p.stick_type !== filters.stick_type) return false;
    return p.variants.some(v => {
      if (filters.hand !== 'all' && v.hand !== filters.hand) return false;
      if (filters.flex !== 'all' && String(v.flex) !== String(filters.flex)) return false;
      return true;
    });
  }), [products, filters]);

  const grouped = useMemo(() => {
    const g = {};
    CATEGORY_ORDER.forEach(cat => {
      const items = filtered.filter(p => p.category === cat);
      if (items.length) g[cat] = items;
    });
    return g;
  }, [filtered]);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F5F5F7; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; min-height: 100vh; }
        .catalog-root { min-height: 100vh; }
        .catalog-header { background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.07); position: sticky; top: 0; z-index: 100; padding: 0 24px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
        .header-left { display: flex; align-items: center; gap: 10px; }
        .header-logo { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .header-logo svg { width: 18px; height: 18px; }
        .header-team { font-size: 15px; font-weight: 600; color: #1a1a2e; }
        .signout-btn { font-size: 13px; color: #6e6e73; background: none; border: none; cursor: pointer; font-family: inherit; padding: 4px 8px; border-radius: 6px; transition: background 0.12s; }
        .signout-btn:hover { background: #f0f0f5; color: #1a1a2e; }
        .cart-btn { position: relative; background: none; border: none; cursor: pointer; color: #1a1a2e; padding: 6px; display: flex; align-items: center; justify-content: center; border-radius: 8px; transition: background 0.12s; }
        .cart-btn:hover { background: #f0f0f5; }
        .cart-count { position: absolute; top: -2px; right: -2px; background: #0071e3; color: #fff; font-size: 10px; font-weight: 700; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .filter-bar { background: #fff; border-bottom: 1px solid rgba(0,0,0,0.06); padding: 16px 24px; display: flex; flex-wrap: wrap; gap: 20px; align-items: center; }
        .filter-group { display: flex; align-items: center; gap: 10px; }
        .filter-label { font-size: 12px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #aeaeb2; white-space: nowrap; }
        .filter-pills { display: flex; flex-wrap: wrap; gap: 6px; }
        .filter-pill { padding: 5px 14px; border-radius: 100px; border: 1.5px solid #e0e0e5; background: #fff; font-size: 13px; font-weight: 500; color: #3a3a3c; cursor: pointer; transition: all 0.12s; font-family: inherit; }
        .filter-pill:hover { border-color: #1a1a2e; color: #1a1a2e; }
        .filter-pill.active { background: #1a1a2e; border-color: #1a1a2e; color: #fff; }
        .filter-pill.dimmed { opacity: 0.35; cursor: not-allowed; }
        .filter-pill.dimmed:hover { border-color: #e0e0e5; color: #3a3a3c; }
        .catalog-body { padding: 40px 24px 80px; }
        .catalog-loading, .catalog-error { text-align: center; padding: 80px 24px; color: #6e6e73; font-size: 15px; }
        .catalog-error { color: #c0392b; }
        .category-section { margin-bottom: 56px; }
        .category-heading { font-size: 22px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.3px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #1a1a2e; display: flex; align-items: center; gap: 10px; }
        .category-count { font-size: 13px; font-weight: 500; color: #aeaeb2; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .product-card { background: #fff; border-radius: 20px; box-shadow: 0 2px 20px rgba(0,0,0,0.06); overflow: hidden; display: flex; flex-direction: column; transition: box-shadow 0.2s, transform 0.2s; }
        .product-card:hover { box-shadow: 0 8px 40px rgba(0,0,0,0.11); transform: translateY(-2px); }
        .product-img-wrap { background: #f5f5f7; aspect-ratio: 4/3; overflow: hidden; }
        .product-img { width: 100%; height: 100%; object-fit: cover; }
        .product-info { padding: 20px; display: flex; flex-direction: column; flex: 1; }
        .product-brand { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #aeaeb2; margin-bottom: 4px; }
        .product-name { font-size: 17px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.2px; margin-bottom: 2px; }
        .product-model { font-size: 13px; color: #6e6e73; margin-bottom: 8px; }
        .product-pricing { margin-bottom: 14px; }
        .price-retail { font-size: 13px; font-weight: 500; color: #aeaeb2; text-decoration: line-through; line-height: 1.2; }
        .price-bulk { font-size: 24px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.3px; margin-top: 2px; }
        .price-bulk-label { font-size: 12px; color: #2e7d32; font-weight: 600; margin-bottom: 8px; }
        .bulk-progress-wrap { margin-top: 6px; }
        .bulk-progress-bar { height: 6px; background: #e0e0e5; border-radius: 100px; overflow: hidden; margin-bottom: 4px; }
        .bulk-progress-fill { height: 100%; background: #0071e3; border-radius: 100px; transition: width 0.4s ease; }
        .bulk-progress-label { font-size: 11px; color: #6e6e73; font-weight: 500; }
        .bulk-unlocked { color: #2e7d32; font-weight: 700; } .bulk-team-count { color: #0071e3; font-weight: 600; }
        .product-variants-section { margin-bottom: 16px; flex: 1; }
        .variants-heading { font-size: 11px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #aeaeb2; margin-bottom: 8px; }
        .variant-selector { display: flex; flex-direction: column; gap: 6px; }
        .variant-btn { padding: 10px 14px; border-radius: 8px; border: 1.5px solid #e0e0e5; background: #fff; cursor: pointer; font-family: inherit; transition: all 0.12s; position: relative; width: 100%; display: flex; flex-direction: row; align-items: center; justify-content: space-between; }
        .variant-btn:hover:not(:disabled) { border-color: #1a1a2e; }
        .variant-btn.active { background: #1a1a2e; border-color: #1a1a2e; }
        .variant-btn.active .variant-flex, .variant-btn.active .variant-detail { color: #fff; } .variant-btn.active .variant-curve { color: #fff; }
        .variant-btn.out { opacity: 0.45; cursor: not-allowed; }
        .variant-flex { font-size: 16px; font-weight: 700; color: #1a1a2e; }
        .variant-detail { font-size: 15px; color: #6e6e73; margin-left: auto; text-align: right; }
        .variant-oos { position: absolute; top: 3px; right: 4px; font-size: 9px; font-weight: 700; color: #c0392b; letter-spacing: 0.05em; text-transform: uppercase; }
        .add-to-cart-btn { width: 100%; padding: 13px; border-radius: 12px; border: none; background: #0071e3; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: opacity 0.15s, transform 0.1s; }
        .add-to-cart-btn:hover:not(:disabled) { opacity: 0.85; }
        .add-to-cart-btn:active:not(:disabled) { transform: scale(0.98); }
        .add-to-cart-btn:disabled { background: #e0e0e5; color: #aeaeb2; cursor: not-allowed; }
        .empty-state { text-align: center; padding: 60px 24px; color: #aeaeb2; font-size: 15px; }
        @media (max-width: 600px) { .filter-bar { padding: 14px 16px; gap: 14px; } .catalog-body { padding: 28px 16px 80px; } .filter-group { flex-direction: column; align-items: flex-start; gap: 6px; } }
      `}</style>
      <div className="catalog-root">
        <header className="catalog-header">
          <div className="header-left">
            <div className="header-logo">
              {team && team.logo_url
                ? <img src={process.env.REACT_APP_API_URL + team.logo_url} alt={team.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                : <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19 C4 19 8 13 12 13 C16 13 20 19 20 19" />
                    <path d="M2 17 L22 17" />
                    <circle cx="12" cy="8" r="3" />
                  </svg>}
            </div>
            <span className="header-team">{team?.name || 'Team Store'}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button className="cart-btn" onClick={() => setCartOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              {cartItems.length > 0 && <span className="cart-count">{cartItems.reduce((s,i) => s+i.quantity,0)}</span>}
            </button>
            <button className="signout-btn" onClick={handleSignOut}>Sign out</button>
          </div>
        </header>

        <FilterBar
          filters={filters}
          setFilters={setFilters}
          availableCategories={availableCategories}
          availableFlex={availableFlex}
        />

        <div className="catalog-body">
          {loading && <div className="catalog-loading">Loading products…</div>}
          {error && <div className="catalog-error">{error}</div>}
          {!loading && !error && Object.keys(grouped).length === 0 && (
            <div className="empty-state">No products match your filters.</div>
          )}
          {!loading && !error && Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="category-section">
              <h2 className="category-heading">
                {CATEGORY_LABELS[cat]}
                <span className="category-count">{items.length} {items.length === 1 ? 'product' : 'products'}</span>
              </h2>
              <div className="products-grid">
                {items.map(p => <ProductCard key={p.id} product={p} activeFilters={filters} onAddToCart={handleAddToCart} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cartItems} onCartUpdate={loadCart} />
    </>
  );
}
