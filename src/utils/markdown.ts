import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import DOMPurify from "dompurify";

const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
  { gfm: true, breaks: true },
);

export function renderMarkdown(text: string): string {
  const html = marked.parse(text, { async: false }) as string;
  // On nettoie le HTML généré (le modèle est une source non fiable), puis on ajoute les boutons "Copier"
  return DOMPurify.sanitize(html).replaceAll(
    "<pre>",
    '<pre><button class="copy-btn" type="button">Copier</button>',
  );
}
