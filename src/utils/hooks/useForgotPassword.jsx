import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import request, { sideCookieOptions } from "../axiosUtils";
import { ForgotPasswordAPI } from "../axiosUtils/API";
import { YupObject, emailSchema } from "../validation/ValidationSchema";

export const ForgotPasswordSchema = YupObject({ email: emailSchema });

const useHandleForgotPassword = (setShowBoxMessage, setState) => {
  const router = useRouter();
  return useMutation({
    mutationFn: (data) => request({ url: ForgotPasswordAPI, method: "post", data }, router),
    onSuccess: (responseData, requestData) => {
      if (responseData.status === 200 || responseData.status === 201) {
        Cookies.set("ue", requestData.email, sideCookieOptions());
        setState("otp");
      } else {
        setShowBoxMessage(responseData?.response.data.message);
      }
    },
  });
};
export default useHandleForgotPassword;
