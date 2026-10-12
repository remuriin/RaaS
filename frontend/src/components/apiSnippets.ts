import type { CodeLanguage } from './ui/CodeBlock'

export type Language = 'curl' | 'JavaScript' | 'Python' | 'Java' | 'PHP'
export const LANGUAGES: Language[] = ['curl', 'JavaScript', 'Python', 'Java', 'PHP']
export const SYNTAX: Record<Language, CodeLanguage> = {
  curl: 'shell',
  JavaScript: 'javascript',
  Python: 'python',
  Java: 'java',
  PHP: 'php',
}

// The same three things are said in every language: what the key line is, what the content type is for,
// and how to turn markdown answers on and off. In curl they sit above the command, because a comment
// between its lines would cut the command in two.

/** How to ask a question, in each language. */
export function askSnippet(language: Language, url: string): string {
  switch (language) {
    case 'curl':
      return `# Authorization: your API key, read here from the API_KEY variable.
# Keep the key on your server.
# Content-Type: says the body is JSON.
# "markdown": true asks for a markdown answer.
# Leave it out, or send false, for plain text (the default).
curl -X POST "${url}/query" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"question":"How long do refunds take?","markdown":true}'`

    case 'JavaScript':
      return `const res = await fetch("${url}/query", {
  method: "POST",
  headers: {
    // your API key, read here from the API_KEY variable.
    // Keep the key on your server.
    Authorization: \`Bearer \${process.env.API_KEY}\`,
    // says the body is JSON
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    question: "How long do refunds take?",
    // true asks for a markdown answer.
    // Leave it out, or send false, for plain text (the default).
    markdown: true,
  }),
});

const { answer, sources, answered } = await res.json();`

    case 'Python':
      return `import os
import requests

res = requests.post(
    "${url}/query",
    # your API key, read here from the API_KEY variable.
    # Keep the key on your server.
    # requests adds the Content-Type header itself when the body is given as json=.
    headers={"Authorization": f"Bearer {os.environ['API_KEY']}"},
    json={
        "question": "How long do refunds take?",
        # True asks for a markdown answer.
        # Leave it out, or send False, for plain text (the default).
        "markdown": True,
    },
)

print(res.json()["answer"])`

    case 'Java':
      return `// Java 11 or newer. This goes inside a method that can throw an exception.
// import java.net.URI;
// import java.net.http.*;

// "markdown": true asks for a markdown answer.
// Leave it out, or send false, for plain text (the default).
String body = "{\\"question\\":\\"How long do refunds take?\\",\\"markdown\\":true}";

HttpRequest request = HttpRequest.newBuilder(URI.create("${url}/query"))
    // your API key, read here from the API_KEY variable.
    // Keep the key on your server.
    .header("Authorization", "Bearer " + System.getenv("API_KEY"))
    // says the body is JSON
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(body))
    .build();

HttpResponse<String> response = HttpClient.newHttpClient()
    .send(request, HttpResponse.BodyHandlers.ofString());

System.out.println(response.body());`

    case 'PHP':
      return `<?php
$ch = curl_init("${url}/query");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        // your API key, read here from the API_KEY variable.
        // Keep the key on your server.
        "Authorization: Bearer " . getenv("API_KEY"),
        // says the body is JSON
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "question" => "How long do refunds take?",
        // true asks for a markdown answer.
        // Leave it out, or send false, for plain text (the default).
        "markdown" => true,
    ]),
]);
$reply = json_decode(curl_exec($ch), true);

echo $reply["answer"];`
  }
}

/** How to add a file, in each language. A PDF, because it is the case people get wrong: the body is the file's bytes. */
export function uploadSnippet(language: Language, url: string): string {
  switch (language) {
    case 'curl':
      return `# Content-Type has to match the file's ending:
#   .pdf application/pdf   .md text/markdown   .txt text/plain
#   .html text/html   .xml application/xml
# --data-binary sends the file itself, not a form and not JSON.
curl -X POST "${url}/documents/handbook.pdf" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/pdf" \\
  --data-binary @handbook.pdf`

    case 'JavaScript':
      return `import { readFile } from "node:fs/promises";

const res = await fetch("${url}/documents/handbook.pdf", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.API_KEY}\`,
    // has to match the file's ending:
    // .pdf application/pdf   .md text/markdown   .txt text/plain
    // .html text/html   .xml application/xml
    "Content-Type": "application/pdf",
  },
  // the body is the file itself, not a form and not JSON
  body: await readFile("handbook.pdf"),
});

const { source, chunks } = await res.json();`

    case 'Python':
      return `import os
import requests

with open("handbook.pdf", "rb") as file:
    res = requests.post(
        "${url}/documents/handbook.pdf",
        headers={
            "Authorization": f"Bearer {os.environ['API_KEY']}",
            # has to match the file's ending:
            # .pdf application/pdf   .md text/markdown   .txt text/plain
            # .html text/html   .xml application/xml
            "Content-Type": "application/pdf",
        },
        # the body is the file itself, not a form and not JSON
        data=file,
    )

print(res.json())`

    case 'Java':
      return `// Java 11 or newer. This goes inside a method that can throw an exception.
// import java.net.URI;
// import java.net.http.*;
// import java.nio.file.Path;

HttpRequest request = HttpRequest.newBuilder(URI.create("${url}/documents/handbook.pdf"))
    .header("Authorization", "Bearer " + System.getenv("API_KEY"))
    // has to match the file's ending:
    // .pdf application/pdf   .md text/markdown   .txt text/plain
    // .html text/html   .xml application/xml
    .header("Content-Type", "application/pdf")
    // the body is the file itself, not a form and not JSON
    .POST(HttpRequest.BodyPublishers.ofFile(Path.of("handbook.pdf")))
    .build();

HttpResponse<String> response = HttpClient.newHttpClient()
    .send(request, HttpResponse.BodyHandlers.ofString());

System.out.println(response.body());`

    case 'PHP':
      return `<?php
$ch = curl_init("${url}/documents/handbook.pdf");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer " . getenv("API_KEY"),
        // has to match the file's ending:
        // .pdf application/pdf   .md text/markdown   .txt text/plain
        // .html text/html   .xml application/xml
        "Content-Type: application/pdf",
    ],
    // the body is the file itself, not a form and not JSON
    CURLOPT_POSTFIELDS => file_get_contents("handbook.pdf"),
]);
$reply = json_decode(curl_exec($ch), true);

echo $reply["source"];`
  }
}
