import { useEffect } from "react";

const THEME_KEY = "data-jostap-theme-original-style";

const darkColors: Record<string, string> = {
  "#fff": "#111827",
  "#ffffff": "#111827",
  "rgb(255,255,255)": "#111827",
  "#f9fafb": "#0f172a",
  "rgb(249,250,251)": "#0f172a",
  "#eff6ff": "#172554",
  "rgb(239,246,255)": "#172554",
  "#f3f4f6": "#1f2937",
  "rgb(243,244,246)": "#1f2937",
  "#e5e7eb": "#334155",
  "rgb(229,231,235)": "#334155",
  "#d1d5db": "#475569",
  "rgb(209,213,219)": "#475569",
  "#111827": "#f9fafb",
  "rgb(17,24,39)": "#f9fafb",
  "#374151": "#e5e7eb",
  "rgb(55,65,81)": "#e5e7eb",
  "#6b7280": "#cbd5e1",
  "rgb(107,114,128)": "#cbd5e1",
  "#9ca3af": "#94a3b8",
  "rgb(156,163,175)": "#94a3b8",
};

const styleProps = [
  "background",
  "backgroundColor",
  "border",
  "borderColor",
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderLeft",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "color",
  "boxShadow",
  "fill",
  "stroke",
];

function compact(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function mapValue(value: string, property: string) {
  if (!value) return value;
  const normalized = compact(value);

  if (normalized.includes("rgba(255,255,255")) {
    return value.replace(/rgba\(255\s*,\s*255\s*,\s*255\s*,\s*([^)]+)\)/gi, "rgba(17,24,39,$1)");
  }

  if (darkColors[normalized]) return darkColors[normalized];

  let next = value;
  for (const [light, dark] of Object.entries(darkColors)) {
    const pattern = light.startsWith("rgb")
      ? light
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/,/g, "\\s*,\\s*")
      : light.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(new RegExp(pattern, "gi"), dark);
  }

  if (property === "boxShadow" && normalized.includes("rgba(0,0,0")) {
    return "0 18px 42px rgba(0,0,0,0.45)";
  }

  return next;
}

function saveOriginal(el: HTMLElement) {
  if (el.getAttribute(THEME_KEY)) return;

  const original: Record<string, string> = {};
  for (const prop of styleProps) {
    const value = (el.style as CSSStyleDeclaration & Record<string, string>)[prop];
    if (value) original[prop] = value;
  }

  if (Object.keys(original).length) {
    el.setAttribute(THEME_KEY, JSON.stringify(original));
  }
}

function applyDark(el: Element) {
  if (!(el instanceof HTMLElement)) return;
  if (!el.getAttribute("style")) return;

  saveOriginal(el);
  const saved = el.getAttribute(THEME_KEY);
  const original: Record<string, string> = saved
    ? JSON.parse(saved)
    : {};

  for (const [prop, value] of Object.entries(original)) {
    const mapped = mapValue(value, prop);
    if (mapped !== value) {
      const cssProp = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      if (
        el.style.getPropertyValue(cssProp) !== mapped ||
        el.style.getPropertyPriority(cssProp) !== "important"
      ) {
        el.style.setProperty(cssProp, mapped, "important");
      }
    }
  }
}

function restoreLight(el: Element) {
  if (!(el instanceof HTMLElement)) return;
  const saved = el.getAttribute(THEME_KEY);
  if (!saved) return;

  const original: Record<string, string> = JSON.parse(saved);
  for (const [prop, value] of Object.entries(original)) {
    (el.style as CSSStyleDeclaration & Record<string, string>)[prop] = value;
  }
}

function applyTheme() {
  const isDark = document.documentElement.dataset.theme === "dark";
  const elements = document.querySelectorAll("[style]");

  elements.forEach((el) => {
    if (isDark) {
      applyDark(el);
    } else {
      restoreLight(el);
    }
  });
}

function forceThemeReapply() {
  // Run in next frame to ensure dataset/theme has been updated.
  requestAnimationFrame(() => applyTheme());
}

export default function ThemeRuntime() {
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(applyTheme);
    };

    schedule();

    const observer = new MutationObserver((mutations) => {
      // Ensure we react both to theme changes and to inline style mutations
      // (e.g. hover handlers mutating `el.style.color`).
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "style") {
          applyTheme();
          return;
        }
      }
      schedule();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style"],
      });
    }

    window.addEventListener("jostap-theme-change", forceThemeReapply);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("jostap-theme-change", schedule);
    };
  }, []);

  return null;
}
