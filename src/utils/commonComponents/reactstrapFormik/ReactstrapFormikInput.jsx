import { ErrorMessage, getIn } from "formik";
import React from "react";
import { useTranslation } from "react-i18next";
import { FormFeedback, FormGroup, Input, InputGroup, InputGroupText, Label } from "reactstrap";
import { handleModifier } from "../../Utils/Validation/ModifiedErrorMessage";

const ReactstrapFormikInput = ({ field: { ...fields }, form: { touched, errors }, ...props }) => {
  const { t } = useTranslation("common");
  // getIn resuelve nombres anidados ("shipping_address.title").
  const fieldError = getIn(errors, fields.name);
  const fieldTouched = getIn(touched, fields.name);

  return (
    <>
      {props.label ? (
        <>
          <FormGroup floating>
            <Input {...props} {...fields} invalid={Boolean(fieldTouched && fieldError)} valid={Boolean(fieldTouched && !fieldError)} autoComplete="off" />
            <Label htmlFor={props.id}>{t(props.label)}</Label>
            {fieldTouched && fieldError ? <FormFeedback>{t(handleModifier(fieldError))}</FormFeedback> : ""}
          </FormGroup>
        </>
      ) : props.inputaddon ? (
        <InputGroup>
          {!props.postprefix && <InputGroupText>{props?.prefixvalue ? props?.prefixvalue : "$"}</InputGroupText>}
          <Input
            disabled={props.disable ? props.disable : false}
            {...fields}
            {...props}
            invalid={Boolean(fieldTouched && fieldError)}
            valid={Boolean(fieldTouched && !fieldError)}
            autoComplete="off"
            readOnly={props.readOnly ? true : false}
            onInput={(e) => {
              if (props.min && props.max) {
                if (e.target.value > 100) e.target.value = 100;
                if (e.target.value < 0) e.target.value = 0;
              } else false;
            }}
          />
          {props.postprefix && <InputGroupText>{props.postprefix}</InputGroupText>}
          {fieldTouched && fieldError ? <FormFeedback>{t(handleModifier(fieldError))}</FormFeedback> : ""}
          {props?.errormsg && (
            <ErrorMessage
              name={fields.name}
              render={(msg) => (
                <div className="invalid-feedback d-block">
                  {t(props.errormsg)} {t("IsRequired")}
                </div>
              )}
            />
          )}
        </InputGroup>
      ) : (
        <>
          {props.type == "color" ? (
            <div className="color-box">
              <Input disabled={props.disable ? props.disable : false} {...fields} {...props} invalid={Boolean(fieldTouched && fieldError)} valid={Boolean(fieldTouched && !fieldError)} autoComplete="off" />
              {fieldTouched && fieldError ? <FormFeedback>{t(handleModifier(fieldError))}</FormFeedback> : ""}
              <h6>{fields.value}</h6>
            </div>
          ) : (
            <>
              <Input disabled={props.disable ? props.disable : false} {...fields} {...props} invalid={Boolean(fieldTouched && fieldError)} valid={Boolean(fieldTouched && !fieldError)} autoComplete="off" />
              {fieldTouched && fieldError ? <FormFeedback>{t(handleModifier(fieldError))}</FormFeedback> : ""}
              {props?.errormsg && (
                <ErrorMessage
                  name={fields.name}
                  render={(msg) => (
                    <div className="invalid-feedback d-block">
                      {t(props.errormsg)} {t("IsRequired")}
                    </div>
                  )}
                />
              )}
            </>
          )}
        </>
      )}
    </>
  );
};
export default ReactstrapFormikInput;
