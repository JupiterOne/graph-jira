import { TextContent } from ".";

export default function parseContent(
  content: TextContent[] | undefined,
): string {
  return content ? content.map(c => parseContentBlock(c)).join("\n\n") : "";
}

function parseContentBlock(content: TextContent): string {
  switch (content.type) {
    case "codeBlock": {
      if (content.content) {
        const code = content.content.map(c => c.text).join("\n");
        const lang = content.attrs ? content.attrs.language : "";
        return `\`\`\`${lang}\n${code}\n\`\`\``;
      }
    }
    case "text": {
      return content.text || "";
    }
    case "mention": {
      return content.attrs ? `@${content.attrs.text}` : "";
    }
    case "paragraph": {
      return content.content
        ? content.content.map(c => parseContentBlock(c)).join("")
        : "";
    }
    default: {
      return content.text || "";
    }
  }
}
