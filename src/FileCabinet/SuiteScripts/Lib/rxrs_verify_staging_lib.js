/**
 * @NApiVersion 2.1
 */

//TODO Include Amount in the Sublist
//TODO Source MRR and RR information in the creation of Bag Label
//TODO display manufacturer so maximum amount in the manufacturer record
//TODO disregard the check of the item return scan in the Suitelet
//TODO Move the creation of the submit instead of via Client Script

define([
  "N/redirect",
  "N/render",
  "N/runtime",
  "N/search",
  "N/url",
  "N/record",
], /**
 * @param{redirect} redirect
 * @param{render} render
 * @param{runtime} runtime
 * @param{search} search
 * @param{url} url
 * @param record
 */ (redirect, render, runtime, search, url, record) => {
  const SUBLISTFIELDS = {
    returnableSublist: [
      {
        id: "custpage_manuf_name",
        type: "TEXT",
        label: "Group By",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_in_date",
        type: "TEXT",
        label: "In Date",
        updateDisplayType: "HIDDEN",
      },
      {
        id: "custpage_verified",
        type: "CHECKBOX",
        label: "Verified",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_manuf",
        type: "TEXT",
        label: "MANUF NAME",
        updateDisplayType: "HIDDEN",
      },
    ],
    inDateSublist: [
      {
        id: "custpage_manuf_name",
        type: "TEXT",
        label: "Group By",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_in_date",
        type: "TEXT",
        label: "In Date",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_verified",
        type: "CHECKBOX",
        label: "Verified",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_manuf",
        type: "TEXT",
        label: "MANUF NAME",
        updateDisplayType: "HIDDEN",
      },
    ],
    returnableManufacturer: [
      {
        id: "custpage_internalid",
        type: "TEXT",
        label: "Internal Id",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_verified",
        type: "CHECKBOX",
        label: "Verified",
        updateDisplayType: "NORMAL",
      },
      {
        id: "custpage_ndc",
        type: "TEXT",
        label: "NDC",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_description",
        type: "TEXT",
        label: "Description",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_manufacturer",
        type: "TEXT",
        label: "Manufacturer",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_date_created",
        type: "TEXT",
        label: "Scanned On",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_date_serial_lot",
        type: "TEXT",
        label: "Serial/Lot Number",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_fullpartialpackage",
        type: "TEXT",
        label: "Full/Partial Package",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_expiration_date",
        type: "TEXT",
        label: "Expiration Date",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_mfgprocessing",
        type: "TEXT",
        label: "Manuf Processing",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_pharmaprocessing",
        type: "TEXT",
        label: "Pharma Processing",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_amount",
        type: "CURRENCY",
        label: "Amount",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_bag_tag_label",
        type: "TEXT",
        label: "Bag Tag Label",
        updateDisplayType: "INLINE",
      },
      {
        id: "custpage_item_id",
        type: "TEXT",
        label: "Item Id",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_manuf_id",
        type: "TEXT",
        label: "Manuf Id",
        updateDisplayType: "DISABLED",
      },
    ],
    returnableInDatedManufacturer: [
      {
        id: "custpage_internalid",
        type: "TEXT",
        label: "Internal Id",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_verified",
        type: "CHECKBOX",
        label: "Verified",
        updateDisplayType: "NORMAL",
      },
      {
        id: "custpage_in_dated",
        type: "TEXT",
        label: "In Date",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_ndc",
        type: "TEXT",
        label: "NDC",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_description",
        type: "TEXT",
        label: "Description",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_manufacturer",
        type: "TEXT",
        label: "Manufacturer",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_date_created",
        type: "TEXT",
        label: "Scanned On",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_date_serial_lot",
        type: "TEXT",
        label: "Serial/Lot Number",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_fullpartialpackage",
        type: "TEXT",
        label: "Full/Partial Package",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_expiration_date",
        type: "TEXT",
        label: "Expiration Date",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_mfgprocessing",
        type: "TEXT",
        label: "Manuf Processing",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_pharmaprocessing",
        type: "TEXT",
        label: "Pharma Processing",
        updateDisplayType: "DISABLED",
      },
    ],
    destructionSublist: [
      {
        id: "custpage_is_hazardous_name",
        type: "TEXT",
        label: "Group By",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_verified",
        type: "CHECKBOX",
        label: "Verified",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_is_hazardous",
        type: "TEXT",
        label: "Desctruction",
        updateDisplayType: "HIDDEN",
      },
    ],
    descrutionField: [
      {
        id: "custpage_internalid",
        type: "TEXT",
        label: "Internal Id",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_verified",
        type: "CHECKBOX",
        label: "Verified",
        updateDisplayType: "NORMAL",
      },
      {
        id: "custpage_ndc",
        type: "TEXT",
        label: "NDC",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_description",
        type: "TEXT",
        label: "Description",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_manufacturer",
        type: "TEXT",
        label: "Manufacturer",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_date_serial_lot",
        type: "TEXT",
        label: "Serial/Lot Number",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_original_lot_number",
        type: "TEXT",
        label: "Original Lot Number",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_fullpartialpackage",
        type: "TEXT",
        label: "Full/Partial Package",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_quantity",
        type: "TEXT",
        label: "Quantity",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_partial_count",
        type: "TEXT",
        label: "Partial Count",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_expiration_date",
        type: "TEXT",
        label: "Expiration Date",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_pharmaprocessing",
        type: "TEXT",
        label: "Pharma Processing",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_mfgprocessing",
        type: "TEXT",
        label: "Manuf Processing",
        updateDisplayType: "DISABLED",
      },
    ],
  };

  /**
   * Get the returnable item return scan group by manufacturer
   * @param {number}options.rrId - Return Request Id
   * @param {number}options.tranId - Document Number
   * @param {boolean} options.inDated - Returnable can be in Dated or not
   * @param {string} options.selectionType - Returnable / Destruction / In Dated
   * @since 07/11/2023
   * @return {array} Return manufacturing list
   */
  function getReturnableManufacturer(options) {
    try {
      //log.audit("getReturnableManufacturer", options);
      let inDated = options.inDated == false ? "F" : "T";
      let rrId = options.rrId;
      let manufacturer = [];
      let filters = [];

      filters.push(
        search.createFilter({
          name: "custrecord_cs_ret_req_scan_rrid",
          operator: "anyof",
          values: options.rrId,
        })
      );
      filters.push(
        search.createFilter({
          name: "custrecord_cs__mfgprocessing",
          operator: "anyof",
          values: 2,
        })
      );
      filters.push(
        search.createFilter({
          name: "custrecord_scanindated",
          operator: "is",
          values: inDated,
        })
      );
      let columns = [];
      columns.push(
        search.createColumn({
          name: "custrecord_cs_item_manufacturer",
          summary: "GROUP",
        })
      );
      if (options.inDated == true) {
        columns.push(
          search.createColumn({
            name: "custrecord_scanindate",
            summary: "MAX",
          })
        );
      }

      const transactionSearchObj = search.create({
        type: "customrecord_cs_item_ret_scan",
        filters: filters,
        columns: columns,
      });
      transactionSearchObj.run().each(function (result) {
        let manufName = result.getValue({
          name: "custrecord_cs_item_manufacturer",
          summary: "GROUP",
        });
        //fixed issue in the URL when there is an ampersand symbol in Manuf Name

        let manufURLName = manufName.replaceAll("&", "_");
        let inDate;
        if (options.inDated == true) {
          inDate = result.getValue({
            name: "custrecord_scanindate",
            summary: "MAX",
          });
        }
        let url = `<a href="https://6816904.app.netsuite.com/app/site/hosting/scriptlet.nl?script=831&deploy=1&compid=6816904&selectionType=${options.selectionType}&manufacturer=${manufURLName}&rrId=${rrId}&tranid=${options.tranId}&inDate=${inDate}">${manufName}</a>`;
        let isVerified = checkIfManufIsVerified({
          recId: rrId,
          manufName: manufName,
          inDated: inDated,
        });
        isVerified = isVerified === true ? "T" : "F";
        manufacturer.push({
          manufName: url,
          inDate: inDate,
          isVerified: isVerified,
          name: manufName,
        });
        if (options.inDated == false) delete manufacturer[0].inDated;
        return true;
      });
      log.emergency("manufacturer", manufacturer);
      return manufacturer;
    } catch (e) {
      log.error("getReturnableManufacturer", e.message);
    }
  }

  /**
   * Check if the manufacturer is verified
   * @param {string} options.manufName Manufacturer Name
   * @param {number} options.recId
   * @param {boolean} options.inDated
   * @return {boolean}
   */
  function checkIfManufIsVerified(options) {
    try {
      let manuf = options.manufName;
      //log.audit("checkIfManufIsVerified", options);
      let ISVERIFIED = true;
      let filters = [];
      filters.push(
        search.createFilter({
          name: "custrecord_cs_ret_req_scan_rrid",
          operator: "anyof",
          values: options.recId,
        })
      );
      filters.push(
        search.createFilter({
          name: "custrecord_cs__mfgprocessing",
          operator: "anyof",
          values: 2,
        })
      );
      filters.push(
        search.createFilter({
          name: "custrecord_scanindated",
          operator: "is",
          values: options.inDated,
        })
      );
      filters.push(
        search.createFilter({
          name: "custrecord_cs_item_manufacturer",
          operator: "is",
          values: options.manufName,
        })
      );
      const transactionSearchObj = search.create({
        type: "customrecord_cs_item_ret_scan",
        filters: filters,

        columns: [
          search.createColumn({
            name: "custrecord_is_verified",
            summary: "GROUP",
            label: "Verified",
          }),
        ],
      });
      let column = transactionSearchObj.columns;
      const searchResultCount = transactionSearchObj.runPaged().count;
      transactionSearchObj.run().each(function (result) {
        let isVerified = result.getValue(column[0]);
        // log.audit("isVerified", { manuf, isVerified });
        if (isVerified == false) {
          ISVERIFIED = false;
          return false;
        }
      });
      log.audit("results", { manuf, searchResultCount, ISVERIFIED });
      return searchResultCount == 1 && ISVERIFIED == true;
    } catch (e) {
      log.error("checkIfManufIsVerified", e.message);
    }
  }

  /**
   * Get the manufacturer ID
   * @param name
   */
  function getManufactuerId(name) {
    let manufId;
    var customrecord_csegmanufacturerSearchObj = search.create({
      type: "customrecord_csegmanufacturer",
      filters: [["name", "is", name]],
      columns: [
        search.createColumn({ name: "internalid", label: "Internal ID" }),
        search.createColumn({
          name: "name",
          sort: search.Sort.ASC,
          label: "Name",
        }),
      ],
    });

    customrecord_csegmanufacturerSearchObj.run().each(function (result) {
      manufId = result.id;
    });
    return manufId;
  }

  /**
   * Get all of the item return scan hazardous
   * @param options.isHazardous
   * @param options.rrId
   * @return {*[]} return hazardous item return scan list
   */
  function getDesctructionHazardous(options) {
    try {
      log.emergency("getDesctructionHazardous", options);
      let ISHAZARDOUS = options.isHazardous == "true" ? "T" : "F";
      log.emergency("ISHAZARDOUS", ISHAZARDOUS);
      let hazardousList = [];
      var customrecord_cs_item_ret_scanSearchObj = search.create({
        type: "customrecord_cs_item_ret_scan",
        filters: [
          ["custrecord_cs__mfgprocessing", "anyof", "1"],
          "AND",
          ["custrecord_cs_return_req_scan_item.custitem1", "is", ISHAZARDOUS],
          "AND",
          ["custrecord_cs_ret_req_scan_rrid", "anyof", options.rrId],
        ],
        columns: [
          search.createColumn({
            name: "custrecord_is_verified",
            label: "Verified",
          }),
          search.createColumn({ name: "internalid", label: "Internal ID" }),
          search.createColumn({
            name: "itemid",
            join: "CUSTRECORD_CS_RETURN_REQ_SCAN_ITEM",
            label: "NDC",
          }),
          search.createColumn({
            name: "purchasedescription",
            join: "CUSTRECORD_CS_RETURN_REQ_SCAN_ITEM",
            label: "Description",
          }),
          search.createColumn({
            name: "custrecord_scanmanufacturer",
            label: "Manufacturer",
          }),
          search.createColumn({
            name: "custrecord_cs_lotnum",
            label: "Serial/Lot Number",
          }),
          search.createColumn({
            name: "custrecord_scanorginallotnumber",
            label: "Original Lot Number",
          }),
          search.createColumn({
            name: "custrecord_cs_full_partial_package",
            label: "Full/Partial Package",
          }),
          search.createColumn({ name: "custrecord_cs_qty", label: "Qty" }),
          search.createColumn({
            name: "custrecord_scanpartialcount",
            label: "Partial Count",
          }),
          search.createColumn({
            name: "custrecord_cs_expiration_date",
            label: "Expiration Date",
          }),
          search.createColumn({
            name: "custrecord_cs__rqstprocesing",
            label: "Pharmacy Processing",
          }),
          search.createColumn({
            name: "custrecord_cs__mfgprocessing",
            label: "Mfg Processing",
          }),
          search.createColumn({
            name: "internalid",
            join: "CUSTRECORD_CS_RETURN_REQ_SCAN_ITEM",
          }),
        ],
      });
      let column = customrecord_cs_item_ret_scanSearchObj.columns;
      customrecord_cs_item_ret_scanSearchObj.run().each(function (result) {
        let verified = result.getValue(column[0]) == true ? "T" : "F";
        let ndcName = result.getValue(column[2]);
        let itemId = result.getValue({
          name: "internalid",
          join: "CUSTRECORD_CS_RETURN_REQ_SCAN_ITEM",
        });

        let ndcLink = `https://6816904.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=436&id=${result.id}&e=T&pf=CUSTRECORD_CS_RET_REQ_SCAN_RRID&pi=10798&pr=-30`;

        hazardousList.push({
          internalId: result.getValue(column[1]),
          verified: verified,
          ndc: `<a href =${ndcLink}> ${ndcName} </a>`,
          description: result.getValue(column[3]),
          manufacturer: result.getValue(column[4]),
          serialLotNumber: result.getValue(column[5]),
          originalLotNumber: result.getValue(column[6]),
          fullPartialPackage: result.getText(column[7]),
          quantity: result.getValue(column[8]),
          partialCount: result.getValue(column[9]),
          expirationDate: result.getValue(column[10]),
          pharmaProcessing: result.getText(column[11]),
          mfgProcessing: result.getText(column[12]),
        });
        return true;
      });
      return hazardousList;
    } catch (e) {
      log.error("getDesctructionHazardous", e.message);
    }
  }

  /**
   * Get the item return scan record based on Return request and Manufacturer and In Dated Status
   * @param {number}options.rrId - Return Request Id
   * @param {string}options.manufacturer - Manufacturer Text Name
   * @param {boolean} options.inDated - Check If In dated
   * @returns {object} returns the item scanlist
   */
  function getItemScanReturnbleByManufacturer(options) {
    try {
      let manufacturer = options.manufacturer;

      //log.audit("getItemScanByManufacturer", options);
      let itemScanList = [];
      let filters = [];
      filters.push(
        search.createFilter({
          name: "custrecord_cs_ret_req_scan_rrid",
          operator: "anyof",
          values: options.rrId,
        })
      );
      filters.push(
        search.createFilter({
          name: "custrecord_cs_item_manufacturer",
          operator: "is",
          values: manufacturer,
        })
      );
      filters.push(
        search.createFilter({
          name: "custrecord_cs__mfgprocessing",
          operator: "anyof",
          values: 2,
        })
      );
      filters.push(
        search.createFilter({
          name: "custrecord_scanindated",
          operator: "is",
          values: options.inDated,
        })
      );

      const customrecord_cs_item_ret_scanSearchObj = search.create({
        type: "customrecord_cs_item_ret_scan",
        filters: filters,
        columns: [
          search.createColumn({
            name: "custrecord_is_verified",
            label: "Verified",
          }),
          search.createColumn({
            name: "custrecord_cs_item_ndc",
            label: "Item Details Display - NDC",
          }),
          search.createColumn({
            name: "salesdescription",
            join: "CUSTRECORD_CS_RETURN_REQ_SCAN_ITEM",
            label: "Description",
          }),
          search.createColumn({
            name: "custrecord_cs_item_manufacturer",
            label: "Item manufacturer",
          }),
          search.createColumn({ name: "created", label: "Scanned on" }),
          search.createColumn({
            name: "custrecord_cs_lotnum",
            label: "Serial/Lot Number",
          }),
          search.createColumn({
            name: "custrecord_cs_full_partial_package",
            label: "Full/Partial Package",
          }),
          search.createColumn({
            name: "custrecord_cs_expiration_date",
            label: "Expiration Date",
          }),
          search.createColumn({
            name: "custrecord_cs__mfgprocessing",
            label: "Mfg Processing",
          }),
          search.createColumn({
            name: "custrecord_cs__rqstprocesing",
            label: "Pharmacy Processing",
          }),
          search.createColumn({
            name: "internalid",
            join: "CUSTRECORD_CS_RETURN_REQ_SCAN_ITEM",
            label: "Internal ID",
          }),
          search.createColumn({ name: "custrecord_scanrate", label: "Rate" }),
          search.createColumn({
            name: "custrecord_isc_overriderate",
            label: "Override Rate",
          }),
          search.createColumn({ name: "custrecord_cs_qty", label: "Qty" }),
          search.createColumn({
            name: "custrecord_scanbagtaglabel",
            label: "Bag Tag Label",
          }),
          search.createColumn({
            name: "custrecord_isc_inputrate",
            label: "Input Rate",
          }),
        ],
      });

      let column = customrecord_cs_item_ret_scanSearchObj.columns;
      customrecord_cs_item_ret_scanSearchObj.run().each(function (result) {
        let inputRate = result.getValue("custrecord_isc_inputrate");
        let isOverrideRate = result.getValue("custrecord_isc_overriderate");
        let rate = result.getValue("custrecord_scanrate") || 0;
        let qty = result.getValue("custrecord_cs_qty") || 0;
        let bagTagLabel = result.getValue("custrecord_scanbagtaglabel");

        let amount = isOverrideRate == true ? inputRate : +rate * +qty;

        let verified = result.getValue(column[0]) == true ? "T" : "F";
        let ndcName = result.getValue(column[1]);
        let ndcLink = `https://6816904.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=436&id=${result.id}&e=T&pf=CUSTRECORD_CS_RET_REQ_SCAN_RRID&pi=10798&pr=-30`;
        itemScanList.push({
          internalId: result.id,
          verified: verified,
          ndc: `<a href=${ndcLink}>${ndcName}</a>`,
          description: result.getValue(column[2]),
          manufacturer: result.getValue(column[3]),
          dateCreated: result.getValue(column[4]),
          serialLotNumber: result.getValue(column[5]),
          fullPartialPackage: result.getText(column[6]),
          expirationDate: result.getValue(column[7]),
          mfgProcessing: result.getText(column[8]),
          pharmaProcessing: result.getText(column[9]),
          amount: amount || 0,
          bagTagLabel: `<a href ="https://6816904.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=401&id=${bagTagLabel}" target="_blank">${bagTagLabel}</a>`,
          itemId: result.getValue({
            name: "internalid",
            join: "CUSTRECORD_CS_RETURN_REQ_SCAN_ITEM",
          }),
          manufId: getManufactuerId(result.getValue(column[3]))
        });
        return true;
      });
      return itemScanList;
    } catch (e) {
      log.error("getItemScanByManufacturer", e.message);
    }
  }

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

  /**
   * return the hazardous item return scan group by Hazardous
   * @param {number} options.rrId return request Id
   * @param {string} options.tranId transaction of the return request
   * @return {object} array object of the des destruction item return scan
   */
  function getItemScanByDescrutionType(options) {
    // log.audit("getItemScanByDescrutionType", options);
    try {
      let destructionList = [];
      let rrId = options.rrId;
      const customrecord_cs_item_ret_scanSearchObj = search.create({
        type: "customrecord_cs_item_ret_scan",
        filters: [
          ["custrecord_cs__mfgprocessing", "anyof", "1"],
          "AND",
          ["custrecord_cs_ret_req_scan_rrid", "anyof", rrId],
          "AND",
          ["custrecord_scanindated", "is", "F"],
        ],
        columns: [
          search.createColumn({
            name: "custitem1",
            join: "CUSTRECORD_CS_RETURN_REQ_SCAN_ITEM",
            summary: "GROUP",
            sort: search.Sort.ASC,
            label: "Hazardous Material",
          }),
        ],
      });

      let column = customrecord_cs_item_ret_scanSearchObj.columns;
      customrecord_cs_item_ret_scanSearchObj.run().each(function (result) {
        let isHazardous = result.getValue(column[0]);
        let name =
          isHazardous == true ? "Destruction Hazardous" : "Destruction";
        let url = `<a href="https://6816904.app.netsuite.com/app/site/hosting/scriptlet.nl?script=831&deploy=1&compid=6816904&selectionType=Destruction&isHazardous=${isHazardous}&rrId=${rrId}&tranid=${options.tranId}">${name}</a>`;
        let isVerified = checkIfHazardousIsVerified({
          recId: rrId,
          isHazardous: isHazardous,
        });
        isVerified = isVerified === true ? "T" : "F";
        destructionList.push({
          destruction: url,
          isVerified: isVerified,
          name: name,
        });
        return true;
      });
      log.emergency("getItemScanByDescrutionType des ", destructionList);
      return destructionList;
    } catch (e) {
      log.error("getItemScanByDescrutionType", e.message);
    }
  }

  /**
   * Check if the hazardous is verified or not
   * @param {number} options.recId Return request internal id
   * @param {boolean} options.isHazardous Item Hazardous Material Field
   * @return {boolean} return if the destruction or destruction hazardous is verified
   */
  function checkIfHazardousIsVerified(options) {
    try {
      log.emergency("checkIfHazardousIsVerified", options);
      let ISVERIFIED = true;
      let ISHAZARDOUS = options.isHazardous == true ? "T" : "F";
      var customrecord_cs_item_ret_scanSearchObj = search.create({
        type: "customrecord_cs_item_ret_scan",
        filters: [
          ["custrecord_cs__mfgprocessing", "anyof", "1"],
          "AND",
          ["custrecord_cs_return_req_scan_item.custitem1", "is", ISHAZARDOUS],
          "AND",
          ["custrecord_cs_ret_req_scan_rrid", "anyof", options.recId],
        ],

        columns: [
          search.createColumn({
            name: "custrecord_is_verified",
            summary: "GROUP",
            label: "Verified",
          }),
        ],
      });
      const searchResultCount =
        customrecord_cs_item_ret_scanSearchObj.runPaged().count;
      let column = customrecord_cs_item_ret_scanSearchObj.columns;
      customrecord_cs_item_ret_scanSearchObj.run().each(function (result) {
        let isVerified = result.getValue(column[0]);
        if (isVerified == false) {
          ISVERIFIED = false;
          return false;
        }
        return true;
      });
      //log.audit("checkifVerified", { searchResultCount, ISVERIFIED });
      return searchResultCount == 1 && ISVERIFIED == true;
    } catch (e) {
      log.error("checkIfHazardousIsVerified", e.message);
    }
  }

  /**
   * Update the status of the item return scan
   * @param {number} options.ids Internal Id of the return item scan
   * @param {boolean} options.isVerify
   * @return {number} item return scan Id
   */
  function updateVerificationStatus(options) {
    try {
      let ids = options.ids;
      for (let i = 0; i < ids.length; i++) {
        record.submitFields.promise({
          type: "customrecord_cs_item_ret_scan",
          id: +ids[i],
          values: {
            custrecord_is_verified: options.isVerify,
          },
        });
      }
    } catch (e) {
      log.error("updateVerificationStatus", e.message);
    }
  }

  return {
    getReturnableManufacturer,
    getItemScanByManufacturer: getItemScanReturnbleByManufacturer,
    getDesctructionHazardous,
    getItemScanByDescrutionType,
    getFileId,
    isEmpty,
    updateVerificationStatus,
    SUBLISTFIELDS,
  };
});
