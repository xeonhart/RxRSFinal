define(['N/runtime', 'N/ui/dialog', 'N/task', 'N/record', 'N/search', 'N/log'], function(
  /** @type {import('N/runtime')} **/ runtime,
  /** @type {import('N/task')}    **/ task,
  /** @type {import('N/record')}  **/ record,
  /** @type {import('N/search')}  **/ search,
  /** @type {import('N/log')}     **/ log
) {
	function getScannedItem(context) {
      var currentRec = context.currentRecord;
      var currentfieldid = context.fieldId;
      var trackingNumber = context.currentRecord.getValue({
        fieldId: 'custrecordrxrs_item_scan_field'
      })
      if(currentfieldid === 'custrecordrxrs_item_scan_field')
      {
        var tn = test(context, trackingNumber);
      }
    }
  function test(context, trackingNumber){
    context.currentRecord.setValue({
      fieldId: 'custrecord_cs_lotnum',
      value: 'test passed'
    })
  }
  return true;
});

/*let IsProductFound = false;
let strLocalNDC = document.getElementById("txtNewNDC").value.trim();
let txtNewNDC = "";
let lblGTIN = "";
let lblUPC = "";
let lblSerialNumber = "";
let txtExpirationDate = "";
let txtLotNumber = "";
let rfvQuantity = false;
let rfvExpirationDate = false;
let rfvLotNumber = false;

if (strLocalNDC == "") {
     document.getElementById("lblMessages").placeholder = "Please enter NDC number.";
}

function CalculateCheckSumDigit(digits, NDClength, NDCtype) {
    let factor = 3;
    let sum = 0;
    try {
        if (digits.length != NDClength)
        {
            return "Error: Please enter the first " + NDClength + " " + NDCtype + " digits.";
        }
        for (let index = NDClength; index > 0; index--) {
            sum += parseInt(digits.substring(index - 1, 1)) * factor;
            factor = 4 - factor;
        }
        digits += (1000 - sum) % 10;
        return digits;
    } catch (error) {
        return "Error: " + caught.Message;
    }
}

function GetQrScanElement(rawData, startPosition) {
    var result = new Object();
    result.keys = "";
    result.values = "";
    let strAI = "";
    let strElementValue = "";

    if (rawData.length > startPosition + 2) {

        strAI = rawData.substring(startPosition, 2);

        if (strAI == "21") {
            for (var j = 0; j < 20; j++) {
                if (rawData.length <= startPosition + 2 + j) {
                    startPosition = rawData.length;
                    j = 30;
                    result.keys = "21";
                    result.values = strElementValue;
                } else if (rawData.substring(startPosition + 2 + j, 1) == "↔") {
                    startPosition = startPosition + 2 + j + 1;
                    j = 30;
                    result.keys = "21";
                    result.values = strElementValue; } else {

                    strElementValue += rawData.substring(startPosition + 2 + j, 1);
                }
            }
        }
        else if (strAI == "17" && rawData.length >= startPosition + 8) {
            result.keys = "17";
            result.values = rawData.substring(startPosition + 2, 6);
            startPosition += 8;
        }
        else if (strAI == "10")
        {
            for (var i = 0; i < 20; i++)
            {
                if (rawData.length <= startPosition + 2 + i)
                {
                    startPosition = rawData.length;
                    i = 30;
                    result.keys = "10";
                    result.values = strElementValue;
                }
                else if (rawData.substring(startPosition + 2 + i, 1) == "↔")
                {
                    startPosition = startPosition + 2 + i + 1;
                    i = 30;
                    result.keys = "10";
                    result.values = strElementValue;
                }
                else
                {
                    strElementValue += rawData.substring(startPosition + 2 + i, 1);
                }
            }
        }
        else
        {
            startPosition = rawData.length;
        }
    }
    return result;
}

function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function SearchProduct() {
    try {
        if (strLocalNDC.length > 30) {
            let intPosition = 16;
            var sl = SortedList.create();
            let intMaxDataMatrixSize = 2335;
            let intLoopCount = 0;
            let isDataReadComplete = false;
            lblGTIN.Text = strLocalNDC.substring(2, 14);
            if (lblGTIN.Text.startsWith("00"))
            {
                lblUPC.Text = lblGTIN.Text.substring(2, 12);
            }
            else
            {
                lblUPC.Text = CalculateCheckSumDigit(lblGTIN.Text.substring(2, 11), 11, "UPC");
            }
            if (strLocalNDC.substring(16, 2) != "17")
            {
                for (let intPosition = 0; intPosition < strLocalNDC.length - 1 && intPosition < intMaxDataMatrixSize; intPosition++)
                {
                    if (strLocalNDC.substring(intPosition, 2) == "17" && strLocalNDC.length > intPosition + 10)
                    {
                        if (strLocalNDC.substring(intPosition + 8, 2) == "10")
                        {
                            sl.insert("21", strLocalNDC.substring(18, intPosition - 18).replace("↔", ""));
                            sl.insert("17", strLocalNDC.substring(intPosition + 2, 6));
                            sl.insert("10", strLocalNDC.substring(intPosition + 10, strLocalNDC.length - intPosition - 10).replace("↔", ""));
                            isDataReadComplete = true;
                        }
                        else if (strLocalNDC.substring(intPosition + 8, 2) == "21")
                        {
                            sl.insert("21", strLocalNDC.substring(intPosition + 10, strLocalNDC.length - intPosition - 10).replace("↔", ""));
                            sl.insert("17", strLocalNDC.substring(intPosition + 2, 6));
                            sl.insert("10", strLocalNDC.substring(18, intPosition - 18).replace("↔", ""));
                            isDataReadComplete = true;
                        }
                    }
                }
            }
            if (!isDataReadComplete)
            {
                intPosition = 16;
                while (intPosition < strLocalNDC.length && intLoopCount < intMaxDataMatrixSize)
                {
                    var de = GetQrScanElement(strLocalNDC, intPosition);
                    if (de.keys.toString() == "21" || de.keys.toString() == "17" || de.keys.toString() == "10")
                    {
                        sl.insert(de.keys, de.values);
                    }
                    intLoopCount++;
                }
            }

            sl.foreach(deAI => {
                if (deAI.keys.toString() == "21") {
                    lblSerialNumber.Text = deAI.Value.toString();
                }
                else if (deAI.keys.toString() == "17" && deAI.values.toString().length == 6) {
                    let year = parseInt(deAI.values.toString().substring(0, 2));
                    let month = parseInt(deAI.values.toString().substring(2, 2));
                    var expDate = new Date(year, month, getDaysInMonth(year, month));
                    txtExpirationDate.Text = expDate.toString("MM/dd/yy");
                }
                else if (deAI.keys.toString() == "10") {
                    txtLotNumber.Text = deAI.values.toString();
                }
            })
           
            IsProductFound = p.LoadNDC("UPC", lblUPC.Text);
            if (IsProductFound)
            {
                lblScanType.Text = "QR SCAN";
            }
        }
        else
        {
            if (strLocalNDC.length == 12)
            {
                IsProductFound = p.LoadNDC("UPC", strLocalNDC);
            }
            if (!IsProductFound)
            {
                IsProductFound = p.LoadNDC("NDC", CStaticFunctions.NDC11Digits(strLocalNDC, rdbNDCFormat.SelectedValue));
            }
            if (!IsProductFound)
            {
                IsProductFound = p.LoadNDC("NDC", strLocalNDC);
            }
        }
        if (p.error.Count() > 0)
        {
            lblMessages.Text = p.Errors.toString("WEB");
            lblMessages.CssClass = "textError";
            return;
        }
        if (!IsProductFound)
        {
            lblMessages.Text = "The system could not find this product.";
            lblMessages.CssClass = "textError";
            return;
        }
        if (p.Control == "2" && lblBoxStatus.Text == "PENDING REVIEW")
        {
            lblMessages.Text = "You may not add any C2 products while the return is pending review.";
            lblMessages.CssClass = "textError";
            return;
        }
        litJavaScript.Text = "<script type=\"text/javascript\">document.getElementById(\"" + txtQuantity.ClientID + "\").focus();</script>";
        LoadProductContent(p, "");
        if (p.Control == "2")
        {
            rfvQuantity.Enabled = true;
            rfvExpirationDate.Enabled = true;
            rfvLotNumber.Enabled = true;
        }        
    } catch (error) {
    
    }
}*/

