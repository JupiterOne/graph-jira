import mdToADF from 'md-to-adf';

export const markdownToADF = (markdown = ''): any => {
  const adf = mdToADF(markdown);
  return adf;
};
