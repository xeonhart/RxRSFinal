/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/ui/serverWidget"],
    /**
 * @param{serverWidget} serverWidget
 */
    (serverWidget) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            if (scriptContext.type === "view" || scriptContext.type === "edit") {
                const curRec = scriptContext.newRecord;
                const status = curRec.getText("custrecord_kod_mr_status");
                const name = curRec.getText("name");
                log.debug("status", status);
                if (status) {
                var hideFld = scriptContext.form.addField({
                    id: "custpage_hide_buttons",
                    label: "not shown - hidden",
                    type: serverWidget.FieldType.INLINEHTML,
                });
                var scr = ""; //ext-element-22

                scr += `jQuery('div.uir-record-name').html('${name}<span style="font-weight: bold;"> Status: [${status}]</span> ');`;
                hideFld.defaultValue =
                    "<script>jQuery(function($){require([], function(){" +
                    scr +
                    "})})</script>";
        }
      }
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
