/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
    "N/runtime",
    "N/url",
    "N/currentRecord",
    "N/ui/message",
    "N/record",
    "N/https"
], /**
 * @param{runtime} runtime
 * @param{url} url
 * @param currentRecord
 * @param message
 * @param record
 */ function (runtime, url, currentRecord, message, record, https) {
    let suitelet = null;
    const RETURNABLESUBLIST = "custpage_items_sublist";
    let urlParams;
    let lineTobeUpdated = []

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
        suitelet = scriptContext.currentRecord;
        let arrTemp = window.location.href.split("?");
        urlParams = new URLSearchParams(arrTemp[1]);


    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        let rrId = suitelet.getValue("custpage_rrid");
        let tranId = suitelet.getValue("custpage_tranid");
        let rrType = suitelet.getValue("custpage_rr_type")
        let mrrId  = suitelet.getValue("custpage_mrrid")

        console.log("fieldChanged");
        console.log(scriptContext.fieldId);
        console.log(scriptContext.sublistId);
        console.log(rrId + tranId);
        let params = {};
        try {
            if (scriptContext.fieldId == "custpage_radio") {
                let selection = suitelet.getValue("custpage_radio");
                if (selection === "Returnable") {
                    params.isMainReturnable = true
                } else if (selection === "Destruction") {
                    params.isMainDestruction = true
                } else {
                    params.isMainInDated = true
                }
                params.selectionType = selection;
                params.tranid = tranId;
                params.rrId = rrId;
                params.rrType = rrType
                params.mrrId = mrrId
                console.log(params);
                let stSuiteletUrl = url.resolveScript({
                    scriptId: "customscript_sl_returnable_page",
                    deploymentId: "customdeploy_sl_returnable_page",
                    returnExternalUrl: false,
                    params: params,
                });
                window.ischanged = false;
                window.open(stSuiteletUrl, "_self");
            }
        } catch (e) {
            console.error("fieldChanged", e.message);
        }
    }

    /**
     * Return to returnable page group by Manufacturer
     */
    function backToReturnable() {
        let params = {};

        params.rrId = urlParams.get("rrId");
        params.tranid = urlParams.get("tranid");
        params.selectionType = suitelet.getValue("custpage_radio");
        if (params.selectionType == "Returnable") {
            params.isMainReturnable = true;
        } else if (params.selectionType == "Desctruction") {
            params.isMainDestruction = true
        } else {
            params.isMainInDated = true
        }

        let stSuiteletUrl = url.resolveScript({
            scriptId: "customscript_sl_returnable_page",
            deploymentId: "customdeploy_sl_returnable_page",
            returnExternalUrl: false,
            params: params,
        });
        window.ischanged = false;
        window.open(stSuiteletUrl, "_self");
    }


    function verify() {

        let returnItemScanIds = []
        for (
            let i = 0;
            i < suitelet.getLineCount("custpage_items_sublist");
            i++
        ) {
            let internalId = suitelet.getSublistValue({
                sublistId: RETURNABLESUBLIST,
                fieldId: "custpage_internalid",
                line: i,
            });
            returnItemScanIds.push(internalId)
        }

        let params = {
            custscript_payload: JSON.stringify(returnItemScanIds),
            isVerify: true
        }
        let stSuiteletUrl = url.resolveScript({
            scriptId: "customscript_sl_validate_return",
            deploymentId: "customdeploy_sl_validate_return",
            params: params
        });
        let response = https.post({
            url: stSuiteletUrl,
        });
        handleButtonClick()
       if(response){
           setTimeout(function(){
               location.reload()
           },300)
       }


    }

    function handleButtonClick() {
        try {
            jQuery("#_loading_dialog").attr("title", "Updating Verify Status and Creating Bag Label");
            jQuery("#_loading_dialog").html(
                `<div style="text-align: center; margin-left:230px; font-style: italic;">Please wait.</div>
        <br><br>
        <div style="text-align: center; margin-left:110px; width:100%;">
        <i class="fas fa-cog fa-spin" data-fa-transform="grow-20" ></i>
        </div>`
            );
            jQuery("#_loading_dialog").dialog({
                modal: true,
                width: 10,
                height: 150,
                resizable: false,
                closeOnEscape: false,
                position: {my: "top", at: "top+160", of: "#main_form"},
                open: function (evt, ui) {
                    // jQuery(".ui-dialog-titlebar-close").hide();
                    setTimeout(function () {

                    }, 100);
                },
            });
        } catch (e) {
            console.error("handleButtonClick", e.message);
        }
    }

    function destroyModal() {
        jQuery("#_loading_dialog").dialog("destroy");
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        verify: verify,
        backToReturnable: backToReturnable,
    };
});
