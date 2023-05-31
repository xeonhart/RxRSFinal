/*******************************************************************************
{{ScriptHeader}} *
 * Company:                  {{Company}}
 * Author:                   {{Name}} - {{Email}}
 * File:                     {{ScriptFileName}}
 * Script:                   {{ScriptTitle}}
 * Script ID:                {{ScriptID}}
 * Version:                  1.0
 *
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 *
 ******************************************************************************/
define(['N/runtime', 'N/ui/dialog', 'N/record', 'N/search', 'N/log'], function(
    /** @type import('N/runtime')}   **/
    runtime,
    /** @type import('N/ui/dialog')} **/
    dialog,
    /** @type import('N/record')}    **/
    record,
    /** @type import('N/search')}    **/
    search,
    /** @type import('N/log')}       **/
    log
) {

    /**
     * context.currentRecord
     * context.sublistId
     * context.fieldId
     * context.line
     * context.column
     *
     * @type {import('N/types').EntryPoints.Client.fieldChanged}
     */
    var DAMAGE_TYPE_1 = 1;
    var DAMAGE_TYPE_2 = 2;
    var FULL_PACKAGE = 1;
    var PARTIAL_PACKAGE = 2;
    var PROCESSING_NON_RETURNABLE = 1;
    var PROCESSING_RETURNABLE = 2;
    var FULL_PACKAGE = 1;
    var PARTIAL_PACKAGE = 2;
    var REC_RET_POLICY = 'customrecord_kod_returnpolicy_cr';
    var FLD_RP_IN_MONTHS = 'custrecord_kod_indate';
    var FLD_RP_OUT_MONTHS = 'custrecord_kod_rtnpolicy_dayexp';
    var FLD_RP_C2_HANDICAP_DAYS = 'custrecord_kod_c2handicap';
    var FLD_RP_RX_C35_HANDICAP_DAYS = 'custrecord_kod_pharmacrallow';
    var FLD_RP_DOES_NOT_ALLOW_RETURN = 'custrecord_kd_notallowsrtrn';
    var FLD_RP_ALLOWS_PARTIAL = 'custrecord_kd_partialallowed';
    var FLD_RP_ALLOWS_OTC = 'custrecord_kod_otcallowed';
    var FLD_RP_ACCEPTED_FULL_CONTAINER = 'custrecord_kod_rtnpolicy_drugform';
    var FLD_RP_ACCEPTED_PARTIAL_CONTAINER = 'custrecord_kod_partialallowed';
    var FLD_RP_MINQTY_EACH = 'custrecord_kod_minqty_each';
    var FLD_RP_MINQTY_GRAMS = 'custrecord_kod_minqty_grams';
    var FLD_RP_MINQTY_ML = 'custrecord_kod_minqty_ml';
    var IT_CT_C2 = 3;
    var CUST_TYPE_PREPAID = 3;
    var CUST_TYPE_QUICK_CASH = 4;
    var CUST_TYPE_DESTRUCTION = 5;
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////	
    function getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }

    function CalculateCheckSumDigit(digits, NDClength, NDCtype) {
        var d = digits
        var factor = 3;
        var sum = 0;
        for (var index = NDClength; index > 0; index--) {
            sum += parseInt(d.substr(index - 1, 1)) * factor;
            factor = 4 - factor;
        }
        d += (1000 - sum) % 10;
        return d;
    }

    function SearchProduct(qrCode) {
        var lblGTIN;
        var lblUPC;
        var lblNDC;
        var lblSerialNumber;
        var txtExpirationDate;
        var txtLotNumber;
        var intPosition;
        var sl;
        var intMaxDataMatrixSize;

        try {
            if (qrCode.length > 30) {
                intPosition = 16;
                sl = Object();
                intMaxDataMatrixSize = 2335;
                lblGTIN = qrCode.substr(2, 14);
            }
            if (lblGTIN.startsWith("00")) {
                lblUPC = lblGTIN.substr(2, 12);
            } else {
                lblUPC = CalculateCheckSumDigit(lblGTIN.substr(2, 11), 11, "UPC");
            }
            if (qrCode.substr(16, 2) != "17") {
                for (intPosition; intPosition < qrCode.length - 1 && intPosition < intMaxDataMatrixSize; intPosition++) {
                    if (qrCode.substr(intPosition, 2) == "17" && qrCode.length > intPosition + 10) {
                        if (qrCode.substr(intPosition + 8, 2) == "10") {
                            sl["21"] = qrCode.substr(18, intPosition - 18).replace("↔", "");
                            sl["17"] = qrCode.substr(intPosition + 2, 6);
                            sl["10"] = qrCode.substr(intPosition + 10, qrCode.length - intPosition - 10).replace("↔", "");
                            isDataReadCompvare = true;
                        } else if (qrCode.substr(intPosition + 8, 2) == "21") {
                            sl["21"] = qrCode.substr(intPosition + 10, qrCode.length - intPosition - 10).replace("↔", "");
                            sl["17"] = qrCode.substr(intPosition + 2, 6);
                            sl["10"] = qrCode.substr(18, intPosition - 18).replace("↔", "");
                            isDataReadCompvare = true;
                        }
                    }
                }
            }
            for (var key in sl) {
                if (key == '21') {
                    lblSerialNumber = sl[key].toString();
                } else if (key == '17' && sl[key].toString().length == 6) {
                    var year = 2000 + parseInt(sl[key].toString().substr(0, 2));
                    var month = parseInt(sl[key].toString().substr(2, 2));
                    var day = parseInt(sl[key].toString().substr(4, 2));
                    txtExpirationDate = new Date(year, month - 1, day);
                } else if (key == "10") {
                    txtLotNumber = sl[key].toString();
                }
            }
            lblNDC = lblUPC.substr(1, 10);
          if (lblNDC.length == 10){
            lblNDC = lblNDC.slice(0, 5) + '0' + lblNDC.slice(5);
          }
        } catch (error) {
            log.debug(error);
        } finally {
            return {
                "NDC": lblNDC,
                "Lot Number": txtLotNumber,
                "Exp. Date": txtExpirationDate
            };
        }
    }

    function JSMonth(month) {
        switch (month) {
            case 0:
                return "01"
                break;
            case 1:
                return "02"
                break;
            case 2:
                return "03"
                break;
            case 3:
                return "04"
                break;
            case 4:
                return "05"
                break;
            case 5:
                return "06"
                break;
            case 6:
                return "07"
                break;
            case 7:
                return "08"
                break;
            case 8:
                return "09"
                break;
            case 9:
                return "10"
                break;
            case 10:
                return "11"
                break;
            default:
                return "12"
        }
    }
    /////////////////////////////////////////////////////////////////////////

    function fieldChanged(context) {
        var curentRec = context.currentRecord;
        if (context.fieldId == 'custrecordrxrs_item_scan_field') {
            try {
                var qrCode = String(curentRec.getValue({
                    fieldId: 'custrecordrxrs_item_scan_field'
                }));
                var info = SearchProduct(qrCode);
				var expdate =JSMonth(info['Exp. Date'].getMonth()) + '/' + info['Exp. Date'].getDate() + '/' + info['Exp. Date'].getFullYear();
				objRecord.setValue({fieldId:'custrecord_cs_lotnum',value:info['Lot Number'],ignoreFieldChange:true});
				objRecord.setValue({fieldId:'custrecord_cs_expiration_date',value:expdate,ignoreFieldChange:true});
				objRecord.setValue({fieldId:'custrecord_cs_return_req_scan_item_display',value:info['NDC'],ignoreFieldChange:true});
                //NS.jQuery('#custrecord_cs_lotnum').val(info['Lot Number']);
                //NS.jQuery('#custrecord_cs_expiration_date').val(JSMonth(info['Exp. Date'].getMonth()) + '/' + info['Exp. Date'].getDate() + '/' + info['Exp. Date'].getFullYear());
               // NS.jQuery('#custrecord_cs_return_req_scan_item_display').val(info['NDC']);
              //NS.jQuery('#custrecord_cs_return_req_scan_item_display').focus();
             // NS.jQuery('#custrecord_cs_return_req_scan_item_display').select();

                NS.jQuery('#custrecordrxrs_item_scan_field').val('');
            } catch (error) {
                log.debug(error);
            }
        }
        // no return value
        if (context.fieldId == 'custrecord_scan_complete_submit_returns') {
            var curentRec = context.currentRecord;
            var ismarked = curentRec.getValue({
                fieldId: 'custrecord_scan_complete_submit_returns'
            });
            if (ismarked) {
              /*var text="Save";
              console.log('button',document.getElementById('custpage_save_copy').innerHTML)
              console.log('button1',document.getElementById('custpage_save_copy').value)
document.getElementById('custpage_save_copy').value=text;
document.getElementById('secondarycustpage_save_copy').innerHTML=text;*/
              
                NS.jQuery('#custpage_save_record').show();
                NS.jQuery('#secondarycustpage_save_record').show();//hide
                NS.jQuery('#custpage_save_copy').show();
                NS.jQuery('#secondarycustpage_save_copy').show();
            } else {
             /* var text="Save & Continue";
              document.getElementById('custpage_save_copy').value=text; */
                NS.jQuery('#custpage_save_record').show();
                NS.jQuery('#secondarycustpage_save_record').show();
                NS.jQuery('#custpage_save_copy').show();
                NS.jQuery('#secondarycustpage_save_copy').show();
            }
        }
        /* //jay code
	var currentRecord = context.currentRecord;
		if(context.fieldId == 'custrecord_cs_damageditem'){
		var isDamagedItem = currentRecord.getValue({
                fieldId: 'custrecord_cs_damageditem'
            });
			if(isDamagedItem){
				var damageType=currentRecord.getValue({
                fieldId: 'custrecord_cs_damagecode'
            });
			var pharmaProcessing, mfgProcessing
			if(damageType == DAMAGE_TYPE_1){
                    pharmaProcessing = PROCESSING_NON_RETURNABLE;
                    mfgProcessing = {processing: PROCESSING_RETURNABLE, isindate: false, indate: ''};
                    alert('damaged item ' + pharmaProcessing + ' ' + mfgProcessing.processing)
                    //mfgProcessing = PROCESSING_RETURNABLE;
                }else if(damageType == DAMAGE_TYPE_2){
                    pharmaProcessing = PROCESSING_NON_RETURNABLE;
                    mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                    alert('damaged item ' + pharmaProcessing + ' ' + mfgProcessing.processing)
                    //mfgProcessing = PROCESSING_NON_RETURNABLE;
                }
			}
		}
		var fullPartialPackage = currentRecord.getValue({
                    fieldId: 'custrecord_cs_full_partial_package'
                });
                if(fullPartialPackage == FULL_PACKAGE){
                  log.debug('TEST', 'Drug Form is allowed for full container on Return Policy');
                        pharmaProcessing = PROCESSING_NON_RETURNABLE;
                        mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                        //mfgProcessing = PROCESSING_RETURNABLE;
                        isApplyReturnPolicyDays = true;
				} */

        // <===== new process =====>
        //Is there a Return Policy ? else conditon end
      
      /*  var currentRecord = context.currentRecord;
        var pharmaProcessing, mfgProcessing, fullPartialPackage, drugForm, acceptedFullContainer, acceptedPartialContainer;
        var isIndate = false;
        var isApplyReturnPolicyDays = false;
		//APPLY THE RETURN POLICY ON THE ITEM SCAN RIGHT AFTER THE ITEM
		var field 			= context.fieldId; 
		var currentRecord 	= context.currentRecord;
		if(field == 'custrecord_cs_return_req_scan_item'){
			var itemid = currentRecord.getValue({fieldId:field});
			var itemobj = search.lookupFields({type:'inventoryitem',id:itemid,columns:['custitem_kod_rtnpolicy']});
			if(itemobj.custitem_kod_rtnpolicy){
				var returnPolicy = itemobj.custitem_kod_rtnpolicy[0].value;
				if(returnPolicy){
					currentRecord.setValue({fieldId:'custrecord_cs_return_policy',value:returnPolicy,ignoreFieldChange:false});
				}
			}
		}
        if (context.fieldId == 'custrecord_cs_return_policy') {
            var returnPolicy = currentRecord.getValue({
                fieldId: 'custrecord_cs_return_policy'
            });
            var mfgProcessing, pharmaProcessing;
            var retPolicyDetails = getReturnPolicyDetails(returnPolicy);
            log.debug('retPolicyDetails', retPolicyDetails)
            var rr_record_id = currentRecord.getValue({
                fieldId: 'custrecord_cs_ret_req_scan_rrid'
            });
            var rr_lookup = search.lookupFields({
                type: 'customsale_kod_returnrequest',
                id: rr_record_id,
                columns: ['entity']
            });
            log.debug('rr_lookup', rr_lookup);
            var cust_id = rr_lookup['entity'][0].value;
            var cust_lookup = search.lookupFields({
                type: 'customer',
                id: cust_id,
                columns: ['custentity_kod_custtype', 'billstate']
            });
            log.debug('cust_lookup', cust_lookup);
            var customerType = cust_lookup.custentity_kod_custtype;
            var ir_item = currentRecord.getValue({
                fieldId: 'custrecord_cs_return_req_scan_item'
            });
            var item_lookup = search.lookupFields({
                type: search.Type.ITEM,
                id: ir_item,
                columns: ['custitem_kod_returnable', 'custitem_kd_prescription_otc', 'custitem_kd_drugform']
            });
            var returnable = item_lookup.custitem_kod_returnable;
            var isDamagedItem = currentRecord.getValue({
                fieldId: 'custrecord_cs_damageditem'
            });
            var damageType = currentRecord.getValue({
                fieldId: 'custrecord_cs_damagecode'
            });
            var itemIsOtc = false;
            if (item_lookup.custitem_kd_prescription_otc == 2) {
                itemIsOtc = true;
            }
            if ((returnPolicy == '') || (returnPolicy != '' && retPolicyDetails.notallowreturn)) {
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
                mfgProcessing = {
                    processing: PROCESSING_NON_RETURNABLE,
                    isindate: false,
                    indate: ''
                };
                //mfgProcessing = PROCESSING_NON_RETURNABLE;
            } else if (!returnable) {
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
                mfgProcessing = {
                    processing: PROCESSING_NON_RETURNABLE,
                    isindate: false,
                    indate: ''
                };
                //mfgProcessing = PROCESSING_NON_RETURNABLE;
            } else if (isDamagedItem) {
                if (damageType == DAMAGE_TYPE_1) {
                    pharmaProcessing = PROCESSING_NON_RETURNABLE;
                    mfgProcessing = {
                        processing: PROCESSING_RETURNABLE,
                        isindate: false,
                        indate: ''
                    };
                    alert('damaged item ' + pharmaProcessing + ' ' + mfgProcessing.processing)
                    //mfgProcessing = PROCESSING_RETURNABLE;
                } else if (damageType == DAMAGE_TYPE_2) {
                    pharmaProcessing = PROCESSING_NON_RETURNABLE;
                    mfgProcessing = {
                        processing: PROCESSING_NON_RETURNABLE,
                        isindate: false,
                        indate: ''
                    };
                    alert('damaged item ' + pharmaProcessing + ' ' + mfgProcessing.processing)
                    //mfgProcessing = PROCESSING_NON_RETURNABLE;
                }
            } else if (itemIsOtc && !retPolicyDetails.allowsotc) {
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
                mfgProcessing = {
                    processing: PROCESSING_NON_RETURNABLE,
                    isindate: false,
                    indate: ''
                };
                //mfgProcessing = PROCESSING_NON_RETURNABLE;
            } else {
                fullPartialPackage = currentRecord.getValue({
                    fieldId: 'custrecord_cs_full_partial_package'
                });
                drugForm = item_lookup.custitem_kd_drugform;
                if (fullPartialPackage == FULL_PACKAGE) {
                    if (retPolicyDetails.acceptedfullcontainer != null && retPolicyDetails.acceptedfullcontainer !== undefined && retPolicyDetails.acceptedfullcontainer.indexOf(drugForm) >= 0) {
                        log.debug('TEST', 'Drug Form is allowed for full container on Return Policy');
                        pharmaProcessing = PROCESSING_RETURNABLE;
                        mfgProcessing = {
                            processing: PROCESSING_RETURNABLE,
                            isindate: false,
                            indate: ''
                        };
                        //mfgProcessing = PROCESSING_RETURNABLE;
                        isApplyReturnPolicyDays = true;
                    } else {
                        log.debug('TEST', 'Drug Form is NOT allowed for full container on Return Policy');
                        pharmaProcessing = PROCESSING_NON_RETURNABLE;
                        mfgProcessing = {
                            processing: PROCESSING_NON_RETURNABLE,
                            isindate: false,
                            indate: ''
                        };
                        //mfgProcessing = PROCESSING_NON_RETURNABLE;
                    }
                } else {
                    var drugFormMinQty, checkCustomerState = false,
                        checkMinQty = false;
                    switch (drugForm) {
                        case '1': //each
                            drugFormMinQty = retPolicyDetails.minqtyeach;
                            break;
                        case '2': //ml
                            drugFormMinQty = retPolicyDetails.minqtyml;
                            break;
                        case '3': //grams
                            drugFormMinQty = retPolicyDetails.minqtygrams;
                            break;
                    }
                    var packageSize = currentRecord.getValue({
                        fieldId: 'custrecord_cs_package_size'
                    });;
                    if (drugFormMinQty == null || drugFormMinQty == undefined || drugFormMinQty == '') {
                        drugFormMinQty = 0;
                    }
                    if (packageSize == null || packageSize == undefined || packageSize == '') {
                        packageSize = 0;
                    }
                    var minQtyPackageSize = (parseFloat(drugFormMinQty) / 100) * parseFloat(packageSize);
                    var itemPartialQty = currentRecord.getValue({
                        fieldId: 'custrecord_cs_qty'
                    });
                    log.debug('TEST', drugFormMinQty + ' * ' + packageSize + ' = ' + minQtyPackageSize);
                    if (retPolicyDetails.allowspartial) {
                        if (retPolicyDetails.acceptedpartialcontainer != null && retPolicyDetails.acceptedpartialcontainer !== undefined && retPolicyDetails.acceptedpartialcontainer.indexOf(drugForm) >= 0) {
                            log.debug('TEST', 'drug form is accepted in partial')
                            if (itemPartialQty < minQtyPackageSize) {
                                log.debug('TEST', 'item partial qty is less than minQtyOfPackageSize')
                                pharmaProcessing = PROCESSING_NON_RETURNABLE;
                                mfgProcessing = {
                                    processing: PROCESSING_NON_RETURNABLE,
                                    isindate: false,
                                    indate: ''
                                };
                                //mfgProcessing = PROCESSING_NON_RETURNABLE;
                            } else {
                                log.debug('TEST', 'item partial qty is greater than minQtyOfPackageSize')
                                pharmaProcessing = PROCESSING_RETURNABLE;
                                mfgProcessing = {
                                    processing: PROCESSING_RETURNABLE,
                                    isindate: false,
                                    indate: ''
                                };
                                //mfgProcessing = PROCESSING_RETURNABLE;
                                isApplyReturnPolicyDays = true;
                            }
                        } else {
                            checkCustomerState = true;
                        }
                    } else {
                        checkCustomerState = true;
                    }

                    if (checkCustomerState) {
                          var lookupFieldsRs = search.lookupFields({
                             type: 'customer',
                             id: currentRecord.getValue('entity'),
                             columns: ['billstate']
                         });
                        log.debug('cust_lookup.billstate', cust_lookup.billstate);
                        var l = cust_lookup.billstate;
                        if (l.length >= 0) {
                            var customerState = cust_lookup['billstate'][0].text;
                        } else {
                            var customerState = '';
                        }
                        pharmaProcessing = PROCESSING_NON_RETURNABLE;
                        mfgProcessing = {
                            processing: PROCESSING_NON_RETURNABLE,
                            isindate: false,
                            indate: ''
                        };
                        //mfgProcessing = PROCESSING_NON_RETURNABLE;
                        log.debug('TEST', 'Customer State is ' + customerState);
                        if (customerState != 'MS' && customerState != 'GA' && customerState != 'NC') {
                            pharmaProcessing = PROCESSING_NON_RETURNABLE;
                            mfgProcessing = {
                                processing: PROCESSING_NON_RETURNABLE,
                                isindate: false,
                                indate: ''
                            };
                            //mfgProcessing = PROCESSING_NON_RETURNABLE;
                            //isApplyReturnPolicyDays = true;
                        } else {
                            if (itemPartialQty < minQtyPackageSize) {
                                log.debug('TEST', 'item qty is less than minQtyOfPackageSize')
                                pharmaProcessing = PROCESSING_NON_RETURNABLE;
                                mfgProcessing = {
                                    processing: PROCESSING_NON_RETURNABLE,
                                    isindate: false,
                                    indate: ''
                                };
                                //mfgProcessing = PROCESSING_NON_RETURNABLE;
                            } else {
                                log.debug('TEST', 'item qty is greater than minQtyOfPackageSize')
                                pharmaProcessing = PROCESSING_RETURNABLE;
                                mfgProcessing = {
                                    processing: PROCESSING_RETURNABLE,
                                    isindate: false,
                                    indate: ''
                                };
                                //mfgProcessing = PROCESSING_RETURNABLE;
                                isApplyReturnPolicyDays = true;
                            }
                        }
                    }
                }

                if (isApplyReturnPolicyDays) {
                    log.debug('TEST', 'get expi date');
                    var expiDate = new Date(currentRecord.getValue({
                        fieldId: 'custrecord_cs_expiration_date'
                    }));
                    log.debug('TEST', 'expi date' + expiDate);
                    if (expiDate == 'Invalid Date' || expiDate == '') {
                        alert('Please enter Expiration Date!');
                        return false;
                    }
                    var firstDayExpiDate = new Date(expiDate.getFullYear(), expiDate.getMonth(), 1);
                    log.debug('CHECK HERE', 'expiration date adjusted ' + firstDayExpiDate);
                    var itemControlType = currentRecord.getValue({
                        fieldId: 'custrecord_cs__controlnum'
                    })
                    log.debug('TEST', 'passed to getPharmaProcessing ' + JSON.stringify(retPolicyDetails));
                    pharmaProcessing = getPharmaProcessing(firstDayExpiDate, retPolicyDetails, itemControlType);
                    mfgProcessing = getMfgProcessing(firstDayExpiDate, retPolicyDetails);
                } else {
                    log.debug('TEST', 'Did not apply Return Policy')
                }
            }
            if ((customerType == CUST_TYPE_PREPAID || customerType == CUST_TYPE_DESTRUCTION)) {
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
            }

            log.debug('TEST', 'PP: ' + pharmaProcessing + '; MP: ' + mfgProcessing.processing);


            //setting values
            if (pharmaProcessing != null && pharmaProcessing != '') {
                currentRecord.setValue({
                    fieldId: 'custrecord_cs__rqstprocesing',
                    value: pharmaProcessing,
                    ignoreFieldChange: true
                });
            }
            if (mfgProcessing != null && mfgProcessing != '' && mfgProcessing.hasOwnProperty('processing')) {
                currentRecord.setValue({
                    fieldId: 'custrecord_cs__mfgprocessing',
                    value: mfgProcessing.processing,
                    ignoreFieldChange: true
                });
            }
        }
        */
        return true;
    }

    function getReturnPolicyDetails(returnPolicy) {
        var rpDetails = {};

        if (returnPolicy != null && returnPolicy != '') {
            var lookupFieldsRs = search.lookupFields({
                type: REC_RET_POLICY,
                id: returnPolicy,
                columns: [FLD_RP_IN_MONTHS, FLD_RP_OUT_MONTHS, FLD_RP_RX_C35_HANDICAP_DAYS, FLD_RP_C2_HANDICAP_DAYS, FLD_RP_DOES_NOT_ALLOW_RETURN, FLD_RP_ALLOWS_PARTIAL, FLD_RP_ALLOWS_OTC, FLD_RP_ACCEPTED_PARTIAL_CONTAINER, FLD_RP_ACCEPTED_FULL_CONTAINER, FLD_RP_MINQTY_EACH, FLD_RP_MINQTY_GRAMS, FLD_RP_MINQTY_ML]
            });

            var acceptedPartial = [];
            for (var i = 0; i < lookupFieldsRs[FLD_RP_ACCEPTED_PARTIAL_CONTAINER].length; i++) {
                acceptedPartial.push(lookupFieldsRs[FLD_RP_ACCEPTED_PARTIAL_CONTAINER][i].value);
            }

            var acceptedFull = [];
            for (var i = 0; i < lookupFieldsRs[FLD_RP_ACCEPTED_FULL_CONTAINER].length; i++) {
                acceptedFull.push(lookupFieldsRs[FLD_RP_ACCEPTED_FULL_CONTAINER][i].value);
            }

            rpDetails = {
                'inmonths': lookupFieldsRs[FLD_RP_IN_MONTHS] != '' ? lookupFieldsRs[FLD_RP_IN_MONTHS] : 0,
                'outmonths': lookupFieldsRs[FLD_RP_OUT_MONTHS] != '' ? lookupFieldsRs[FLD_RP_OUT_MONTHS] : 0,
                'c2days': lookupFieldsRs[FLD_RP_C2_HANDICAP_DAYS] != '' ? lookupFieldsRs[FLD_RP_C2_HANDICAP_DAYS] : 0,
                'rxc35days': lookupFieldsRs[FLD_RP_RX_C35_HANDICAP_DAYS] != '' ? lookupFieldsRs[FLD_RP_RX_C35_HANDICAP_DAYS] : 0,
                'notallowreturn': lookupFieldsRs[FLD_RP_DOES_NOT_ALLOW_RETURN],
                'minqtyeach': lookupFieldsRs[FLD_RP_MINQTY_EACH] != '' ? lookupFieldsRs[FLD_RP_MINQTY_EACH] : 0,
                'minqtygrams': lookupFieldsRs[FLD_RP_MINQTY_GRAMS] != '' ? lookupFieldsRs[FLD_RP_MINQTY_GRAMS] : 0,
                'minqtyml': lookupFieldsRs[FLD_RP_MINQTY_ML] != '' ? lookupFieldsRs[FLD_RP_MINQTY_ML] : 0,
                'allowspartial': lookupFieldsRs[FLD_RP_ALLOWS_PARTIAL],
                'allowsotc': lookupFieldsRs[FLD_RP_ALLOWS_OTC],
                'acceptedpartialcontainer': acceptedPartial, //lookupFieldsRs[FLD_RP_ACCEPTED_PARTIAL_CONTAINER],
                'acceptedfullcontainer': acceptedFull //lookupFieldsRs[FLD_RP_ACCEPTED_FULL_CONTAINER]
            };
        }

        return rpDetails;
    }

    function getPharmaProcessing(expirationDate, returnPolicyDays, controlType) {
        var pharmaProcessing;
        var sysDate = new Date();
        sysDate.setHours(0, 0, 0, 0);
        sysDate.setDate(sysDate.getDate() + 1 - 1)
        //sysDate = new Date(sysDate.getFullYear(), sysDate.getMonth(), sysDate.getDate());
        var handicapDays;
        if (controlType == IT_CT_C2) {
            handicapDays = returnPolicyDays.c2days;
        } else {
            handicapDays = returnPolicyDays.rxc35days;
        }
        var pharmaReturnableStart = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
        pharmaReturnableStart.setMonth(pharmaReturnableStart.getMonth() - parseInt(returnPolicyDays.inmonths));

        var pharmaReturnableEnd = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
        pharmaReturnableEnd.setMonth(pharmaReturnableEnd.getMonth() + parseInt(returnPolicyDays.outmonths) - 1);
        pharmaReturnableEnd = new Date(pharmaReturnableEnd.getFullYear(), pharmaReturnableEnd.getMonth() + 1, 0);
        pharmaReturnableEnd.setDate(pharmaReturnableEnd.getDate() - parseInt(handicapDays))

        log.debug('TEST', sysDate)
        log.debug('TEST', 'pharma returnable start ' + pharmaReturnableStart);
        log.debug('TEST', 'pharma returnable end ' + pharmaReturnableEnd);

        log.debug('TEST', 'sysDate >= pharmaReturnableStart ' + sysDate >= pharmaReturnableStart);
        log.debug('TEST', 'sysDate <= pharmaReturnableEnd ' + sysDate <= pharmaReturnableEnd)

        if (sysDate >= pharmaReturnableStart && sysDate <= pharmaReturnableEnd) {
            log.debug('TEST', 'sysdate is within pharmaReturnablePeriod');
            var handicapStart = new Date(pharmaReturnableEnd.getFullYear(), pharmaReturnableEnd.getMonth(), pharmaReturnableEnd.getDate());
            //handicapStart.setDate(handicapStart.getDate() - parseInt(handicapDays));
            handicapStart.setDate(handicapStart.getDate() + 1);
            var handicapEnd = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
            handicapEnd.setMonth(expirationDate.getMonth() + parseInt(returnPolicyDays.outmonths) - 1);
            handicapEnd = new Date(handicapEnd.getFullYear(), handicapEnd.getMonth() + 1, 0);
            log.debug('TEST', 'handicap start ' + handicapStart);
            log.debug('TEST', 'handicap end ' + handicapEnd);

            if (sysDate >= handicapStart && sysDate <= handicapEnd) {
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
            } else {
                pharmaProcessing = PROCESSING_RETURNABLE
            }
        } else {
            log.debug('TEST', 'sysdate is NOT within pharmaReturnablePeriod');
            if (sysDate < pharmaReturnableStart) {
                pharmaProcessing = PROCESSING_RETURNABLE
            } else if (sysDate > pharmaReturnableEnd) {
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
            }
        }

        return pharmaProcessing;
    }

    function getMfgProcessing(expirationDate, returnPolicyDays) {
        var mfgProcessing;
        var sysDate = new Date();
        sysDate.setHours(0, 0, 0, 0);
        var isInDate = false;

        var mfgReturnableStart = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
        mfgReturnableStart.setMonth(mfgReturnableStart.getMonth() - (parseInt(returnPolicyDays.inmonths) - 1));
        log.debug('TEST', mfgReturnableStart.getMonth() + ' - (' + returnPolicyDays.inmonths + ' - 1)');

        var mfgReturnableEnd = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
        mfgReturnableEnd.setMonth(mfgReturnableEnd.getMonth() + parseInt(returnPolicyDays.outmonths));
        mfgReturnableEnd = new Date(mfgReturnableEnd.getFullYear(), mfgReturnableEnd.getMonth() + 1, 0);

        var inDate = new Date(mfgReturnableStart.getFullYear(), mfgReturnableStart.getMonth(), mfgReturnableStart.getDate());
        inDate.setDate(inDate.getDate() - 1);
        inDate.setHours(0, 0, 0, 0);

        log.debug('TEST', 'mfg returnable start ' + mfgReturnableStart);
        log.debug('TEST', 'mfg returnable end ' + mfgReturnableEnd);
        log.debug('TEST', 'in date ' + inDate);

        if (sysDate >= mfgReturnableStart && sysDate <= mfgReturnableEnd) {
            mfgProcessing = PROCESSING_RETURNABLE;
        } else {
            if (sysDate < mfgReturnableStart) {
                mfgProcessing = PROCESSING_RETURNABLE;
                isInDate = true;
            } else if (sysDate > mfgReturnableEnd) {
                mfgProcessing = PROCESSING_NON_RETURNABLE;
            }
        }

        return {
            processing: mfgProcessing,
            isindate: isInDate,
            indate: mfgReturnableStart
        };
    }
    /**
     * context.currentRecord
     * context.mode // [copy, paste, create]
     *
     * @type {import('N/types').EntryPoints.Client.pageInit}
     */
    function pageInit(context) {
        // no return value
		var curentRec = context.currentRecord;
		log.debug('context.mode',context.mode);
        if (context.mode != 'edit') {
		log.debug('enter to hide block');	
		NS.jQuery('#custrecord_cs_expiration_date').val('');
        NS.jQuery('#custrecord_cs_qty').val('');
		       
        
            curentRec.setValue({
                fieldId: 'custrecord_cs_lotnum',
                value: '',
                ignoreFieldChange: true
            });
                      curentRec.setValue({
                fieldId: 'custrecord_scan_complete_submit_returns',
                value: false,
                ignoreFieldChange: true
            });
			curentRec.setValue({
                fieldId: 'custrecord_cs_full_partial_package',
                value: '',
                ignoreFieldChange: true
            });
			curentRec.setValue({
                fieldId: 'custrecord_cs_return_req_scan_item',
                value: '',
                ignoreFieldChange: true
            });
			curentRec.setValue({
                fieldId: 'custrecord_cs_damageditem',
                value: false,
                ignoreFieldChange: true
            });
			curentRec.setValue({
                fieldId: 'custrecord_cs_damagecode',
                value: '',
                ignoreFieldChange: true
            });
			curentRec.setValue({
                fieldId: 'custrecord_cs__rqstprocesing',
                value: '',
                ignoreFieldChange: true
            });
			curentRec.setValue({
                fieldId: 'custrecord_cs__mfgprocessing',
                value: '',
                ignoreFieldChange: true
            });
			curentRec.setValue({
                fieldId: 'custrecord_cs_return_policy',
                value: '',
                ignoreFieldChange: true
            });
			curentRec.setValue({
                fieldId: 'custrecord_cs_qty',
                value: '',
                ignoreFieldChange: true
            });
			curentRec.setValue({
                fieldId: 'custrecord_cs_expiration_date',
                value: '',
                ignoreFieldChange: true
            });
        }
        var ismarked = curentRec.getValue({
            fieldId: 'custrecord_scan_complete_submit_returns'
        });
        if (ismarked) {
            NS.jQuery('#custpage_save_record').show();
            NS.jQuery('#secondarycustpage_save_record').show();
            NS.jQuery('#custpage_save_copy').show();
            NS.jQuery('#secondarycustpage_save_copy').show();
        } else {
            NS.jQuery('#custpage_save_record').show();
            NS.jQuery('#secondarycustpage_save_record').show();
            NS.jQuery('#custpage_save_copy').show();
            NS.jQuery('#secondarycustpage_save_copy').show();
        }
        NS.jQuery('#spn_multibutton_submitter').hide();
        NS.jQuery('#btn_secondarymultibutton_submitter').hide();
        NS.jQuery('#changeid').hide();
        NS.jQuery('#secondarychangeid').hide();
        NS.jQuery('#tdbody_changeid').hide();
        //NS.jQuery('#tdbody_custpage_save_copy').hide();
        //NS.jQuery('#tdbody_secondarycustpage_save_copy').hide();
        NS.jQuery('#tdbody_secondarychangeid').hide();
        NS.jQuery('#spn_secondarymultibutton_submitter').hide();
        //NS.jQuery('#custpage_save_record').hide();
        //NS.jQuery('#secondarycustpage_save_record').hide();
        NS.jQuery('.multiBnt').hide();

    }
 
    return {
        'fieldChanged': fieldChanged,
        'pageInit': pageInit,
     
    };
});