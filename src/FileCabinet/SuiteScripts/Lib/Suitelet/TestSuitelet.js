/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/file", "N/ui/serverWidget"] /**
 * @param{file} file
 */, (file, serverWidget) => {
  /**
   * Defines the Suitelet script trigger point.
   * @param {Object} scriptContext
   * @param {ServerRequest} scriptContext.request - Incoming request
   * @param {ServerResponse} scriptContext.response - Suitelet response
   * @since 2015.2
   */
  const onRequest = (scriptContext) => {
    let file2 = file.load(34039);
    if (scriptContext.request.method == "GET") {
      scriptContext.response.writeFile({
        file: file2,
        isInline: false,
      });
    }
  };

  return { onRequest };
});
