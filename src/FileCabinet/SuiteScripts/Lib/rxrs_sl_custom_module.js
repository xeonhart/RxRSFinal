/**
 * @NApiVersion 2.1
 */
define([
  "N/record",
  "N/render",
  "N/search",
  "N/ui/dialog",
  "N/ui/message",
  "N/ui/serverWidget",
], /**
 * @param{record} record
 * @param{render} render
 * @param{search} search
 * @param{dialog} dialog
 * @param{message} message
 * @param{serverWidget} serverWidget
 */ (record, render, search, dialog, message, serverWidget) => {
  let SOFORM222SUBLIST = [
    {
      id: "custpage_select",
      type: "CHECKBOX",
      label: "Select",
      updateDisplayType: "NORMAL",
    },
    {
      id: "custpage_item",
      type: "SELECT",
      label: "Item",
      updateDisplayType: "INLINE",
    },
    {
      id: "custpage_linekey",
      type: "TEXT",
      label: "Line Key",
      updateDisplayType: "HIDDEN",
    },
    {
      id: "custpage_form222_ref",
      type: "TEXT",
      label: "222 Form Number",
      updateDisplayType: "ENTRY",
    },
  ];
  let ADDCREDITMEMOSUBLIST = [
    {
      id: "custpage_select",
      type: "CHECKBOX",
      label: "Select",
      updateDisplayType: "NORMAL",
    },
    {
      id: "custpage_lineuniquekey",
      type: "TEXT",
      label: "Line UniqueKey",
      updateDisplayType: "HIDDEN",
    },
    {
      id: "custpage_itemid",
      type: "TEXT",
      label: "item id",
      updateDisplayType: "INLINE",
    },
    {
      id: "custpage_ndc",
      type: "TEXT",
      label: "NDC",
      updateDisplayType: "INLINE",
    },
    {
      id: "custpage_description",
      type: "TEXT",
      label: "Description",
      updateDisplayType: "NORMAL",
    },
    {
      id: "custpage_lot_number",
      type: "TEXT",
      label: "Lot Number",
      updateDisplayType: "NORMAL",
    },
    {
      id: "custpage_exp_date",
      type: "TEXT",
      label: "Exp. Date",
      updateDisplayType: "NORMAL",
    },
    {
      id: "custpage_full_partial",
      type: "TEXT",
      label: "FULL/PARTIAL PACKAGE",
      updateDisplayType: "ENTRY",
    },
    {
      id: "custpage_package_size",
      type: "TEXT",
      label: "Package Size",
      updateDisplayType: "ENTRY",
    },
    {
      id: "custpage_full",
      type: "TEXT",
      label: "Quantity",
      updateDisplayType: "ENTRY",
    },
    {
      id: "custpage_partial",
      type: "TEXT",
      label: "Partial Quantity",
      updateDisplayType: "ENTRY",
    },
    {
      id: "custpage_packing_slip_price",
      type: "CURRENCY",
      label: "Packing Slip Price",
      updateDisplayType: "ENTRY",
    },
    {
      id: "custpage_packing_slip_value",
      type: "CURRENCY",
      label: "Packing Slip Value",
      updateDisplayType: "ENTRY",
    },
    {
      id: "custpage_unit_price",
      type: "CURRENCY",
      label: "UNIT PRICE",
      updateDisplayType: "ENTRY",
    },
    {
      id: "custpage_amount_paid",
      type: "CURRENCY",
      label: "Amount Paid",
      updateDisplayType: "ENTRY",
    },
    {
      id: "custpage_credit_memo",
      type: "TEXT",
      label: "CREDIT MEMO REFERENCE ID",
      source: "customrecord_creditmemo",
      updateDisplayType: "INLINE",
    },
  ];
  /**
   * It creates a billable expense sublist on the form and populates it with the items that are passed in
   * @param {object}options.form - The form object that we are adding the sublist to.
   * @param {object}options.sublistFields SublistFields
   * @param {array} options.value - Saved Search results
   * @param {string} options.title - Sublist Title
   * @param {string} options.creditMemoId
   * @returns  Updated Form.
   */
  const createSublist = (options) => {
    try {
      log.debug("createSublist", options);

      let fieldName = [];
      let {
        form,
        sublistFields,
        title,
        value,
        creditMemoId,
        clientScriptAdded,
      } = options;
      if (!clientScriptAdded) {
        form.clientScriptFileId = getFileId("rxrs_cs_verify_staging.js");
      }

      let sublist;
      sublist = form.addSublist({
        id: "custpage_items_sublist",
        type: serverWidget.SublistType.LIST,
        label: title,
      });
      sublist.addButton({
        id: "custpage_markall",
        label: "Mark All",
        functionName: `markAll("true")`,
      });
      sublist.addButton({
        id: "custpage_unmarkall",
        label: "Unmark All",
        functionName: `markAll("false")`,
      });
      sublistFields.forEach((attri) => {
        log.debug("attri", attri.id);
        try {
          if (attri.id == "custpage_item") {
            sublist
              .addField({
                id: attri.id,
                type: serverWidget.FieldType.SELECT,
                label: attri.label,
                source: "item",
              })
              .updateDisplayType({
                displayType:
                  serverWidget.FieldDisplayType[attri.updateDisplayType],
              });
          } else {
            sublist
              .addField({
                id: attri.id,
                type: serverWidget.FieldType[attri.type],
                label: attri.label,
              })
              .updateDisplayType({
                displayType:
                  serverWidget.FieldDisplayType[attri.updateDisplayType],
              });
          }
          if (
            attri.id === "custpage_select" ||
            attri.id === "custpage_form222_ref"
          ) {
          } else {
            fieldName.push(attri.id);
          }
        } catch (e) {
          log.error("error in ", { error: e.message, id: attri.id });
        }
      });
      log.debug("fieldName", fieldName);
      let mainLineInfo = [];
      value.forEach((val) => {
        try {
          let value = Object.values(val);
          let fieldInfo = [];
          for (let i = 0; i < value.length; i++) {
            log.debug("fieldName[i]", fieldName[i]);
            if (isEmpty(fieldName[i])) continue;
            if (
              fieldName[i] == "custpage_select" ||
              fieldName[i] == "custpage_form222_ref"
            ) {
            } else {
              log.debug("else");
              fieldInfo.push({
                fieldId: fieldName[i],
                value: value[i],
              });
            }
          }
          log.audit("fieldInfo", fieldInfo);
          mainLineInfo.push(fieldInfo);
        } catch (e) {
          log.error("ERROR ON FIELD", {
            error: e.message,
            Field: fieldName[i],
            value: value[i],
          });
        }
      });

      populateSublist({
        sublist: sublist,
        fieldInfo: mainLineInfo,
        creditMemoId: creditMemoId,
      });
    } catch (e) {
      log.error("createSublist", e.message);
    }
  };
  /**
   * Populate the sublist
   * @param options.sublist
   * @param options.fieldInfo
   * @param options.creditMemoId
   */
  const populateSublist = (options) => {
    try {
      log.audit("populateSublist", options);
      let sublist = options.sublist;
      let sublistFields = options.fieldInfo;
      let creditMemoId = options.creditMemoId;
      if (sublistFields.length > 0) {
        let lineCount = 0;
        sublistFields.forEach((element) => {
          for (let i = 0; i < element.length; i++) {
            log.emergency("element", element[i]);
            try {
              sublist.setSublistValue({
                id: element[i].fieldId,
                line: lineCount,
                value: element[i].value ? element[i].value : " ",
              });
            } catch (e) {
              log.emergency("SetSublist", e.message);
            }
          }
          lineCount++;
        });
      }
    } catch (e) {
      log.error("populateSublist", e.message);
    }
  };

  /**
   * Return file Id based on filename
   * @param fileName
   * @returns {number}
   */
  function getFileId(fileName) {
    try {
      const fileSearch = search
        .create({
          type: "file",
          filters: [["name", "is", fileName]],
        })
        .run()
        .getRange({ start: 0, end: 1 });
      return fileSearch[0].id;
    } catch (e) {
      log.error("getFileId", e.message);
    }
  }

  function isEmpty(stValue) {
    return (
      stValue === "" ||
      stValue == null ||
      false ||
      (stValue.constructor === Array && stValue.length == 0) ||
      (stValue.constructor === Object &&
        (function (v) {
          for (var k in v) return false;
          return true;
        })(stValue))
    );
  }

  return {
    createSublist: createSublist,
    getFileId,
    SOFORM222SUBLIST,
    ADDCREDITMEMOSUBLIST,
  };
});
