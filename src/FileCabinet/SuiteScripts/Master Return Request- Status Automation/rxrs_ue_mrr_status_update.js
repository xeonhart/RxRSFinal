/* eslint-disable no-undef */
/* eslint-disable import/no-amd */
/**
 * Correlated WF: KD | Master Return WF
 * Description: Update correlated Master Return Request to In
 * Progress upon validation and initial Approval
 *
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(
  ['N/search', 'N/record'],
  /**
 * @param{serverWidget} serverWidget
 */
  (search, record) => {
    const mrrStatus = {
      CustomerSubmitted: '1',
      New: '11',
      WaitingForApproval: '8',
      Approved: '10',
      PriceLocked: '12',
      Archived: '13',
      InProgress: '14',
    };
    const retReqStatus = {
      PendingReview: 'A',
      Rejected: 'B',
      Authorized: 'C',
      PendingPackageReceipt: 'D',
      ReceivedPendingProcessing: 'E',
      Processing: 'F',
      PendingApproval: 'G',
      Rejected_Resubmission: 'H',
      Approved: 'I',
      C2Kittobemailed: 'J',
      PendingVerification: 'K',
    };
    const approvedSearchString = 'statusI';

    const validateRetRequestForWaitingApprSearch = (masterRetId, alreadyInProgress) => {
      const logTitle = 'validateRetRequestForWaitingApprSearch';
      let updateMrrToLockPrice = true;

      const transactionSearchObj = search.create({
        type: search.Type.TRANSACTION,
        filters:
                [
                  ['custbody_kd_master_return_id', 'anyof', masterRetId],
                  'AND',
                  ['type', 'anyof', 'CuTrPrch106'],
                  'AND',
                  ['mainline', 'is', 'T'],
                ],
        columns:
                [
                  search.createColumn({ name: 'tranid', label: 'Document Number' }),
                  search.createColumn({ name: 'statusref', label: 'Status' }),
                ],
      });

      const searchResultCount = transactionSearchObj.runPaged().count;
      if (searchResultCount === 1 || alreadyInProgress === true) {
        transactionSearchObj.run().each((result) => {
          const documentStatus = result.getValue('statusref');
          log.debug({
            title: logTitle,
            details: `${JSON.stringify(documentStatus)} !== ${JSON.stringify(approvedSearchString)}`,
          });

          if (documentStatus !== approvedSearchString) {
            updateMrrToLockPrice = false;
            return false;
          }
          return true;
        });

        if (updateMrrToLockPrice) {
          record.submitFields({
            type: 'customrecord_kod_masterreturn',
            id: masterRetId,
            values: {
              custrecord_kod_mr_status: mrrStatus.WaitingForApproval,
            },
          });
        }
      }
    };

    const afterSubmit = (scriptContext) => {
      const logTitle = 'rxrs_ue_mrr_status_update';
      const { oldRecord } = scriptContext;
      const { newRecord } = scriptContext;
      if (scriptContext.type === 'edit') {
        try {
          const retReqCurrStatus = newRecord.getValue({
            fieldId: 'transtatus',
          });
          const oldRecordStatus = oldRecord.getValue({
            fieldId: 'transtatus',
          });
          log.debug({
            title: 'Statuses Comparison',
            details: `${retReqCurrStatus} - ${oldRecordStatus} `,
          });
          if (retReqCurrStatus === retReqStatus.Approved
            && (oldRecordStatus !== retReqCurrStatus)) {
            const masterRetId = newRecord.getValue({
              fieldId: 'custbody_kd_master_return_id',
            });
            const mrStatusSearch = search.lookupFields({
              type: 'customrecord_kod_masterreturn',
              id: masterRetId,
              columns: 'custrecord_kod_mr_status',
            }).custrecord_kod_mr_status[0].value;
            log.debug({
              title: 'mrStatusSearch',
              details: `Result > ${mrStatusSearch} `,
            });

            if (mrStatusSearch === mrrStatus.CustomerSubmitted) {
              log.debug({
                title: logTitle,
                details: 'Check Cust Submitted Logic',
              });
              record.submitFields({
                type: 'customrecord_kod_masterreturn',
                id: masterRetId,
                values: {
                  custrecord_kod_mr_status: mrrStatus.InProgress,
                },
              });
              validateRetRequestForWaitingApprSearch(masterRetId, false);
            // Logic for Setting to Waiting for Approval
            } else if (mrStatusSearch === mrrStatus.InProgress) {
              log.debug({
                title: logTitle,
                details: 'Check InProgress Logic',
              });
              validateRetRequestForWaitingApprSearch(masterRetId, true);
            }
          }
        } catch (error) {
          log.debug({
            title: logTitle,
            details: error.message,
          });
        }
      }
    };

    return { afterSubmit };
  },
);
