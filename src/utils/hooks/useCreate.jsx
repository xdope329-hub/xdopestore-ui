import { useMutation } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import request from "../axiosUtils";
import SuccessHandle from "../customFunctions/SuccessHandle";

const useCreate = (url, updateId, path = false, message, extraFunction, notHandler, setCouponError, refetch, setShowBoxMessage, responseType, errFunction) => {
  const router = useRouter();
  const pathName = usePathname();
  return useMutation({
    mutationFn: (data) => request({ url: updateId ? `${url}/${Array.isArray(updateId) ? updateId.join("/") : updateId}` : url, data, method: "post", responseType: responseType ? responseType : "" }),
    onSuccess: (resDta, variables) => {
      !notHandler && SuccessHandle(resDta, router, path, message, setCouponError, pathName, setShowBoxMessage);
      extraFunction && extraFunction(resDta, variables);
      refetch && refetch();
    },
    onError: (err) => {
      errFunction && errFunction(err);
      setShowBoxMessage(err);
      return err;
    },
  });
};

export default useCreate;
