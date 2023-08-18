/**
 * @NApiVersion 2.1
 */

define([
  "N/ui/serverWidget",
  "N/redirect",
  "N/render",
  "N/runtime",
  "N/search",
  "N/url",
  "N/record",
  "./rxrs_util",
  "./rxrs_verify_staging_lib",
  "./rxrs_print_inventory_lib",
], /**
 * @param serverWidget
 * @param{redirect} redirect
 * @param{render} render
 * @param{runtime} runtime
 * @param{search} search
 * @param{url} url
 * @param record
 * @param rxrs_util
 * @param rxrs_vs_lib
 * @param rxrs_PI_lib
 */ (
  serverWidget,
  redirect,
  render,
  runtime,
  search,
  url,
  record,
  rxrs_util,
  rxrs_vs_lib,
  rxrs_PI_lib
) => {
  const VERIFYSTAGINGRETURNABLECOLUMNS = [
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
    search.createColumn({
      name: "custrecord_scanindate",
      label: "In Date",
    }),
    search.createColumn({
      name: "custrecord_wac_amount",
      sort: search.Sort.ASC,
      label: "Amount",
    }),
  ];
  const RETURNCOVERLETTERCOLUMNS = [
    search.createColumn({
      name: "created",
      summary: "MAX",
      label: "Date Created",
    }),
    search.createColumn({
      name: "custrecord_wac_amount",
      summary: "SUM",
      label: "Amount",
    }),
    search.createColumn({
      name: "custrecord_scan_paymentschedule",
      summary: "GROUP",
      label: "Payment Sched",
    }),
  ];
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
        id: "custpage_print_inventory",
        type: "TEXT",
        label: "Print Inventory",
        updateDisplayType: "NORMAL",
      },
      {
        id: "custpage_print_label",
        type: "TEXT",
        label: "Print Label",
        updateDisplayType: "NORMAL",
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
      {
        id: "custpage_return_list",
        type: "TEXT",
        label: "Return List",
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
        id: "custpage_in_date",
        type: "TEXT",
        label: "In Date",
        updateDisplayType: "INLINE",
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
        updateDisplayType: "HIDDEN",
      },
      {
        id: "custpage_manuf_id",
        type: "TEXT",
        label: "Manuf Id",
        updateDisplayType: "HIDDEN",
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
      {
        id: "custpage_in_date",
        type: "TEXT",
        label: "In Date",
        updateDisplayType: "INLINE",
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
        id: "custpage_print_inventory",
        type: "TEXT",
        label: "Print Inventory",
        updateDisplayType: "NORMAL",
      },
      {
        id: "custpage_print_label",
        type: "TEXT",
        label: "Print Label",
        updateDisplayType: "NORMAL",
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
      {
        id: "custpage_bag_tag_label",
        type: "TEXT",
        label: "Bag Tag Label",
        updateDisplayType: "INLINE",
      },
    ],
    returnCoverLetterFields: [
      {
        id: "custpage_date_created",
        type: "TEXT",
        label: "Date Created",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_amount",
        type: "TEXT",
        label: "AMOUNT",
        updateDisplayType: "DISABLED",
      },
      {
        id: "custpage_payment_type",
        type: "TEXT",
        label: "Payment Type",
        updateDisplayType: "DISABLED",
      },
    ],
  };

  /**
   * RETURNABLE FUNCTIONALITY
   */

  /**
   * Get the returnable item return scan group by manufacturer
   * @param {number}options.rrId - Return Request Id
   * @param {number}options.tranId - Document Number
   * @param {boolean} options.inDated - Returnable can be in Dated or not
   * @param {string} options.rrType - return request rec type
   * @param {number} options.mrrId - master return request Id
   * @param {string} options.selectionType - Returnable / Destruction / In Dated
   * @return {array} Return manufacturing list
   */
  function getReturnableManufacturer(options) {
    try {
      log.audit("getReturnableManufacturer", options);
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
          values: 2, // returnable = true
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

        let returnableScanList = getItemScanReturnbleByManufacturer({
          rrId: options.rrId,
          manufacturer: manufName,
          inDated: options.inDated,
          rrType: options.rrType,
          mrrId: options.mrrId,
          isVerifyStaging: true,
        });
        let currentAmount = 0;
        returnableScanList.forEach((ret) => (currentAmount += +ret.amount));
        log.error("returnableScanList", { manufName, returnableScanList });
        let manufId = getManufactuerId(manufName);
        //fixed issue in the URL when there is an ampersand symbol in Manuf Name
        let manufMaximumAmount = getManufMaxSoAmount(manufId)
          ? getManufMaxSoAmount(manufId)
          : 0;
        log.error("new info", { manufName, manufMaximumAmount, currentAmount });
        let numberOfBags;
        numberOfBags =
          +manufMaximumAmount > +currentAmount
            ? 1
            : +currentAmount / +manufMaximumAmount;
        numberOfBags = Math.ceil(numberOfBags);
        let manufURLName = manufName.replaceAll("&", "_");
        if (manufMaximumAmount == 0 || currentAmount == 0) {
          numberOfBags = 1;
        }
        log.error("numberOfBags", numberOfBags);

        let bags = [];
        for (let i = 1; i <= numberOfBags; i++) {
          bags.push(i);
        }
        let bagList = [];
        let inDate;
        if (options.inDated == true) {
          inDate = result.getValue({
            name: "custrecord_scanindate",
            summary: "MAX",
          });
        }

        let sum = 0;
        let b = 0;
        /**
         * Group the return item scanlist based from the manuf maximum amount
         */
        log.error("returnableScanList", returnableScanList);
        try {
          if (manufMaximumAmount >= currentAmount) {
            let holder = [];
            returnableScanList.forEach((ret) => {
              holder.push(ret.internalId);
            });
            bagList.push(holder);
          } else {
            for (let i = 0; i < returnableScanList.length; i++) {
              sum += +returnableScanList[i].amount;
              if (sum <= +manufMaximumAmount) {
                if (sum == manufMaximumAmount) {
                  b += 1;
                  sum = 0;
                }
                if (sum == 0 && manufMaximumAmount == 0) {
                  b = 0;
                }
                bagList.push({
                  bag: bags[b],
                  scanId: returnableScanList[i].internalId,
                });
              } else {
                b += 1;
                if (b >= bags.length) {
                  b = b - 1;
                }
                bagList.push({
                  bag: bags[b],
                  scanId: returnableScanList[i].internalId,
                });
                sum = 0;
              }
            }

            const groupBy = (a, f) =>
              a.reduce((x, c) => (x[f(c)] ??= []).push(c) && x, {});

            bagList = groupBy(bagList, (b) => b.bag);
            let mainBags = [];

            for (let i = 1; i <= numberOfBags; i++) {
              try {
                let a = bagList[i];
                let temp = [];
                a.forEach((b) => temp.push(b.scanId));
                mainBags.push(temp);
              } catch (e) {
                log.error("adding to bag", e.message);
              }
            }
            bagList = mainBags;
          }
          log.debug("bag", bagList);
        } catch (e) {
          log.error("GROUPING RETURN LIST", e.message);
        }

        // let mainFields = rxrs_PI_lib.getInventoryLocationObject({
        //   rrId: rrId,
        //   rrType: options.rrType,
        //   manufId: manufId,
        //   returnList: bag,
        //   inventoryStatus: options.selectionType
        // })
        log.debug("aaa ", bagList);
        bagList.forEach((bag) => {
          let verification = checkIfReturnScanIsVerified({
            recId: rrId,
            returnList: bag,
            inDated: inDated,
          });
          log.debug("isVerified", verification);
          let isVerified = verification.isVerified === true ? "T" : "F";
          log.debug("isVerif", verification.isVerified);
          let bagLabel = isVerified == "T" ? verification.bagLabel : "";
          let printSLURL;
          let returnList = JSON.stringify(bag.join("_"));
          let params = {
            rrId: rrId,
            rrType: options.rrType,
            manufId: manufId,
            returnList: returnList,
            inventoryStatus: options.selectionType,
          };
          if (bagLabel) {
            printSLURL = url.resolveScript({
              scriptId: "customscript_sl_print_bag_label",
              deploymentId: "customdeploy_sl_print_bag_label",
              returnExternalUrl: false,
              params: {
                recId: bagLabel,
              },
            });
          }

          let printSLInventory = url.resolveScript({
            scriptId: "customscript_sl_print_inv_report",
            deploymentId: "customdeploy_sl_print_inv_report",
            returnExternalUrl: false,
            params: params,
          });
          let stSuiteletUrl = url.resolveScript({
            scriptId: "customscript_sl_returnable_page",
            deploymentId: "customdeploy_sl_returnable_page",
            returnExternalUrl: false,
            params: {
              selectionType: options.selectionType,
              manufacturer: manufURLName,
              rrId: rrId,
              tranid: options.tranId,
              inDate: inDate,
              rrType: options.rrType,
              mrrId: options.mrrId,
              returnList: returnList,
            },
          });

          manufacturer.push({
            manufName: `<a href="${stSuiteletUrl}">${manufName}</a>`,
            inDate: inDate,
            printInventory: printSLInventory
              ? `<a href="${printSLInventory}">Print Inventory</a>`
              : "",
            printLabel: printSLURL
              ? `<a href="${printSLURL}">Print Label</a>`
              : "No Bag Label/Not Verified",
            isVerified: isVerified,
            name: manufName,
            returnableScanList: bag,
          });
          if (options.inDated == false) delete manufacturer[0].inDated;
        });

        return true;
      });
      log.debug("manufacturer", manufacturer);
      return manufacturer;
    } catch (e) {
      log.error("getReturnableManufacturer", e.message);
    }
  }

  /**
   * Check if the returnList is verified
   * @param {string} options.returnList
   * @param {number} options.recId
   * @param {boolean} options.inDated
   * @return {boolean}
   */
  function checkIfReturnScanIsVerified(options) {
    try {
      let ISVERIFIED = true;
      let bagLabel;
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
          name: "internalid",
          operator: "anyof",
          values: options.returnList,
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
          search.createColumn({
            name: "custrecord_scanbagtaglabel",
            summary: "GROUP",
            label: "Bag Tag Label",
          }),
        ],
      });

      let column = transactionSearchObj.columns;
      const searchResultCount = transactionSearchObj.runPaged().count;
      transactionSearchObj.run().each(function (result) {
        let isVerified = result.getValue(column[0]);
        bagLabel = result.getValue(column[1]);
        // log.audit("isVerified", { manuf, isVerified });
        if (isVerified == false) {
          ISVERIFIED = false;
          return false;
        }
        return true;
      });
      return {
        isVerified: ISVERIFIED == true,
        bagLabel: bagLabel,
      };
    } catch (e) {
      log.error("checkIfReturnScanIsVerified", e.message);
    }
  }

  /**
   * Get the bag label if the all the return list is verified
   * @param {array}options.returnList
   */
  function getReturnListBagLabel(options) {
    log.error("getReturnListBagLabel", options.returnList);

    try {
      let bagLabel;
      let filters = [];
      filters.push(
        search.createFilter({
          name: "internalid",
          operator: "anyof",
          values: options.returnList,
        })
      );
      const customrecord_cs_item_ret_scanSearchObj = search.create({
        type: "customrecord_cs_item_ret_scan",
        filters: filters,
        columns: [
          search.createColumn({
            name: "custrecord_is_verified",
            summary: "GROUP",
            label: "Verified",
          }),
          search.createColumn({
            name: "custrecord_scanbagtaglabel",
            summary: "GROUP",
            label: "Bag Tag Label",
          }),
        ],
      });
      const searchResultCount =
        customrecord_cs_item_ret_scanSearchObj.runPaged().count;
      if (searchResultCount > 1) return null;
      customrecord_cs_item_ret_scanSearchObj.run().each(function (result) {
        bagLabel = result.getValue({
          name: "custrecord_scanbagtaglabel",
          summary: "GROUP",
        });
        return true;
      });
      return bagLabel;
    } catch (e) {
      log.error("getReturnListBagLabel", e.message);
    }
  }

  /**
   * Check if the returnRequest Is Verified
   * @param {string} options.rrId Manufacturer Name
   * @return {boolean}
   */
  function checkIfRRIsVerified(options) {
    try {
      let manuf = options.manufName;
      //log.audit("checkIfManufIsVerified", options);
      let ISVERIFIED = true;
      let filters = [];
      filters.push(
        search.createFilter({
          name: "custrecord_cs_ret_req_scan_rrid",
          operator: "anyof",
          values: options.rrId,
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
      log.error("checkIfRRIsVerified", e.message);
    }
  }

  /**
   * Get the manufacturer ID
   * @param {string}name
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
   * Get the item return scan record based on Return request and Manufacturer and In Dated Status
   * @param {number}options.rrId - Return Request Id
   * @param {string}options.manufacturer - Manufacturer Text Name
   * @param {boolean} options.inDated - Check If In dated
   * @param {string} options.rrType - Return Request Type
   * @param {number} options.mrrId - Master Return Request Id
   * @param {array} options.returnList - List of the return item scan
   * @param {boolean} options.isVerifyStaging - Check if the suitelet is for Verify Staging else it is use for return cover letter
   * @returns {object} returns the item scanlist
   */
  function getItemScanReturnbleByManufacturer(options) {
    try {
      let itemScanList = [];
      let filters = [];
      let manufacturer = options.manufacturer;
      let columns;
      columns =
        options.isVerifyStaging == true
          ? VERIFYSTAGINGRETURNABLECOLUMNS
          : RETURNCOVERLETTERCOLUMNS;

      //log.audit("getItemScanByManufacturer", options);

      if (options.returnList) {
        filters.push(
          search.createFilter({
            name: "internalid",
            operator: "anyof",
            values: options.returnList,
          })
        );
      } else {
        filters.push(
          search.createFilter({
            name: "custrecord_cs_ret_req_scan_rrid",
            operator: "anyof",
            values: options.rrId,
          })
        );
        if (options.isVerifyStaging == true) {
          filters.push(
            search.createFilter({
              name: "custrecord_cs_item_manufacturer",
              operator: "is",
              values: manufacturer,
            })
          );
        }

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
      }

      const customrecord_cs_item_ret_scanSearchObj = search.create({
        type: "customrecord_cs_item_ret_scan",
        filters: filters,
        columns: columns,
      });

      let column = customrecord_cs_item_ret_scanSearchObj.columns;
      customrecord_cs_item_ret_scanSearchObj.run().each(function (result) {
        if (options.isVerifyStaging == true) {
          let inputRate = result.getValue("custrecord_isc_inputrate");
          let isOverrideRate = result.getValue("custrecord_isc_overriderate");
          let rate = result.getValue("custrecord_scanrate") || 0;
          let qty = result.getValue("custrecord_cs_qty") || 0;
          let bagTagLabel = result.getValue("custrecord_scanbagtaglabel");
          let itemId = result.getValue({
            name: "internalid",
            join: "CUSTRECORD_CS_RETURN_REQ_SCAN_ITEM",
          });
          let amount = result.getValue("custrecord_wac_amount");
          let verified = result.getValue(column[0]) == true ? "T" : "F";
          let ndcName = result.getValue(column[1]);
          let ndcLink = generateRedirectLink({
            type: "customrecord_cs_item_ret_scan",
            id: result.id,
          });
          let bagLabelURL = generateRedirectLink({
            type: "customrecord_kd_taglabel",
            id: bagTagLabel,
          });
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
            inDate: result.getValue("custrecord_scanindate"),
            bagTagLabel: `<a href ="${bagLabelURL}" target="_blank">${bagTagLabel}</a>`,
            itemId: itemId,
            manufId: getManufactuerId(result.getValue(column[3])),
          });
          return true;
        } else {
          itemScanList.push({
            dateCreated: result.getValue({
              name: "created",
              summary: "MAX",
            }),
            amount: result.getValue({
              name: "custrecord_wac_amount",
              summary: "SUM",
            }),
            paymetnSchedule: result.getText({
              name: "custrecord_scan_paymentschedule",
              summary: "GROUP",
            }),
          });
          return true;
        }
      });
      log.audit("itemScanList", itemScanList);
      return itemScanList;
    } catch (e) {
      log.error("getItemScanByManufacturer", e.message);
    }
  }

  /**
   * HAZARDOUS FUNCTIONALITY
   */

  /**
   * return the hazardous item return scan group by Hazardous
   * @param {number} options.rrId return request Id
   * @param {string} options.tranId transaction of the return request
   * @param {string} options.rrType - return request type
   * @param {number} options.mrrId - master return request id
   * @param {string} options.selectionType - In Dated/Returnable/Destruction
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
        let stSuiteletUrl = url.resolveScript({
          scriptId: "customscript_sl_returnable_page",
          deploymentId: "customdeploy_sl_returnable_page",
          returnExternalUrl: false,
          params: {
            selectionType: options.selectionType,
            isHazardous: isHazardous,
            rrId: rrId,
            tranid: options.tranId,
            rrType: options.rrType,
            mrrId: options.mrrId,
          },
        });
        log.emergency("Is Hazzard", isHazardous);
        let isVerified = checkIfHazardousIsVerified({
          recId: rrId,
          isHazardous: isHazardous,
        });
        let returnData = getDesctructionHazardous({
          isHazardous: isHazardous,
          rrId: rrId,
          getBagLabel: true,
        });

        let returnList = returnData.returnList.join("_");
        log.emergency("returnDatareturnList", returnList);
        let params = {
          rrId: rrId,
          rrType: options.rrType,
          returnList: JSON.stringify(returnList),
          inventoryStatus: options.selectionType,
        };

        let printSLInventory = url.resolveScript({
          scriptId: "customscript_sl_print_inv_report",
          deploymentId: "customdeploy_sl_print_inv_report",
          returnExternalUrl: false,
          params: params,
        });
        let printSLURL;
        if (isVerified === true) {
          printSLURL = url.resolveScript({
            scriptId: "customscript_sl_print_bag_label",
            deploymentId: "customdeploy_sl_print_bag_label",
            returnExternalUrl: false,
            params: {
              recId: returnData.bagTagLabel,
            },
          });
        }
        isVerified = isVerified === true ? "T" : "F";
        destructionList.push({
          destruction: `<a href="${stSuiteletUrl}">${name}</a>`,
          printInventory: printSLInventory
            ? `<a href="${printSLInventory}">Print Inventory</a>`
            : "",
          printLabel: printSLURL
            ? `<a href="${printSLURL}">Print Label</a>`
            : "No Bag Label/Not Verified",
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
   * Get all the item return scan hazardous
   * @param {boolean}options.isHazardous
   * @param {number}options.rrId
   * @param {array}options.getReturnList
   * @return {*[]} return hazardous item return scan list
   */
  function getDesctructionHazardous(options) {
    try {
      let returnList = [];
      log.emergency("getDesctructionHazardous", options);
      let bagTagLabel;
      let ISHAZARDOUS =
        options.isHazardous == true || options.isHazardous == "true"
          ? "T"
          : "F";
      log.emergency("ISHAZARDOUS", ISHAZARDOUS);
      let hazardousList = [];
      const customrecord_cs_item_ret_scanSearchObj = search.create({
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
          search.createColumn({
            name: "custrecord_scanbagtaglabel",
            label: "Bag Tag Label",
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
        let ndcLink = generateRedirectLink({
          type: "customrecord_cs_item_ret_scan",
          id: result.id,
        });
        bagTagLabel = result.getValue("custrecord_scanbagtaglabel");
        let bagLabelURL;

        if (bagTagLabel) {
          bagLabelURL = generateRedirectLink({
            type: "customrecord_kd_taglabel",
            id: bagTagLabel,
          });
        }
        log.audit("bagTagLabel des", bagTagLabel);
        returnList.push(result.id);
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
          bagTagLabel: bagTagLabel
            ? `<a href ="${bagLabelURL}" target="_blank">${bagTagLabel}</a>`
            : null,
        });
        return true;
      });
      if (options.getBagLabel == true) {
        log.emergency("Value", { bagTagLabel, returnList });
        return { bagTagLabel, returnList };
      } else {
        return hazardousList;
      }
    } catch (e) {
      log.error("getDesctructionHazardous", e.message);
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

  function getWACPrice(itemId) {
    try {
      return rxrs_util.getItemRate({
        priceLevelName: 'Wholesale Acquisition Price "WAC" (input)',
        itemId: itemId,
      });
    } catch (e) {
      log.error("getWACPrice", e.message);
    }
  }

  /**
   * Get the Manufacturer Maximum SO allowed Amount
   * @param {number} manufId manufacturer Id
   * @return {number} Maximum Allowed SO Amount
   */
  function getManufMaxSoAmount(manufId) {
    try {
      let maxSOAmount;
      const customrecord_returnprocedureSearchObj = search.create({
        type: "customrecord_returnprocedure",
        filters: [["custrecord_returnprocmanufacturer", "anyof", manufId]],
        columns: [
          search.createColumn({
            name: "custrecord_psmaxvalue",
            label: "Maximum Value",
          }),
        ],
      });
      customrecord_returnprocedureSearchObj.run().each(function (result) {
        maxSOAmount = result.getValue("custrecord_psmaxvalue");
      });
      return maxSOAmount;
    } catch (e) {
      log.error("getManufMaxSoAmount", e.message);
    }
  }

  /**
   * Create a redirect link
   * @params {string} options.type
   * @params {number }options.id
   * @return {url} return URL
   */
  function generateRedirectLink(options) {
    try {
      return url.resolveRecord({
        recordType: options.type,
        recordId: options.id,
        isEditMode: false,
      });
    } catch (e) {
      log.error("generateRedirectLink", e.message);
    }
  }

  /**
   * Get the internal Id of the Entity in the Master Return Request
   * @param {number}mrrId
   * @return {number} Entity Id
   */
  function getEntityFromMrr(mrrId) {
    try {
      const rs = search.lookupFields({
        type: "customrecord_kod_masterreturn",
        id: mrrId,
        columns: ["custrecord_mrrentity"],
      });
      return +rs.custrecord_mrrentity[0].value;
    } catch (e) {
      log.error("getEntityFromMrr", e.message);
    }
  }

  /**
   * It creates a returnable sublist on the form and populates it with the items that are passed in
   * @param {object}options.form - The form object that we are adding the sublist to.
   * @param {number}options.rrTranId - Return Request Id
   * @param {object}options.sublistFields SublistFields
   * @param {array} options.value
   * @param {boolean} options.isMainReturnable
   * @param {string} options.rrName
   * @param {string} options.paramManufacturer
   * @param {number} options.mrrId
   * @param {string} options.rrType
   * @param {string} options.inDate
   * @param {string} options.title
   * @returns  Updated Form.
   */
  const createReturnableSublist = (options) => {
    try {
      log.debug("createReturnableSublist", options);
      //let inDate = options.paramInDate ? " : " + options.paramInDate : "";
      let manuf = options.paramManufacturer;
      let mrrId = options.mrrId;
      let rrType = options.rrType;
      let fieldName = [];
      let form = options.form;
      let sublistFields = options.sublistFields;
      let value = options.value;
      form.clientScriptFileId = getFileId("rxrs_cs_verify_staging.js");
      let sublist;

      sublist = form.addSublist({
        id: "custpage_items_sublist",
        type: serverWidget.SublistType.LIST,
        label: options.title,
      });

      if (manuf) {
        //If the user is in the Manufacturing Group. Add the following UI context below

        form.addButton({
          id: "custpage_verify",
          label: "Update Verification",
          functionName: `verify()`,
        });
        form.addButton({
          id: "custpage_back",
          label: "Back",
          functionName: `backToReturnable()`,
        });
        sublist.addMarkAllButtons();
      }

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
          if (isEmpty(fieldName[i])) continue;
          if (options.inDate != true && fieldName[i] == "custpage_in_date") {
            log.debug("val", [options.inDate, fieldName[i]]);
          } else {
            fieldInfo.push({
              fieldId: fieldName[i],
              value: value[i],
            });
          }
        }
        mainLineInfo.push(fieldInfo);
      });

      populateSublist({
        sublist: sublist,
        fieldInfo: mainLineInfo,
        isMainReturnable: options.isMainReturnable,
        isIndate: options.paramInDate,
      });
    } catch (e) {
      log.error("createReturnableSublist", e.message);
    }
  };
  /**
   * Populate the returnable sublist
   * @param options.sublist
   * @param options.fieldInfo
   * @param options.isMainReturnable
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

  return {
    getReturnableManufacturer,
    createReturnableSublist,
    checkIfRRIsVerified,
    getItemScanReturnbleByManufacturer,
    getDesctructionHazardous,
    getItemScanByDescrutionType,
    getFileId,
    isEmpty,
    getManufactuerId,
    getWACPrice,
    getManufMaxSoAmount,
    generateRedirectLink,
    getEntityFromMrr,
    SUBLISTFIELDS,
  };
});
