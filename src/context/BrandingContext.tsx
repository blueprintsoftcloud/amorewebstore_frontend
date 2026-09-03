// src/context/BrandingContext.tsx
// Fetches company branding (logo, name, tagline) once from the public API
// and makes it available throughout the app via useBranding().

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import api from "../utils/api";

interface BrandingData {
  companyName: string;
  companyTagline: string;
  companyLogo: string;
  companyFavicon: string;
  showCompanyName: boolean;
  showCompanyTagline: boolean;
}

interface BrandingContextValue {
  branding: BrandingData;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

const BRANDING_CACHE_KEY = "crm_branding_cache";

function readBrandingCache(): BrandingData | null {
  try {
    const raw = localStorage.getItem(BRANDING_CACHE_KEY);
    return raw ? (JSON.parse(raw) as BrandingData) : null;
  } catch {
    return null;
  }
}

export const useBranding = (): BrandingContextValue => {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used inside <BrandingProvider>");
  return ctx;
};

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  // Initialise immediately from cache so the navbar never flickers on reload
  const cached = readBrandingCache();
  const [branding, setBranding] = useState<BrandingData>(
    cached ?? {
      companyName: "",
      companyTagline: "",
      companyLogo: "",
      companyFavicon: "",
      showCompanyName: true,
      showCompanyTagline: true,
    }
  );
  // If we already have cached data, consider it "loaded" right away
  const [loading, setLoading] = useState(!cached);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get("/admin/company-settings");
      const s = res.data.settings ?? {};
      const fresh: BrandingData = {
        companyName: s.COMPANY_NAME ?? "",
        companyTagline: s.COMPANY_TAGLINE ?? "",
        companyLogo: s.COMPANY_LOGO ?? "",
        companyFavicon: s.COMPANY_FAVICON ?? "",
        showCompanyName:
          s.SHOW_COMPANY_NAME === "true" ||
          s.SHOW_COMPANY_NAME === "1" ||
          s.SHOW_COMPANY_NAME === undefined ||
          s.SHOW_COMPANY_NAME === null,
        showCompanyTagline:
          s.SHOW_COMPANY_TAGLINE === "true" ||
          s.SHOW_COMPANY_TAGLINE === "1" ||
          s.SHOW_COMPANY_TAGLINE === undefined ||
          s.SHOW_COMPANY_TAGLINE === null,
      };
      setBranding(fresh);
      try { localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(fresh)); } catch { /* quota exceeded — ignore */ }
    } catch {
      // Keep cached / default values on error — non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Sync browser tab title and favicon whenever branding changes
  useEffect(() => {
    if (branding.companyName) {
      document.title = branding.companyName;
    }
    if (branding.companyFavicon) {
      let link = document.getElementById("app-favicon") as HTMLLinkElement | null;
      if (!link) {
        link = document.querySelector<HTMLLinkElement>("link[rel='icon'], link[rel='shortcut icon']");
      }
      if (!link) {
        link = document.createElement("link");
        link.id = "app-favicon";
        link.rel = "icon";
        document.head.appendChild(link);
      }
      const absoluteFaviconUrl = new URL(branding.companyFavicon, window.location.origin).href;
      if (link.href !== absoluteFaviconUrl) {
        link.href = branding.companyFavicon;
      }
    }
  }, [branding.companyName, branding.companyFavicon]);

  return (
    <BrandingContext.Provider value={{ branding, loading, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
};
