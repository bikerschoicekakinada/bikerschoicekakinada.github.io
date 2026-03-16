import { useEffect } from "react";

type SeoProps = {
  title: string;
  description?: string;
  keywords?: string;
  canonical?: string;
};

function upsertMetaByName(name: string, content: string) {
  const existing = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (existing) {
    existing.setAttribute("content", content);
    return;
  }
  const meta = document.createElement("meta");
  meta.setAttribute("name", name);
  meta.setAttribute("content", content);
  document.head.appendChild(meta);
}

function upsertCanonical(href: string) {
  const existing = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (existing) {
    existing.setAttribute("href", href);
    return;
  }
  const link = document.createElement("link");
  link.setAttribute("rel", "canonical");
  link.setAttribute("href", href);
  document.head.appendChild(link);
}

export default function Seo({ title, description, keywords, canonical }: SeoProps) {
  useEffect(() => {
    document.title = title;
    if (description) upsertMetaByName("description", description);
    if (keywords) upsertMetaByName("keywords", keywords);
    if (canonical) upsertCanonical(canonical);
  }, [title, description, keywords, canonical]);

  return null;
}

