// src/hooks/useSEO.js — Per-page SEO meta tags (no extra dependencies)
// Lightweight alternative to react-helmet for adding social/SEO meta tags
import { useEffect } from 'react';

const DEFAULTS = {
  title: 'GateNexa – AI Powered GATE 2027 Preparation Platform',
  description: 'Prepare smarter for GATE with AI Mentor, Study Planner, PYQs, Mock Tests, Analytics, Revision Tracking, and Personalized Roadmaps.',
  image: '/images/logo.webp',
  url: 'https://gatenexa.vercel.app',
  type: 'website',
  siteName: 'GateNexa',
};

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  if (!href) return;
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSEO({
  title,
  description,
  image,
  url = typeof window !== 'undefined' ? window.location.href : DEFAULTS.url,
  type = 'website',
  noindex = false,
}) {
  useEffect(() => {
    const finalTitle = title ? `${title} | GateNexa` : DEFAULTS.title;
    const finalDesc = description || DEFAULTS.description;
    const finalImage = image || DEFAULTS.image;
    const finalUrl = url || DEFAULTS.url;

    document.title = finalTitle;
    setMeta('description', finalDesc);
    setMeta('og:title', finalTitle, 'property');
    setMeta('og:description', finalDesc, 'property');
    setMeta('og:image', finalImage, 'property');
    setMeta('og:url', finalUrl, 'property');
    setMeta('og:type', type, 'property');
    setMeta('og:site_name', DEFAULTS.siteName, 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', finalTitle);
    setMeta('twitter:description', finalDesc);
    setMeta('twitter:image', finalImage);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setCanonical(finalUrl);
    
    return () => {
      document.title = DEFAULTS.title;
      setMeta('description', DEFAULTS.description);
      setCanonical(DEFAULTS.url);
    };
  }, [title, description, image, url, type, noindex]);
}

export default useSEO;
