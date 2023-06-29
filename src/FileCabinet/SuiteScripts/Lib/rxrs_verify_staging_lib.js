/**
 * @NApiVersion 2.1
 */
define(["N/redirect", "N/render", "N/runtime", "N/search", "N/url"], /**
 * @param{redirect} redirect
 * @param{render} render
 * @param{runtime} runtime
 * @param{search} search
 * @param{url} url
 */ (redirect, render, runtime, search, url) => {
  /**
   * Get the returnable item return scan group by manufacturer
   * @param rrId
   */
  function getReturnableManufacturer(rrId) {
    try {
      let manufacturer = [];
      const transactionSearchObj = search.create({
        type: "transaction",
        filters: [
          ["type", "anyof", "CuTrSale102", "CuTrPrch106"],
          "AND",
          ["mainline", "is", "T"],
          "AND",
          [
            "custrecord_cs_ret_req_scan_rrid.custrecord_cs__mfgprocessing",
            "anyof",
            "2",
          ],
          "AND",
          [
            "custrecord_cs_ret_req_scan_rrid.custrecord_cs_ret_req_scan_rrid",
            "anyof",
            "10807",
          ],
        ],
        columns: [
          search.createColumn({
            name: "custrecord_cs_item_manufacturer",
            join: "CUSTRECORD_CS_RET_REQ_SCAN_RRID",
            summary: "GROUP",
            sort: search.Sort.ASC,
            label: "Manufacturer",
          }),
          search.createColumn({
            name: "custrecord_is_verified",
            join: "CUSTRECORD_CS_RET_REQ_SCAN_RRID",
            summary: "MAX",
            label: "Verified",
          }),
        ],
      });

      transactionSearchObj.run().each(function (result) {
        let manufName = result.getValue({
          name: "custrecord_cs_item_manufacturer",
          join: "CUSTRECORD_CS_RET_REQ_SCAN_RRID",
          summary: "GROUP",
        });
        let isVerified = result.getValue({
          name: "custrecord_is_verified",
          join: "CUSTRECORD_CS_RET_REQ_SCAN_RRID",
        });
        let url = `<a href="https://6816904.app.netsuite.com/app/site/hosting/scriptlet.nl?script=831&deploy=1&compid=6816904&selectionType=Returnable&manufacturer=${manufName}">${manufName}</a>`;
        manufacturer.push({
          manufName: url,
          isVerified: isVerified,
          name: manufName
        });
        return true;
      });
      return manufacturer;
    } catch (e) {
      log.error("getReturnableManufacturer", e.message);
    }
  }

  const SUBLISTFIELDS = {
    returnableSublist: [
      {
        id: "custpage_manuf_name",
        type: "TEXT",
        label: "Group By",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_verified",
        type: "CHECKBOX",
        label: "Verified",
        updateDisplayType: "NORMAL",
      },
    ],
    returnableManufacturer: [
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
    ],
  };

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
   * Get the item return scan record based on Return request and Manufacturer
   * @param {number}options.rrId - Return Request Id
   * @param {string}options.manufacturer - Manufacturer Text Name
   * @returns {object} returns the item scanlist
   */
  function getItemScanByManufacturer(options) {
    try {
      let manufacturer = options.manufacturer;
      log.emergency("getItemScanByManufacturer", getItemScanByManufacturer)

      log.audit("getItemScanByManufacturer", manufacturer);
      let itemScanList = [];
      const customrecord_cs_item_ret_scanSearchObj = search.create({
        type: "customrecord_cs_item_ret_scan",
        filters: [
          ["custrecord_cs_ret_req_scan_rrid", "anyof", options.rrId],
          "AND",
          ["custrecord_cs_item_manufacturer", "is", manufacturer],
          "AND",
          ["custrecord_cs__mfgprocessing", "anyof", "2"],
          "AND",
          ["custrecord_scanindated", "is", "F"],
        ],
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
        ],
      });

      let column = customrecord_cs_item_ret_scanSearchObj.columns;
      customrecord_cs_item_ret_scanSearchObj.run().each(function (result) {
        let verified = result.getValue(column[0]) == true ? "T" : "F"

        itemScanList.push({
          verified: verified,
          ndc: result.getValue(column[1]),
          description: result.getValue(column[2]),
          manufacturer: result.getValue(column[3]),
          dateCreated: result.getValue(column[4]),
          serialLotNumber: result.getValue(column[5]),
          fullPartialPackage: result.getValue(column[6]),
          expirationDate: result.getValue(column[7]),
          mfgProcessing: result.getText(column[8]),
          pharmaProcessing: result.getText(column[9]),
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
    const fileSearch = search
      .create({
        type: "file",
        filters: [["name", "is", fileName]],
      })
      .run()
      .getRange({ start: 0, end: 1 });
    return fileSearch[0].id;
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
    getReturnableManufacturer,
    getFileId,
    getItemScanByManufacturer,
    isEmpty,
    SUBLISTFIELDS,
  };
});
