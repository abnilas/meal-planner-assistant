import type { ReactNode } from "react";

export function cleanMarkdown(text?: string): string {
    if (!text) return "";

    return text
        .replace(/\r\n/g, "\n")
        .replace(/\\([*_`#-])/g, "$1")
        .replace(/\s+\|\s+(?=\|)/g, " |\n")
        .replace(/[ \t]+\n/g, "\n")
        .trim();
}

function parseInline(text: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        const token = match[0];
        const content = token.slice(2, -2);

        if (token.startsWith("`")) {
            nodes.push(
                <code
                    key={`${match.index}-code`}
                    className="rounded bg-purple-50 px-1 py-0.5 text-[0.9em] text-purple-900"
                >
                    {token.slice(1, -1)}
                </code>
            );
        } else {
            nodes.push(
                <strong key={`${match.index}-strong`} className="font-bold text-slate-950">
                    {content}
                </strong>
            );
        }

        lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}

function isBlockStart(line: string) {
    return (
        /^#{1,4}\s+/.test(line) ||
        /^-{3,}$/.test(line.trim()) ||
        isTableRow(line) ||
        /^\s*[-*•]\s+/.test(line) ||
        /^\s*\d+[.)]\s+/.test(line)
    );
}

function isTableRow(line: string) {
    const trimmed = line.trim();
    return trimmed.startsWith("|") && trimmed.endsWith("|");
}

function parseTableRow(line: string) {
    return line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim());
}

function isDividerRow(cells: string[]) {
    return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function formatTableBullet(headers: string[], row: string[]) {
    return row
        .map((cell, cellIndex) => {
            if (!cell) return "";

            const header = headers[cellIndex];
            return header ? `${header}: ${cell}` : cell;
        })
        .filter(Boolean)
        .join(" • ");
}

function renderTableAsBullets(rows: string[][], key: string) {
    const hasDivider = rows.length > 1 && isDividerRow(rows[1]);
    const headers = hasDivider ? rows[0] : [];
    const bodyRows = hasDivider ? rows.slice(2) : rows;
    const items = bodyRows
        .filter((row) => !isDividerRow(row))
        .map((row) => formatTableBullet(headers, row))
        .filter(Boolean);

    return (
        <ul key={key} className="my-2 list-disc space-y-1 pl-5">
            {items.map((item, itemIndex) => (
                <li key={`${key}-item-${itemIndex}`} className="pl-1 leading-relaxed">
                    {parseInline(item)}
                </li>
            ))}
        </ul>
    );
}

export function parseMarkdown(text?: string): ReactNode {
    const lines = cleanMarkdown(text).split("\n");
    const blocks: ReactNode[] = [];
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];
        const trimmed = line.trim();

        if (!trimmed) {
            index += 1;
            continue;
        }

        const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
        if (heading) {
            const level = heading[1].length;
            const className =
                level <= 2
                    ? "mt-3 first:mt-0 text-base font-bold text-slate-950"
                    : "mt-3 first:mt-0 text-sm font-bold uppercase text-purple-900";

            blocks.push(
                <p key={`heading-${index}`} className={className}>
                    {parseInline(heading[2])}
                </p>
            );
            index += 1;
            continue;
        }

        if (/^-{3,}$/.test(trimmed)) {
            blocks.push(
                <div key={`rule-${index}`} className="my-3 border-t border-purple-100" />
            );
            index += 1;
            continue;
        }

        if (isTableRow(line)) {
            const rows: string[][] = [];

            while (index < lines.length && isTableRow(lines[index])) {
                rows.push(parseTableRow(lines[index]));
                index += 1;
            }

            blocks.push(renderTableAsBullets(rows, `table-${index}`));
            continue;
        }

        if (/^\s*[-*•]\s+/.test(line)) {
            const items: ReactNode[] = [];

            while (index < lines.length && /^\s*[-*•]\s+/.test(lines[index])) {
                const item = lines[index].replace(/^\s*[-*•]\s+/, "");
                items.push(
                    <li key={`ul-item-${index}`} className="pl-1">
                        {parseInline(item)}
                    </li>
                );
                index += 1;
            }

            blocks.push(
                <ul key={`ul-${index}`} className="my-2 list-disc space-y-1 pl-5">
                    {items}
                </ul>
            );
            continue;
        }

        if (/^\s*\d+[.)]\s+/.test(line)) {
            const items: ReactNode[] = [];

            while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
                const item = lines[index].replace(/^\s*\d+[.)]\s+/, "");
                items.push(
                    <li key={`ol-item-${index}`} className="pl-1">
                        {parseInline(item)}
                    </li>
                );
                index += 1;
            }

            blocks.push(
                <ol key={`ol-${index}`} className="my-2 list-decimal space-y-1 pl-5">
                    {items}
                </ol>
            );
            continue;
        }

        const paragraph: string[] = [];
        while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
            paragraph.push(lines[index].trim());
            index += 1;
        }

        blocks.push(
            <p key={`p-${index}`} className="my-2 first:mt-0 last:mb-0 leading-relaxed">
                {parseInline(paragraph.join(" "))}
            </p>
        );
    }

    return <div className="space-y-1">{blocks}</div>;
}
