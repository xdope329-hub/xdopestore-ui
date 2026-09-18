import request, { dropStaleRefreshToken } from "@/utils/axiosUtils";
import { SelfAPI } from "@/utils/axiosUtils/API";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import AccountContext from ".";

const AccountProvider = (props) => {
  const cookies = Cookies.get("uat");
  const [mobileSideBar, setMobileSideBar] = useState(false);
  const [accountData, setAccountData] = useState();
  const { data, refetch, fetchStatus } = useFetchQuery([SelfAPI], () => request({ url: SelfAPI }), {
    enabled: false,
    select: (res) => {
      return res?.data;
    },
  });

  // Política "invitado es invitado": sesión vencida al cargar = visitante
  // invitado. Ver dropStaleRefreshToken en axiosUtils.
  useEffect(() => {
    dropStaleRefreshToken();
  }, []);

  useEffect(() => {
    cookies && refetch() ;
  }, [cookies]);

  useEffect(() => {
    if (data) {
      setAccountData(data);
    }
  }, [fetchStatus == "fetching", data]);

  return <AccountContext.Provider value={{ ...props, accountData, setAccountData, refetch, mobileSideBar, setMobileSideBar }}>{props.children}</AccountContext.Provider>;
};

export default AccountProvider;
