import { TextContent } from "./";
import parseContent from "./parseContent";

test("parse paragraph contents", () => {
  const testContent: TextContent = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "When a user is added to the organization...",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Mitigating controls should be put in place...",
          },
        ],
      },
    ],
  };

  const text = parseContent(testContent.content!);
  expect(text).toEqual(
    `When a user is added to the organization...

Mitigating controls should be put in place...`,
  );
});

test("parse code block contents", () => {
  const testContent: TextContent = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Example CLI Code:",
          },
        ],
      },
      {
        type: "codeBlock",
        attrs: {
          language: "bash",
        },
        content: [
          {
            type: "text",
            text: "j1 -o delete --alert -a j1dev -f ./alerts.json\r\nDone!",
          },
        ],
      },
    ],
  };

  const text = parseContent(testContent.content!);
  expect(text).toEqual(
    `Example CLI Code:

\`\`\`bash
j1 -o delete --alert -a j1dev -f ./alerts.json\r\nDone!
\`\`\``,
  );
});

test("parse url contents", () => {
  const testContent: TextContent = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "The summary will contain the following items:",
          },
          {
            type: "hardBreak",
          },
          {
            type: "text",
            text: "• summary.csv (see ",
          },
          {
            type: "inlineCard",
            attrs: {
              url: "https://domain.atlassian.net/browse/KEY-1234#icft=KEY-1234",
            },
          },
          {
            type: "text",
            text: ")",
          },
          {
            type: "hardBreak",
          },
          {
            type: "text",
            text: "• policies.csv",
          },
        ],
      },
    ],
  };

  const text = parseContent(testContent.content!);
  expect(text).toEqual(
    `The summary will contain the following items:
• summary.csv (see [KEY-1234](https://domain.atlassian.net/browse/KEY-1234#icft=KEY-1234))
• policies.csv`,
  );
});

test("parse complex contents", () => {
  const testContent: TextContent = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Issue",
            marks: [
              {
                type: "strong",
              },
            ],
          },
          {
            type: "text",
            text: ": At 5pm on Monday Sept 9th 2019, ",
          },
          {
            type: "mention",
            attrs: {
              id: "123456789",
              text: "Joe Smith",
            },
          },
          {
            type: "text",
            text: " discovered an issue. ",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Determination",
            marks: [
              {
                type: "strong",
              },
            ],
          },
          {
            type: "text",
            text: ": This issue was due to a misconfiguration.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Resolution",
            marks: [
              {
                type: "strong",
              },
            ],
          },
          {
            type: "text",
            text: ": The team changed the access control policy in ",
          },
          {
            type: "text",
            text: "code",
            marks: [
              {
                type: "code",
              },
            ],
          },
          {
            type: "text",
            text: ".",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Length of Exposure",
            marks: [
              {
                type: "strong",
              },
            ],
          },
          {
            type: "text",
            text: ": This issue has been present for a day.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Forensic Analysis",
            marks: [
              {
                type: "strong",
              },
            ],
          },
          {
            type: "text",
            text: ": No breach.",
          },
        ],
      },
    ],
  };
  const text = parseContent(testContent.content!);
  expect(text).toEqual(
    `**Issue**: At 5pm on Monday Sept 9th 2019, @Joe Smith discovered an issue. 

**Determination**: This issue was due to a misconfiguration.

**Resolution**: The team changed the access control policy in \`code\`.

**Length of Exposure**: This issue has been present for a day.

**Forensic Analysis**: No breach.`,
  );
});

test("parse content with panels and lists", () => {
  const testContent: TextContent = {
    type: "doc",
    content: [
      {
        type: "panel",
        attrs: {
          panelType: "info",
        },
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Summary",
                marks: [
                  {
                    type: "strong",
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "emoji",
                attrs: {
                  shortName: ":check_mark:",
                  id: "atlassian-check_mark",
                  text: ":check_mark:",
                },
              },
              {
                type: "text",
                text:
                  " This request should be approved because the correct processes were followed",
              },
            ],
          },
        ],
      },
      {
        type: "panel",
        attrs: {
          panelType: "info",
        },
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Code changes review",
                marks: [
                  {
                    type: "strong",
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "The previous approval (",
              },
              {
                type: "inlineCard",
                attrs: {
                  url:
                    "https://test.atlassian.net/browse/PRODCM-12345#icft=PRODCM-12345",
                },
              },
              {
                type: "text",
                text: ") was for build jupiter-integration-jira/master:65.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "In jupiterone/jupiter-integration-jira:",
              },
            ],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "emoji",
                        attrs: {
                          shortName: ":check_mark:",
                          id: "atlassian-check_mark",
                          text: ":check_mark:",
                        },
                      },
                      {
                        type: "text",
                        text: " Merged in custom-fields (",
                      },
                      {
                        type: "text",
                        text: "pull request #71",
                        marks: [
                          {
                            type: "link",
                            attrs: {
                              href:
                                "https://bitbucket.org/jupiterone/jupiter-integration-jira/pull-requests/71",
                            },
                          },
                        ],
                      },
                      {
                        type: "text",
                        text: ")",
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "emoji",
                        attrs: {
                          shortName: ":check_mark:",
                          id: "atlassian-check_mark",
                          text: ":check_mark:",
                        },
                      },
                      {
                        type: "text",
                        text: " upgrade to v1.6.4",
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "emoji",
                        attrs: {
                          shortName: ":check_mark:",
                          id: "atlassian-check_mark",
                          text: ":check_mark:",
                        },
                      },
                      {
                        type: "text",
                        text: " upgrade to 1.6.3",
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "emoji",
                        attrs: {
                          shortName: ":check_mark:",
                          id: "atlassian-check_mark",
                          text: ":check_mark:",
                        },
                      },
                      {
                        type: "text",
                        text: " v1.6.1",
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "emoji",
                        attrs: {
                          shortName: ":check_mark:",
                          id: "atlassian-check_mark",
                          text: ":check_mark:",
                        },
                      },
                      {
                        type: "text",
                        text: " upgrade to v1.6.0",
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "emoji",
                        attrs: {
                          shortName: ":check_mark:",
                          id: "atlassian-check_mark",
                          text: ":check_mark:",
                        },
                      },
                      {
                        type: "text",
                        text: " update description",
                      },
                    ],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "emoji",
                        attrs: {
                          shortName: ":check_mark:",
                          id: "atlassian-check_mark",
                          text: ":check_mark:",
                        },
                      },
                      {
                        type: "text",
                        text: " Add customFields to integration definition",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "panel",
        attrs: {
          panelType: "info",
        },
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Security process review",
                marks: [
                  {
                    type: "strong",
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "emoji",
                attrs: {
                  shortName: ":check_mark:",
                  id: "atlassian-check_mark",
                  text: ":check_mark:",
                },
              },
              {
                type: "text",
                text: " Snyk scan was detected and found no problems",
              },
            ],
          },
        ],
      },
    ],
  };

  const text = parseContent(testContent.content!);
  expect(text).toEqual(
    `**Summary**

:check_mark: This request should be approved because the correct processes were followed

---

**Code changes review**

The previous approval ([PRODCM-12345](https://test.atlassian.net/browse/PRODCM-12345#icft=PRODCM-12345)) was for build jupiter-integration-jira/master:65.

In jupiterone/jupiter-integration-jira:

- :check_mark: Merged in custom-fields (pull request #71)

- :check_mark: upgrade to v1.6.4

- :check_mark: upgrade to 1.6.3

- :check_mark: v1.6.1

- :check_mark: upgrade to v1.6.0

- :check_mark: update description

- :check_mark: Add customFields to integration definition

---

**Security process review**

:check_mark: Snyk scan was detected and found no problems

---`,
  );
});
