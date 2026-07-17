"use client";

import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import React, { useMemo } from "react";
import { I18nextProvider as Provider, initReactI18next } from "react-i18next";

import { getOptions } from "./settings";

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(resourcesToBackend((language, namespace) => import(`./locales/${language}/${namespace}.json`)))
  .init({
    ...getOptions(),
    detection: {
      // Only the explicit choice (cookie) counts — never the browser's
      // navigator language — so Spanish stays the default for new visitors.
      order: ["cookie"],
      caches: ["cookie"],
    },
  });

export function I18nProvider({ children, language }) {
  useMemo(() => {
    i18next.changeLanguage(language);
  }, []);
  return <Provider i18n={i18next}>{children}</Provider>;
}
