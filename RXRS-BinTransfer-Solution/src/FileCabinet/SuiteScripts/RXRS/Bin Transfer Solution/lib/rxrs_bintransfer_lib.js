/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
*/
define(
  // ['N/currentRecord', 'N/ui/dialog', 'N/url', 'N/https', '../RXRS Fedex Integration/Lib/util/rxrs_util_lib'],
  ['N/search', 'N/record', 'N/log', '../../../RXRS Fedex Integration/Lib/util/rxrs_util_lib'],
  (search, record, log, rxrsUtilLib) => {
    const inDateMonthList = {
      1: {
        monthDesc: 'Jan. - Mar.',
        internalId: 1,
      },
      2: {
        monthDesc: 'Apr. - May.',
        internalId: 2,
      },
      3: {
        monthDesc: 'Jun. - Aug.',
        internalId: 3,
      },
      4: {
        monthDesc: 'Sep. - Oct.',
        internalId: 4,
      },
      5: {
        monthDesc: 'Nov. - Dec.',
        internalId: 5,
      },
    };

    const inDateYearList = {
      1: { fiscalYear: 'F.Y. 2024', internalId: 1 },
      2: { fiscalYear: 'F.Y. 2025', internalId: 2 },
      3: { fiscalYear: 'F.Y. 2026', internalId: 3 },
      4: { fiscalYear: 'F.Y. 2027', internalId: 4 },
      5: { fiscalYear: 'F.Y. 2028', internalId: 5 },
      6: { fiscalYear: 'F.Y. 2029', internalId: 6 },
    };

    const mainBinTransferLib = {};

    const getYearInFiscalYearId = (parsedYear) => {
      let fiscalYearId;
      Object.keys(inDateYearList).forEach((key) => {
        const fiscalYearString = inDateYearList[key].fiscalYear;
        const fiscalYear = parseInt(fiscalYearString.split(' ')[1], 10);

        if (parsedYear === fiscalYear) {
          fiscalYearId = inDateYearList[key].internalId;
        }
      });

      return fiscalYearId; // Return null if no match is found
    };

    function getCurrentMonthAndYear(inputDate) {
      const date = new Date(inputDate);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      return { month, year };
    }


    function getInternalIdFromMonth(month) {
      let internalId;

      // Check the month range to determine the internalId
      if (month >= 1 && month <= 3) {
        internalId = inDateMonthList[1].internalId;
      } else if (month >= 4 && month <= 5) {
        internalId = inDateMonthList[2].internalId;
      } else if (month >= 6 && month <= 8) {
        internalId = inDateMonthList[3].internalId;
      } else if (month >= 9 && month <= 10) {
        internalId = inDateMonthList[4].internalId;
      } else if (month >= 11 && month <= 12) {
        internalId = inDateMonthList[5].internalId;
      }

      return internalId;
    }


    const findSerialNumberId = (serialNumber, itemId) => {
      let serialNumberId = '';
      const mySearch = search.load({
        type: search.Type.ITEM,
        id: 'customsearch_rxrs_serial_item_search',
      });

      mySearch.filters.push((search.createFilter({
        name: 'serialnumber',
        operator: search.Operator.IS,
        values: serialNumber,
      })));
      mySearch.filters.push((search.createFilter({
        name: 'internalidnumber',
        operator: search.Operator.EQUALTO,
        values: itemId,
      })));
      const mySearchCount = mySearch.runPaged().count;
      if (mySearchCount === 0) {
        return serialNumberId;
      }
      mySearch.run().each((result) => {
        log.debug('First Result ID', result.id);
        serialNumberId = result.getValue({
          name: 'internalid',
          join: 'inventoryNumber',
        }) || '';
        return false;
      });
      return serialNumberId;
    };

    const findBinLocationId = (inDate, prodCategId) => {
      const logTitle = 'findBinLocationId';
      let correctBinId = '';
      const monthYearObj = getCurrentMonthAndYear(inDate);
      const binIndateMonthId = getInternalIdFromMonth(monthYearObj.month);
      const binFiscalYearId = getYearInFiscalYearId(monthYearObj.year);
      log.debug({
        title: logTitle,
        details: {
          binIndateMonthId,
          binFiscalYearId,
        },
      });
      const mySearch = search.load({
        type: search.Type.BIN,
        id: 'customsearch_rxrs_bts_custom_binsearch',
      });

      mySearch.filters.push((search.createFilter({
        name: 'custrecord_bin_indate_month',
        operator: search.Operator.ANYOF,
        values: binIndateMonthId,
      })));
      mySearch.filters.push((search.createFilter({
        name: 'custrecord_bin_indate_year',
        operator: search.Operator.ANYOF,
        values: binFiscalYearId,
      })));
      mySearch.filters.push((search.createFilter({
        name: 'custrecord_bin_product_category',
        operator: search.Operator.ANYOF,
        values: prodCategId,
      })));
      const mySearchCount = mySearch.runPaged().count;
      if (mySearchCount === 0) {
        throw `Error for finding correct Bin Location id for Auto Transfer Date \n
         inDate: ${inDate} prodCategId: ${prodCategId}`;
      }
      mySearch.run().each((result) => {
        correctBinId = result.id;
        return false;
      });
      return correctBinId;
    };
    mainBinTransferLib.processBinTransfer = (objToProcess) => {
      const logTitle = 'processBinTransfer';
      const returnObj = {};
      log.debug({
        title: logTitle,
        details: objToProcess,
      });
      try {
        const {
          serialNumber, itemId, inDate,
          locationId, quantity, binIntId, prodCategId,
        } = objToProcess;

        /* - Final Data
      custcol_kd_baglabel_link: "37812",
      custbody_kd_master_return_id: "20000-10018",
      custcol_item_manufacturer: "PAR PHARMACEUTICALS",
      inDate: "12/3/2024",
      binIntId: "227",
      itemId: "74217",
      serialNumber: "RRPO172_720",
      prodCategId: "4",
      locationId: "1",
      binNum: "CONTAS1-C1"
    */
        // Lookup Serial Number ID
        const serialNumberId = findSerialNumberId(serialNumber, itemId);
        // Lookup Correct Bin Location for Transferring
        const correctBinLocationId = findBinLocationId(inDate, prodCategId);

        // Process Bin Transfer Record

        log.debug({
          title: logTitle,
          details: {
            serialNumber,
            itemId,
            inDate,
            locationId,
            quantity,
            binIntId,
            serialNumberId,
            correctBinLocationId,
            prodCategId,
          },
        });


        const binTransfer = record.create({
          type: record.Type.BIN_TRANSFER,
          isDynamic: true,
        });

        binTransfer.setValue({
          fieldId: 'location',
          value: locationId,
        });
        binTransfer.setValue({
          fieldId: 'memo',
          value: 'Generated via Bin Transfer Solution',
        });

        binTransfer.selectNewLine({ sublistId: 'inventory' });

        binTransfer.setCurrentSublistValue({
          sublistId: 'inventory',
          fieldId: 'item',
          value: itemId,
        });

        binTransfer.setCurrentSublistValue({
          sublistId: 'inventory',
          fieldId: 'quantity',
          value: quantity,
        });

        const inventoryDetail = binTransfer.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail',
        });

        inventoryDetail.selectNewLine({ sublistId: 'inventoryassignment' });

        inventoryDetail.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'issueinventorynumber',
          value: serialNumberId,
        });

        inventoryDetail.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'binnumber',
          value: binIntId,
        });

        inventoryDetail.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'tobinnumber',
          value: correctBinLocationId,
        });

        inventoryDetail.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'quantity',
          value: quantity,
        });
        // inventoryDetail.setCurrentSublistValue({
        //   sublistId: 'inventorystatus',
        //   fieldId: 'quantity',
        //   value: 1, // Always GOOD
        // });
        inventoryDetail.commitLine({ sublistId: 'inventoryassignment' });
        binTransfer.commitLine({ sublistId: 'inventory' });
        const recordId = binTransfer.save();
        returnObj.success = true;
        returnObj.message = `Bin Transfer Record ID: ${recordId}`;
      } catch (error) {
        returnObj.success = false;
        returnObj.message = `Error Creating Bin Transfer: ${error}`;
      }
      log.debug({
        title: logTitle,
        details: returnObj,
      });
      return returnObj;
    };

    return mainBinTransferLib;
  },
);
