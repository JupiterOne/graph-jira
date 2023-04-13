import { extractValueFromCustomField } from './extractValueFromCustomField';

describe('extractValueFromCustomField', () => {
  // All custom Jira field types
  // https://developer.atlassian.com/server/jira/platform/jira-rest-api-examples/#setting-custom-field-data-for-other-field-types
  const CascadingSelectField = { value: 'green', child: { value: 'blue' } };
  const DatePickerField = '2011-10-03';
  const DateTimeField = '2011-10-19T10:29:29.908+1100';
  const FreeTextField = 'Free text goes here.  Type away!';
  const GroupPicker = { name: 'jira-developers' };
  const MultiGroupPicker = [
    { name: 'admins' },
    { name: 'jira-developers' },
    { name: 'jira-users' },
  ];
  const MultiSelect = [{ value: 'red' }, { value: 'blue' }, { value: 'green' }];
  const MultiUserPicker = [
    { name: 'charlie' },
    { name: 'bjones' },
    { name: 'tdurden' },
  ];
  const NumberField = 42.07;
  const ProjectPicker = { key: 'JRADEV' };
  const RadioButtons = { value: 'red' };
  const SelectList = { value: 'red' };
  const SingleVersionPicker = { name: '5.0' };
  const TextField = 'Is anything better than text?';
  const URLField = 'http://www.atlassian.com';
  const UserPicker = { name: 'brollins' };
  const VersionPicker = [{ name: '1.0' }, { name: '1.1.1' }, { name: '2.0' }];

  it('should extact the value of a CascadingSelectField correctly', () => {
    const value = extractValueFromCustomField(CascadingSelectField);
    expect(value).toEqual('green');
  });
  it('should extact the value of a DatePickerField correctly', () => {
    const value = extractValueFromCustomField(DatePickerField);
    expect(value).toEqual('2011-10-03');
  });
  it('should extact the value of a DateTimeField correctly', () => {
    const value = extractValueFromCustomField(DateTimeField);
    expect(value).toEqual('2011-10-19T10:29:29.908+1100');
  });
  it('should extact the value of a FreeTextField correctly', () => {
    const value = extractValueFromCustomField(FreeTextField);
    expect(value).toEqual('Free text goes here.  Type away!');
  });
  it('should extact the value of a GroupPicker correctly', () => {
    const value = extractValueFromCustomField(GroupPicker);
    expect(value).toEqual('jira-developers');
  });
  it('should extact the value of a MultiGroupPicker correctly', () => {
    const value = extractValueFromCustomField(MultiGroupPicker);
    expect(value).toEqual(['admins', 'jira-developers', 'jira-users']);
  });
  it('should extact the value of a MultiSelect correctly', () => {
    const value = extractValueFromCustomField(MultiSelect);
    expect(value).toEqual(['red', 'blue', 'green']);
  });
  it('should extact the value of a MultiUserPicker correctly', () => {
    const value = extractValueFromCustomField(MultiUserPicker);
    expect(value).toEqual(['charlie', 'bjones', 'tdurden']);
  });
  it('should extact the value of a NumberField correctly', () => {
    const value = extractValueFromCustomField(NumberField);
    expect(value).toEqual(42.07);
  });
  it('should extact the value of a ProjectPicker correctly', () => {
    const value = extractValueFromCustomField(ProjectPicker);
    expect(value).toEqual('JRADEV');
  });
  it('should extact the value of a RadioButtons correctly', () => {
    const value = extractValueFromCustomField(RadioButtons);
    expect(value).toEqual('red');
  });
  it('should extact the value of a SelectList correctly', () => {
    const value = extractValueFromCustomField(SelectList);
    expect(value).toEqual('red');
  });
  it('should extact the value of a SingleVersionPicker correctly', () => {
    const value = extractValueFromCustomField(SingleVersionPicker);
    expect(value).toEqual('5.0');
  });
  it('should extact the value of a TextField correctly', () => {
    const value = extractValueFromCustomField(TextField);
    expect(value).toEqual('Is anything better than text?');
  });
  it('should extact the value of a URLField correctly', () => {
    const value = extractValueFromCustomField(URLField);
    expect(value).toEqual('http://www.atlassian.com');
  });
  it('should extact the value of a UserPicker correctly', () => {
    const value = extractValueFromCustomField(UserPicker);
    expect(value).toEqual('brollins');
  });
  it('should extact the value of a VersionPicker correctly', () => {
    const value = extractValueFromCustomField(VersionPicker);
    expect(value).toEqual(['1.0', '1.1.1', '2.0']);
  });
});
