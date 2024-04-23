/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(["N/file", "N/xml", "N/render"], /**
 * @param{file} file
 * @param{xml} xml
 * @param render
 */ function (file, xml, render) {
  /**
   * Build XMLDoc file from template with content Data
   * @param {number} options.templateID - Template Id
   * @param {[]} options.content - Content of the PDF
   * @param {string} options.fileName - FileName
   * @param {record} options.record
   * @param {number} options.outputFolder - Folder where to save the PDF
   * @returns PDF
   */
  function buildFileFromTemplate(options) {
    try {
      const objRender = render.create();
      const xmlTmpFile = file.load(options.templateID);
      objRender.templateContent = xmlTmpFile.getContents();
      if (options.record) {
        objRender.addRecord("record", options.record);
      } else {
        objRender.addCustomDataSource({
          format: render.DataSource.OBJECT,
          alias: "record",
          data: options.content,
        });
      }

      const PDF = objRender.renderAsPdf();

      PDF.name = options.fileName;
      PDF.folder = options.outputFolder;
      return PDF.save();
    } catch (e) {
      log.error("buildFileFromTemplate", e.message);
    }
  }

  return {
    buildFileFromTemplate: buildFileFromTemplate,
  };
});
