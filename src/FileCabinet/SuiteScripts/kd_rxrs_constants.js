/**
 *@NApiVersion 2.x
 */
define([],
    function () {
        return {
            RECORDS: {
                RETURN_REQUEST: 'customsale_kod_returnrequest',
                RETURN_REQUEST_PO: 'custompurchase_returnrequestpo',
                RETURN_ITEM_REQUESTED: 'customrecord_kod_mr_item_request',
                FORM_222_REFERENCE_NUMBER: 'customrecord_kd_222formrefnum'
            },
            RECORDFIELDS: {
                RIR_RETURN_REQUEST: 'custrecord_kd_rir_return_request',
                RIR_222_FORM_REF: 'custrecord_kd_rir_form222_ref',
                F2RN_REF_NUM: 'custrecord_kd_refnum',
                F2RN_PAGE: 'custrecord_kd_form222_page',
                F2RN_RETURN_REQUEST: 'custrecord_kd_returnrequest'
            },
            RRSTATUS: Object.freeze({
                PendingReview: "A",
                Rejected: "B",
                Authorized: "C",
                PendingPackageReceipt: "D",
                ReceivedPendingProcessing: "E",
                Processing: "F",
                PendingApproval: "G",
                Rejected_Resubmission: "H",
                Approved: "I",
                C2Kittobemailed: "J",
                PendingVerification: "K",
            }),
            MRRSTATUS: Object.freeze({
                CustomerSubmitted: 1,
                New: 11,
                WaitingForApproval: 8,
                Approved: 10,
                PriceLocked: 12,
                Archived: 13,
                InProgress: 14,
            }),
            TEMPITEM: Object.freeze({
                RxOTC: 897,
                C3To5: 896,
                C2: 895,
                NonScannableItem: 649,
            }),
            RRCATEGORY: Object.freeze({
                C2: 3,
                RXOTC: 1,
                C3TO5: 4,
            })

        };
    });