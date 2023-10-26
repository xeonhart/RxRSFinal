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
  /** @type import('N/runtime')}   **/ runtime,
  /** @type import('N/ui/dialog')} **/ dialog,
  /** @type import('N/record')}    **/ record,
  /** @type import('N/search')}    **/ search,
  /** @type import('N/log')}       **/ log
) {
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
  /**
   * context.currentRecord
   * context.sublistId
   * context.fieldId
   * context.line
   * context.column
   *
   * @type {import('N/types').EntryPoints.Client.fieldChanged}
   */
  function saveRecord(context) {
    try{
		//APPLY THE RETURN POLICY ON THE ITEM SCAN RIGHT AFTER THE ITEM
		var currentRecord = context.currentRecord;
			
		//var field 			= context.fieldId; 
		var currentRecord 	= context.currentRecord;
		var itemreturnable = false;
		var customerType = '';
		var returnPolicy;
		var pharmaProcessing, mfgProcessing, fullPartialPackage, drugForm, acceptedFullContainer, acceptedPartialContainer;
		var isIndate = false;
		var isApplyReturnPolicyDays = false;
	//if(field == 'custrecord_cs_return_req_scan_item'||field == 'custrecord_cs_full_partial_package'||field == 'custrecord_cs_qty'||field == 'custrecord_cs_expiration_date'){//field == 'custrecord_cs_return_req_scan_item'
			if(true){
			var itemid = currentRecord.getValue({fieldId:'custrecord_cs_return_req_scan_item'});//field
			if(itemid){
			var itemobj = search.lookupFields({type:'lotnumberedinventoryitem',id:itemid,columns:['custitem_kod_rtnpolicy','custitem_kod_returnable']});
			log.debug(itemobj.custitem_kod_rtnpolicy.length,itemobj.custitem_kod_rtnpolicy);
			if(itemobj.custitem_kod_rtnpolicy.length>0){
				returnPolicy = itemobj.custitem_kod_rtnpolicy[0].value;
				if(returnPolicy){
					currentRecord.setValue({fieldId:'custrecord_cs_return_policy',value:returnPolicy,ignoreFieldChange:false});
				}
			}
			itemreturnable = itemobj.custitem_kod_returnable;
		
		//NO MANUFACTURER RETURN POLICY ASSIGNED TO THE ITEM, SET PHARMA PROCESSING AND MFG PROCESSING AS NON-RETURNABLE,
		//== '' || fldValue == null || fldValue == undefined
		if(returnPolicy== ''||returnPolicy==null||returnPolicy== undefined){
			//STEP 1
			log.debug('NO MANUFACTURER RETURN POLICY ASSIGNED TO THE ITEM, SET PHARMA PROCESSING AND MFG PROCESSING AS NON-RETURNABLE,')
				setFieldsData(1,1,currentRecord);
		}else{
			//STEP 2
			//(DOES NOT ALLOW RETURN = TRUE [RETURN POLICY]), IF TRUE, SET PHARMA PROCESSING AND MFG PROCESSING = NON-RETURNABLE,
			log.debug('returnPolicy',returnPolicy)
			var returnpolicyObj = search.lookupFields({type:'customrecord_kod_returnpolicy_cr',id:returnPolicy,columns:['custrecord_kd_notallowsrtrn']});
			var notAllowReturn  = returnpolicyObj.custrecord_kd_notallowsrtrn;
			var retPolicyDetails = getReturnPolicyDetails(returnPolicy);
			log.debug('notAllowReturn',notAllowReturn)
			if(notAllowReturn){
				log.debug('(DOES NOT ALLOW RETURN = TRUE [RETURN POLICY]), IF TRUE, SET PHARMA PROCESSING AND MFG PROCESSING = NON-RETURNABLE,')
				setFieldsData(1,1,currentRecord);
			}else{
				log.debug('allow return');
				//2.1 IF THE CUSTOMER TYPE = PHARMA PREPAID OR PHARMA DESTRUCTION, SET PHARMA PROCESSING FIELD =NON-RETURNABLE;
				var rr_record_id = currentRecord.getValue({
					fieldId: 'custrecord_cs_ret_req_scan_rrid'
				});
				var rr_lookup = search.lookupFields({
					type: 'customsale_kod_returnrequest',
					id: rr_record_id,
					columns: ['entity']
				}); 
				var cust_id = rr_lookup['entity'][0].value;
				var cust_lookup = search.lookupFields({
					type: 'customer',
					id: cust_id,
					columns: ['custentity_planselectiontype', 'billstate']//custentity_kod_custtype
				}); 
				customerType = cust_lookup.custentity_planselectiontype;
				if(customerType[0].value == 3 || customerType[0].value == 5){
					log.debug('IF THE CUSTOMER TYPE = PHARMA PREPAID OR PHARMA DESTRUCTION, SET PHARMA PROCESSING FIELD =NON-RETURNABLE;')
					setFieldsData(1,'',currentRecord);
				}
				//2.2 IF THE ITEM RETURNABLE CHECKBOX = FALSE, SET THE PHARMA PROCESSING AND MANUFACTURING PROCESSING FIELD = NON-RETURNABLE
				if(!itemreturnable){
					log.debug('IF THE ITEM RETURNABLE CHECKBOX = FALSE, SET THE PHARMA PROCESSING AND MANUFACTURING PROCESSING FIELD = NON-RETURNABLE')
					setFieldsData(1,1,currentRecord);
				}
				//2.3 IF THE RETURNABLE CHECKBOX IN THE ITEM RECORD = TRUE AND CUSTOMER TYPE = PHARMA QUICK CASH,
				//4	Pharma - Quick Cash
				log.debug('itemreturnable '+itemreturnable,'customerType '+customerType[0].value);
				if(itemreturnable){// && customerType[0].value==4
					log.debug('quick cash');
					//2.4.1 CHECK IF THE ITEM IS DAMAGED, IF DAMAGED ITEM = TRUE (RETURN REQUEST LINE), THEN CHECK THE DAMAGED TYPE,
					var itemid = currentRecord.getValue({fieldId:'custrecord_cs_return_req_scan_item'});//field
					var isDamagedItem = currentRecord.getValue({
											fieldId: 'custrecord_cs_damageditem'
											});
				  var damageType = currentRecord.getValue({
                fieldId: 'custrecord_cs_damagecode'
            });
			//2.4.1	Check if the item is damaged, if Damaged Item = True (Return Request Line), then check the damaged type
			if(isDamagedItem){
				log.debug('damaged item');
				//2.4.1.1	If Damage type = 1, set Pharma Processing = Non-Returnable and Manufacturing Processing = Returnable 
                if(damageType == DAMAGE_TYPE_1){
					log.debug('If Damage type = 1, set Pharma Processing = Non-Returnable and Manufacturing Processing = Returnable ')
					setFieldsData(2,1,currentRecord);
                }
				//2.4.1.2	If Damage type = 2, set Pharma Processing and Mfg Processing = Non-Returnable
				else if(damageType == DAMAGE_TYPE_2){
					log.debug('If Damage type = 2, set Pharma Processing and Mfg Processing = Non-Returnable')
					setFieldsData(1,1,currentRecord);
                }
			}
			//2.4.2	Check if the item is OTC, if OTC (item record) = True,
			else{
				log.debug('otc check')
				var itemIsOtc = false;
				var ir_item=currentRecord.getValue({
                fieldId: 'custrecord_cs_return_req_scan_item'
            });
				var item_lookup = search.lookupFields({
									 type: search.Type.ITEM,
									 id: ir_item,
									 columns: ['custitem_kod_returnable','custitem_kd_prescription_otc','custitem_kd_drugform']
			});
			log.debug('item_lookup',item_lookup);
			log.debug('item_lookup.custitem_kd_prescription_otc',item_lookup.custitem_kd_prescription_otc)
			if(item_lookup.custitem_kd_prescription_otc.length>0){
			if(item_lookup['custitem_kd_prescription_otc'][0].value == 2){
                itemIsOtc = true;
            }
			}
			log.debug('itemIsOtc',itemIsOtc);
				if(itemIsOtc){
				
				
			//2.4.2.1	Check if Allows OTC, if Allows OTC (return policy) = False, then set Pharma Processing and Manufacturing Processing = Non-Returnable, otherwise
			if(itemIsOtc && !retPolicyDetails.allowsotc){
				log.debug('Check if Allows OTC, if Allows OTC (return policy) = False, then set Pharma Processing and Manufacturing Processing = Non-Returnable, otherwise')
               setFieldsData(1,1,currentRecord);
            }
			else{
				
				fullPartialPackage =currentRecord.getValue({
                fieldId: 'custrecord_cs_full_partial_package'
            });
                drugForm = item_lookup.custitem_kd_drugform;
				log.debug('drugForm',drugForm);
				log.debug('retPolicyDetails.acceptedfullcontainer',retPolicyDetails.acceptedfullcontainer);
                
				if(fullPartialPackage == FULL_PACKAGE){
					//2.4.2.2.1	If the item is Full Package, set the Mfg Processing & Pharma Processing = Returnable when, the drug form (Return Request) = Drug Form [Accept Full Containers] selected on the Return Policy. (Then proceed to the logic starting from 2.4.3)

                    if(retPolicyDetails.acceptedfullcontainer != null && retPolicyDetails.acceptedfullcontainer !== undefined && retPolicyDetails.acceptedfullcontainer.indexOf(drugForm[0].value) >= 0){
                        log.debug('TEST', 'Drug Form is allowed for full container on Return Policy');
                        setFieldsData(2,2,currentRecord);
                        isApplyReturnPolicyDays = true;
                    }else{
						//2.4.2.2.2	If the item is Full Package, set the Mfg Processing & Pharma Processing = Non Returnable when, the drug form (Return Request) is not equal to drug form [Accept Full Containers] selected on the Return Policy. (logic stops here)
                        log.debug('TEST', 'Drug Form is NOT allowed for full container on Return Policy');
                        setFieldsData(1,1,currentRecord);
                        //mfgProcessing = PROCESSING_NON_RETURNABLE;
                    }
                }
				else if(fullPartialPackage ==PARTIAL_PACKAGE ){
                    var drugFormMinQty, checkCustomerState = false, checkMinQty = false;
                    switch(drugForm[0].value){
                        case '1'://each
                            drugFormMinQty = retPolicyDetails.minqtyeach;
                            break;
                        case '2'://ml
                            drugFormMinQty = retPolicyDetails.minqtyml;
                            break;
                        case '3'://grams
                            drugFormMinQty = retPolicyDetails.minqtygrams;
                            break;
                    }
                    var packageSize = currentRecord.getValue({
                fieldId: 'custrecord_cs_package_size'
            });;
                    if(drugFormMinQty == null || drugFormMinQty == undefined || drugFormMinQty == ''){
                        drugFormMinQty = 0;
                    }
                    if(packageSize == null || packageSize == undefined || packageSize == ''){
                        packageSize = 0;
                    }
                    var minQtyPackageSize = (parseFloat(drugFormMinQty) / 100) * parseFloat(packageSize);
                    var itemPartialQty = currentRecord.getValue({
                        fieldId: 'custrecord_cs_qty'
                    });
                    log.debug('TEST', drugFormMinQty + ' * ' + packageSize + ' = ' + minQtyPackageSize);
                    if(retPolicyDetails.allowspartial){
                        if(retPolicyDetails.acceptedpartialcontainer != null && retPolicyDetails.acceptedpartialcontainer !== undefined && retPolicyDetails.acceptedpartialcontainer.indexOf(drugForm[0].value) >= 0){
                            log.debug('TEST', 'drug form is accepted in partial');
                           //2.4.2.2.4	If the item is Partial Package, set the Mfg Processing & Pharma Processing = Non Returnable when,"Allows Partial" checkbox (Return Policy) = True and,the drug form (Return Request) = Drug Form [Accept Partial Containers] selected on the Return Policy; and,Partial Count (Return Request) < Minimum Quantity *Minimum quantity (%) (Return Policy) x Package Size (Item Record). (logic stops here)
							if(itemPartialQty < minQtyPackageSize){
                                log.debug('TEST', 'item partial qty is less than minQtyOfPackageSize')
                                //pharmaProcessing = PROCESSING_NON_RETURNABLE;
                                //mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                                //mfgProcessing = PROCESSING_NON_RETURNABLE;
								 setFieldsData(1,1,currentRecord);
                            }else{ 
							//2.4.2.2.3	If the item is Partial Package, set the Mfg Processing & Pharma Processing = Returnable when, "Allows Partial" checkbox (Return Policy) = True and,the drug form (Return Request) = Drug Form [Accept Partial Containers] selected on the Return Policy; and,Partial Count (Return Request) =/> Minimum Quantity *Minimum quantity (%) (Return Policy) x Package Size (Item Record). (Then proceed to the logic starting from 2.4.3)
							log.debug('TEST', 'item partial qty is greater than minQtyOfPackageSize')
                                //pharmaProcessing = PROCESSING_RETURNABLE;
                                //mfgProcessing = {processing: PROCESSING_RETURNABLE, isindate: false, indate: ''};
                                //mfgProcessing = PROCESSING_RETURNABLE;
								 setFieldsData(2,2,currentRecord);
                                isApplyReturnPolicyDays = true;
                            }
                        }else{
                            checkCustomerState = true;
                        }    
                    }else{
                        checkCustomerState = true;
                    }

                    if(checkCustomerState){
                       /*  var lookupFieldsRs = search.lookupFields({
                            type: 'customer',
                            id: currentRecord.getValue('entity'),
                            columns: ['billstate']
                        }); */
						log.debug('cust_lookup.billstate',cust_lookup.billstate);
						var l=cust_lookup.billstate;
						if(l.length>0){
                        var customerState = cust_lookup['billstate'][0].text;
						}
						else{
							var customerState='';
						}
                       // pharmaProcessing = PROCESSING_NON_RETURNABLE;
                      //  mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                        //mfgProcessing = PROCESSING_NON_RETURNABLE;
                        log.debug('TEST', 'Customer State is ' + customerState);
						//2.4.2.2.5	If the item is Partial Package, set the Mfg Processing & Pharma Processing = Non Returnable when,the "Allows Partial" checkbox (Return Policy) = False and,Customer State is not = MS or GA, or NC; and, (logic stops here)

                        if(customerState != 'MS' && customerState != 'GA' && customerState != 'NC'){
                            //pharmaProcessing = PROCESSING_NON_RETURNABLE;
                            //mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                            setFieldsData(1,1,currentRecord);
							//mfgProcessing = PROCESSING_NON_RETURNABLE;
                            //isApplyReturnPolicyDays = true;
                        }else{
							//2.4.2.2.6	If the item is Partial Package, set the Mfg Processing & Pharma Processing = Non Returnable when,the "Allows Partial" checkbox (Return Policy) = False and,Customer State is = MS or GA, or NC; and,Partial Count (Return Request) < Minimum Quantity *Minimum quantity (%) (Return Policy) x Package Size (Item Record) (logic stops here)

                            if(itemPartialQty < minQtyPackageSize){
                                log.debug('TEST', 'item qty is less than minQtyOfPackageSize')
                                //pharmaProcessing = PROCESSING_NON_RETURNABLE;
                                //mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                                setFieldsData(1,1,currentRecord);
								//mfgProcessing = PROCESSING_NON_RETURNABLE;
                            }else{
								//2.4.2.2.7	If the item is Partial Package, set the Mfg Processing & Pharma Processing = Returnable when, the "Allows Partial" checkbox (Return Policy) = False and,Customer State is = MS or GA, or NC; and,Partial Count (Return Request) =/> Minimum Quantity *Minimum quantity (%) (Return Policy) x Package Size (Item Record). (Then proceed to the logic starting from 2.4.3)


                                log.debug('TEST', 'item qty is greater than minQtyOfPackageSize')
                                //pharmaProcessing = PROCESSING_RETURNABLE;
                                //mfgProcessing = {processing: PROCESSING_RETURNABLE, isindate: false, indate: ''};
                                //mfgProcessing = PROCESSING_RETURNABLE;
								setFieldsData(2,2,currentRecord);
                                isApplyReturnPolicyDays = true;
                            }
                        }
                    }
                }
				//2.4.3	Identify whether the system date is within the returnable period.
				if(isApplyReturnPolicyDays){
                    log.debug('TEST', 'get expi date');
                    var expiDate = new Date( currentRecord.getValue({
                        fieldId: 'custrecord_cs_expiration_date'
                    }));
                    log.debug('TEST', 'expi date' + expiDate);
                    if(expiDate == 'Invalid Date' || expiDate == ''){
                        alert('Please enter Expiration Date!');
                        return false;
                    }
                    var firstDayExpiDate = new Date(expiDate.getFullYear(), expiDate.getMonth(), 1);
                    log.debug('CHECK HERE', 'expiration date adjusted ' +firstDayExpiDate);
                    var itemControlType =currentRecord.getValue({
                        fieldId: 'custrecord_cs__controlnum'
                    })
                     var sysDate = new Date();
                    log.debug('TEST', 'sysDate start' + sysDate);
                    /*if(sysDate == 'Invalid Date' || sysDate == ''){
                        alert('Please enter System Date!');
                        return false;
                    }*/
                    log.debug('TEST', 'passed to getPharmaProcessing ' + JSON.stringify(retPolicyDetails));
                    pharmaProcessing = getPharmaProcessing(firstDayExpiDate, retPolicyDetails, itemControlType,sysDate);
                    mfgProcessing = getMfgProcessing(firstDayExpiDate, retPolicyDetails,sysDate);
					setFieldsData(mfgProcessing.processing,pharmaProcessing,currentRecord);
                }else{
                    log.debug('TEST', 'Did not apply Return Policy')
                }
			}
			}
			else{
				
				fullPartialPackage =currentRecord.getValue({
                fieldId: 'custrecord_cs_full_partial_package'
            });
                drugForm = item_lookup.custitem_kd_drugform;
				log.debug('drugForm',drugForm);
				log.debug('retPolicyDetails.acceptedfullcontainer',retPolicyDetails.acceptedfullcontainer);
                
				if(fullPartialPackage == FULL_PACKAGE){
					//2.4.2.2.1	If the item is Full Package, set the Mfg Processing & Pharma Processing = Returnable when, the drug form (Return Request) = Drug Form [Accept Full Containers] selected on the Return Policy. (Then proceed to the logic starting from 2.4.3)

                    if(retPolicyDetails.acceptedfullcontainer != null && retPolicyDetails.acceptedfullcontainer !== undefined && retPolicyDetails.acceptedfullcontainer.indexOf(drugForm[0].value) >= 0){
                        log.debug('TEST', 'Drug Form is allowed for full container on Return Policy');
                        setFieldsData(2,2,currentRecord);
                        isApplyReturnPolicyDays = true;
                    }else{
						//2.4.2.2.2	If the item is Full Package, set the Mfg Processing & Pharma Processing = Non Returnable when, the drug form (Return Request) is not equal to drug form [Accept Full Containers] selected on the Return Policy. (logic stops here)
                        log.debug('TEST', 'Drug Form is NOT allowed for full container on Return Policy');
                        setFieldsData(1,1,currentRecord);
                        //mfgProcessing = PROCESSING_NON_RETURNABLE;
                    }
                }
				else if(fullPartialPackage ==PARTIAL_PACKAGE ){
                    var drugFormMinQty, checkCustomerState = false, checkMinQty = false;
                    switch(drugForm[0].value){
                        case '1'://each
                            drugFormMinQty = retPolicyDetails.minqtyeach;
                            break;
                        case '2'://ml
                            drugFormMinQty = retPolicyDetails.minqtyml;
                            break;
                        case '3'://grams
                            drugFormMinQty = retPolicyDetails.minqtygrams;
                            break;
                    }
                    var packageSize = currentRecord.getValue({
                fieldId: 'custrecord_cs_package_size'
            });;
                    if(drugFormMinQty == null || drugFormMinQty == undefined || drugFormMinQty == ''){
                        drugFormMinQty = 0;
                    }
                    if(packageSize == null || packageSize == undefined || packageSize == ''){
                        packageSize = 0;
                    }
                    var minQtyPackageSize = (parseFloat(drugFormMinQty) / 100) * parseFloat(packageSize);
                    var itemPartialQty = currentRecord.getValue({
                        fieldId: 'custrecord_cs_qty'
                    });
                    log.debug('TEST', drugFormMinQty + ' * ' + packageSize + ' = ' + minQtyPackageSize);
                    if(retPolicyDetails.allowspartial){
                        if(retPolicyDetails.acceptedpartialcontainer != null && retPolicyDetails.acceptedpartialcontainer !== undefined && retPolicyDetails.acceptedpartialcontainer.indexOf(drugForm[0].value) >= 0){
                            log.debug('TEST', 'drug form is accepted in partial');
                           //2.4.2.2.4	If the item is Partial Package, set the Mfg Processing & Pharma Processing = Non Returnable when,"Allows Partial" checkbox (Return Policy) = True and,the drug form (Return Request) = Drug Form [Accept Partial Containers] selected on the Return Policy; and,Partial Count (Return Request) < Minimum Quantity *Minimum quantity (%) (Return Policy) x Package Size (Item Record). (logic stops here)
							if(itemPartialQty < minQtyPackageSize){
                                log.debug('TEST', 'item partial qty is less than minQtyOfPackageSize')
                                //pharmaProcessing = PROCESSING_NON_RETURNABLE;
                                //mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                                //mfgProcessing = PROCESSING_NON_RETURNABLE;
								 setFieldsData(1,1,currentRecord);
                            }else{ 
							//2.4.2.2.3	If the item is Partial Package, set the Mfg Processing & Pharma Processing = Returnable when, "Allows Partial" checkbox (Return Policy) = True and,the drug form (Return Request) = Drug Form [Accept Partial Containers] selected on the Return Policy; and,Partial Count (Return Request) =/> Minimum Quantity *Minimum quantity (%) (Return Policy) x Package Size (Item Record). (Then proceed to the logic starting from 2.4.3)
							log.debug('TEST', 'item partial qty is greater than minQtyOfPackageSize')
                                //pharmaProcessing = PROCESSING_RETURNABLE;
                                //mfgProcessing = {processing: PROCESSING_RETURNABLE, isindate: false, indate: ''};
                                //mfgProcessing = PROCESSING_RETURNABLE;
								 setFieldsData(2,2,currentRecord);
                                isApplyReturnPolicyDays = true;
                            }
                        }else{
                            checkCustomerState = true;
                        }    
                    }else{
                        checkCustomerState = true;
                    }

                    if(checkCustomerState){
                       /*  var lookupFieldsRs = search.lookupFields({
                            type: 'customer',
                            id: currentRecord.getValue('entity'),
                            columns: ['billstate']
                        }); */
						log.debug('cust_lookup.billstate',cust_lookup.billstate);
						var l=cust_lookup.billstate;
						if(l.length>0){
                        var customerState = cust_lookup['billstate'][0].text;
						}
						else{
							var customerState='';
						}
                       // pharmaProcessing = PROCESSING_NON_RETURNABLE;
                      //  mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                        //mfgProcessing = PROCESSING_NON_RETURNABLE;
                        log.debug('TEST', 'Customer State is ' + customerState);
						//2.4.2.2.5	If the item is Partial Package, set the Mfg Processing & Pharma Processing = Non Returnable when,the "Allows Partial" checkbox (Return Policy) = False and,Customer State is not = MS or GA, or NC; and, (logic stops here)

                        if(customerState != 'MS' && customerState != 'GA' && customerState != 'NC'){
                            //pharmaProcessing = PROCESSING_NON_RETURNABLE;
                            //mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                            setFieldsData(1,1,currentRecord);
							//mfgProcessing = PROCESSING_NON_RETURNABLE;
                            //isApplyReturnPolicyDays = true;
                        }else{
							//2.4.2.2.6	If the item is Partial Package, set the Mfg Processing & Pharma Processing = Non Returnable when,the "Allows Partial" checkbox (Return Policy) = False and,Customer State is = MS or GA, or NC; and,Partial Count (Return Request) < Minimum Quantity *Minimum quantity (%) (Return Policy) x Package Size (Item Record) (logic stops here)

                            if(itemPartialQty < minQtyPackageSize){
                                log.debug('TEST', 'item qty is less than minQtyOfPackageSize')
                                //pharmaProcessing = PROCESSING_NON_RETURNABLE;
                                //mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                                setFieldsData(1,1,currentRecord);
								//mfgProcessing = PROCESSING_NON_RETURNABLE;
                            }else{
								//2.4.2.2.7	If the item is Partial Package, set the Mfg Processing & Pharma Processing = Returnable when, the "Allows Partial" checkbox (Return Policy) = False and,Customer State is = MS or GA, or NC; and,Partial Count (Return Request) =/> Minimum Quantity *Minimum quantity (%) (Return Policy) x Package Size (Item Record). (Then proceed to the logic starting from 2.4.3)


                                log.debug('TEST', 'item qty is greater than minQtyOfPackageSize')
                                //pharmaProcessing = PROCESSING_RETURNABLE;
                                //mfgProcessing = {processing: PROCESSING_RETURNABLE, isindate: false, indate: ''};
                                //mfgProcessing = PROCESSING_RETURNABLE;
								setFieldsData(2,2,currentRecord);
                                isApplyReturnPolicyDays = true;
                            }
                        }
                    }
                }
				//2.4.3	Identify whether the system date is within the returnable period.
				if(isApplyReturnPolicyDays){
                    log.debug('TEST', 'get expi date');
                    var expiDate = new Date(currentRecord.getValue({
                        fieldId: 'custrecord_cs_expiration_date'
                    }));
                    log.debug('TEST', 'expi date' + expiDate);
                    if(expiDate == 'Invalid Date' || expiDate == ''){
                        alert('Please enter Expiration Date!');
                        return false;
                    }
                    var firstDayExpiDate = new Date(expiDate.getFullYear(), expiDate.getMonth(), 1);
                    log.debug('CHECK HERE', 'expiration date adjusted ' +firstDayExpiDate);
                    var itemControlType =currentRecord.getValue({
                        fieldId: 'custrecord_cs__controlnum'
                    })
                    var sysDate = new Date();
                  
                  /* if(sysDate == 'Invalid Date' || sysDate == ''){
                        alert('Please enter System Date!');
                        return false;
                    }*/
                 
                  log.debug('sysDate start',sysDate);
                    log.debug('TEST', 'passed to getPharmaProcessing ' + JSON.stringify(retPolicyDetails));
                    pharmaProcessing = getPharmaProcessing(firstDayExpiDate, retPolicyDetails, itemControlType,sysDate);
                    mfgProcessing = getMfgProcessing(firstDayExpiDate, retPolicyDetails,sysDate);
					setFieldsData(mfgProcessing.processing,pharmaProcessing,currentRecord);
                }else{
                    log.debug('TEST', 'Did not apply Return Policy')
                }
			}
				}
				}
			}
			
			
		}
	}
		}
		return true
	}catch(e){
		log.debug('Error',e.toString());
	}
  }
 function setFieldsData(mfg,pharma,currentRecord){
	 try{
		 currentRecord.setValue({fieldId:'custrecord_cs__mfgprocessing',value:mfg,ignoreFieldChange:true});
		 currentRecord.setValue({fieldId:'custrecord_cs__rqstprocesing',value:pharma,ignoreFieldChange:true});
	 }catch(e){
		 log.debug('Error in setFieldsData',e.toString());
	 }
 }
 
 function getReturnPolicyDetails(returnPolicy){
        var rpDetails = {};

        if(returnPolicy != null && returnPolicy != ''){
            var lookupFieldsRs = search.lookupFields({
                type: REC_RET_POLICY,
                id: returnPolicy,
                columns: [FLD_RP_IN_MONTHS, FLD_RP_OUT_MONTHS, FLD_RP_RX_C35_HANDICAP_DAYS, FLD_RP_C2_HANDICAP_DAYS, FLD_RP_DOES_NOT_ALLOW_RETURN, FLD_RP_ALLOWS_PARTIAL, FLD_RP_ALLOWS_OTC, FLD_RP_ACCEPTED_PARTIAL_CONTAINER, FLD_RP_ACCEPTED_FULL_CONTAINER, FLD_RP_MINQTY_EACH, FLD_RP_MINQTY_GRAMS, FLD_RP_MINQTY_ML]
            });
            
            var acceptedPartial = [];
            for(var i = 0; i < lookupFieldsRs[FLD_RP_ACCEPTED_PARTIAL_CONTAINER].length; i++){
                acceptedPartial.push(lookupFieldsRs[FLD_RP_ACCEPTED_PARTIAL_CONTAINER][i].value);
            }

            var acceptedFull = [];
            for(var i = 0; i < lookupFieldsRs[FLD_RP_ACCEPTED_FULL_CONTAINER].length; i++){
                acceptedFull.push(lookupFieldsRs[FLD_RP_ACCEPTED_FULL_CONTAINER][i].value);
            }
            
            rpDetails = {
                'inmonths' : lookupFieldsRs[FLD_RP_IN_MONTHS] != ''? lookupFieldsRs[FLD_RP_IN_MONTHS]  : 0,
                'outmonths' : lookupFieldsRs[FLD_RP_OUT_MONTHS] != ''? lookupFieldsRs[FLD_RP_OUT_MONTHS] : 0,
                'c2days' : lookupFieldsRs[FLD_RP_C2_HANDICAP_DAYS] != ''? lookupFieldsRs[FLD_RP_C2_HANDICAP_DAYS]: 0,
                'rxc35days' : lookupFieldsRs[FLD_RP_RX_C35_HANDICAP_DAYS] != ''? lookupFieldsRs[FLD_RP_RX_C35_HANDICAP_DAYS] : 0,
                'notallowreturn': lookupFieldsRs[FLD_RP_DOES_NOT_ALLOW_RETURN],
                'minqtyeach': lookupFieldsRs[FLD_RP_MINQTY_EACH] != ''? lookupFieldsRs[FLD_RP_MINQTY_EACH] : 0,
                'minqtygrams': lookupFieldsRs[FLD_RP_MINQTY_GRAMS] != ''? lookupFieldsRs[FLD_RP_MINQTY_GRAMS] : 0,
                'minqtyml': lookupFieldsRs[FLD_RP_MINQTY_ML] != ''? lookupFieldsRs[FLD_RP_MINQTY_ML] : 0,
                'allowspartial': lookupFieldsRs[FLD_RP_ALLOWS_PARTIAL],
                'allowsotc': lookupFieldsRs[FLD_RP_ALLOWS_OTC],
                'acceptedpartialcontainer': acceptedPartial,//lookupFieldsRs[FLD_RP_ACCEPTED_PARTIAL_CONTAINER],
                'acceptedfullcontainer': acceptedFull//lookupFieldsRs[FLD_RP_ACCEPTED_FULL_CONTAINER]
            };
        }
        
        return rpDetails;
    }
	function getPharmaProcessing(expirationDate, returnPolicyDays, controlType,sysDate){
        var pharmaProcessing;
        var sysDate = new Date(sysDate);
      log.debug('sysDate initial',sysDate)
        //sysDate.setHours(0, 0, 0, 0);
        sysDate.setDate(sysDate.getDate() + 1 - 1)
        //sysDate = new Date(sysDate.getFullYear(), sysDate.getMonth(), sysDate.getDate());
        var handicapDays;
        if(controlType == IT_CT_C2){
            handicapDays = returnPolicyDays.c2days;
        }else{
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

        if(sysDate >= pharmaReturnableStart && sysDate <= pharmaReturnableEnd){	
            log.debug('TEST', 'sysdate is within pharmaReturnablePeriod');
            var handicapStart = new Date(pharmaReturnableEnd.getFullYear(), pharmaReturnableEnd.getMonth(), pharmaReturnableEnd.getDate());
            //handicapStart.setDate(handicapStart.getDate() - parseInt(handicapDays));
            handicapStart.setDate(handicapStart.getDate() + 1);
            var handicapEnd = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
            handicapEnd.setMonth(expirationDate.getMonth() + parseInt(returnPolicyDays.outmonths) - 1);
            handicapEnd = new Date(handicapEnd.getFullYear(), handicapEnd.getMonth() + 1, 0);
            log.debug('TEST', 'handicap start ' + handicapStart);
            log.debug('TEST', 'handicap end ' + handicapEnd);

            if(sysDate >= handicapStart && sysDate <= handicapEnd){
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
            }else{
                pharmaProcessing = PROCESSING_RETURNABLE
            }
        }else{
            log.debug('TEST', 'sysdate is NOT within pharmaReturnablePeriod');
            if(sysDate < pharmaReturnableStart){
                pharmaProcessing = PROCESSING_RETURNABLE
            }else if(sysDate > pharmaReturnableEnd){
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
            }
        }

        return pharmaProcessing;
    }
    function getMfgProcessing(expirationDate, returnPolicyDays,sysDate){
        var mfgProcessing;
        var sysDate = new Date(sysDate);
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
        
        if(sysDate >= mfgReturnableStart && sysDate <= mfgReturnableEnd){
            mfgProcessing = PROCESSING_RETURNABLE;
        }else{
            if(sysDate < mfgReturnableStart){
                mfgProcessing = PROCESSING_RETURNABLE;
                isInDate = true;
            }else if(sysDate > mfgReturnableEnd){
                mfgProcessing = PROCESSING_NON_RETURNABLE;
            }
        }

        return {processing: mfgProcessing, isindate: isInDate, indate: mfgReturnableStart};
    }
     
  return {
    //'fieldChanged':   fieldChanged,
   // 'lineInit':       lineInit,
   // 'pageInit':       pageInit,
   // 'postSourcing':   postSourcing,
   'saveRecord':    saveRecord,// saveRecord,
  // 'sublistChanged': sublistChanged,
  //  'validateDelete': validateDelete,
  //  'validateField':  validateField,
  //  'validateInsert': validateInsert,
  //  'validateLine':   validateLine
  };

});