import { useEffect } from 'react';

const SITE_NAME = 'Extrato Co.';
const BASE_URL  = 'https://extratobancario.cortezgroup.com.br';
const OG_IMAGE  = `${BASE_URL}/og.png`;

/**
 * @param {object} opts
 * @param {string}  opts.title        — título da aba e do OG
 * @param {string}  opts.description  — descrição para Google e preview social
 * @param {boolean} [opts.noindex]    — páginas privadas (dashboard, reset)
 * @param {string}  [opts.canonical]  — URL canônica (padrão: URL atual)
 */
export function useSEO({ title, description, noindex = false, canonical }) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;

    // ── Título ──────────────────────────────────────────────────────────
    document.title = fullTitle;

    // ── Meta tags ───────────────────────────────────────────────────────
    setMeta('name', 'description',           description);
    setMeta('name', 'robots',                noindex ? 'noindex,nofollow' : 'index,follow');

    // Open Graph
    setMeta('property', 'og:site_name',      SITE_NAME);
    setMeta('property', 'og:type',           'website');
    setMeta('property', 'og:title',          fullTitle);
    setMeta('property', 'og:description',    description);
    setMeta('property', 'og:image',          OG_IMAGE);
    setMeta('property', 'og:url',            canonical ?? window.location.href);

    // Twitter / X
    setMeta('name', 'twitter:card',          'summary_large_image');
    setMeta('name', 'twitter:title',         fullTitle);
    setMeta('name', 'twitter:description',   description);
    setMeta('name', 'twitter:image',         OG_IMAGE);

    // ── Canonical ───────────────────────────────────────────────────────
    setLink('canonical', canonical ?? window.location.href);
  }, [title, description, noindex, canonical]);
}

// ── helpers ─────────────────────────────────────────────────────────────────

function setMeta(attr, key, value) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value ?? '');
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}
