/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/runtime", "./Lib/serp_headlight_add_order.js"],

    (runtime, SERP_headlight_add_order) => {

        const afterSubmit = (scriptContext) => {
            try {

                const record = scriptContext.newRecord;
                const recId = record.id

                let headlightSettingId = getParamets()
                SERP_headlight_add_order.sendOrderDetails({recId, headlightSettingId})
            } catch (e) {
                log.error("afterSubmit", e.message)
            }
        }

        function getParamets() {
            const scriptObj = runtime.getCurrentScript()
            return scriptObj.getParameter({
                name: "custscript_serp_headlight_settings"
            })

        }

        return {afterSubmit}

    });
