"use client";
import WrapperComponent from "@/components/widgets/WrapperComponent";
import request from "@/utils/axiosUtils";
import { PageAPI } from "@/utils/axiosUtils/API";
import Breadcrumbs from "@/utils/commonComponents/breadcrumb";
import useFetchQuery from "@/utils/hooks/useFetchQuery";
import Loader from "@/layout/loader";
import { trustedHtml } from "@/utils/security/sanitizeHtml";
import { useTranslation } from "react-i18next";

// Legal pages (Terms & Conditions, Privacy Policy).
// Content is managed from the admin dashboard (Pages section) and fetched by
// slug from the API. If the API has no published page for the slug, the
// bundled bilingual content from src/data/legal is rendered as fallback.
const LegalPage = ({ slug, fallback }) => {
  const { i18n } = useTranslation("common");
  const lang = (i18n?.resolvedLanguage || i18n?.language || "es").split("-")[0];
  const staticPage = fallback?.[lang] || fallback?.es;

  const { data: adminPage, isLoading } = useFetchQuery(
    [PageAPI, slug],
    () => request({ url: `${PageAPI}/${slug}` }),
    {
      enabled: Boolean(slug),
      refetchOnWindowFocus: false,
      retry: false,
      select: (res) => res?.data,
    }
  );

  if (isLoading) return <Loader />;

  const title = adminPage?.content ? adminPage?.title : staticPage?.title;

  return (
    <>
      <Breadcrumbs title={title} subNavigation={[{ name: title }]} />
      <WrapperComponent classes={{ sectionClass: "legal-section section-b-space", fluidClass: "container", colClass: "col-sm-12" }}>
        <div className="legal-content">
          {adminPage?.content ? (
            <div dangerouslySetInnerHTML={trustedHtml(adminPage.content)} />
          ) : (
            <>
              <p className="legal-updated text-content">{staticPage?.updated}</p>
              <p>{staticPage?.intro}</p>
              {staticPage?.sections?.map((section, i) => (
                <div className="legal-block" key={i}>
                  <h3>{section?.h}</h3>
                  {section?.ps?.map((paragraph, j) => (
                    <p key={j}>{paragraph}</p>
                  ))}
                  {section?.list?.length ? (
                    <ul>
                      {section.list.map((item, k) => (
                        <li key={k}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </>
          )}
        </div>
      </WrapperComponent>
    </>
  );
};

export default LegalPage;
