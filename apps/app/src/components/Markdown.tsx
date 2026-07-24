import React, { Fragment } from 'react';
import { Linking, Text, View } from 'react-native';
import { cn } from '@/lib/utils';

type InlineSegment =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string };

function parseInline(input: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let remaining = input;
  const pattern =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: remaining.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined) {
      segments.push({ type: 'bold', text: match[2] });
    } else if (match[4] !== undefined) {
      segments.push({ type: 'italic', text: match[4] });
    } else if (match[6] !== undefined) {
      segments.push({ type: 'code', text: match[6] });
    } else if (match[8] !== undefined) {
      segments.push({ type: 'link', text: match[8], href: match[9] });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < remaining.length) {
    segments.push({ type: 'text', text: remaining.slice(lastIndex) });
  }
  return segments;
}

function renderInline(segments: InlineSegment[], keyPrefix: string) {
  return segments.map((seg, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (seg.type) {
      case 'bold':
        return (
          <Text key={key} style={cn('font-bold text-foreground')}>
            {seg.text}
          </Text>
        );
      case 'italic':
        return (
          <Text key={key} style={cn('italic text-foreground')}>
            {seg.text}
          </Text>
        );
      case 'code':
        return (
          <Text
            key={key}
            style={cn('font-mono text-primary bg-primary/10 px-1 py-0.5 rounded-sm')}
          >
            {seg.text}
          </Text>
        );
      case 'link':
        return (
          <Text
            key={key}
            style={cn('text-primary font-semibold underline')}
            onPress={() => Linking.openURL(seg.href)}
          >
            {seg.text}
          </Text>
        );
      default:
        return (
          <Text key={key} style={cn('text-foreground')}>
            {seg.text}
          </Text>
        );
    }
  });
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] };

function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    const codeFence = line.match(/^```(.*)$/);
    if (codeFence) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        text: heading[2].trim(),
      });
      i++;
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      const quoteLines: string[] = [];
      while (i < lines.length && /(^>\s?)|(^\s*$)/.test(lines[i])) {
        const m = lines[i].match(/^>\s?(.*)$/);
        if (m) quoteLines.push(m[1]);
        i++;
      }
      blocks.push({ type: 'quote', text: quoteLines.join(' ') });
      continue;
    }

    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[2]);
      const items: string[] = [];
      while (i < lines.length) {
        const lm = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
        if (!lm) break;
        items.push(lm[3]);
        i++;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^(\s*)([-*+]|\d+\.)\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
  }

  return blocks;
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const blocks = parseMarkdown(content);

  return (
    <View style={cn('gap-2', className)}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            const sizes = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-base', 'text-sm'];
            const size = sizes[Math.min(block.level, 6) - 1];
            return (
              <Text
                key={idx}
                style={cn('font-sans font-bold text-foreground tracking-tight mt-1', size)}
              >
                {block.text}
              </Text>
            );
          }
          case 'code':
            return (
              <View
                key={idx}
                style={cn('bg-muted border border-border rounded-md px-3 py-2 my-1')}
              >
                <Text style={cn('font-mono text-foreground text-sm')}>{block.text}</Text>
              </View>
            );
          case 'quote':
            return (
              <View
                key={idx}
                style={cn(
                  'border-l-2 border-primary bg-accent/40 px-3 py-2 my-1 rounded-r-md'
                )}
              >
                <Text style={cn('font-sans italic text-muted-foreground text-sm')}>
                  {block.text}
                </Text>
              </View>
            );
          case 'list':
            return (
              <View key={idx} style={cn('gap-1.5 my-1')}>
                {block.items.map((item, li) => (
                  <View key={li} style={cn('flex-row gap-2')}>
                    <Text style={cn('text-primary font-sans font-bold w-4')}>
                      {block.ordered ? `${li + 1}.` : '•'}
                    </Text>
                    <View style={cn('flex-1')}>
                      <Text style={cn('font-sans text-foreground text-sm leading-5')}>
                        {renderInline(parseInline(item), `li-${idx}-${li}`)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          default:
            return (
              <Text key={idx} style={cn('font-sans text-foreground text-sm leading-5')}>
                <Fragment>
                  {renderInline(parseInline(block.text), `p-${idx}`)}
                </Fragment>
              </Text>
            );
        }
      })}
    </View>
  );
}
