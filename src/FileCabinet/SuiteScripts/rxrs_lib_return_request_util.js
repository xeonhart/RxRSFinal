/**
 * @NApiVersion 2.1
 */
define(['N/email', 'N/file', 'N/runtime', 'N/search'],
    /**
 * @param{email} email
 * @param{file} file
 * @param{runtime} runtime
 * @param{search} search
 */
    (email, file, runtime, search) => {
        function createReturnRequest(masterRecId, customer, category, docFile, item, requestedDate, isLicenseExpired, isStateLicenseExpired) {
            var rrRec = record.create({
                type: 'customsale_kod_returnrequest',
                isDynamic: false
            });
            if (category == 3 && isLicenseExpired == false && isStateLicenseExpired == false) {
                log.audit('Category is 2')
                rrRec.setValue({
                    fieldId: 'transtatus',
                    value: 'J'
                })

            }else {
                rrRec.setValue({
                    fieldId: 'transtatus',
                    value: 'A'
                })

            }
            rrRec.setValue({
                fieldId: 'entity',
                value: customer
            })


            rrRec.setValue({
                fieldId: 'custbody_kd_master_return_id',
                value: masterRecId

            })
            rrRec.setValue({
                fieldId: 'custbody_kd_rr_category',
                value: category
            })
            rrRec.setValue({
                fieldId: 'location',
                value: 1
            });
            rrRec.setValue({
                fieldId: 'custbody_kd_file',
                value: docFile
            })
            rrRec.setValue({
                fieldId: 'custbody_kd_requested_pick_up_date',
                value: requestedDate
            })

            rrRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: 0,
                value: item

            })
            rrRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                line: 0,
                value: 1

            })
            rrRec.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_kod_fullpartial',
                line: 0,
                value: 1

            })
            var Id = rrRec.save({ignoreMandatoryFields: true})
            if (Id) {

                var rrRec = record.load({
                    type: 'customsale_kod_returnrequest',
                    id: Id
                });
                if(category == 3 ){
                    var extId = rrRec.getValue('tranid')
                    createTask(extId,rrRec.id)
                    if( rrRec.getValue('custbody_kd_state_license_expired') === false && rrRec.getValue('custbody_kd_license_expired')) {
                        sendEmail(3, rrRec.getValue('entity'), rrRec.getValue('transtatus'), rrRec.getValue('tranid'))
                    }
                }
                log.debug('RR ID ' + Id)
                var cat = rrRec.getValue({
                    fieldId: 'custbody_kd_rr_category'
                })
                var requestedDate = rrRec.getValue({
                    fieldId: 'custbody_kd_requested_pick_up_date'
                })

                var customer = rrRec.getValue({
                    fieldId: 'entity'
                })
                var isC2;
                if (cat == 3) {
                    isC2 = true
                }
                sendEmail(0, customer ,rrRec.getValue('transtatus'),rrRec.getValue('tranid'))
                log.debug('requested date' + requestedDate + 'customer ' + customer + 'category ' + category)
                log.debug('TEST', 'numOfLabels ' + numOfLabels);
                if (numOfLabels) {
                    log.debug('nummberofLabels ' + numOfLabels)
                    for (var i = 0; i < numOfLabels; i++) {
                        createReturnPackages(Id, masterRecId, requestedDate, cat, customer, isC2)
                    }
                }


            }
        }


        return {

        }

    });
