import { markdownToADF } from './markdownToADF';

const BASIC_MARKDOWN = `
# H1  
## H2  
### H3  

**BOLD**

*ITALICIZED*

> blockquote

1. First
2. Second
3. Third

- First
- Second
- Third

\`code\`

---

[linkTitle](https://imsdb.com/scripts/Star-Wars-Revenge-of-the-Sith.html)
`;

const CODE_BLOCK_MARKDOWN = `
\`\`\`json
{
  "firstName": "John",
  "lastName": "Smith",
  "age": 25
}
\`\`\`
`;

const EMOJI_MARKDOWN = `:joy:`;

const parseObject = (obj: any) => JSON.parse(JSON.stringify(obj));

describe('markdownToADF', () => {
  test('Converts text to ADF', () => {
    expect(parseObject(markdownToADF('hello world'))).toMatchObject(
      parseObject({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'hello world',
              },
            ],
          },
        ],
        version: 1,
      }),
    );
  });
  test('Converts basic markdown to ADF', () => {
    expect(parseObject(markdownToADF(BASIC_MARKDOWN))).toMatchObject(
      parseObject({
        type: 'doc',
        content: [
          {
            type: 'heading',
            content: [
              {
                type: 'text',
                text: 'H1  ',
              },
            ],
            attrs: {
              level: 1,
            },
          },
          {
            type: 'heading',
            content: [
              {
                type: 'text',
                text: 'H2  ',
              },
            ],
            attrs: {
              level: 2,
            },
          },
          {
            type: 'heading',
            content: [
              {
                type: 'text',
                text: 'H3  ',
              },
            ],
            attrs: {
              level: 3,
            },
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'BOLD',
                marks: [
                  {
                    type: 'strong',
                  },
                ],
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'ITALICIZED',
                marks: [
                  {
                    type: 'em',
                  },
                ],
              },
            ],
          },
          {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'blockquote',
                  },
                ],
              },
            ],
          },
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'First',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Second',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Third',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'First',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Second',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Third',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'code',
                marks: [
                  {
                    type: 'code',
                  },
                ],
              },
            ],
          },
          {
            type: 'rule',
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'linkTitle',
                marks: [
                  {
                    type: 'link',
                    attrs: {
                      href: 'https://imsdb.com/scripts/Star-Wars-Revenge-of-the-Sith.html',
                    },
                  },
                ],
              },
            ],
          },
        ],
        version: 1,
      }),
    );
  });
  test('Converts code block markdown to ADF', () => {
    expect(parseObject(markdownToADF(CODE_BLOCK_MARKDOWN))).toMatchObject(
      parseObject({
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            content: [
              {
                type: 'text',
                text: '{\n  "firstName": "John",\n  "lastName": "Smith",\n  "age": 25\n}',
              },
            ],
            attrs: {
              language: 'json',
            },
          },
        ],
        version: 1,
      }),
    );
  });
  test('Converts emoji markdown to ADF', () => {
    expect(parseObject(markdownToADF(EMOJI_MARKDOWN))).toMatchObject(
      parseObject({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'emoji',
                attrs: {
                  shortName: 'joy',
                },
              },
            ],
          },
        ],
        version: 1,
      }),
    );
  });
});
