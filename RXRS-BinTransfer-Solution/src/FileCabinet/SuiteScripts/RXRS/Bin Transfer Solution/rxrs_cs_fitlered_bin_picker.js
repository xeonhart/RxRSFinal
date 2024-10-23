/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {
  function saveRecord(context) {
    const binId = context.currentRecord.getValue({ fieldId: 'custpage_selected_bin' });
    const lineIndex = context.currentRecord.getValue({ fieldId: 'custpage_line_index' });

    if (binId) {
      // Communicate with the parent window and pass the selected bin ID and line index
      window.opener.setSelectedBin(binId, lineIndex);

      // Close the popup window
      window.onbeforeunload = null;
      window.close();

      return false;
    }
    alert('Please select a bin.');
    return false;
  }

  return {
    saveRecord,
  };
});
