// Sincronizza docs/stack-e-risorse.md con una pagina Notion esistente:
// cancella i blocchi attuali della pagina e li ricrea dal Markdown.
// Uso: node scripts/notion-sync-docs.mjs <page_id>
import { Client } from "@notionhq/client";
import { readFileSync } from "fs";

const TOKEN = process.env.NOTION_TOKEN;
const PAGE_ID = process.argv[2];
if (!TOKEN) throw new Error("Manca NOTION_TOKEN nell'ambiente.");
if (!PAGE_ID) throw new Error("Uso: node notion-sync-docs.mjs <page_id>");

const notion = new Client({ auth: TOKEN });

// --- Parsing inline: **bold**, `code` ---
function parseInline(text) {
  const rich = [];
  const re = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) rich.push({ type: "text", text: { content: text.slice(last, m.index) } });
    if (m[2] !== undefined) {
      rich.push({ type: "text", text: { content: m[2] }, annotations: { bold: true } });
    } else if (m[3] !== undefined) {
      rich.push({ type: "text", text: { content: m[3] }, annotations: { code: true } });
    }
    last = re.lastIndex;
  }
  if (last < text.length) rich.push({ type: "text", text: { content: text.slice(last) } });
  return rich.length ? rich : [{ type: "text", text: { content: "" } }];
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

function isTableSeparator(line) {
  return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line.trim());
}

function md(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { i++; continue; }
    if (line.trim() === "---") { blocks.push({ object: "block", type: "divider", divider: {} }); i++; continue; }

    if (line.startsWith("> ")) {
      blocks.push({ object: "block", type: "quote", quote: { rich_text: parseInline(line.slice(2)) } });
      i++; continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ object: "block", type: "heading_3", heading_3: { rich_text: parseInline(line.slice(4)) } });
      i++; continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ object: "block", type: "heading_2", heading_2: { rich_text: parseInline(line.slice(3)) } });
      i++; continue;
    }
    if (line.startsWith("# ")) {
      blocks.push({ object: "block", type: "heading_1", heading_1: { rich_text: parseInline(line.slice(2)) } });
      i++; continue;
    }

    // Blockquote di più righe stile ">" per note ⚠️ trattato riga per riga (già gestito sopra)

    if (/^-\s+/.test(line)) {
      blocks.push({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: parseInline(line.replace(/^-\s+/, "")) } });
      i++; continue;
    }

    // Tabella: riga con | ... | seguita da riga separatore |---|---|
    if (line.trim().startsWith("|") && lines[i + 1] && isTableSeparator(lines[i + 1])) {
      const header = parseTableRow(line);
      const rows = [header];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      const width = header.length;
      blocks.push({
        object: "block",
        type: "table",
        table: {
          table_width: width,
          has_column_header: true,
          has_row_header: false,
          children: rows.map((r) => ({
            object: "block",
            type: "table_row",
            table_row: { cells: r.map((c) => parseInline(c)) },
          })),
        },
      });
      continue;
    }

    // Paragrafo normale
    blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: parseInline(line) } });
    i++;
  }

  return blocks;
}

async function clearPage(pageId) {
  let cursor;
  do {
    const res = await notion.blocks.children.list({ block_id: pageId, start_cursor: cursor });
    for (const block of res.results) {
      await notion.blocks.delete({ block_id: block.id });
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
}

async function appendInChunks(pageId, blocks) {
  // L'API Notion accetta max 100 blocchi per chiamata.
  for (let i = 0; i < blocks.length; i += 100) {
    await notion.blocks.children.append({ block_id: pageId, children: blocks.slice(i, i + 100) });
  }
}

const content = readFileSync(new URL("../docs/stack-e-risorse.md", import.meta.url), "utf-8");
const blocks = md(content);

console.log(`Pulizia pagina ${PAGE_ID}...`);
await clearPage(PAGE_ID);
console.log(`Scrittura di ${blocks.length} blocchi...`);
await appendInChunks(PAGE_ID, blocks);
console.log("Fatto.");
