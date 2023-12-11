/* eslint-disable no-undef */
/* eslint-disable import/no-amd */
/**
 * Custom Automization Rule - Return Policy
 *
 * agrajo
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(
  ['N/record', 'N/search', 'N/log', '../agSharedLib/rxrs_shared_functions'],

  (record, search, log, sharedFuncUtil) => {
    // Processing Request List > https://6816904.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=385
    const processingRequestList = {
      nonReturnable: 1,
      returnable: 2,
      inDated: 3,
    };

    // Damage Codes List > https://6816904.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=389
    const damageCodesList = {
      illegibleLot: '1',
      containsPatientLabel: '2',
      packagesMissingDamaged: '3',
    };

    // Prescription/OTC List > https://6816904.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=425
    const prescriptionOtcList = {
      prescription: '1',
      otc: '2',
    };

    // Full Partial List List  > https://6816904.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=384
    const fullPartialList = {
      fullPkg: '1',
      partialPkg: '2',
    };

    const stateRuleIncludedFromPartial = ['MS', 'GA', 'NC'];
    const planSelectTypePharmaQuickCash = '4';

    const validateSystemDateProcess = (expirationDate, pharmaValue, mfgValue) => {
      const logTitle = 'validateSystemDateProcess';
      const returnObj = {
        finalPharmaValue: pharmaValue,
        finalMfgValue: mfgValue,
        inDateCb: false,
        overrideExpirationDate: false,
        dates: {},
      };
      const inDays = 3;
      const outDays = 6;
      const handicapDays = 10;
      // const expirationDate = new Date("05/01/2023");

      // Compute returnableStartDate by subtracting 3 months
      const returnableStartDate = new Date(expirationDate);
      returnableStartDate.setMonth(expirationDate.getMonth() - inDays);

      // Compute returnableEndDate correctly
      const returnableEndDate = new Date(expirationDate);
      returnableEndDate.setMonth(returnableEndDate.getMonth() + outDays);
      returnableEndDate.setDate(returnableEndDate.getDate() - handicapDays);

      // Compute handicapStartDate
      const handicapStartDate = new Date(returnableEndDate);
      handicapStartDate.setDate(returnableEndDate.getDate() - handicapDays);

      // Compute handicapEndDate
      const handicapEndDate = new Date(expirationDate);
      handicapEndDate.setMonth(expirationDate.getMonth() + outDays);

      /* Compute systemDate (current date) - Format current date to display
         only date, month, and year */
      const systemDate = new Date();

      // Display the computed dates (optional)

      log.debug({
        title: 'Returnable Start Date:',
        details: JSON.stringify(returnableStartDate),
      });
      log.debug({
        title: 'Returnable End Date:',
        details: JSON.stringify(returnableEndDate),
      });
      log.debug({
        title: 'Handicap Start Date:',
        details: JSON.stringify(handicapStartDate),
      });
      log.debug({
        title: 'Handicap End Date:',
        details: JSON.stringify(handicapEndDate),
      });
      log.debug({
        title: 'System Date:',
        details: JSON.stringify(systemDate),
      });

      returnObj.dates = {
        returnableStartDate,
        returnableEndDate,
        handicapStartDate,
        handicapEndDate,
      };

      // Actual Comparison Logic

      // System Date within Returnable Period?
      if (systemDate >= returnableStartDate && systemDate <= returnableEndDate) {
        log.debug({
          title: logTitle,
          details: 'System Date within Returnable Period',
        });
        returnObj.finalMfgValue = processingRequestList.returnable;
        // System Date within Handicap Days?
        if (systemDate >= handicapStartDate && systemDate <= handicapEndDate) {
          returnObj.finalPharmaValue = processingRequestList.nonReturnable;
        } else {
          returnObj.finalPharmaValue = processingRequestList.returnable;
        }
      // System Date Before Start of Returnable Period? or After End Of Returnable Period?
      } else if (systemDate < returnableStartDate) {
        log.debug({
          title: logTitle,
          details: 'Before Start of Returnable Period',
        });
        returnObj.finalPharmaValue = processingRequestList.returnable;
        returnObj.finalMfgValue = processingRequestList.returnable;
        returnObj.inDateCb = true;
        returnObj.overrideExpirationDate = true;
      // After End of Returnable Period
      } else {
        log.debug({
          title: logTitle,
          details: 'After End Of Returnable Period',
        });
        returnObj.finalPharmaValue = processingRequestList.nonReturnable;
        returnObj.finalMfgValue = processingRequestList.nonReturnable;
      }

      log.debug({
        title: logTitle,
        details: returnObj,
      });

      return returnObj;
    };

    const getState = (entityRecord) => {
      let state = '';
      const addressSublist = entityRecord.getSublist({
        sublistId: 'addressbook',
      });

      log.debug({
        title: 'addressSublist verify -  getState',
        details: JSON.stringify(addressSublist),
      });

      // Check if the customer has at least one address
      const addressCount = entityRecord.getLineCount({
        sublistId: 'addressbook',
      });
      if (addressCount > 0) {
        // Get the state value

        entityRecord.selectLine({
          sublistId: 'addressbook',
          line: 0,
        });
        // Set an option field on the sublist line
        state = entityRecord.getCurrentSublistValue({
          sublistId: 'addressbook',
          fieldId: 'state',
        });

        log.debug({
          title: 'State',
          details: state,
        });

        // You can use the 'state' variable as needed in your script
      } else {
        log.debug({
          title: 'No Addresses Found',
          details: 'The customer does not have any addresses.',
        });
      }

      return state;
    };

    const beforeSubmit = (scriptContext) => {
      const logTitle = 'ReturnPolicy-Automation';
      const currentRecord = scriptContext.newRecord;

      let finalPharmaProcessingValue = '';
      let finalMfgProcessingValue = '';
      let scanInDate = false;
      let overrideExpDate = false;
      let datesObj = {};
      let verifyEntityQuickCash = false;

      const itemId = currentRecord.getValue({
        fieldId: 'custrecord_cs_return_req_scan_item',
      });
      const entityId = currentRecord.getValue({
        fieldId: 'custrecord_scanentity',
      });
      const returnPolicyValue = currentRecord.getValue({
        fieldId: 'custrecord_cs_return_policy',
      });
      const damagedItemBool = currentRecord.getValue({
        fieldId: 'custrecord_cs_damageditem',
      });
      const damageType = currentRecord.getValue({
        fieldId: 'custrecord_cs_damagecode',
      });
      const fullPartialListValue = currentRecord.getValue({
        fieldId: 'custrecord_cs_full_partial_package',
      });
      const quantity = currentRecord.getValue({
        fieldId: 'custrecord_cs_qty',
      });
      const packageSize = currentRecord.getValue({
        fieldId: 'custrecord_cs_package_size',
      });
      const expirationDate = currentRecord.getValue({
        fieldId: 'custrecord_cs_expiration_date',
      });
      const overridePhrm = currentRecord.getValue({
        fieldId: 'custrecord_cs_cb_orverride_phrm',
      });
      const currentPhrmValue = currentRecord.getValue({
        fieldId: 'custrecord_cs__rqstprocesing',
      });

      log.debug({
        title: `Before Return Policy Checking ${returnPolicyValue}`,
        details: sharedFuncUtil.isNotEmpty(returnPolicyValue),
      });

      // Set Return Policy
      if (sharedFuncUtil.isNotEmpty(returnPolicyValue)) {
        const loadReturnPolicy = record.load({
          type: 'customrecord_kod_returnpolicy_cr',
          id: returnPolicyValue,
        });
        const notAllowReturnBool = loadReturnPolicy.getValue({
          fieldId: 'custrecord_kd_notallowsrtrn',
        });
        const allowsPartialBool = loadReturnPolicy.getValue({
          fieldId: 'custrecord_kd_partialallowed',
        });
        // MFG Allow Returns
        if (sharedFuncUtil.isFalse(notAllowReturnBool)) {
          log.debug({
            title: 'Verify Entity ID',
            details: entityId,
          });

          const loadEntityRec = record.load({
            type: search.Type.CUSTOMER,
            id: entityId,
            isDynamic: true,
          });
          const planSelectionType = loadEntityRec.getValue({
            fieldId: 'custentity_planselectiontype',
          });

          // Check Address Exists
          const entityState = getState(loadEntityRec);

          const loadItemRecord = search.lookupFields({
            type: search.Type.ITEM,
            id: itemId,
            columns: ['custitem_kod_returnable', 'custitem_kd_prescription_otc'],
          });

          log.debug({
            title: logTitle,
            details: `Verify for Quick Cash EID ${planSelectionType} - \n default ${planSelectTypePharmaQuickCash}`,
          });

          // Check Entity Plan Selection Type
          if (planSelectionType === planSelectTypePharmaQuickCash) {
            log.debug({
              title: logTitle,
              details: 'Plan Selection Type for Entity is Quick Cash',
            });
            finalPharmaProcessingValue = processingRequestList.nonReturnable;
            verifyEntityQuickCash = true;
          }

          // Check Item Returnable
          if (sharedFuncUtil.isTrue(loadItemRecord.custitem_kod_returnable)) {
            // Check if Damaged Item
            if (sharedFuncUtil.isTrue(damagedItemBool)) {
              if (damageType === damageCodesList.illegibleLot) {
                log.debug({
                  title: logTitle,
                  details: 'Damage Type is Illegible Lot',
                });
                finalPharmaProcessingValue = processingRequestList.nonReturnable;
                finalMfgProcessingValue = processingRequestList.returnable;

              // (damageType === damageCodesList.containsPatientLabel)
              } else {
                log.debug({
                  title: logTitle,
                  details: 'Damage Type Contains Patient Label',
                });
                finalPharmaProcessingValue = processingRequestList.nonReturnable;
                finalMfgProcessingValue = processingRequestList.nonReturnable;
              }
            } else {
              const isOtcAllowed = loadReturnPolicy.getValue({
                fieldId: 'custrecord_kod_otcallowed',
              });
              const isStateIncluded = stateRuleIncludedFromPartial.includes(entityState);
              log.debug({
                title: logTitle,
                details: {
                  title: 'Per Logic Validation',
                  logic1Name: `${loadItemRecord.custitem_kd_prescription_otc[0].value}
                  === ${prescriptionOtcList.otc}
                  && sharedFuncUtil.isFalse(${isOtcAllowed})`,
                  logic1: loadItemRecord.custitem_kd_prescription_otc === prescriptionOtcList.otc
                  && sharedFuncUtil.isFalse(isOtcAllowed),
                  logic2Name: `${fullPartialListValue} === ${fullPartialList.fullPkg}
                  && ${allowsPartialBool} === true`,
                  logic2: fullPartialListValue === fullPartialList.fullPkg
                  && sharedFuncUtil.isTrue(allowsPartialBool),
                  logic3Name: `(${fullPartialListValue} === ${fullPartialList.partialPkg}
                    && ${allowsPartialBool} === true) && !(quantity >= packageSize)`,
                  logic3: (fullPartialListValue === fullPartialList.partialPkg
                    && allowsPartialBool === true) && !(quantity >= packageSize),
                  logic4Name: `(fullPartialListValue === fullPartialList.partialPkg
                    && allowsPartialBool === false)
                    && (!isStateIncluded || !(quantity >= packageSize))`,
                  logic4: (fullPartialListValue === fullPartialList.partialPkg
                    && allowsPartialBool === false)
                    && (!isStateIncluded || !(quantity >= packageSize)),
                },
              });
              // Proceed on checking Product = OTC / or Prescription
              if (loadItemRecord.custitem_kd_prescription_otc[0].value === prescriptionOtcList.otc
                && sharedFuncUtil.isFalse(isOtcAllowed)) {
                log.debug({
                  title: logTitle,
                  details: 'Prescription is OTC and OTC is Not Allowed',
                });
                finalPharmaProcessingValue = processingRequestList.nonReturnable;
                finalMfgProcessingValue = processingRequestList.nonReturnable;
                // Item is Full or Partial
              } else if (fullPartialListValue === fullPartialList.fullPkg
                && sharedFuncUtil.isTrue(allowsPartialBool)) {
                // Set Mfg Processing = Non-Returnable
                log.debug({
                  title: logTitle,
                  details: 'Package is Full and Allow Partial is True',
                });
                finalPharmaProcessingValue = processingRequestList.nonReturnable;
                finalMfgProcessingValue = processingRequestList.nonReturnable;
              } else if ((fullPartialListValue === fullPartialList.partialPkg
                && sharedFuncUtil.isTrue(allowsPartialBool)) && !(quantity >= packageSize)) {
                log.debug({
                  title: logTitle,
                  details: `Package is Partial and Allow Partial is True and 
                  Quantity is not greater or equal then Package Size`,
                });
                finalPharmaProcessingValue = processingRequestList.nonReturnable;
                finalMfgProcessingValue = processingRequestList.nonReturnable;
              } else if ((fullPartialListValue === fullPartialList.partialPkg
                && sharedFuncUtil.isFalse(allowsPartialBool))
                && (!isStateIncluded || !(quantity >= packageSize))) {
                // Customer State = MS or GA, or NC
                // Mississippi MS
                // GA - Georgia
                // NC - North Carolina

                log.debug({
                  title: logTitle,
                  details: `Package is Partial and Allow Partial is False and 
                  Quantity is not greater or equal then Package Size or Not Included in
                  the state selection.`,
                });
                finalPharmaProcessingValue = processingRequestList.nonReturnable;
                finalMfgProcessingValue = processingRequestList.nonReturnable;
              } else {
                log.debug({
                  title: logTitle,
                  details: 'Reached all is returnable',
                });

                finalPharmaProcessingValue = processingRequestList.returnable;
                finalMfgProcessingValue = processingRequestList.returnable;

                // System Date within Returnable Period Logic
                const getReturnObj = validateSystemDateProcess(
                  expirationDate,
                  finalPharmaProcessingValue,
                  finalMfgProcessingValue,
                );

                finalPharmaProcessingValue = getReturnObj.finalPharmaValue;
                finalMfgProcessingValue = getReturnObj.finalMfgValue;
                scanInDate = getReturnObj.inDateCb;
                overrideExpDate = getReturnObj.overrideExpirationDate;
                datesObj = getReturnObj.dates;
              }
            }
          } else {
            log.debug({
              title: logTitle,
              details: 'Item is NOT Returnable',
            });

            finalPharmaProcessingValue = processingRequestList.nonReturnable;
            finalMfgProcessingValue = processingRequestList.nonReturnable;
          }
        } else {
          log.debug({
            title: logTitle,
            details: 'Return Policy does not allow Return',
          });

          finalPharmaProcessingValue = processingRequestList.nonReturnable;
          finalMfgProcessingValue = processingRequestList.nonReturnable;
        }
      } else {
        log.debug({
          title: logTitle,
          details: 'There is no return Policy',
        });

        finalPharmaProcessingValue = processingRequestList.nonReturnable;
        finalMfgProcessingValue = processingRequestList.nonReturnable;
      }

      // Check if Entity is Quick Cash
      if (sharedFuncUtil.isTrue(verifyEntityQuickCash)) {
        finalPharmaProcessingValue = processingRequestList.nonReturnable;
      }

      // Override via Checkbox
      if (sharedFuncUtil.isTrue(overridePhrm)) {
        finalPharmaProcessingValue = currentPhrmValue;
      }

      // Set Field Values
      currentRecord.setValue({
        fieldId: 'custrecord_cs__rqstprocesing',
        value: finalPharmaProcessingValue,
      });
      currentRecord.setValue({
        fieldId: 'custrecord_cs__mfgprocessing',
        value: finalMfgProcessingValue,
      });
      currentRecord.setValue({
        fieldId: 'custrecord_scanindated',
        value: scanInDate,
      });

      if (sharedFuncUtil.isTrue(overrideExpDate)) {
        currentRecord.setValue({
          fieldId: 'custrecord_cs_expiration_date',
          value: datesObj.returnableStartDate,
        });
      }

      // Set Date Fields

      if (sharedFuncUtil.isTrue(scanInDate)) {
        currentRecord.setValue({
          fieldId: 'custrecord_cs_expiration_date',
          value: datesObj.returnableStartDate,
        });
      }

      log.debug({
        title: 'scanInDate and datesObj',
        details: `${scanInDate} --- ${datesObj}`,
      });

      if (sharedFuncUtil.isNotEmpty(datesObj)) {
        currentRecord.setValue({
          fieldId: 'custrecord_ret_start_date',
          value: datesObj.returnableStartDate,
        });
        currentRecord.setValue({
          fieldId: 'custrecord_ret_end_date',
          value: datesObj.returnableEndDate,
        });
        currentRecord.setValue({
          fieldId: 'custrecord_hand_start_date',
          value: datesObj.handicapStartDate,
        });
        currentRecord.setValue({
          fieldId: 'custrecord_hand_end_date',
          value: datesObj.handicapEndDate,
        });
      }
    };

    return { beforeSubmit };
  },
);
