"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import request from "../axiosUtils";
import SuccessHandle from "../customFunctions/SuccessHandle";

const useDelete = (url, refetch, deleteMessageNotShow) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deleteId) => request({ url: `${url}/${deleteId}`, method: "delete" }),
    onSuccess: (resData) => {
      // 'No' le indica a SuccessHandle que no muestre NINGÚN toast (una
      // cadena vacía igual mostraba uno genérico).
      SuccessHandle(resData, false, false, !deleteMessageNotShow ? "Deleted Successfully" : "No");
      refetch && queryClient.invalidateQueries({ queryKey: [refetch] });
    },
  });
};

export default useDelete;
