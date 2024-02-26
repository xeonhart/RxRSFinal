/**
 * @NApiVersion 2.1
 */
define(["N/https", "./serp_headlight_create_service_logs", "./serp_headlight_add_order"], /**
 *
 */ function (https, SERP_Headlight_ServiceLogs, SERP_Headlight_Add_Order) {

    /**
     * @param {object} options.fedexIntegrationSettings Record settings of Headlight
     * @returns {object} response from Headlight
     */
    function requestApi(options) {
        let params = null
        try {
            const recId = options.recId
            const soapAction = "POST";
            let serviceURL = options.fedexIntegrationSettings.endpointURL + options.fedexIntegrationSettings.companyId + "/add_orders";
            const headers = {};
            headers["Content-Type"] = "application/json";
            headers["Authorization"] =
                "Token " + options.fedexIntegrationSettings.authorization;

            const headlightResponse = https.post({
                method: https.Method.POST,
                url: serviceURL,
                body: JSON.stringify(options.orderObj),
                headers: headers,
            });
            SERP_Headlight_ServiceLogs.headlightCreateServicelogs(
                {
                    soId: recId,
                    serviceURL: serviceURL,
                    soapAction: soapAction,
                    bodyRequest: options.orderObj,
                    responseCode: headlightResponse.code,
                    responseHeader: JSON.stringify(headlightResponse.headers),
                    responseBody: headlightResponse.body.substring(0, 100000)
                }
            );
            let resBody = JSON.parse(headlightResponse.body)
            let successFulItemLength = resBody.successfully_created_orders.length
            let failedItemLength = resBody.failed_data.length
            let deletedItemLength = resBody.deleted_orders.length
            params = {recId,resBody}
            if (successFulItemLength > 0 ) {
                let soId = SERP_Headlight_Add_Order.updateSoSuccessItem(params)
            }
            if(failedItemLength > 0 && deletedItemLength < 0){
                 SERP_Headlight_Add_Order.updateSoFailedItem(params)
            }
            if(deletedItemLength > 0){
                SERP_Headlight_Add_Order.updateDeletedOrder(params)
            }

            return headlightResponse;
        } catch (e) {
            log.error("addOrder", e.message);
        }
    }

    /**
     * @param {int} options.recId Sales order Internal Id
     * @param {string} options.orderObj Created JSON Body string to send to Headlight
     * @param {object} options.fedexIntegrationSettings Record settings of Headlight
     * @returns {object} response from Headlight
     */

    function addOrder(options) {
        let params = null
        try {
            const recId = options.recId
            const soapAction = "POST";
            let serviceURL = options.fedexIntegrationSettings.endpointURL + options.fedexIntegrationSettings.companyId + "/add_orders";
            const headers = {};
            headers["Content-Type"] = "application/json";
            headers["Authorization"] =
                "Token " + options.fedexIntegrationSettings.authorization;

            const headlightResponse = https.post({
                method: https.Method.POST,
                url: serviceURL,
                body: JSON.stringify(options.orderObj),
                headers: headers,
            });
            SERP_Headlight_ServiceLogs.headlightCreateServicelogs(
                {
                    soId: recId,
                    serviceURL: serviceURL,
                    soapAction: soapAction,
                    bodyRequest: options.orderObj,
                    responseCode: headlightResponse.code,
                    responseHeader: JSON.stringify(headlightResponse.headers),
                    responseBody: headlightResponse.body.substring(0, 100000)
                }
            );
            let resBody = JSON.parse(headlightResponse.body)
            let successFulItemLength = resBody.successfully_created_orders.length
            let failedItemLength = resBody.failed_data.length
            let deletedItemLength = resBody.deleted_orders.length
            params = {recId,resBody}
            if (successFulItemLength > 0 ) {
                let soId = SERP_Headlight_Add_Order.updateSoSuccessItem(params)
            }
            if(failedItemLength > 0 && deletedItemLength < 0){
                 SERP_Headlight_Add_Order.updateSoFailedItem(params)
            }
            if(deletedItemLength > 0){
                SERP_Headlight_Add_Order.updateDeletedOrder(params)
            }

            return headlightResponse;
        } catch (e) {
            log.error("addOrder", e.message);
        }
    }

    return {
        addOrder: addOrder,
    };
});
