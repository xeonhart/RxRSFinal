/**
 * Description:
 * Shared Function Utility File
 * @author agrajo
 * @copyright 2023
 *
 */
// eslint-disable-next-line no-undef, import/no-amd
define(
  [],
  () => {
    const sharedFuncUtil = {};

    sharedFuncUtil.isNotEmpty = (value) => {
      if (value === null || value === undefined) {
        return false;
      }

      if (Array.isArray(value) || typeof value === 'string' || typeof value === 'object') {
        return Object.keys(value).length !== 0;
      }

      // For other types, you might want to customize the check based on your specific needs.
      return true;
    };

    sharedFuncUtil.isEmpty = (value) => !sharedFuncUtil.isNotEmpty(value);

    sharedFuncUtil.isTrue = (value) => value === true;

    sharedFuncUtil.isFalse = (value) => value === false;

    return sharedFuncUtil;
  },
);
