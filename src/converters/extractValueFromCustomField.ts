import { isArray } from 'util';
import { TextContent } from '../jira';
import parseContent, { parseNumber } from '../jira/parseContent';

export const UNABLE_TO_PARSE_RESPONSE = '7e6e239c-b4ac-11eb-8529-0242ac130003';

/**
 * There are several different custom field types Jira allows.
 * Each one stores information in a different way. This makes sure
 * we extract the most relevant data for each type.
 *
 * https://developer.atlassian.com/server/jira/platform/jira-rest-api-examples/#setting-custom-field-data-for-other-field-types
 */
export function extractValueFromCustomField(value: any): any {
  /**
   * Handles:
   *   DatePickerFields
   *   DateTimeFields
   *   FreeTextFields
   *   NumberFields
   *   TextFields
   *   URLFields
   */
  if (['string', 'number'].includes(typeof value)) {
    return value;
  } else if (typeof value === 'object') {
    /**
     * I'm unsure what this handles as this case is not in the Jiras docs,
     * but I'm too scared to pull it out.
     */
    if (value.type === 'doc' && value.content) {
      return parseContent(value.content as TextContent[]);
    } else if (value.value) {
      /**
       * Handles:
       *   CascadingSelectFields (minus the child values)
       *   RadioButtons
       *   SelectLists
       */
      return typeof value.value === 'object'
        ? JSON.stringify(value.value)
        : parseNumber(value.value);
    } else if (value.name || value.id || value.key) {
      /**
       * Unsuppoted Custom Fields:
       *   ProjectPickers
       *   SingleVersionPickers
       *   UserPickers
       *   VersionPickers
       */
      if (value.name) {
        return value.name;
      }
      if (value.id) {
        return value.id;
      }
      if (value.key) {
        return value.key;
      }
    } else if (isArray(value)) {
      /**
       * Handles:
       *   Multi Group Picker
       *   Multi Select
       *   Multi User Picker
       */
      return value.map(extractValueFromCustomField).join(',');
    } else {
      return UNABLE_TO_PARSE_RESPONSE;
    }
  } else {
    return UNABLE_TO_PARSE_RESPONSE;
  }
}
