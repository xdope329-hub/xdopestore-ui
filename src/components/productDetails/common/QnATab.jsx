import NoDataFound from "@/components/widgets/NoDataFound";
import AccountContext from "@/context/accountContext";
import request from "@/utils/axiosUtils";
import { QuestionAnswerAPI } from "@/utils/axiosUtils/API";
import useUpdate from "@/utils/hooks/useUpdate";
import useFetchQuery from "@/utils/hooks/useFetchQuery";;
import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiEditLine } from "react-icons/ri";
import QuestionAnswerModal from "./allModal/QuestionAnswerModal";
import LikeDisLike from "./LikeDisLike";

const QnATab = ({ productState }) => {
  const { accountData } = useContext(AccountContext);
  const [modal, setModal] = useState("");
  const [editData, setEditData] = useState();
  const { t } = useTranslation("common");
  const productId = productState?.product?.id;
  // Clave por producto: con la clave fija anterior, al pasar de un producto a
  // otro la pestaña seguía mostrando (o no) las preguntas del anterior y no
  // volvía a pedir la lista, así que las respuestas nuevas no aparecían.
  const { data, isLoading, refetch } = useFetchQuery([QuestionAnswerAPI, productId], () => request({ url: QuestionAnswerAPI, params: { product_id: productId } }), {
    enabled: !!productId,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    select: (res) => res?.data?.data,
  });
  // Ids planos (el API los normaliza) para saber cuál pregunta es del usuario.
  const ownerId = (qna) => String(qna?.consumer_id?.id || qna?.consumer_id?._id || qna?.consumer_id || "");
  const myId = String(accountData?.id || accountData?._id || "");
  // Una sola pregunta por producto y cliente.
  const alreadyAsked = !!myId && (data || []).some((qna) => ownerId(qna) === myId);
  const onEditClick = (data) => {
    setEditData(data);
    setModal("qna");
  };
  const { mutate: updateQnA, isLoading: updateLoader } = useUpdate(QuestionAnswerAPI, editData?.id, false, "QuestionUpdatedSuccessfully", (resData) => {
    if (resData?.status == 200 || resData?.status == 201) {
      refetch();
      setModal("");
    }
  });
  return (
    <>
      <div className="post-question-box">
        <h4>
          {t("HaveDoubtsRegardingThisProduct")} ?
          {alreadyAsked ? (
            <span className="text-content ms-2">{t("YouAlreadyAskedAboutThisProduct")}</span>
          ) : (
            <a
              onClick={() => {
                setEditData("Add");
                setModal("qna");
              }}
            >
              {t("PostYourQuestion")}
            </a>
          )}
        </h4>
      </div>
      <div className="question-answer">
        <ul>
          {data?.length > 0 ? (
            data?.map((qna, i) => (
              <li key={i}>
                <div className="question-box">
                  <h5>Q{i + 1}</h5>
                  <h6 className="font-weight-bold que">{qna?.question}</h6>
                  <ul className="link-dislike-box">
                    {myId && ownerId(qna) === myId && !qna?.answer ? (
                      <li>
                        <a onClick={() => onEditClick(qna)}>
                          <span>
                            <RiEditLine />
                          </span>
                        </a>
                      </li>
                    ) : null}
                    <LikeDisLike qna={qna} refetch={refetch} />
                  </ul>
                </div>
                <div className="answer-box">
                  <h5>A{i + 1}</h5>
                  <p className="ans">{qna?.answer ? qna?.answer : t("Replysoon")} </p>
                </div>
              </li>
            ))
          ) : (
            <NoDataFound customClass="no-data-added" title="NoQuestionPostedYet" description="ThereAreCurrentlyNoQuestionForThisProduct" />
          )}
        </ul>
        <QuestionAnswerModal modal={modal} setModal={setModal} productState={productState} update={{ editData: editData, updateQnA: updateQnA, updateLoader: updateLoader }} refetch={refetch} />
      </div>
    </>
  );
};

export default QnATab;
