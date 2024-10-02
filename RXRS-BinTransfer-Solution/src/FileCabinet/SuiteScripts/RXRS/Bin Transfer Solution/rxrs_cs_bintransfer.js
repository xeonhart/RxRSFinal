/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */
define(
  ['N/currentRecord', 'N/ui/dialog', 'N/url', 'N/https', './Lib/util/rxrs_util_lib'],
  (currentRecord, dialog, url, https, rxrsUtilLib) => {
    const mainSublist = 'custpage_search_results';
    const PKG_RECEIEVE_SL_SCRIPT_ID = 'customscript_rxrs_sl_bulk_pickup_pkg_cmp';
    const PKG_RECEIEVE_SL_DEP_ID = 'customdeploy_rxrs_sl_bulk_pickup_pkg_cmp';

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
      for (let i = 0; i < lineCount; i += 1) {
        rec.setCurrentSublistValue({
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
      const trackingNumbers = [];
      for (let i = 0; i < lineCount; i += 1) {
        const isSelected = rec.getSublistValue({
          sublistId: mainSublist,
          fieldId: 'id_to_process',
          line: i,
        });
        if (isSelected) {
          const id = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'internalid',
            line: i,
          });
          const trackingNum = rec.getSublistValue({
            sublistId: mainSublist,
            fieldId: 'kod_packrtn_trackingnum',
            line: i,
          });
          selectedIds.push(id);
          trackingNumbers.push(trackingNum);
        }
      }

      if (rxrsUtilLib.isEmpty(selectedIds)) {
        dialog.alert({
          title: 'There are no Return Packages to Process',
          message: 'Please mark the checkbox for desired return Packages to process.',
        });
        return;
      }

      dialog.alert({
        title: 'Process Packages',
        message: `Processing these package IDs: ${JSON.stringify(trackingNumbers)}`,
      });

      const suiteletUrl = url.resolveScript({
        scriptId: PKG_RECEIEVE_SL_SCRIPT_ID,
        deploymentId: PKG_RECEIEVE_SL_DEP_ID,
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
      const confirmation = confirm('Processed Succesfully, should I Close the page?');

      console.log(JSON.stringify(sletResposne));
      // If user confirms Pickup
      if (confirmation) {
        window.location.close();
      }
    }

    return {
      goToPage,
      markAll,
      unselectAll,
      processButton,
    };
  },
);
