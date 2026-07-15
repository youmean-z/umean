import { Node, mergeAttributes } from '@tiptap/core';

import { ZH_CN, type UmeanMessages } from '../i18n';

export const CALLOUT_TYPES = ['info', 'tip', 'warning', 'danger'] as const;
export type CalloutType = (typeof CALLOUT_TYPES)[number];

/** @deprecated 使用 `UmeanMessages`（通过 `locale` 配置）；保留导出以兼容旧代码 */
export const CALLOUT_TYPE_LABELS: Record<CalloutType, string> = {
  info: ZH_CN.calloutInfo,
  tip: ZH_CN.calloutTip,
  warning: ZH_CN.calloutWarning,
  danger: ZH_CN.calloutDanger,
};

function calloutLabels(messages: UmeanMessages): Record<CalloutType, string> {
  return {
    info: messages.calloutInfo,
    tip: messages.calloutTip,
    warning: messages.calloutWarning,
    danger: messages.calloutDanger,
  };
}

export interface CalloutOptions {
  HTMLAttributes?: Record<string, unknown>;
  /** 默认类型，默认 info */
  defaultType?: CalloutType;
  /** 国际化文案（仅使用 callout 相关字段），默认 zh-CN */
  messages?: UmeanMessages;
}

function isCalloutType(value: unknown): value is CalloutType {
  return (
    typeof value === 'string' &&
    (CALLOUT_TYPES as readonly string[]).includes(value)
  );
}

function normalizeCalloutType(
  value: unknown,
  fallback: CalloutType = 'info',
): CalloutType {
  return isCalloutType(value) ? value : fallback;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      /** 插入或切换为 callout（可选类型） */
      setCallout: (attrs?: { type?: CalloutType }) => ReturnType;
      /** 切换 callout；已在同类 callout 内则解除 */
      toggleCallout: (attrs?: { type?: CalloutType }) => ReturnType;
      /** 更新当前 callout 类型 */
      updateCalloutType: (type: CalloutType) => ReturnType;
      /** 解除 callout 包裹 */
      unsetCallout: () => ReturnType;
    };
  }
}

/**
 * 提示块（Callout）。
 * Markdown：Obsidian 风格 `> [!info]` / `> [!tip]` / `> [!warning]` / `> [!danger]`。
 */
export const Callout = Node.create<CalloutOptions>({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      defaultType: 'info',
      messages: ZH_CN,
    };
  },

  addAttributes() {
    return {
      type: {
        default: this.options.defaultType ?? 'info',
        parseHTML: (element) =>
          normalizeCalloutType(
            element.getAttribute('data-callout-type'),
            this.options.defaultType ?? 'info',
          ),
        renderHTML: (attributes) => ({
          'data-callout-type': normalizeCalloutType(
            attributes.type,
            this.options.defaultType ?? 'info',
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'aside[data-callout-type]',
      },
      {
        tag: 'div[data-type="callout"]',
        getAttrs: (element) => {
          if (typeof element === 'string') {
            return false;
          }
          return {
            type: normalizeCalloutType(
              element.getAttribute('data-callout-type') ??
                element.getAttribute('data-type-variant'),
            ),
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = normalizeCalloutType(
      node.attrs.type,
      this.options.defaultType ?? 'info',
    );
    const labels = calloutLabels(this.options.messages ?? ZH_CN);
    return [
      'aside',
      mergeAttributes(this.options.HTMLAttributes ?? {}, HTMLAttributes, {
        class: `umean-callout umean-callout--${type}`,
        'data-callout-type': type,
        'data-callout-label': labels[type],
      }),
      0,
    ];
  },

  markdownTokenizer: {
    name: 'callout',
    level: 'block',
    start(src) {
      const match = /^(?:>\s*)?\[!(info|tip|warning|danger)\]/m.exec(src);
      // Prefer lines that start with >
      const idx = src.search(/^>\s*\[!(info|tip|warning|danger)\]/m);
      return idx >= 0 ? idx : match?.index ?? -1;
    },
    tokenize(src, _tokens, lexer) {
      const opening =
        /^>\s*\[!(info|tip|warning|danger)\][^\n]*\n?/.exec(src);
      if (!opening) {
        return undefined;
      }

      const type = normalizeCalloutType(opening[1]);
      let rest = src.slice(opening[0].length);
      const bodyLines: string[] = [];
      let consumed = opening[0].length;

      while (rest.length > 0) {
        if (rest.startsWith('\n') && !rest.startsWith('\n>')) {
          break;
        }
        const lineMatch = /^(>\s?(.*))(\n|$)/.exec(rest);
        if (!lineMatch) {
          break;
        }
        // stop if next callout header
        if (/^>\s*\[!(info|tip|warning|danger)\]/.test(lineMatch[1])) {
          break;
        }
        bodyLines.push(lineMatch[2] ?? '');
        consumed += lineMatch[0].length;
        rest = rest.slice(lineMatch[0].length);
      }

      const rawBody = bodyLines.join('\n');
      const contentTokens = rawBody.trim()
        ? lexer.blockTokens(`${rawBody}\n`)
        : [];

      contentTokens.forEach((token: { text?: string; tokens?: unknown[] }) => {
        if (
          token.text &&
          (!token.tokens || (token.tokens as unknown[]).length === 0)
        ) {
          token.tokens = lexer.inlineTokens(token.text);
        }
      });

      return {
        type: 'callout',
        raw: src.slice(0, consumed),
        attributes: { type },
        tokens: contentTokens,
      };
    },
  },

  parseMarkdown: (token, helpers) => {
    const type = normalizeCalloutType(
      (token as { attributes?: { type?: string } }).attributes?.type,
    );
    const content = helpers.parseChildren(token.tokens || []);
    return helpers.createNode(
      'callout',
      { type },
      content.length ? content : [helpers.createNode('paragraph')],
    );
  },

  renderMarkdown: (node, helpers) => {
    const type = normalizeCalloutType(node.attrs?.type);
    const body = helpers.renderChildren(node.content || [], '\n\n');
    const lines = body
      ? body.split('\n').map((line) => (line.length ? `> ${line}` : '>'))
      : ['>'];
    return [`> [!${type}]`, ...lines].join('\n');
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ commands }) => {
          const type = normalizeCalloutType(
            attrs?.type,
            this.options.defaultType ?? 'info',
          );
          return commands.wrapIn(this.name, { type });
        },
      toggleCallout:
        (attrs) =>
        ({ commands, editor }) => {
          const type = normalizeCalloutType(
            attrs?.type,
            this.options.defaultType ?? 'info',
          );
          if (editor.isActive(this.name, { type })) {
            return commands.lift(this.name);
          }
          if (editor.isActive(this.name)) {
            return commands.updateAttributes(this.name, { type });
          }
          return commands.wrapIn(this.name, { type });
        },
      updateCalloutType:
        (type) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, {
            type: normalizeCalloutType(type),
          }),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-c': () => this.editor.commands.toggleCallout({ type: 'info' }),
    };
  },
});
