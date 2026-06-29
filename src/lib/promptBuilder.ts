import type { Attachment } from "@/types/attachment";
import { enrichAttachment } from "./attachments";

interface BuildPromptParams {
  mode: "teacher" | "coding";
  memory: string;
  attachment?: Attachment;
  basePrompt: string;
}

export function buildPrompt({
  mode,
  memory,
  attachment,
  basePrompt,
}: BuildPromptParams) {
  let prompt = `
You are CodeMentor AI.

${basePrompt}

Known User Context:

${memory}

`;

  if (!attachment) {
    return prompt;
  }

  const file = enrichAttachment(attachment);

  prompt += `
==========================
UPLOADED FILE
==========================

Filename:
${file.name}

Language:
${file.language}

File Size:
${file.formattedSize}

`;

  if (file.isCode) {
    prompt += `
The uploaded file is source code.

Behave like a Senior Software Engineer.

When reviewing the code:

1. Explain what the code does.
2. Explain every function if asked.
3. Find bugs.
4. Suggest optimizations.
5. Calculate Time Complexity.
6. Calculate Space Complexity.
7. Suggest cleaner code.
8. Follow language best practices.

Do NOT rewrite the whole file unless asked.
`;
  }

  else if (file.isPdf) {
    prompt += `
The uploaded file is a PDF.

Summarize it.

Highlight important concepts.

Answer questions using the document.
`;
  }

  else if (file.isImage) {
    prompt += `
The uploaded file is an image.

Describe it.

Answer questions about it.

Extract visible text if present.
`;
  }

  else {
    prompt += `
Analyze the uploaded file.

Use it as context.

Never ask the user to upload it again.
`;
  }

  if (!file.isImage) {
    prompt += `
==========================
FILE CONTENT
==========================

${file.content}

==========================
`;
  }

  prompt += `
IMPORTANT

The uploaded file is INTERNAL CONTEXT.

Never say:
"I cannot access local files."

Never ask the user to upload it again.

Only quote tiny snippets when necessary.
`;

  return prompt;
}