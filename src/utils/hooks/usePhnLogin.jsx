import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import request, { sideCookieOptions } from "../axiosUtils";
import { LoginPhnAPI } from "../axiosUtils/API";

const useHandlePhnLogin = (setShowBoxMessage, setState) => {
  const router = useRouter();
  return useMutation({
    mutationFn: (data) => request({ url: LoginPhnAPI, method: "post", data }),
    onSuccess: (responseData, requestData) => {
      if (responseData.status === 200) {
        // Short-lived, SameSite=Lax, Secure on https - never a bare Cookies.set.
        Cookies.set("uc", requestData.country_code, sideCookieOptions());
        Cookies.set("up", requestData.phone, sideCookieOptions());
        setState("otp");
      } else {
        setShowBoxMessage(responseData.response.data.message);
      }
    },
  });
};

export default useHandlePhnLogin;
