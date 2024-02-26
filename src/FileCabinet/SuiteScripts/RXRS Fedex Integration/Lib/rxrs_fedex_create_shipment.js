/**
 * @NApiVersion 2.1
 */
define(["N/record", "N/runtime", "N/search", "N/format", "./serp_headlight_api_service.js",], /**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{format} format,
 * @param{*} SERP_Headlight_APIService
 */ function (record, runtime, search, format, SERP_Headlight_APIService) {

    /**
     * Get the record information and SO details and create an object with it that will be used in sending request
     * @param {string} options.recId Record Id
     * @returns {object} return record object information
     */

    function getOrderDetails(options) {
        try {

            const soRec = record.load({
                type: record.Type.SALES_ORDER, id: options.recId, isDynamic: true,
            });

            const shipSubRecord = soRec.getSubrecord({
                fieldId: "shippingaddress",
            });

            let dropOffAddress = `${shipSubRecord.getValue("addr1")},  ${shipSubRecord.getValue("city")}, ${shipSubRecord.getValue("state")}, ${shipSubRecord.getValue("zip")} `
            let orderInfo = {}
            orderInfo.orders = []
            for (let i = 0; i < soRec.getLineCount("item"); i++) {
                const itemId = soRec.getSublistText({
                    sublistId: "item", fieldId: "item", line: i,
                });
                const itemName = soRec.getSublistText({
                    sublistId: "item", fieldId: "item", line: i,
                });

                const quantity = soRec.getSublistValue({
                    sublistId: "item", fieldId: "quantity", line: i,
                });
                const description = soRec.getSublistValue({
                    sublistId: "item", fieldId: "description", line: i,
                })
                orderInfo.orders.push({
                    "remote_order_header_id": options.recId,
                    "order_number": soRec.getValue("tranid"),
                    "order_type": "sale",
                    "ship_date": soRec.getText("trandate") || null,
                    "earliest_ship_date": null,
                    "customer": soRec.getText("entity") || null,
                    "vendor": null,
                    "dropoff_address": dropOffAddress,
                    "pickup_address": null,
                    "delivery_window_start": null,
                    "delivery_window_end": null,
                    "appointment_time": null,
                    "stop_time": null,
                    "order_comments": soRec.getValue("memo") || null,
                    "ship_rules": null,
                    "bin_ship_rules": "",
                    "shipping_constraints": null,
                    "hold_code": null,
                    "bol_number": null,
                    "bol_stop_number": null,
                    "selected": null,
                    "remote_order_item_id": null,
                    "line_number": i + 1,
                    "description": description || null,
                    "part_name": itemName || null,
                    "part_number": null,
                    "unique_bin_part_number": null,
                    "inventory_status": null,
                    "quantity": quantity || null,
                    "weight": null,
                    "width": null,
                    "length": null
                })

            }
            orderInfo.delete_orders = true
            log.debug("order obj", orderInfo);
            return orderInfo;
        } catch (e) {
            log.error("getOrderDetails", e.message);
        }
    }

    /**
     * Create JSON body and send the request using Headlight integration settings
     * @param {string} options.recId record internal id
     * @param {string} options.headlightSettingId Headlight settings internal id
     * @returns {object} response from Headlight
     */
    function sendOrderDetails(options) {

        let recId = options.recId
        let headlightSettingId = options.headlightSettingId
        try {
            log.debug("sendOrderDetails", {recId, headlightSettingId})
            const orderObj = getOrderDetails({recId: recId, recType: options.recType});
            const headlightIntegrationSettings = getHeadlightIntegSettings(+headlightSettingId)
            return SERP_Headlight_APIService.addOrder({
                recId, orderObj, headlightIntegrationSettings
            });
        } catch (e) {
            log.error("sendOrderDetails", e.message);
        }
    }

    /**
     * Load elite Headlight Integration Settings
     * @param headlightId
     */
    function getHeadlightIntegSettings(headlightId) {
        try {
            const headLightSettingsResults = {};
            const headLightSettingsSearch = search.lookupFields({
                type: "customrecord_serp_headlight_integ_sett",
                id: headlightId,
                columns: ["custrecord_serp_headlight_ep_url", "custrecord_serp_headlight_comp_id", "custrecord_serp_headlight_authorization",],
            });
            headLightSettingsResults["endpointURL"] = headLightSettingsSearch["custrecord_serp_headlight_ep_url"];
            headLightSettingsResults["authorization"] = headLightSettingsSearch["custrecord_serp_headlight_authorization"];
            headLightSettingsResults["companyId"] = headLightSettingsSearch["custrecord_serp_headlight_comp_id"];
            log.debug("headLightSettingsResults", headLightSettingsResults)
            return headLightSettingsResults;
        } catch (e) {
            log.debug("getHeadlightIntegSettings", e.message);
        }
    }

    /**
     * Update SO successful line item
     *@param {string} options.recId  Sales Order Id
     *@param {object} options.resBody Response from Headlight API
     * @param options
     */
    function updateSoSuccessItem(options) {
        try {
            let orderId = null
            let soRec = record.load({
                type: record.Type.SALES_ORDER,
                id: options.recId
            })
            let res = options.resBody

            let successfullyItemList = res.successfully_created_orders[0].order_items
            successfullyItemList.forEach(item => {
                soRec.setSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_serp_headlight_item_id",
                    line: item.line_number - 1,
                    value: item.id
                })
                soRec.setSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_serp_headlight_failed_reason",
                    line: item.line_number - 1,
                    value: ""
                })

                soRec.setSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_serp_headlight_res_status",
                    line: item.line_number - 1,
                    value: "SUCCESS"
                })
                if (orderId == null) orderId = item.order_id

            })
            soRec.setValue({
                fieldId: "custbody_serp_headlight_order_id",
                value: orderId
            })
            return soRec.save({
                ignoreMandatoryFields: true
            })
        } catch (e) {
            log.error("getSuccessfulOrders", e.message)
        }
    }

    /**
     * Update SO failed line item
     *@param {string} options.recId  Sales Order Id
     *@param {object} options.resBody Response from Headlight API
     *@param {string} soId return SO Id
     */
    function updateSoFailedItem(options) {
        try {

            let soRec = record.load({
                type: record.Type.SALES_ORDER,
                id: options.recId
            })
            let res = options.resBody

            res.failed_data.forEach(item => {
                soRec.setSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_serp_headlight_item_id",
                    line: item.data.line_number - 1,
                    value: ""
                })
                soRec.setSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_serp_headlight_res_status",
                    line: item.data.line_number - 1,
                    value: "FAILED"
                })
                soRec.setSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_serp_headlight_failed_reason",
                    line: item.data.line_number - 1,
                    value: item.errors
                })


            })
            return soRec.save({
                ignoreMandatoryFields: true
            })
        } catch (e) {
            log.error("updateSoFailedItem", e.message)
        }
    }

    /**
     * Update whole SO line item
     *@param {string} options.recId  Sales Order Id
     *@param {object} options.resBody Response from Headlight API
     *@param {string} soId return SO Id
     */
    function updateDeletedOrder(options) {
        try {
            let res = options.resBody
            let soRec = record.load({
                type: record.Type.SALES_ORDER,
                id: options.recId
            })
            soRec.setValue({
                fieldId: "custbody_serp_headlight_deleted_order",
                value: res.deleted_orders[0].remote_primary_key
            })
            soRec.setValue({
                fieldId: "custbody_serp_headlight_order_id",
                value: ""
            })
            for (let i = 0; i < soRec.getLineCount("item"); i++) {
                soRec.setSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_serp_headlight_item_id",
                    line: i,
                    value: ""
                })
                soRec.setSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_serp_headlight_res_status",
                    line: i,
                    value: "DELETED"
                })
                soRec.setSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_serp_headlight_failed_reason",
                    line: i,
                    value: ""
                })
            }
            return soRec.save({ignoreMandatoryFields: true})

        } catch (e) {
            log.error("updateDeletedOrder", e.message)
        }
    }

    /**
     * Check if empty string is passed
     * @param {*} stValue
     */
    function isEmpty(stValue) {
        return (stValue === "" || stValue == null || false || (stValue.constructor === Array && stValue.length === 0) || (stValue.constructor === Object && (function (v) {
            for (var k in v) return false;
            return true;
        })(stValue)));
    }


    return {
        isEmpty: isEmpty,
        sendOrderDetails: sendOrderDetails,
        getEliteExtraSettings: getHeadlightIntegSettings,
        updateSoSuccessItem: updateSoSuccessItem,
        updateSoFailedItem: updateSoFailedItem,
        updateDeletedOrder: updateDeletedOrder
    };
});
