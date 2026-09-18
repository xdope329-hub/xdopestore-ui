import LegalPage from "@/components/pages/legal";
import terms from "@/data/legal/terms";
import React from "react";

export const metadata = {
  title: "Términos y Condiciones | XDOPE Store",
  description: "Términos y condiciones de XDOPE Store: compra de hoodies con diseños bordados, pagos, envíos, cambios, devoluciones y garantía en Colombia.",
};

const TermsAndConditions = () => {
  return <LegalPage slug="terms-and-conditions" fallback={terms} />;
};

export default TermsAndConditions;
