/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search'], (serverWidget, search) => {
  function onRequest(context) {
    const { productCategory } = context.request.parameters;
    const lineIndex = context.request.parameters.line;

    if (context.request.method === 'GET') {
      const form = serverWidget.createForm({ 
        title: 'Select Bin',
        hideNavBar:true });
      form.clientScriptFileId = 35939;
      // Dropdown to display filtered bins
      const binField = form.addField({
        id: 'custpage_selected_bin',
        type: serverWidget.FieldType.SELECT,
        label: 'Bins',
      });
      const lineIndexField = form.addField({
        id: 'custpage_line_index',
        type: serverWidget.FieldType.TEXT,
        label: 'Line Index'
    }).updateDisplayType({
        displayType: serverWidget.FieldDisplayType.HIDDEN
    });

    // Set the value of the "Line Index" field from the URL parameter
    lineIndexField.defaultValue = lineIndex || '';

      // Populate the dropdown with bins based on the product category
      const binSearchObj = search.create({
        type: 'bin',
        filters: [
          ['custrecord_bin_product_category', 'anyof', productCategory],
        ],
        columns: [
          search.createColumn({ name: 'binnumber', label: 'Bin Number' }),
        ],
      });

      binSearchObj.run().each((result) => {
        binField.addSelectOption({
          value: result.id,
          text: result.getValue({ name: 'binnumber' }),
        });
        return true;
      });

      form.addSubmitButton({ label: 'Select' });
      context.response.writePage(form);
    } else {
      // POST Request - Bin selected
      const selectedBinId = context.request.parameters.custpage_selected_bin;
      const lineIndex = context.request.parameters.line;

      // Send selected bin back to the first Suitelet using window.opener
    //     window.opener.setSelectedBin('${selectedBinId}', '${lineIndex}');
      const script = `
                <script>
                  
              <html>
    <head>
        <script type="text/javascript">
            window.onload = function() {
                window.opener.setSelectedBin('${selectedBinId}', '${lineIndex}');
                window.close();
            };
        </script>
    </head>
    <body>
        <p>Closing...</p>
    </body>
    </html>
                </script>
            `;

      context.response.write(script);
    }
  }

  return {
    onRequest,
  };
});
