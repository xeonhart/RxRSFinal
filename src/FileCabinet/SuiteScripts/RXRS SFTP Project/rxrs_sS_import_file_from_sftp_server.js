/* eslint-disable no-undef */
/* eslint-disable import/no-amd */
/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(
  ['N/record', 'N/sftp', 'N/runtime', 'N/file', 'N/encode', 'N/search'],
  /**
 * @param{record} record
 */
  (record, sftp, runtime, file, encode, search) => {
    const CUSTRECSFTPDIRECTORYID = 'customrecord_rxrs_sftp_directory_file_dl';

    const exportSearchResult = (searchId) => {
      const returnArr = [];
      const exportSearch = search.load({
        id: searchId,
        type: CUSTRECSFTPDIRECTORYID,
      });

      const searchResultCount = exportSearch.runPaged().count;
      if (searchResultCount > 0) {
        exportSearch.run().each((result) => {
          const fileName = result.getValue({
            name: 'custrecord_dir_sftp_file_name',
          });

          const directory = result.getValue({
            name: 'custrecord_dir_sftp_directory',
          });

          const saveDirectory = result.getValue({
            name: 'custrecord_dir_sftp_fc_save_directory',
          });

          returnArr.push({
            fileName,
            directory,
            saveDirectory,
          });
          return true;
        });
      }
      return returnArr;
    };

    const execute = () => {
      const logTitle = 'SchedScriptSFTP';
      try {
        // const oldTime = Date.now();
        // let newTime;
        const scriptObj = runtime.getCurrentScript();

        const sftpKeyRecId = scriptObj.getParameter({
          name: 'custscript_rxrs_main_sftp_key',
        });
        const sftpFileListSearch = scriptObj.getParameter({
          name: 'custscript_rxrs_sftp_imp_file_search',
        });

        const sftpKeyRec = record.load({
          type: 'customrecord_rxrs_sftp_access_credential',
          id: sftpKeyRecId,
        });
        const sftpUser = sftpKeyRec.getValue({
          fieldId: 'custrecord_rxrs_sftp_user',
        });
        const sftpGuidPw = sftpKeyRec.getValue({
          fieldId: 'custrecord_rxrs_sftp_guid_pw',
        });
        const sftpUrl = sftpKeyRec.getValue({
          fieldId: 'custrecord_rxrs_sftp_url',
        });
        const sftpHostKey = sftpKeyRec.getValue({
          fieldId: 'custrecord_rxrs_sftp_host_key',
        });
        const sftpHostKeyType = sftpKeyRec.getValue({
          fieldId: 'custrecord_rxrs_sftp_host_key_type',
        });
        const sftpPortId = sftpKeyRec.getValue({
          fieldId: 'custrecord_rxrs_sftp_port_id',
        });
        const arrToDownload = exportSearchResult(sftpFileListSearch);

        if (runtime.envType === runtime.EnvType.PRODUCTION) {
          const buildConnObj = {
            username: sftpUser,
            passwordGuid: sftpGuidPw,
            url: sftpUrl,
            hostKey: sftpHostKey,
            hostKeyType: sftpHostKeyType,
            port: sftpPortId,
          };
          log.debug({
            title: 'Attempt Connection',
            details: buildConnObj,
          });
          const connection = sftp.createConnection({
            username: sftpUser,
            passwordGuid: sftpGuidPw,
            url: sftpUrl,
            hostKey: sftpHostKey,
            hostKeyType: sftpHostKeyType,
            port: sftpPortId,
          });
          log.debug({ title: 'connection', details: connection });
          for (let i = 0; i < arrToDownload.length; i += 1) {
            try {
              const downloadedFile = connection.download({
                directory: arrToDownload[i].directory,
                filename: arrToDownload[i].fileName,
              });
              log.debug({ title: 'downloadedFile', details: downloadedFile });
              log.debug({ title: 'fileContent', details: downloadedFile.getContents() });
              const reencodedDlString = encode.convert({
                string: downloadedFile.getContents(),
                inputEncoding: encode.Encoding.BASE_64,
                outputEncoding: encode.Encoding.UTF_8,
              });
              log.debug({ title: 'reencodedDlString', details: reencodedDlString });

              const recFile = file.create({
                name: arrToDownload[i].fileName,
                fileType: file.Type.PLAINTEXT,
                contents: reencodedDlString,
              });
              recFile.folder = arrToDownload[i].saveDirectory;
              const recFileId = recFile.save();
              log.audit({
                title: logTitle,
                details: `recFileId SAVED: ${recFileId}`,
              });
            } catch (error) {
              log.error({
                title: 'ERROR IN DOWNLOAD',
                details: error,
              });
            }
          }
        } else {
          log.audit('Non-production environment', 'Skipping execution');
        }
      } catch (e) {
        log.error({ title: 'error', details: e });
      }
    };

    return { execute };
  },
);
