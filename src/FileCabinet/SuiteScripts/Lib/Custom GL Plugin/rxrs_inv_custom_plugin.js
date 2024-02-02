function customizeGlImpact(
  transactionRecord,
  standardLines,
  customLines,
  book
) {
  nlapiLogExecution(
    "DEBUG",
    "credit",
    standardLines.getLine(1).getCreditAmount()
  );
  nlapiLogExecution("DEBUG", "total", transactionRecord.getFieldValue("total"));
  var total = transactionRecord.getFieldValue("total");
  nlapiLogExecution("DEBUG", "type", transactionRecord.getRecordType());
  var tranType = transactionRecord.getRecordType();
  switch (tranType) {
    // case "invoice":
    //   var amount = 0;
    //   amount = transactionRecord.getFieldValue("custbody_remaining_balance");
    //   if (amount == 0) return;
    //   var newLine = customLines.addNewLine();
    //   newLine.setCreditAmount(amount);
    //   newLine.setAccountId(54);
    //   newLine.setMemo("Custom Script setting Credit Value.");
    //
    //   var newLine = customLines.addNewLine();
    //   newLine.setDebitAmount(amount);
    //   newLine.setAccountId(119);
    //   newLine.setMemo("Custom Script Setting Debit Value.");
    //   break;
    case "customerpayment":
      var newLine = customLines.addNewLine();
      newLine.setCreditAmount(total);
      newLine.setAccountId(940);
      newLine.setMemo("Custom Script setting Credit Value.");

      var newLine = customLines.addNewLine();
      newLine.setDebitAmount(total);
      newLine.setAccountId(119);
      newLine.setMemo("Custom Script Setting Debit Value.");
      break;
  }
}
