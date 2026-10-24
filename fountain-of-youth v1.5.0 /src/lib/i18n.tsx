import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LANG_KEY, type Lang } from "@/lib/faucet";
import { errorKey, fill, localeFor, lookup } from "@/lib/copy";

type I18n = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
  errorText: (message: string) => string;
};

const I18nContext = createContext<I18n | null>(null);

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "es" || stored === "en") return stored;
  } catch {
    /* ignore */
  }
  try {
    const nav = navigator.language || "";
    if (nav.toLowerCase().startsWith("es")) return "es";
  } catch {
    /* ignore */
  }
  return "en";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    setLangState(readStoredLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18n>(() => {
    const t = (key: string, vars?: Record<string, string | number>) => {
      const raw = lookup(lang, key);
      return vars ? fill(raw, vars) : raw;
    };
    return {
      lang,
      setLang,
      t,
      locale: localeFor(lang),
      errorText: (message: string) => {
        const key = errorKey(message);
        if (!key) return message;
        if (key.endsWith("|held")) {
          const base = key.slice(0, -"|held".length);
          return `${t(base)} ${t("error.streakHeld")}`;
        }
        return t(key);
      },
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: "en",
      setLang: () => {},
      t: (key, vars) => (vars ? fill(lookup("en", key), vars) : lookup("en", key)),
      locale: "en-US",
      errorText: (message) => message,
    };
  }
  return ctx;
}
