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
            text: ": The team changed the access control policy.",
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
    `Issue: At 5pm on Monday Sept 9th 2019, @Joe Smith discovered an issue. 

Determination: This issue was due to a misconfiguration.

Resolution: The team changed the access control policy.

Length of Exposure: This issue has been present for a day.

Forensic Analysis: No breach.`,
  );
});
