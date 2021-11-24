import { buildProjectConfigs } from './builders';

describe('buildProjectConfigs', () => {
  const correctOutputSingle = [{ key: 'string1' }];
  const correctOutputDouble = [{ key: 'string1' }, { key: 'string2' }];

  it('project configs from array', () => {
    const input = ['string1', 'string2'];
    const value = buildProjectConfigs(input);
    expect(value).toEqual(correctOutputDouble);
  });

  it('project configs from array with blank extras', () => {
    const input = ['string1', 'string2', '', '   '];
    const value = buildProjectConfigs(input);
    expect(value).toEqual(correctOutputDouble);
  });

  it('project configs from string', () => {
    const input = 'string1';
    const value = buildProjectConfigs(input);
    expect(value).toEqual(correctOutputSingle);
  });

  it('project configs from stringified array', () => {
    const input = '[ "string1", "string2" ]';
    const value = buildProjectConfigs(input);
    expect(value).toEqual(correctOutputDouble);
  });

  it('project configs from stringified array and blank extras', () => {
    const input = '[ "string1", "string2", "", "    " ]';
    const value = buildProjectConfigs(input);
    expect(value).toEqual(correctOutputDouble);
  });
});
