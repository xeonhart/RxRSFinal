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

    const fieldChanged = (scriptContext) => {

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
          fieldId: 'custpage_binnumber',
          value: urlParams.get('rrPoId'),
        });
      }

      if (urlParams.get('manufId')) {
        currRec.setValue({
          fieldId: 'custpage_manufacturer',
          value: urlParams.get('manufId'),
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
      const indateYear = checkIfEmpty(currRec.getText({
        fieldId: 'custpage_indateyear',
      }), 'indateYear');
      const indateMonth = checkIfEmpty(currRec.getText({
        fieldId: 'custpage_indatemonth',
      }), 'indateMonth');
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

      const buildDataToPass = `${binNumber}${indateYear}${indateMonth}${mrrId}${rrPoId}${manufId}${prodCateg}${dateAsOf}`;

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
            fieldId: 'custcol_kd_baglabel_link',
            line: i,
          });
          objToPass.custbody_kd_master_return_id = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'custbody_kd_master_return_id',
            line: i,
          });
          objToPass.custcol_item_manufacturer = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'custcol_item_manufacturer',
            line: i,
          });
          objToPass.prodCategoryVal = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'custitem_kod_itemcontrol',
            line: i,
          });
          objToPass.inDate = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'custcol_rxrs_indate_itrs_po',
            line: i,
          });
          objToPass.binStoredForm = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'bin_stored_form',
            line: i,
          });
          objToPass.binIntId = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'internalid',
            line: i,
          });
          objToPass.manufIntId = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'custitem_kod_mfgsegment',
            line: i,
          });
          objToPass.itemId = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'item',
            line: i,
          });

          objToPass.quantity = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'binnumberquantity',
            line: i,
          });
          objToPass.serialNumber = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'serialnumber',
            line: i,
          });
          objToPass.prodCategId = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'custcol_kod_controlnumid',
            line: i,
          });
          objToPass.prodCalocationtegId = rec.getSublistValue({
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
      const sletResposne = https.post({
        body: JSON.stringify(selectedIds),
        url: suiteletUrl,
      });
      // if ()
      // dialog.alert({
      //   title: 'Process Packages',
      //   message: `Processing these package IDs: ${JSON.stringify(trackingNumbers)}`,
      // });
      console.log(JSON.stringify(sletResposne));
      alert('Processed Succesfully, Page Reloading');
      window.location.reload();
    }

    return {
      searchWithFilters,
      fieldChanged,
      pageInit,
      goToPage,
      markAll,
      unselectAll,
      processButton,
    };
  },
);
