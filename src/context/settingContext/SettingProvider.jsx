import request from "@/utils/axiosUtils";
import { CapacityAPI, SettingAPI } from "@/utils/axiosUtils/API";
import { isCapacityReached } from "@/utils/customFunctions/capacityRules";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import Cookies from "js-cookie";
import { useCallback, useEffect, useState } from "react";
import SettingContext from ".";

// The storefront is restricted to two currencies. COP is the base / default —
// product prices in the DB are stored in COP, so its exchange_rate is 1.
export const SUPPORTED_CURRENCIES = {
  COP: {
    code: "COP",
    name: "Colombian Peso",
    symbol: "$",
    no_of_decimal: 0,
    exchange_rate: 1,
    symbol_position: "before_price",
    is_default: true,
  },
  USD: {
    code: "USD",
    name: "US Dollar",
    symbol: "US$",
    no_of_decimal: 2,
    exchange_rate: 0.00024,
    symbol_position: "before_price",
    is_default: false,
  },
};

export const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES.COP;

const SettingProvider = (props) => {
  const [menuLoader, setMenuLoader] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState({});
  const [settingState, setSettingData] = useState({});
  const [settingObj, setSettingObj] = useState({});
  const { data: settingData, isLoading, refetch } = useFetchQuery([SettingAPI], () => request({ url: SettingAPI }),
     { enabled: false, refetchOnWindowFocus: false, select: (res) => res?.data?.values});

  useEffect(() => {
    refetch(); // 🔁 Fetch settings when component mounts
  }, []);

  // Cupo de hoy (GET /capacity). Cambia a medida que entran pedidos, así que
  // se refresca cada minuto y al volver a la pestaña; el checkout lo vuelve a
  // pedir antes de crear el pedido. Con el cupo lleno (`capacityReached`) la
  // tienda oculta carrito, botones de compra y checkout y ofrece WhatsApp.
  const { data: capacity, refetch: refetchCapacity } = useFetchQuery([CapacityAPI], () => request({ url: CapacityAPI }), {
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 15 * 1000,
    retry: 1,
    select: (res) => res?.data,
  });
  const capacityReached = isCapacityReached(capacity);

  useEffect(() => {
    if (settingData) {
      if (settingData?.maintenance?.maintenance_mode) {
        Cookies.set("maintenance", JSON.stringify(true));
      } else {
        Cookies.remove("maintenance");
      }
      setSettingData(settingData);
      setSettingObj(settingData);
    }
  }, [settingData]);

  useEffect(() => {
    isLoading && refetch();
  }, [isLoading]);

  const convertCurrency = useCallback(
    (value) => {
      // Resolution order: explicitly picked → settings.default_currency → COP fallback.
      // Any unsupported code that sneaks in still gets coerced back to COP so we never
      // render with a foreign currency the system isn't configured for.
      let currency = selectedCurrency?.code ? selectedCurrency : settingObj?.general?.default_currency;
      if (!currency?.code || !SUPPORTED_CURRENCIES[currency.code]) {
        currency = DEFAULT_CURRENCY;
      }
      const position = currency?.symbol_position || "before_price";
      const symbol = currency?.symbol || DEFAULT_CURRENCY.symbol;
      const rate = Number(currency?.exchange_rate) || 1;
      const amount = Number(value) * rate;
      if (isNaN(amount)) return `${symbol}0`;
      const decimals = Number.isFinite(Number(currency?.no_of_decimal))
        ? Number(currency.no_of_decimal)
        : 2;
      // COP uses "es-CO" formatting (1.234.567); USD uses "en-US" (1,234,567.89).
      const locale = currency.code === "COP" ? "es-CO" : "en-US";
      const formatted = decimals === 0
        ? Math.round(amount).toLocaleString(locale)
        : amount.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      return position === "before_price" ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
    },
    [settingObj, selectedCurrency]
  );
  return <SettingContext.Provider value={{ ...props, settingData, convertCurrency, selectedCurrency, setSelectedCurrency, menuLoader, isLoading, setMenuLoader, capacity, capacityReached, refetchCapacity }}>{props.children}</SettingContext.Provider>;
};
export default SettingProvider;
