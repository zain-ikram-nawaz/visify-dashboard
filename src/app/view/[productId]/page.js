'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '../../../../lib/api';

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    const contentType = response.headers.get('content-type') || 'unknown content type';
    throw new Error(`API returned a non-JSON response (${response.status}, ${contentType}). Check NEXT_PUBLIC_API_URL.`);
  }
}

/* ─── Icons ───────────────────────────────────────────────────────────────── */
function IconRotate() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}
function IconShare() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}
function IconCube() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7B5CF5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function ViewerPage() {
  const { productId } = useParams();
  const searchParams = useSearchParams();
  const apiKey = searchParams.get('key');

  const viewerRef = useRef(null);
  const scriptInjected = useRef(false);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedParts, setSelectedParts] = useState({});
  const [selectedVariants, setSelectedVariants] = useState({});
  const [copied, setCopied] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);


  useEffect(() => {
    if (!productId || !apiKey) return;
    fetch(`${API_BASE_URL}/public/products/${productId}`, {
      headers: { 'X-API-Key': apiKey },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Product not found');
        return readJsonResponse(r);
      })
      .then((data) => {
        setProduct(data.product);
       
        const defaults = {};
        (data.product.parts || []).forEach((p) => {
          if (p.isDefault) defaults[p._id] = true;
        });
        setSelectedParts(defaults);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [productId, apiKey]);

  /* Inject viewer script once product is loaded */
  useEffect(() => {
    if (!product || scriptInjected.current || !viewerRef.current) return;
    scriptInjected.current = true;

    const viewerBaseUrl = (process.env.NEXT_PUBLIC_VIEWER_URL || 'https://viewer.zingcalc.com').replace(/\/$/, '');
    const viewerScriptPath =
      viewerBaseUrl.includes('localhost') || viewerBaseUrl.includes('127.0.0.1')
        ? '/src/index.js'
        : '/embed.iife.js';

    const el = viewerRef.current;
    el.setAttribute('data-api-key', apiKey);
    el.setAttribute('data-product-id', productId);

    // The viewer script reads these globals (not the data-* attributes above)
    // to decide which product to fetch — must be set before it loads.
    window.VISIFY_API_URL = API_BASE_URL;
    window.VISIFY_API_KEY = apiKey;
    window.VISIFY_SHOP_DOMAIN = product.shopDomain || '';
    window.VISIFY_PRODUCT_ID = product.shopifyHandle || productId;
    window.VISIFY_CONFIGURATOR_ID = productId;

    const script = document.createElement('script');
    script.src = `${viewerBaseUrl}${viewerScriptPath}`;
    script.type = 'module';
    script.onload = () => setViewerReady(true);
    document.body.appendChild(script);
  }, [product, apiKey, productId]);

  /* Calculated price */
  const total = (() => {
    if (!product) return 0;
    let t = product.basePrice || 0;
    Object.entries(selectedVariants).forEach(([partId, variantId]) => {
      const part = (product.parts || []).find((p) => p._id === partId);
      const v = part?.variants?.find((v) => v._id === variantId);
      if (v?.priceModifier) t += v.priceModifier;
    });
    Object.entries(selectedParts).forEach(([partId, on]) => {
      if (!on) return;
      const part = (product.parts || []).find((p) => p._id === partId);
      if (part?.basePrice) t += part.basePrice;
    });
    return t;
  })();

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  /* ── Screens ── */
  const missingParams = !productId || !apiKey;
  const displayError = error || (missingParams ? 'Missing product ID or API key.' : null);
  if (loading && !missingParams) return <LoadingScreen />;
  if (displayError) return <ErrorScreen message={displayError} />;
  if (!product) return null;

  const steps = buildSteps(product);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#06060C',
      color: '#E4E4F0',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      overflow: 'hidden',
    }}>

      {/* ── Top bar ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        height: '52px',
        borderBottom: '1px solid #1A1A2E',
        background: '#06060C',
        zIndex: 10,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IconCube />
          <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.12em', color: '#E4E4F0' }}>
            VI<span style={{ color: '#7B5CF5' }}>SI</span>FY
          </span>
        </div>

        <span style={{ fontSize: '13px', color: '#6B6B85', fontWeight: '500' }}>
          {product.name}
        </span>

        <button
          onClick={handleShare}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(123,92,245,0.08)',
            border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : '#22223A'}`,
            borderRadius: '6px',
            color: copied ? '#34D399' : '#A78BFA',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
        >
          {copied ? <IconCheck /> : <IconShare />}
          {copied ? 'Copied' : 'Share'}
        </button>
      </header>

      {/* ── Body: canvas + panel ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── 3D Canvas ── */}
        <div style={{ position: 'relative', flex: 1 }}>
          {/* Viewer mount point */}
          <div
            id="visify-configurator"
            ref={viewerRef}
            style={{ width: '100%', height: '100%', background: '#06060C' }}
          />

          {/* Loading overlay until viewer is ready */}
          {!viewerReady && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: '#06060C',
              gap: '20px',
            }}>
              <CanvasPlaceholder />
            </div>
          )}

          {/* Rotate hint */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '7px 14px',
            background: 'rgba(14,14,26,0.7)',
            border: '1px solid #1A1A2E',
            borderRadius: '20px',
            color: '#6B6B85',
            fontSize: '11px',
            fontWeight: '500',
            backdropFilter: 'blur(8px)',
            letterSpacing: '0.03em',
          }}>
            <IconRotate />
            Drag to rotate · Scroll to zoom
          </div>
        </div>

        {/* ── Configurator panel ── */}
        <aside style={{
          width: '340px',
          flexShrink: 0,
          background: '#0A0A16',
          borderLeft: '1px solid #1A1A2E',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Product identity */}
          <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #1A1A2E' }}>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#E4E4F0', lineHeight: 1.2, marginBottom: '6px' }}>
              {product.name}
            </h1>
            {product.description && (
              <p style={{ fontSize: '12px', color: '#6B6B85', lineHeight: 1.5 }}>{product.description}</p>
            )}
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: '#E4E4F0', fontVariantNumeric: 'tabular-nums' }}>
                ${total.toLocaleString()}
              </span>
              <span style={{ fontSize: '12px', color: '#6B6B85' }}>configured total</span>
            </div>
          </div>

          {/* Steps scroll area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {steps.map((step, i) => (
              <StepBlock
                key={i}
                step={step}
                index={i}
                isActive={activeStep === i}
                onActivate={() => setActiveStep(i)}
                selectedParts={selectedParts}
                setSelectedParts={setSelectedParts}
                selectedVariants={selectedVariants}
                setSelectedVariants={setSelectedVariants}
              />
            ))}
          </div>

          {/* CTA */}
          <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #1A1A2E' }}>
            <PriceLine product={product} selectedParts={selectedParts} selectedVariants={selectedVariants} total={total} />
            <button
              style={{
                width: '100%',
                padding: '14px',
                background: '#7B5CF5',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                letterSpacing: '0.02em',
                marginTop: '12px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(123,92,245,0.9)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#7B5CF5'; }}
            >
              Add to Cart — ${total.toLocaleString()}
            </button>
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#3A3A52', marginTop: '10px' }}>
              Powered by Visify
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ─── Step builder ────────────────────────────────────────────────────────── */
function buildSteps(product) {
  const steps = [];

  /* Parts step */
  if (product.parts?.length > 0) {
    const byCategory = {};
    product.parts.forEach((p) => {
      const cat = p.category || 'general';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(p);
    });
    Object.entries(byCategory).forEach(([cat, parts]) => {
      steps.push({ type: 'parts', label: cat.charAt(0).toUpperCase() + cat.slice(1), parts });
    });
  }

  /* Variant steps per part */
  (product.parts || []).forEach((part) => {
    if (part.variants?.length > 0) {
      const colorVars = part.variants.filter((v) => v.type === 'color');
      const textureVars = part.variants.filter((v) => v.type === 'texture');
      if (colorVars.length > 0) steps.push({ type: 'variants', label: `${part.name} Color`, partId: part._id, variants: colorVars });
      if (textureVars.length > 0) steps.push({ type: 'variants', label: `${part.name} Texture`, partId: part._id, variants: textureVars });
    }
  });

  /* Fallback if no parts */
  if (steps.length === 0) {
    steps.push({ type: 'info', label: 'Product' });
  }

  return steps;
}

/* ─── Step Block ──────────────────────────────────────────────────────────── */
function StepBlock({ step, index, isActive, onActivate, selectedParts, setSelectedParts, selectedVariants, setSelectedVariants }) {
  const num = String(index + 1).padStart(2, '0');

  return (
    <div style={{ borderBottom: '1px solid #14141F' }}>
      {/* Step header */}
      <button
        onClick={onActivate}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 24px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{
          fontSize: '10px',
          fontWeight: '700',
          color: isActive ? '#7B5CF5' : '#3A3A52',
          letterSpacing: '0.08em',
          fontVariantNumeric: 'tabular-nums',
          transition: 'color 0.15s',
          flexShrink: 0,
        }}>
          {num}
        </span>
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          color: isActive ? '#E4E4F0' : '#6B6B85',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          transition: 'color 0.15s',
        }}>
          {step.label}
        </span>
        <span style={{
          marginLeft: 'auto',
          width: '5px',
          height: '5px',
          borderRight: `1.5px solid ${isActive ? '#7B5CF5' : '#3A3A52'}`,
          borderBottom: `1.5px solid ${isActive ? '#7B5CF5' : '#3A3A52'}`,
          transform: isActive ? 'rotate(225deg) translateY(-2px)' : 'rotate(45deg)',
          transition: 'all 0.2s',
          flexShrink: 0,
        }} />
      </button>

      {/* Step content */}
      {isActive && (
        <div style={{ padding: '4px 24px 20px' }}>
          {step.type === 'parts' && (
            <PartsSelector
              parts={step.parts}
              selectedParts={selectedParts}
              setSelectedParts={setSelectedParts}
            />
          )}
          {step.type === 'variants' && (
            <VariantsSelector
              variants={step.variants}
              partId={step.partId}
              selectedVariants={selectedVariants}
              setSelectedVariants={setSelectedVariants}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Parts selector ──────────────────────────────────────────────────────── */
function PartsSelector({ parts, selectedParts, setSelectedParts }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {parts.map((part) => {
        const on = !!selectedParts[part._id];
        return (
          <button
            key={part._id}
            onClick={() => setSelectedParts((prev) => ({ ...prev, [part._id]: !on }))}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: on ? 'rgba(123,92,245,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${on ? 'rgba(123,92,245,0.4)' : '#1A1A2E'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: on ? '#E4E4F0' : '#6B6B85', marginBottom: '2px' }}>
                {part.name}
              </p>
              {part.basePrice > 0 && (
                <p style={{ fontSize: '11px', color: on ? '#A78BFA' : '#3A3A52' }}>
                  +${part.basePrice}
                </p>
              )}
            </div>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: `1.5px solid ${on ? '#7B5CF5' : '#22223A'}`,
              background: on ? '#7B5CF5' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}>
              {on && <IconCheck />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Variants selector ───────────────────────────────────────────────────── */
function VariantsSelector({ variants, partId, selectedVariants, setSelectedVariants }) {
  const selected = selectedVariants[partId];
  const activeVariant = variants.find((v) => v._id === selected);

  const isColor = variants[0]?.type === 'color';

  if (isColor) {
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          {variants.map((v) => {
            const isSelected = selected === v._id;
            return (
              <button
                key={v._id}
                title={v.label}
                onClick={() => setSelectedVariants((prev) => ({ ...prev, [partId]: v._id }))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: v.value,
                  border: isSelected ? '2px solid #7B5CF5' : '2px solid transparent',
                  outline: isSelected ? '2px solid rgba(123,92,245,0.3)' : '2px solid transparent',
                  outlineOffset: '2px',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
        {activeVariant && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#E4E4F0', fontWeight: '500' }}>{activeVariant.label}</span>
            {activeVariant.priceModifier !== 0 && (
              <span style={{ fontSize: '11px', color: '#A78BFA' }}>+${activeVariant.priceModifier}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  /* Texture or other type */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {variants.map((v) => {
        const isSelected = selected === v._id;
        return (
          <button
            key={v._id}
            onClick={() => setSelectedVariants((prev) => ({ ...prev, [partId]: v._id }))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              background: isSelected ? 'rgba(123,92,245,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isSelected ? 'rgba(123,92,245,0.4)' : '#1A1A2E'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              background: `url(${v.value}) center/cover`,
              backgroundColor: '#22223A',
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.08)',
            }} />
            <span style={{ fontSize: '13px', color: isSelected ? '#E4E4F0' : '#6B6B85', fontWeight: '500' }}>
              {v.label}
            </span>
            {v.priceModifier !== 0 && (
              <span style={{ fontSize: '11px', color: '#A78BFA', marginLeft: 'auto' }}>+${v.priceModifier}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Price breakdown ─────────────────────────────────────────────────────── */
function PriceLine({ product, selectedParts, selectedVariants, total }) {
  const lines = [];
  lines.push({ label: 'Base', amount: product.basePrice || 0 });

  (product.parts || []).forEach((part) => {
    if (selectedParts[part._id] && part.basePrice > 0) {
      lines.push({ label: part.name, amount: part.basePrice });
    }
    const variantId = selectedVariants[part._id];
    if (variantId) {
      const v = part.variants?.find((v) => v._id === variantId);
      if (v?.priceModifier) lines.push({ label: v.label, amount: v.priceModifier });
    }
  });

  return (
    <div>
      {lines.length > 1 && (
        <div style={{ marginBottom: '10px' }}>
          {lines.map((l, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: '#3A3A52' }}>{l.label}</span>
              <span style={{ fontSize: '11px', color: '#3A3A52', fontVariantNumeric: 'tabular-nums' }}>
                ${l.amount.toLocaleString()}
              </span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #1A1A2E', paddingTop: '6px', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#6B6B85', fontWeight: '600' }}>Total</span>
            <span style={{ fontSize: '13px', color: '#E4E4F0', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>
              ${total.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Canvas placeholder ──────────────────────────────────────────────────── */
function CanvasPlaceholder() {
  return (
    <>
      <style>{`
        @keyframes vSpin { to { transform: rotate(360deg); } }
        @keyframes vPulse { 0%,100% { opacity:0.3; } 50% { opacity:0.7; } }
      `}</style>

      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(123,92,245,0.12) 0%, transparent 70%)',
        animation: 'vPulse 3s ease-in-out infinite',
      }} />

      {/* Spinner */}
      <div style={{
        width: '36px',
        height: '36px',
        border: '2px solid #1A1A2E',
        borderTopColor: '#7B5CF5',
        borderRadius: '50%',
        animation: 'vSpin 0.8s linear infinite',
        position: 'relative',
        zIndex: 1,
      }} />

      <p style={{
        fontSize: '12px',
        color: '#3A3A52',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontWeight: '600',
        position: 'relative',
        zIndex: 1,
      }}>
        Loading 3D model
      </p>
    </>
  );
}

/* ─── Loading screen ──────────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#06060C',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <style>{`@keyframes vSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '2px solid #22223A',
          borderTopColor: '#7B5CF5',
          borderRadius: '50%',
          animation: 'vSpin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#3A3A52', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: '600' }}>
          Loading
        </p>
      </div>
    </div>
  );
}

/* ─── Error screen ────────────────────────────────────────────────────────── */
function ErrorScreen({ message }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#06060C',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '320px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '18px',
        }}>⚠</div>
        <h2 style={{ color: '#E4E4F0', fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>
          Unable to load viewer
        </h2>
        <p style={{ color: '#6B6B85', fontSize: '13px', lineHeight: 1.5 }}>{message}</p>
        <p style={{ color: '#3A3A52', fontSize: '11px', marginTop: '20px' }}>
          Check the URL includes a valid <code style={{ color: '#7B5CF5' }}>?key=</code> parameter.
        </p>
      </div>
    </div>
  );
}
