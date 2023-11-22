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

  /**
   * It creates a billable expense sublist on the form and populates it with the items that are passed in
   * @param {object}options.form - The form object that we are adding the sublist to.
   * @param {object}options.sublistFields SublistFields
   * @param {array} options.value - Saved Search results
   * @param {string} options.title - Sublist Title
   * @returns  Updated Form.
   */
  const createSublist = (options) => {
    try {
      log.debug("createSublist", options);

      let fieldName = [];
      let { form, sublistFields, title, value } = options;
      form.clientScriptFileId = getFileId("rxrs_cs_verify_staging.js");
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
      });
      log.debug("fieldName", fieldName);
      let mainLineInfo = [];
      value.forEach((val) => {
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
      });

      populateSublist({
        sublist: sublist,
        fieldInfo: mainLineInfo,
      });
    } catch (e) {
      log.error("createSublist", e.message);
    }
  };
  /**
   * Populate the sublist
   * @param options.sublist
   * @param options.fieldInfo
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
  };
});
