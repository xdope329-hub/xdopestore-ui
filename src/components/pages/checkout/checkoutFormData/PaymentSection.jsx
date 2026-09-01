import { Col, Input, Label, Row } from 'reactstrap';
import { useTranslation } from "react-i18next";
import { Fragment, useContext, useEffect } from 'react';
import SettingContext from '@/context/settingContext';
import { ModifyString } from '@/utils/customFunctions/ModifyString';

const PaymentSection = ({ values, setFieldValue, }) => {
    const { t } = useTranslation('common');
    const { settingData } = useContext(SettingContext);
    // Mercado Pago por defecto si está activo; si no, el primer método activo.
    useEffect(() => {
        if (values?.payment_method) return;
        const methods = (settingData?.payment_methods || []).filter((m) => m?.status);
        const preferred = methods.find((m) => m.name === 'mercadopago') || methods[0];
        if (preferred) setFieldValue('payment_method', preferred.name);
    }, [settingData?.payment_methods]); // eslint-disable-line
    return (
        <div className="checkbox-main-box">
            <div className="checkout-title1">
                <h2>{'Payment Details'}</h2>
            </div>
            <Row className='g-sm-4 g-3'>
                {settingData?.payment_methods?.map((elem, i) => (
                    <Fragment key={i}>
                        {elem?.status && (
                            <Col xxl={6}>
                                <div className='payment-option'>
                                    <div className='payment-category w-100'>
                                        <div className='form-check custom-form-check gap-0 hide-check-box w-100'>
                                            <Input
                                                className='form-check-input'
                                                id={elem?.name}
                                                checked={values?.payment_method === elem.name}
                                                type='radio'
                                                name='payment_method'
                                                onChange={() => {
                                                    setFieldValue('payment_method', elem.name);
                                                }}
                                            />
                                            <Label className='form-check-label' htmlFor={elem.name}>
                                                {ModifyString(elem?.name, 'upper')}
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        )}
                    </Fragment>
                ))}
            </Row>
        </div>
    );

};

export default PaymentSection;
