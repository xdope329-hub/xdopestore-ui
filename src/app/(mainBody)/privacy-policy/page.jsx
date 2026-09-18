import LegalPage from "@/components/pages/legal";
import privacy from "@/data/legal/privacy";
import React from "react";

export const metadata = {
  title: "Política de Privacidad | XDOPE Store",
  description: "Política de privacidad y tratamiento de datos personales de XDOPE Store conforme a la Ley 1581 de 2012 (habeas data).",
};

const PrivacyPolicy = () => {
  return <LegalPage slug="privacy-policy" fallback={privacy} />;
};

export default PrivacyPolicy;
