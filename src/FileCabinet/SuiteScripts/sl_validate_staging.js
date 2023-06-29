/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "./Lib/rxrs_verify_staging_lib", "N/cache"], /**
 * @param{serverWidget} serverWidget
 * @param rxrs_vs_util
 * @param cache
 */ (serverWidget, rxrs_vs_util, cache) => {
  /**
   * Defines the Suitelet script trigger point.
   * @param {Object} scriptContext
   * @param {ServerRequest} scriptContext.request - Incoming request
   * @param {ServerResponse} scriptContext.response - Suitelet response
   * @since 2015.2
   */
  const RRNAME = "RR0001817";
  const onRequest = (context) => {
    let params = context.request.parameters;
    if (context.request.method === "GET") {
      try {
        let form = displayForms(params);
        context.response.writePage(form);
      } catch (e) {
        log.error("GET", e.message);
      }
    }
  };

  /**
   * It creates a form, adds a client script to it, creates header fields, and then creates a sublist of
   * items
   * @param params - parameters
   * @returns The form object is being returned.
   */
  function displayForms(params) {
    try {
      log.debug("objClientParams", params);
      let form = serverWidget.createForm({
        title: "Return Order Verification",
      });
      form.clientScriptFileId = rxrs_vs_util.getFileId(
        "rxrs_cs_verify_staging.js"
      );
      form = createHeaderFields({ form, params });
      return form;
    } catch (e) {
      log.error("displayForms", e.message);
    }
  }

  /**
   * Create the header fields of the Suitelet
   * @param {object}options.form Object form
   * @param {object}options.params paramters passed to the suitelet
   * @return {*}
   */
  const createHeaderFields = (options) => {
    try {
      log.debug("createHeaderFields options", options);
      let form = options.form;
      let paramSelectionType = options.params.selectionType;
      let paramManufacturer = options.params.manufacturer
        ? options.params.manufacturer
        : "";

      form.addFieldGroup({
        id: "fieldgroup_options",
        label: "Selection Type",
      });

      let selectionType = form
        .addField({
          id: "custpage_radio",
          label: "Returnable",
          type: serverWidget.FieldType.RADIO,
          source: "Returnable",
          container: "fieldgroup_options",
        })
        .updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.OUTSIDE,
        });
      form
        .addField({
          id: "custpage_radio",
          label: "Destruction",
          type: serverWidget.FieldType.RADIO,
          source: "Destruction",
          container: "fieldgroup_options",
        })
        .updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.OUTSIDE,
        });
      form
        .addField({
          id: "custpage_radio",
          label: "In Dated",
          type: serverWidget.FieldType.RADIO,
          source: "In Dated",
          container: "fieldgroup_options",
        })
        .updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.OUTSIDE,
        });

      paramSelectionType
        ? (selectionType.defaultValue = paramSelectionType)
        : (selectionType.defaultValue = "Returnable");
      let manufacturer = rxrs_vs_util.getReturnableManufacturer();
      log.emergency("manufacturer", manufacturer);
      let sublistFields;
      if (
        paramSelectionType == "Returnable" ||
        rxrs_vs_util.isEmpty(paramSelectionType)
      ) {
        //create sublist for Returnables
        log.audit(paramManufacturer);
        if (rxrs_vs_util.isEmpty(paramManufacturer)) {
          sublistFields = rxrs_vs_util.SUBLISTFIELDS.returnableSublist;

          createSublist({
            form: form,
            rrTranId: 10807,
            sublistFields: sublistFields,
            value: manufacturer,
            isMainReturnable: false,
            paramManufacturer: paramManufacturer,
          });
        } else {
          sublistFields = rxrs_vs_util.SUBLISTFIELDS.returnableManufacturer;
          // let manuf = []
          // Object.values(manufacturer).map(e => {let name = e.name; manuf.push(name)} )
          let itemsReturnScan = rxrs_vs_util.getItemScanByManufacturer({
            rrId: 10807,
            manufacturer: paramManufacturer,
          });
          log.debug("itemsReturnScan", itemsReturnScan);
          createSublist({
            form: form,
            rrTranId: 10807,
            sublistFields: sublistFields,
            value: itemsReturnScan,
            isMainReturnable: false,
            paramManufacturer: paramManufacturer,
          });
        }
      }

      return form;
    } catch (e) {
      log.error("createHeaderFields", e.message);
    }
  };
  /**
   * It creates a sublist on the form and populates it with the items that are passed in
   * @param {object}options.form - The form object that we are adding the sublist to.
   * @param {number}options.rrTranId - Return Request Id
   * @param {object}options.sublistFields SublistFields
   * @param {array} options.value
   * @param {boolean} options.isMainReturnable
   * @param {string} options.paramManufacturer
   * @returns The form is being returned.
   */
  const createSublist = (options) => {
    try {
      log.debug("createsublist", options);
      let manuf = options.paramManufacturer;
      let fieldName = [];
      let form = options.form;
      let sublistFields = options.sublistFields;
      let value = options.value;
      let scriptId = rxrs_vs_util.getFileId("rxrs_cs_verify_staging.js");
      form.clientScriptFileId = scriptId;
      let sublist;

      sublist = form.addSublist({
        id: "custpage_items_sublist",
        type: serverWidget.SublistType.LIST,
        label: `RO ${RRNAME} - RXLINEITEMS`,
      });

      if (manuf) sublist.addMarkAllButtons();
      // ADD mark all button if the sublist page is all of the return item page group by Manuf
      sublistFields.forEach((attri) => {
        fieldName.push(attri.id);
        sublist
          .addField({
            id: attri.id,
            type: serverWidget.FieldType[attri.type],
            label: attri.label,
          })
          .updateDisplayType({
            displayType: serverWidget.FieldDisplayType[attri.updateDisplayType],
          });
      });

      let mainLineInfo = [];

      value.forEach((val) => {
        let value = Object.values(val);
        let fieldInfo = [];
        for (let i = 0; i < value.length; i++) {
          fieldInfo.push({
            fieldId: fieldName[i],
            value: value[i],
          });
        }
        mainLineInfo.push(fieldInfo);
      });

      populateSublist({
        sublist: sublist,
        fieldInfo: mainLineInfo,
        isMainReturnable: options.isMainReturnable,
      });
    } catch (e) {
      log.error("createSublist", e.message);
    }
  };
  /**
     * Populate the returnable sublist
     * @param options.sublist
     * @param options.fieldInfo
     * @param options.isMainReturnable

     *
     */
  const populateSublist = (options) => {
    try {
      log.audit("populateSublist", options);
      let sublist = options.sublist;
      let sublistFields = options.fieldInfo;

      if (sublistFields.length > 0) {
        let lineCount = 0;
        sublistFields.forEach((element) => {
          for (let i = 0; i < element.length; i++) {
            //  if (element[i].fieldId === "custpage_verified") continue;
            try {
              sublist.setSublistValue({
                id: element[i].fieldId,
                line: lineCount,
                value: element[i].value ? element[i].value : " ",
              });
            } catch (e) {
              log.error("SETSUBLIST", e.message);
            }
          }

          // if (options.isMainReturnable) {
          //   value = `  // }

          //
          lineCount++;
        });
      }
    } catch (e) {
      log.error("populateSublist", e.message);
    }
  };
  return { onRequest };
});
