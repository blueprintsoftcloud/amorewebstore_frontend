// src/components/seo/AnalyticsScripts.tsx
//
// Site-wide (not per-page) SEO/analytics tags: Google Search Console verification and
// GA4. Mounted once in App.tsx so it's present on every page without every page's own
// PageSeo needing to know about it. Both are entirely optional — a store that hasn't
// set SEO_GOOGLE_SITE_VERIFICATION/SEO_GA_MEASUREMENT_ID renders nothing here.

import { Helmet } from "react-helmet-async";
import { useSeoSettings } from "../../context/SeoContext";

export default function AnalyticsScripts() {
  const { seo } = useSeoSettings();
  if (!seo.googleSiteVerification && !seo.gaMeasurementId) return null;

  return (
    <Helmet>
      {seo.googleSiteVerification && (
        <meta name="google-site-verification" content={seo.googleSiteVerification} />
      )}
      {seo.gaMeasurementId && (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${seo.gaMeasurementId}`} />
      )}
      {seo.gaMeasurementId && (
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${seo.gaMeasurementId}');
        `}</script>
      )}
    </Helmet>
  );
}
