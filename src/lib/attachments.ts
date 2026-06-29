import type { Attachment } from "@/types/attachment";

export function getExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

export function getLanguage(extension: string): string {
  const languages: Record<string, string> = {
    c: "C",
    cpp: "C++",
    h: "C Header",
    java: "Java",
    js: "JavaScript",
    ts: "TypeScript",
    tsx: "React TypeScript",
    jsx: "React JavaScript",
    py: "Python",
    php: "PHP",
    html: "HTML",
    css: "CSS",
    sql: "SQL",
    json: "JSON",
    md: "Markdown",
    xml: "XML",
    yaml: "YAML",
    yml: "YAML",
    dockerfile: "Docker",
  };

  return languages[extension] || "Unknown";
}

export function isCodeFile(extension: string): boolean {
  return [
    "c",
    "cpp",
    "h",
    "java",
    "js",
    "jsx",
    "ts",
    "tsx",
    "py",
    "php",
    "html",
    "css",
    "sql",
  ].includes(extension);
}

export function isPdf(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf");
}

export function isImage(fileName: string): boolean {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(fileName);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function enrichAttachment(
  attachment: Attachment
) {
  const extension = getExtension(attachment.name);

  return {
    ...attachment,
    extension,
    language: getLanguage(extension),
    isCode: isCodeFile(extension),
    isPdf: isPdf(attachment.name),
    isImage: isImage(attachment.name),
    formattedSize: formatFileSize(
      attachment.size
    ),
  };
}