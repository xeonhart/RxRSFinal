/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @NScriptType ClientScript
*/
define(
  // ['N/currentRecord', 'N/ui/dialog', 'N/url', 'N/https', '../RXRS Fedex Integration/Lib/util/rxrs_util_lib'],
  ['N/currentRecord', 'N/ui/dialog', 'N/url', 'N/https', '../../RXRS Fedex Integration/Lib/util/rxrs_util_lib'],
  (currentRecord, dialog, url, https, rxrsUtilLib) => {
    const mainSublist = 'custpage_search_results';
    const BIN_TS_SL_SCRIPT_ID = 'customscript_rxrs_sl_bin_transfer_ui';
    const BIN_TS_SL_DEP_ID = 'customdeploy_rxrs_sl_bin_transfer_ui_d1';
    const processPackages = async (selectedIds, suiteletUrl) => {
      try {
        // Send the post request
        const sletResposne = await https.post({
          body: JSON.stringify(selectedIds),
          url: suiteletUrl,
        });

        // Log the response and show the alert
        console.log(JSON.stringify(sletResposne));

        const mainBody = JSON.parse(sletResposne.body);
        dialog.alert({
          title: `Success ${JSON.stringify(mainBody.success)}`,
          message: JSON.stringify(mainBody.binTransferObj),
        });
        if (mainBody.success === true) {
        // Wait for the alert to finish, then reload the window
          window.location.reload();
        }
      } catch (error) {
        console.error('Error processing packages:', error);
        alert('Failed to process packages.');
      }
    };

    const fieldChanged = (context) => {
      const rec = currentRecord.get();
      const { fieldId } = context;

      if (fieldId === 'custpage_date') {
        // Notify the user
        alert('Clearing INDATE YEAR AND IN DATE MONTH since "Date (As of)" was filled.');
        rec.setValue({
          fieldId: 'custpage_indateyear',
          value: '',
        });
        rec.setValue({
          fieldId: 'custpage_indatemonth',
          value: '',
        });
      }
      console.log(context.sublistId, context.fieldId);
      if (context.sublistId === 'custpage_search_results' && context.fieldId === 'custpage_select_bin') {
        const selectBinBool = rec.getCurrentSublistValue({
          sublistId: 'custpage_search_results',
          fieldId: 'custpage_select_bin',
        });
        if (selectBinBool) {
          const productCategory = rec.getCurrentSublistValue({
            sublistId: 'custpage_search_results',
            fieldId: 'custcol_kod_controlnumid',
          });


          const lineIndex = context.line;


          // Resolve the URL for the second Suitelet (popup)
          const binSelectorUrl = url.resolveScript({
            scriptId: 'customscript_rxrs_sl_bin_picker_filtered', // The scriptId of the second Suitelet
            deploymentId: 'customdeploy_rxrs_sl_bin_picker_filtered',
          });

          // Open popup for bin selection
          const popupUrl = `${binSelectorUrl}&productCategory=${productCategory}&line=${lineIndex}`;
          window.open(popupUrl, 'BinSelector', 'width=600,height=400,scrollbars=yes');
        }
      }

      return true;
    };

    const pageInit = (scriptContext) => {
      console.log('page init test');
      const urlParams = new URLSearchParams(window.location.href);
      console.log(urlParams);
      const currRec = currentRecord.get();

      if (urlParams.get('binNumber')) {
        currRec.setValue({
          fieldId: 'custpage_binnumber',
          value: urlParams.get('binNumber'),
        });
      }

      if (urlParams.get('mrrId')) {
        currRec.setValue({
          fieldId: 'custpage_masterretreq',
          value: urlParams.get('mrrId'),
        });
      }

      if (urlParams.get('rrPoId')) {
        currRec.setValue({
          fieldId: 'custpage_retreq_po',
          value: urlParams.get('rrPoId'),
        });
      }

      if (urlParams.get('manufId')) {
        currRec.setValue({
          fieldId: 'custpage_manufacturer',
          value: urlParams.get('manufId'),
        });
      }
      if (urlParams.get('indateYear')) {
        currRec.setValue({
          fieldId: 'custpage_indateyear',
          value: urlParams.get('indateYear'),
        });
      }
      if (urlParams.get('indateMonth')) {
        currRec.setValue({
          fieldId: 'custpage_indatemonth',
          value: urlParams.get('indateMonth'),
        });
      }

      if (urlParams.get('prodCateg')) {
        currRec.setValue({
          fieldId: 'custpage_prodcategory',
          value: urlParams.get('prodCateg'),
        });
      }
    };
    const checkIfEmpty = (data, identifier) => {
      let returnData = '';
      if (data) {
        returnData = `&${identifier}=${data}`;
      }
      return returnData;
    };
    const searchWithFilters = () => {
      const currRec = currentRecord.get();


      const binNumber = checkIfEmpty(currRec.getValue({
        fieldId: 'custpage_binnumber',
      }), 'binNumber');
      const indateYear = checkIfEmpty(currRec.getValue({
        fieldId: 'custpage_indateyear',
      }), 'indateYear');
      const indateMonth = checkIfEmpty(currRec.getValue({
        fieldId: 'custpage_indatemonth',
      }), 'indateMonth');
      const indateYearText = checkIfEmpty(currRec.getText({
        fieldId: 'custpage_indateyear',
      }), 'indateYearText');
      const indateMonthText = checkIfEmpty(currRec.getText({
        fieldId: 'custpage_indatemonth',
      }), 'indateMonthText');
      const mrrId = checkIfEmpty(currRec.getValue({
        fieldId: 'custpage_masterretreq',
      }), 'mrrId');
      const rrPoId = checkIfEmpty(currRec.getValue({
        fieldId: 'custpage_retreq_po',
      }), 'rrPoId');
      const manufId = checkIfEmpty(currRec.getValue({
        fieldId: 'custpage_manufacturer',
      }), 'manufId');
      const prodCateg = checkIfEmpty(currRec.getValue({
        fieldId: 'custpage_prodcategory',
      }), 'prodCateg');
      const dateAsOf = checkIfEmpty(currRec.getText({
        fieldId: 'custpage_date',
      }), 'dateAsOf');

      // Add Field validation for processing
      if ((indateMonth === '' && indateYear) || (indateYear === '' && indateMonth)) {
        alert('If Indate Month/ Indate Year was filled, both data should be filled');
        return;
      }

      if (indateYear && indateMonth) {
        alert('Prioritizing indate Month and Indate Year for search parameters');
      }


      // if (binNumber === '' && indateYear === '' && indateMonth === '' && mrrId === ''
      //   && rrPoId === '' && manufId === '' && prodCateg === '' && dateAsOf === ''
      // ) {
      //   alert('No search data was filled, fill appropriate search Parameters first');
      //   return;
      // }


      const buildDataToPass = `${binNumber}${indateYear}${indateMonth}${mrrId}${rrPoId}${manufId}${prodCateg}${dateAsOf}${indateMonthText}${indateYearText}`;

      const suiteletUrl = url.resolveScript({
        scriptId: BIN_TS_SL_SCRIPT_ID,
        deploymentId: BIN_TS_SL_DEP_ID,
      });
      const urlToRedirect = `${suiteletUrl}${buildDataToPass}`;
      console.log(urlToRedirect);
      window.open(urlToRedirect, '_self');
    };


    const goToPage = (page) => {
      const urlPage = new URL(window.location.href);
      urlPage.searchParams.set('page', page);
      window.location.href = urlPage.toString();
    };

    function markAll() {
      const rec = currentRecord.get();
      const lineCount = rec.getLineCount({ sublistId: mainSublist });

      for (let i = 0; i < lineCount; i += 1) {
        rec.selectLine({
          sublistId: mainSublist,
          line: i,
        });
        rec.setCurrentSublistValue({
          sublistId: mainSublist,
          fieldId: 'id_to_process',
          value: true,
        });
        rec.commitLine({
          sublistId: mainSublist,
        });
      }
    }

    function unselectAll() {
      const rec = currentRecord.get();
      const lineCount = rec.getLineCount({ sublistId: mainSublist });

      console.log(lineCount);
      for (let i = 0; i < lineCount; i += 1) {
        rec.selectLine({
          sublistId: mainSublist,
          line: i,
        });
        rec.setSublistValue({
          sublistId: mainSublist,
          fieldId: 'id_to_process',
          value: false,

        });
      }
    }
    const clearFilters = () => {
      const record = currentRecord.get();
      record.setValue({
        fieldId: 'custpage_binnumber',
        value: '',
      });

      record.setValue({
        fieldId: 'custpage_indateyear',
        value: '',
      });

      record.setValue({
        fieldId: 'custpage_indatemonth',
        value: '',
      });

      record.setValue({
        fieldId: 'custpage_masterretreq',
        value: '',
      });

      record.setValue({
        fieldId: 'custpage_retreq_po',
        value: '',
      });

      record.setValue({
        fieldId: 'custpage_manufacturer',
        value: '',
      });

      record.setValue({
        fieldId: 'custpage_prodcategory',
        value: '',
      });

      record.setValue({
        fieldId: 'custpage_date',
        value: '',
      });
    };


    function processButton() {
      const rec = currentRecord.get();
      const lineCount = rec.getLineCount({ sublistId: mainSublist });
      const selectedIds = [];
      const binNumbers = [];

      for (let i = 0; i < lineCount; i += 1) {
        const isSelected = rec.getSublistValue({
          sublistId: mainSublist,
          fieldId: 'id_to_process',
          line: i,
        });
        console.log(isSelected);
        /*
      //   [
      //     "binnumber",
      //     "custcol_kd_baglabel_link",
      //     "custbody_kd_master_return_id",
      //     "tranid",
      //     "custcol_item_manufacturer",
      //     "custcol_kod_controlnum",
      //     "custcol_kd_indate",
      //     "bin_stored_form"
      //     "internalid"
      //  ]
        */
        if (isSelected) {
          const objToPass = {};
          objToPass.custcol_kd_baglabel_link = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'id',
            line: i,
          });
          objToPass.custbody_kd_master_return_id = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'kd_mrr_link',
            line: i,
          });
          objToPass.custcol_item_manufacturer = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'kd_mfgname',
            line: i,
          });
          objToPass.prodCategoryVal = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'custitem_kod_itemcontrol',
            line: i,
          });
          objToPass.inDate = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'ret_start_date',
            line: i,
          });
          // objToPass.binStoredForm = rec.getSublistValue({
          //   sublistId: mainSublist,
          //   fieldId: 'bin_stored_form',
          //   line: i,
          // });
          objToPass.binIntId = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'internalid0',
            line: i,
          });
          objToPass.bagLabelIntId = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'internalid1',
            line: i,
          });
          objToPass.itemId = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'cs_return_req_scan_item',
            line: i,
          });

          objToPass.quantity = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'cs_qty',
            line: i,
          });
          objToPass.serialNumber = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'cs_lotnum',
            line: i,
          });
          objToPass.prodCategId = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'custcol_kod_controlnumid',
            line: i,
          });
          objToPass.locationId = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'location',
            line: i,
          });
          const binNum = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'binnumber',
            line: i,
          });


          objToPass.binNum = binNum;

          selectedIds.push(objToPass);
          binNumbers.push(binNum);
        }
      }

      if (rxrsUtilLib.isEmpty(selectedIds)) {
        dialog.alert({
          title: 'There are no Bins to Process',
          message: 'Please mark the checkbox for desired Bins to process.',
        });
        return;
      }

      dialog.alert({
        title: 'Process Packages',
        message: `Processing these package IDs: ${JSON.stringify(binNumbers)}`,
      });

      const suiteletUrl = url.resolveScript({
        scriptId: BIN_TS_SL_SCRIPT_ID,
        deploymentId: BIN_TS_SL_DEP_ID,
      });

      processPackages(selectedIds, suiteletUrl);
      // const sletResposne = https.post({
      //   body: JSON.stringify(selectedIds),
      //   url: suiteletUrl,
      // });
      // // if ()
      // // dialog.alert({
      // //   title: 'Process Packages',
      // //   message: `Processing these package IDs: ${JSON.stringify(trackingNumbers)}`,
      // // });
      // console.log(JSON.stringify(sletResposne));
      // alert((sletResposne.body));
      // window.location.reload();
    }
    // This function will be called from the popup when the bin is selected
    function setSelectedBin(binId, lineIndex) {
      console.log({ binId, lineIndex });
      const rec = currentRecord.get();
      rec.selectLine({ sublistId: 'custpage_search_results', line: lineIndex });
      rec.setCurrentSublistValue({
        sublistId: 'custpage_search_results',
        fieldId: 'custpage_final_bin',
        value: binId,
      });
      rec.commitLine({ sublistId: 'custpage_search_results' });
    }

    window.setSelectedBin = setSelectedBin;
    return {
      setSelectedBin,
      searchWithFilters,
      fieldChanged,
      pageInit,
      goToPage,
      markAll,
      unselectAll,
      processButton,
      clearFilters,
    };
  },
);
