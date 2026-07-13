import type { LanguageFn } from 'highlight.js';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import markdown from 'highlight.js/lib/languages/markdown';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { createLowlight } from 'lowlight';

/** 单个代码块语言定义（外部可注入 grammar） */
export interface CodeBlockLanguageDefinition {
  /** 存入 codeBlock.attrs.language 的规范 id */
  id: string;
  /** highlight.js grammar，由调用方 import；库内默认预设也会提供 */
  grammar?: LanguageFn;
  /** 简写/别名，如 js、ts、html */
  aliases?: string[];
  /** 下拉显示名称 */
  label?: string;
  /** 是否启用语法高亮，默认在提供 grammar 时为 true */
  highlight?: boolean;
}

/** 解析后的语言配置 */
export interface ResolvedCodeBlockLanguage {
  id: string;
  label: string;
  aliases: string[];
  highlight: boolean;
}

export interface CodeBlockLanguageConfig {
  languages: ResolvedCodeBlockLanguage[];
  lowlight: ReturnType<typeof createLowlight>;
  aliasToId: ReadonlyMap<string, string>;
  defaultLanguageId: string;
}

export type CodeBlockLanguageInput =
  | string
  | CodeBlockLanguageDefinition;

const BUILTIN_LANGUAGE_PRESETS: Record<
  string,
  Pick<CodeBlockLanguageDefinition, 'id' | 'aliases' | 'label'>
> = {
  js: { id: 'javascript', aliases: ['js'], label: 'JavaScript' },
  javascript: { id: 'javascript', aliases: ['js'], label: 'JavaScript' },
  ts: { id: 'typescript', aliases: ['ts'], label: 'TypeScript' },
  typescript: { id: 'typescript', aliases: ['ts'], label: 'TypeScript' },
  html: { id: 'xml', aliases: ['html'], label: 'HTML' },
  xml: { id: 'xml', aliases: ['html'], label: 'HTML' },
  css: { id: 'css', label: 'CSS' },
  md: { id: 'markdown', aliases: ['md'], label: 'Markdown' },
  markdown: { id: 'markdown', aliases: ['md'], label: 'Markdown' },
};

/** 未传配置时的默认语言（js / ts / html / css / markdown） */
export const DEFAULT_CODE_BLOCK_LANGUAGES: CodeBlockLanguageDefinition[] = [
  {
    id: 'javascript',
    grammar: javascript,
    aliases: ['js'],
    label: 'JavaScript',
  },
  {
    id: 'typescript',
    grammar: typescript,
    aliases: ['ts'],
    label: 'TypeScript',
  },
  {
    id: 'xml',
    grammar: xml,
    aliases: ['html'],
    label: 'HTML',
  },
  {
    id: 'css',
    grammar: css,
    label: 'CSS',
  },
  {
    id: 'markdown',
    grammar: markdown,
    aliases: ['md'],
    label: 'Markdown',
  },
];

const FALLBACK_LABELS: Record<string, string> = {
  text: 'Plain Text',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  xml: 'HTML',
  css: 'CSS',
  markdown: 'Markdown',
};

function formatFallbackLabel(id: string): string {
  return (
    FALLBACK_LABELS[id] ??
    id.charAt(0).toUpperCase() + id.slice(1)
  );
}

function mergeWithDefaultPreset(
  definition: CodeBlockLanguageDefinition,
): CodeBlockLanguageDefinition {
  const defaultDefinition = DEFAULT_CODE_BLOCK_LANGUAGES.find(
    (item) => item.id === definition.id,
  );

  if (!defaultDefinition) {
    return definition;
  }

  return {
    ...defaultDefinition,
    ...definition,
    grammar: definition.grammar ?? defaultDefinition.grammar,
    aliases: definition.aliases ?? defaultDefinition.aliases,
    label: definition.label ?? defaultDefinition.label,
  };
}

function normalizeDefinitionInput(
  input: CodeBlockLanguageInput,
): CodeBlockLanguageDefinition {
  if (typeof input === 'string') {
    const key = input.trim().toLowerCase();
    const preset = BUILTIN_LANGUAGE_PRESETS[key];
    if (preset) {
      return mergeWithDefaultPreset({ ...preset });
    }

    return mergeWithDefaultPreset({ id: key });
  }

  return mergeWithDefaultPreset({
    ...input,
    id: input.id.trim(),
    aliases: input.aliases?.map((alias) => alias.trim()).filter(Boolean),
  });
}

function resolveHighlight(
  definition: CodeBlockLanguageDefinition,
): boolean {
  if (definition.highlight === false) {
    return false;
  }

  return definition.grammar != null;
}

function resolveLabel(definition: CodeBlockLanguageDefinition): string {
  if (definition.label?.trim()) {
    return definition.label.trim();
  }

  const preset = BUILTIN_LANGUAGE_PRESETS[definition.id.toLowerCase()];
  if (preset?.label) {
    return preset.label;
  }

  return formatFallbackLabel(definition.id);
}

/**
 * 将外部配置解析为下拉列表、别名映射与 lowlight 实例。
 */
export function resolveCodeBlockLanguageConfig(
  input?: CodeBlockLanguageInput[] | null,
): CodeBlockLanguageConfig {
  const source = input?.length ? input : DEFAULT_CODE_BLOCK_LANGUAGES;
  const definitions = source.map(normalizeDefinitionInput);
  const languages: ResolvedCodeBlockLanguage[] = [];
  const aliasToId = new Map<string, string>();
  const grammars: Record<string, LanguageFn> = {};
  const aliasGroups: Record<string, string[]> = {};
  const seenIds = new Set<string>();

  for (const definition of definitions) {
    const id = definition.id;
    if (!id || id === 'text' || seenIds.has(id)) {
      continue;
    }

    seenIds.add(id);

    const aliases = new Set<string>();
    for (const alias of definition.aliases ?? []) {
      const normalizedAlias = alias.toLowerCase();
      if (normalizedAlias && normalizedAlias !== id) {
        aliases.add(normalizedAlias);
        aliasToId.set(normalizedAlias, id);
      }
    }

    const highlight = resolveHighlight(definition);
    if (highlight && definition.grammar) {
      grammars[id] = definition.grammar;
    }

    if (aliases.size > 0) {
      aliasGroups[id] = [...aliases];
    }

    aliasToId.set(id, id);

    languages.push({
      id,
      label: resolveLabel(definition),
      aliases: [...aliases],
      highlight,
    });
  }

  const lowlight = createLowlight(
    Object.keys(grammars).length > 0 ? grammars : undefined,
  );

  for (const [id, aliases] of Object.entries(aliasGroups)) {
    if (aliases.length > 0) {
      lowlight.registerAlias({ [id]: aliases });
    }
  }

  return {
    languages,
    lowlight,
    aliasToId,
    defaultLanguageId: languages[0]?.id ?? 'javascript',
  };
}

/** 将别名或 id 规范化为存储用的语言 id */
export function resolveCodeBlockLanguageId(
  config: Pick<CodeBlockLanguageConfig, 'aliasToId'>,
  language: string | null | undefined,
): string {
  const normalized = language?.trim().toLowerCase() || 'text';
  if (normalized === 'text') {
    return 'text';
  }

  return config.aliasToId.get(normalized) ?? normalized;
}

/** 查找已配置语言；未配置时返回 undefined */
export function findResolvedCodeBlockLanguage(
  languages: ResolvedCodeBlockLanguage[],
  language: string | null | undefined,
): ResolvedCodeBlockLanguage | undefined {
  const id = language?.trim();
  if (!id) {
    return undefined;
  }

  return languages.find((item) => item.id === id);
}
