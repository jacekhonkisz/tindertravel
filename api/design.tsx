// design.tsx
// Central design system for Glintz
// -------------------------------------------------------------
// This file defines the visual language of Glintz in code.
// It MUST remain consistent with the brandbook:
// - Colors: #E5DED5, #A1BAC7, #9D5049, #10233B
// - Fonts: Nautica Regular (script), Minion Pro (serif headlines), Apparat (sans-serif UI/body)
// -------------------------------------------------------------

import React, { PropsWithChildren } from "react";

/**
 * Brand colors — single source of truth.
 * Do NOT introduce new brand colors without updating the brandbook.
 */
export const glintzColors = {
  // Primary brand colors
  sand: "#E5DED5", // main background, surfaces, soft dividers
  coastalBlue: "#A1BAC7", // secondary sections, soft highlights
  
  terracotta: "#9D5049", // accent, CTAs, important highlights (max ~10% usage)
  deepNavy: "#10233B", // main text, headings, logo, key UI elements

  // Neutrals (derived, not official brand colors, but allowed for UI)
  white: "#FFFFFF",
  black: "#000000",
  // Optional tints/shades to keep the system practical
  sandLight: "#F4EFE8",
  navySoft: "#1C3250",
  terracottaDark: "#7C3B35",
};

/**
 * Typography settings aligned with brandbook.
 *
 * FONTS:
 * - Nautica Regular  -> displayScript   (tiny, decorative use only)
 * - Minion Pro       -> displaySerif    (headlines, hero, editorial)
 * - Apparat          -> uiSans          (body, labels, navigation, forms)
 */
export const glintzTypography = {
  fontFamilies: {
    displayScript: `"nautica", sans-serif`,
    displaySerif: `"minion-pro", serif`,
    uiSans: `"apparat", "apparat-light", sans-serif`,
  },
  // Suggested type scale – can be adjusted per breakpoint
  fontSizes: {
    hero: "3.2rem",
    h1: "2.4rem",
    h2: "1.8rem",
    h3: "1.4rem",
    body: "1rem",
    small: "0.875rem",
    micro: "0.75rem",
  },
  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.7,
  },
  letterSpacing: {
    normal: "0",
    wide: "0.08em", // for uppercase label / UI microcopy (legacy, use apparatUppercase instead)
    apparatUppercase: "0.211em", // Apparat font with uppercase text
    apparatNormal: "0", // Apparat font with normal text
  },
};

/**
 * Spatial system (spacing / radius / shadows) to keep layouts consistent.
 */
export const glintzLayout = {
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "40px",
    xxl: "64px",
  },
  radii: {
    sm: "6px",
    md: "12px",
    lg: "16px",
    pill: "999px",
  },
  shadows: {
    soft: "0 18px 45px rgba(0, 0, 0, 0.08)", // soft Mediterranean light
  },
  maxWidth: {
    text: "720px",
    page: "1120px",
  },
};

/**
 * GlobalDesignTokens
 * -------------------------------------------------------------
 * Injects CSS variables + base typography.
 * Use once at the root of the React tree (e.g. in _app.tsx or App.tsx).
 *
 * - Sets background to sand (not pure white) to reflect the brand.
 * - Uses deep navy as default text color.
 * - Wires font families to CSS custom properties.
 *
 * IMPORTANT:
 * Load the font files (Nautica, Minion Pro, Apparat) globally
 * via <link> tags, @font-face, or a font loader before using this.
 */
export const GlobalDesignTokens: React.FC = () => {
  return (
    <style>
      {`
        :root {
          /* Brand colors */
          --gl-color-sand: ${glintzColors.sand};
          --gl-color-coastal-blue: ${glintzColors.coastalBlue};
          --gl-color-terracotta: ${glintzColors.terracotta};
          --gl-color-deep-navy: ${glintzColors.deepNavy};
          --gl-color-sand-light: ${glintzColors.sandLight};
          --gl-color-navy-soft: ${glintzColors.navySoft};
          --gl-color-terracotta-dark: ${glintzColors.terracottaDark};
          --gl-color-white: ${glintzColors.white};
          --gl-color-black: ${glintzColors.black};

          /* Typography */
          --gl-font-display-script: ${glintzTypography.fontFamilies.displayScript};
          --gl-font-display-serif: ${glintzTypography.fontFamilies.displaySerif};
          --gl-font-ui-sans: ${glintzTypography.fontFamilies.uiSans};

          --gl-font-size-hero: ${glintzTypography.fontSizes.hero};
          --gl-font-size-h1: ${glintzTypography.fontSizes.h1};
          --gl-font-size-h2: ${glintzTypography.fontSizes.h2};
          --gl-font-size-h3: ${glintzTypography.fontSizes.h3};
          --gl-font-size-body: ${glintzTypography.fontSizes.body};
          --gl-font-size-small: ${glintzTypography.fontSizes.small};
          --gl-font-size-micro: ${glintzTypography.fontSizes.micro};

          --gl-line-height-tight: ${glintzTypography.lineHeights.tight};
          --gl-line-height-snug: ${glintzTypography.lineHeights.snug};
          --gl-line-height-normal: ${glintzTypography.lineHeights.normal};
          --gl-line-height-relaxed: ${glintzTypography.lineHeights.relaxed};

          --gl-letter-spacing-normal: ${glintzTypography.letterSpacing.normal};
          --gl-letter-spacing-wide: ${glintzTypography.letterSpacing.wide};
          --gl-letter-spacing-apparat-uppercase: ${glintzTypography.letterSpacing.apparatUppercase};
          --gl-letter-spacing-apparat-normal: ${glintzTypography.letterSpacing.apparatNormal};

          /* Layout / spacing */
          --gl-space-xs: ${glintzLayout.spacing.xs};
          --gl-space-sm: ${glintzLayout.spacing.sm};
          --gl-space-md: ${glintzLayout.spacing.md};
          --gl-space-lg: ${glintzLayout.spacing.lg};
          --gl-space-xl: ${glintzLayout.spacing.xl};
          --gl-space-xxl: ${glintzLayout.spacing.xxl};

          --gl-radius-sm: ${glintzLayout.radii.sm};
          --gl-radius-md: ${glintzLayout.radii.md};
          --gl-radius-lg: ${glintzLayout.radii.lg};
          --gl-radius-pill: ${glintzLayout.radii.pill};

          --gl-shadow-soft: ${glintzLayout.shadows.soft};

          --gl-max-width-text: ${glintzLayout.maxWidth.text};
          --gl-max-width-page: ${glintzLayout.maxWidth.page};
        }

        /* Base reset matching Glintz brand look & feel */
        * {
          box-sizing: border-box;
        }

        html, body, #__next, #root {
          margin: 0;
          padding: 0;
          min-height: 100%;
        }

        body {
          font-family: var(--gl-font-ui-sans);
          font-size: var(--gl-font-size-body);
          line-height: var(--gl-line-height-normal);
          color: var(--gl-color-deep-navy);
          background-color: var(--gl-color-sand);
          -webkit-font-smoothing: antialiased;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        img {
          max-width: 100%;
          display: block;
        }

        button {
          font-family: var(--gl-font-ui-sans);
        }
      `}
    </style>
  );
};

/**
 * Example components
 * -------------------------------------------------------------
 * These are reference implementations that show how to reflect
 * the brandbook in actual UI. You can reuse them or copy the styles.
 */

/**
 * GlintzPageShell:
 * Wrap top-level pages to keep horizontal rhythm consistent
 * and limit content width according to the design system.
 */
export const GlintzPageShell: React.FC<PropsWithChildren> = ({ children }) => (
  <div
    style={{
      minHeight: "100vh",
      backgroundColor: glintzColors.sand,
      display: "flex",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: glintzLayout.maxWidth.page,
        padding: `${glintzLayout.spacing.lg} ${glintzLayout.spacing.md} ${glintzLayout.spacing.xl}`,
      }}
    >
      {children}
    </div>
  </div>
);

/**
 * GlintzHeroHeading:
 * For main hero titles and key headlines.
 * Uses Minion Pro (display serif) with large size and tight leading.
 */
export const GlintzHeroHeading: React.FC<PropsWithChildren> = ({ children }) => (
  <h1
    style={{
      fontFamily: glintzTypography.fontFamilies.displaySerif,
      fontSize: glintzTypography.fontSizes.hero,
      lineHeight: glintzTypography.lineHeights.tight,
      color: glintzColors.deepNavy,
      margin: "0 0 12px",
    }}
  >
    {children}
  </h1>
);

/**
 * GlintzScriptAccent:
 * Very small script accent (e.g. "The", "Let’s").
 * Use sparingly – it’s decorative.
 */
export const GlintzScriptAccent: React.FC<PropsWithChildren> = ({ children }) => (
  <span
    style={{
      fontFamily: glintzTypography.fontFamilies.displayScript,
      fontSize: glintzTypography.fontSizes.h3,
      letterSpacing: glintzTypography.letterSpacing.normal,
      color: glintzColors.navySoft,
      display: "block",
      marginBottom: "4px",
    }}
  >
    {children}
  </span>
);

/**
 * GlintzBodyText:
 * Default body copy using Apparat.
 * For paragraphs, descriptions, supporting text.
 */
export const GlintzBodyText: React.FC<PropsWithChildren> = ({ children }) => (
  <p
    style={{
      fontFamily: glintzTypography.fontFamilies.uiSans,
      fontSize: glintzTypography.fontSizes.body,
      lineHeight: glintzTypography.lineHeights.relaxed,
      color: glintzColors.navySoft,
      maxWidth: glintzLayout.maxWidth.text,
      margin: "0 0 16px",
    }}
  >
    {children}
  </p>
);

/**
 * GlintzPrimaryButton:
 * Main CTA button.
 * Always terracotta background + white text, rounded pill.
 * Hover/active states stay within brand palette.
 */
interface GlintzButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export const GlintzPrimaryButton: React.FC<GlintzButtonProps> = ({
  children,
  fullWidth,
  style,
  ...rest
}) => (
  <button
    {...rest}
    style={{
      backgroundColor: glintzColors.terracotta,
      color: glintzColors.white,
      border: "none",
      borderRadius: glintzLayout.radii.pill,
      padding: "10px 24px",
      fontSize: glintzTypography.fontSizes.body,
      fontWeight: 500,
      letterSpacing: glintzTypography.letterSpacing.wide,
      textTransform: "uppercase",
      cursor: "pointer",
      width: fullWidth ? "100%" : "auto",
      boxShadow: glintzLayout.shadows.soft,
      transition: "background-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
      ...style,
    }}
    onMouseOver={(e) => {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
        glintzColors.terracottaDark;
      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
    }}
    onMouseOut={(e) => {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
        glintzColors.terracotta;
      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
    }}
  >
    {children}
  </button>
);

/**
 * Usage guideline (example):
 *
 * import {
 *   GlobalDesignTokens,
 *   GlintzPageShell,
 *   GlintzHeroHeading,
 *   GlintzScriptAccent,
 *   GlintzBodyText,
 *   GlintzPrimaryButton,
 * } from "./design";
 *
 * export default function Landing() {
 *   return (
 *     <>
 *       <GlobalDesignTokens />
 *       <GlintzPageShell>
 *         <GlintzScriptAccent>Let’s discover</GlintzScriptAccent>
 *         <GlintzHeroHeading>A new way of finding your Mediterranean stay.</GlintzHeroHeading>
 *         <GlintzBodyText>
 *           Glintz curates boutique coastal escapes so you don’t have to search.
 *           Just swipe, save and book the places that feel like you.
 *         </GlintzBodyText>
 *         <GlintzPrimaryButton>Join the waitlist</GlintzPrimaryButton>
 *       </GlintzPageShell>
 *     </>
 *   );
 * }
 */

