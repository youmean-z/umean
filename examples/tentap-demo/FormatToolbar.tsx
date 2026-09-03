import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';
import {
  Images,
  useBridgeState,
  useKeyboard,
  type EditorBridge,
} from '@10play/tentap-editor';

import { pickLibraryImageAsDataUri, takeCameraImageAsDataUri } from './pickLibraryImage';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type ToolbarContext =
  | 'main'
  | 'heading'
  | 'insert'
  | 'table'
  | 'link'
  | 'code'
  | 'callout'
  | 'math';
type MathKind = 'inline' | 'block';

const CALLOUT_SHORT: Record<string, string> = {
  info: '信',
  tip: '示',
  warning: '警',
  danger: '危',
};

const CODE_LANG_SHORT: Record<string, string> = {
  javascript: 'JS',
  typescript: 'TS',
  xml: 'HTML',
  css: 'CSS',
  markdown: 'MD',
  mermaid: '流',
};

type UmeanEditor = EditorBridge & {
  insertTable: () => void;
  deleteTable: () => void;
  addRowAfter: () => void;
  addColumnAfter: () => void;
  deleteRow: () => void;
  deleteColumn: () => void;
  setCellAlign: (align: 'left' | 'center' | 'right') => void;
  undo: () => void;
  redo: () => void;
  toggleCodeBlock: () => void;
  toggleHeading: (level: HeadingLevel) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  toggleTaskList: () => void;
  toggleBlockquote: () => void;
  setImage: (src: string) => void;
  setHorizontalRule: () => void;
  insertCallout: (type?: 'info' | 'tip' | 'warning' | 'danger' | null) => void;
  updateCalloutType: (type: 'info' | 'tip' | 'warning' | 'danger') => void;
  unsetCallout: () => void;
  setLink: (
    link: string | null,
    range?: { from: number; to: number } | null,
  ) => void;
  setCodeBlockLanguage: (language: string | null) => void;
  applyMath: (
    latex: string,
    kind: MathKind,
    range?: { from: number; to: number } | null,
  ) => void;
  insertMermaid: () => void;
  setMermaidPreview: (preview: boolean) => void;
};

interface FormatToolbarProps {
  editor: EditorBridge;
  /** 键盘高度，栏钉在键盘上方 */
  keyboardHeight: number;
  /** `document` / `chunk` 下不允许改一级标题 */
  headingPolicyMode?: 'free' | 'document' | 'chunk';
  onBarHeightChange?: (height: number) => void;
}

export function FormatToolbar({
  editor,
  keyboardHeight,
  headingPolicyMode = 'document',
  onBarHeightChange,
}: FormatToolbarProps) {
  const umean = editor as UmeanEditor;
  const editorState = useBridgeState(editor);
  const { isKeyboardUp } = useKeyboard();
  const [context, setContext] = useState<ToolbarContext>('main');
  const [preferMainInTable, setPreferMainInTable] = useState(false);
  const [preferMainInCode, setPreferMainInCode] = useState(false);
  const [preferMainInCallout, setPreferMainInCallout] = useState(false);
  const [preferMainInMath, setPreferMainInMath] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');
  const [linkRange, setLinkRange] = useState<{ from: number; to: number } | null>(
    null,
  );
  const [mathDraft, setMathDraft] = useState('');
  const [mathKind, setMathKind] = useState<MathKind>('inline');
  const [mathRange, setMathRange] = useState<{ from: number; to: number } | null>(
    null,
  );
  const [mathEditing, setMathEditing] = useState(false);
  const linkInputRef = useRef<TextInput>(null);
  const mathInputRef = useRef<TextInput>(null);
  const previousContext = useRef<ToolbarContext>(context);
  const linkRangeRef = useRef<{ from: number; to: number } | null>(null);
  const capturedLinkRange = useRef(false);
  const mathRangeRef = useRef<{ from: number; to: number } | null>(null);
  const capturedMathRange = useRef(false);

  const headingLevel = editorState.headingLevel as HeadingLevel | undefined;
  const lockTitle = headingPolicyMode !== 'free' && headingLevel === 1;
  const hideBar = keyboardHeight <= 0;
  const mathBarTall = context === 'math' && mathKind === 'block';
  const barHeight = hideBar ? 0 : mathBarTall ? 112 : 44;

  useEffect(() => {
    onBarHeightChange?.(barHeight);
  }, [barHeight, onBarHeightChange]);
  const isCodeBlockActive = Boolean(
    (editorState as { isCodeBlockActive?: boolean }).isCodeBlockActive,
  );
  const isTableActive = Boolean(
    (editorState as { isTableActive?: boolean }).isTableActive,
  );
  const isCalloutActive = Boolean(
    (editorState as { isCalloutActive?: boolean }).isCalloutActive,
  );
  const calloutType =
    (editorState as { calloutType?: string | null }).calloutType ?? null;
  const calloutTypes = (
    editorState as { calloutTypes?: { id: string; label: string }[] }
  ).calloutTypes ?? [
    { id: 'info', label: '信息' },
    { id: 'tip', label: '提示' },
    { id: 'warning', label: '警告' },
    { id: 'danger', label: '危险' },
  ];
  const isInlineMathActive = Boolean(
    (editorState as { isInlineMathActive?: boolean }).isInlineMathActive,
  );
  const isBlockMathActive = Boolean(
    (editorState as { isBlockMathActive?: boolean }).isBlockMathActive,
  );
  const isMathActive = isInlineMathActive || isBlockMathActive;
  const activeMathKind =
    ((editorState as { mathKind?: MathKind | null }).mathKind ??
      (isBlockMathActive ? 'block' : isInlineMathActive ? 'inline' : null)) as
      | MathKind
      | null;
  const mathLatex =
    (editorState as { mathLatex?: string }).mathLatex ?? '';
  const isMermaidActive = Boolean(
    (editorState as { isMermaidActive?: boolean }).isMermaidActive,
  );
  const isMermaidPreview = Boolean(
    (editorState as { isMermaidPreview?: boolean }).isMermaidPreview ??
      isMermaidActive,
  );
  const isLinkActive = Boolean(editorState.isLinkActive);
  const activeLink =
    (editorState as { activeLink?: string }).activeLink ?? '';
  const codeBlockLanguage =
    (editorState as { codeBlockLanguage?: string | null }).codeBlockLanguage ??
    null;
  const codeBlockLanguages = (
    editorState as { codeBlockLanguages?: { id: string; label: string }[] }
  ).codeBlockLanguages ?? [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'xml', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'markdown', label: 'Markdown' },
  ];
  const cellAlign =
    (editorState as { cellAlign?: 'left' | 'center' | 'right' | null })
      .cellAlign ?? null;
  const isCellAlignLeft = cellAlign === 'left' || cellAlign == null;

  useEffect(() => {
    if (!isTableActive) {
      setPreferMainInTable(false);
    }
  }, [isTableActive]);

  useEffect(() => {
    if (!isCodeBlockActive) {
      setPreferMainInCode(false);
    }
  }, [isCodeBlockActive]);

  useEffect(() => {
    if (!isCalloutActive) {
      setPreferMainInCallout(false);
    }
  }, [isCalloutActive]);

  useEffect(() => {
    if (!isMathActive) {
      setPreferMainInMath(false);
    }
  }, [isMathActive]);

  useEffect(() => {
    if (!isKeyboardUp) {
      setContext('main');
      return;
    }
    setContext((current) => {
      if (current === 'link' || current === 'math') {
        return current;
      }
      if (isTableActive && !preferMainInTable) {
        return 'table';
      }
      if (isCodeBlockActive && !preferMainInCode) {
        return 'code';
      }
      if (isCalloutActive && !preferMainInCallout) {
        return 'callout';
      }
      if (isMathActive && !preferMainInMath) {
        return 'math';
      }
      return current;
    });
  }, [
    isKeyboardUp,
    isTableActive,
    preferMainInTable,
    isCodeBlockActive,
    preferMainInCode,
    isCalloutActive,
    preferMainInCallout,
    isMathActive,
    preferMainInMath,
  ]);

  const keepFocus = useCallback(() => {
    editor.focus();
  }, [editor]);

  useEffect(() => {
    const leavingLink = previousContext.current === 'link' && context !== 'link';
    const leavingMath = previousContext.current === 'math' && context !== 'math';
    previousContext.current = context;

    if (context === 'link') {
      const id = requestAnimationFrame(() => {
        linkInputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }

    if (context === 'math') {
      const id = requestAnimationFrame(() => {
        mathInputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }

    if (leavingLink || leavingMath) {
      editor.focus();
    }
    return undefined;
  }, [context, editor, mathKind]);

  const captureLinkRange = useCallback(() => {
    const live = editor.getEditorState() as {
      selection?: { from?: number; to?: number };
      linkSelection?: { from?: number; to?: number };
    };
    const fromState = editorState as {
      selection?: { from?: number; to?: number };
      linkSelection?: { from?: number; to?: number };
    };
    const sel =
      live.linkSelection ??
      live.selection ??
      fromState.linkSelection ??
      fromState.selection;
    if (sel && typeof sel.from === 'number' && typeof sel.to === 'number') {
      const next = { from: sel.from, to: sel.to };
      linkRangeRef.current = next;
      setLinkRange(next);
      return;
    }
    linkRangeRef.current = null;
    setLinkRange(null);
  }, [editor, editorState]);

  const captureMathRange = useCallback(() => {
    const live = editor.getEditorState() as {
      selection?: { from?: number; to?: number };
      mathSelection?: { from?: number; to?: number };
    };
    const fromState = editorState as {
      selection?: { from?: number; to?: number };
      mathSelection?: { from?: number; to?: number };
    };
    const sel =
      live.mathSelection ??
      live.selection ??
      fromState.mathSelection ??
      fromState.selection;
    if (sel && typeof sel.from === 'number' && typeof sel.to === 'number') {
      const next = { from: sel.from, to: sel.to };
      mathRangeRef.current = next;
      setMathRange(next);
      return;
    }
    mathRangeRef.current = null;
    setMathRange(null);
  }, [editor, editorState]);

  useEffect(() => {
    if (context !== 'math' || !isMathActive) {
      return;
    }
    setMathDraft(mathLatex);
    setMathKind(activeMathKind ?? 'inline');
    setMathEditing(true);
    captureMathRange();
    // 只在进入公式栏时带入当前公式，避免输入时被状态回写冲掉
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  const closeLinkBar = useCallback(() => {
    capturedLinkRange.current = false;
    linkRangeRef.current = null;
    setLinkRange(null);
    setContext('main');
  }, []);

  const unsetHeading = useCallback(() => {
    if (headingLevel && headingLevel !== 1) {
      umean.toggleHeading(headingLevel);
    }
  }, [headingLevel, umean]);

  const run = useCallback(
    (action: () => void, nextContext: ToolbarContext = 'main') => {
      action();
      editor.focus();
      setContext(nextContext);
    },
    [editor],
  );

  const insertImage = useCallback(
    async (source: 'library' | 'camera') => {
      const src =
        source === 'camera'
          ? await takeCameraImageAsDataUri()
          : await pickLibraryImageAsDataUri();
      if (src) {
        // 系统相册/相机会让 WebView 暂停；回来后等就绪再发 setImage
        let sent = false;
        for (let i = 0; i < 20; i += 1) {
          const ready = Boolean(
            editor.webviewRef.current &&
              (editor.getEditorState() as { isReady?: boolean }).isReady,
          );
          if (ready) {
            umean.setImage(src);
            sent = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (!sent) {
          umean.setImage(src);
        }
      }
      editor.focus();
      setContext('main');
    },
    [editor, umean],
  );

  const openLinkBar = useCallback(() => {
    if (!capturedLinkRange.current) {
      captureLinkRange();
    }
    capturedLinkRange.current = false;
    setLinkDraft(activeLink);
    setContext('link');
  }, [activeLink, captureLinkRange]);

  const confirmLink = useCallback(() => {
    umean.setLink(linkDraft, linkRangeRef.current ?? linkRange);
    closeLinkBar();
  }, [closeLinkBar, linkDraft, linkRange, umean]);

  const clearLink = useCallback(() => {
    umean.setLink('', linkRangeRef.current ?? linkRange);
    closeLinkBar();
  }, [closeLinkBar, linkRange, umean]);

  const closeMathBar = useCallback(() => {
    capturedMathRange.current = false;
    mathRangeRef.current = null;
    setMathRange(null);
    setMathEditing(false);
    setPreferMainInMath(true);
    setContext('main');
  }, []);

  const openMathBar = useCallback(
    (kind?: MathKind) => {
      if (!capturedMathRange.current) {
        captureMathRange();
      }
      capturedMathRange.current = false;
      if (isMathActive) {
        setMathDraft(mathLatex);
        setMathKind(kind ?? activeMathKind ?? 'inline');
        setMathEditing(true);
      } else {
        setMathDraft('');
        setMathKind(kind ?? 'block');
        setMathEditing(false);
      }
      setPreferMainInMath(false);
      setContext('math');
    },
    [activeMathKind, captureMathRange, isMathActive, mathLatex],
  );

  const confirmMath = useCallback(() => {
    const latex = mathDraft.trim();
    if (!latex && !mathEditing) {
      return;
    }
    umean.applyMath(latex, mathKind, mathRangeRef.current ?? mathRange);
    closeMathBar();
  }, [closeMathBar, mathDraft, mathEditing, mathKind, mathRange, umean]);

  const clearMath = useCallback(() => {
    umean.applyMath('', mathKind, mathRangeRef.current ?? mathRange);
    closeMathBar();
  }, [closeMathBar, mathKind, mathRange, umean]);

  return (
    <View
      style={[
        styles.bar,
        { bottom: keyboardHeight, height: hideBar ? 44 : barHeight || 44 },
        hideBar ? styles.hidden : undefined,
      ]}
    >
      {context === 'link' ? (
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsHorizontalScrollIndicator={false}
          style={styles.linkScroll}
          contentContainerStyle={styles.linkRow}
        >
          <TextButton label="关" onPress={closeLinkBar} />
          <TextInput
            ref={linkInputRef}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={false}
            blurOnSubmit
            keyboardType="url"
            onChangeText={setLinkDraft}
            onSubmitEditing={confirmLink}
            placeholder="https://"
            placeholderTextColor="#b0b0b0"
            returnKeyType="done"
            style={styles.linkInput}
            value={linkDraft}
          />
          {isLinkActive ? (
            <TextButton label="清" onPress={clearLink} />
          ) : null}
          <TextButton label="定" onPress={confirmLink} />
        </ScrollView>
      ) : context === 'math' ? (
        <View style={styles.mathColumn}>
          <View style={styles.mathChrome}>
            <TextButton label="关" onPress={closeMathBar} />
            <TextButton
              label="行"
              active={mathKind === 'inline'}
              onPress={() => setMathKind('inline')}
            />
            <TextButton
              label="块"
              active={mathKind === 'block'}
              onPress={() => setMathKind('block')}
            />
            {mathKind === 'inline' ? (
              <TextInput
                ref={mathInputRef}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={false}
                blurOnSubmit
                onChangeText={setMathDraft}
                onSubmitEditing={confirmMath}
                placeholder="E=mc^2"
                placeholderTextColor="#b0b0b0"
                returnKeyType="done"
                style={styles.linkInput}
                value={mathDraft}
              />
            ) : (
              <View style={styles.mathSpacer} />
            )}
            {mathEditing ? (
              <TextButton label="清" onPress={clearMath} />
            ) : null}
            <TextButton label="定" onPress={confirmMath} />
          </View>
          {mathKind === 'block' ? (
            <TextInput
              ref={mathInputRef}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={false}
              blurOnSubmit={false}
              multiline
              onChangeText={setMathDraft}
              placeholder="\\sum_{i=1}^{n} i"
              placeholderTextColor="#b0b0b0"
              style={styles.mathMultiline}
              textAlignVertical="top"
              value={mathDraft}
            />
          ) : null}
        </View>
      ) : (
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.barContent}
      >
          {context === 'main' ? (
            <>
              <IconButton
                source={Images.bold}
                active={!!editorState.isBoldActive}
                disabled={!editorState.canToggleBold}
                onPressIn={keepFocus}
                onPress={() => run(() => umean.toggleBold(), 'main')}
              />
              <IconButton
                source={Images.italic}
                active={!!editorState.isItalicActive}
                disabled={!editorState.canToggleItalic}
                onPressIn={keepFocus}
                onPress={() => run(() => umean.toggleItalic(), 'main')}
              />
              <TextButton
                label={
                  headingLevel === 1
                    ? '题'
                    : headingLevel === 2
                      ? 'H2'
                      : headingLevel === 3
                        ? 'H3'
                        : '正'
                }
                active={headingLevel === 2 || headingLevel === 3}
                disabled={lockTitle || !editorState.canToggleHeading}
                onPressIn={keepFocus}
                onPress={() => setContext('heading')}
              />
              <TextButton
                label="拍"
                onPress={() => {
                  void insertImage('camera');
                }}
              />
              <TextButton
                label="图"
                onPress={() => {
                  void insertImage('library');
                }}
              />
              <Pressable
                accessibilityLabel="插入"
                onPressIn={keepFocus}
                onPress={() => setContext('insert')}
                style={styles.plusHit}
              >
                <Text style={styles.plus}>+</Text>
              </Pressable>
              <IconButton
                source={Images.undo}
                disabled={!editorState.canUndo}
                onPressIn={keepFocus}
                onPress={() => run(() => umean.undo(), 'main')}
              />
              <IconButton
                source={Images.redo}
                disabled={!editorState.canRedo}
                onPressIn={keepFocus}
                onPress={() => run(() => umean.redo(), 'main')}
              />
              {isLinkActive ? (
                <TextButton
                  label="链"
                  active
                  onPressIn={() => {
                    captureLinkRange();
                    capturedLinkRange.current = true;
                    editor.focus();
                  }}
                  onPress={openLinkBar}
                />
              ) : null}
              {isTableActive ? (
                <TextButton
                  label="表"
                  onPressIn={keepFocus}
                  onPress={() => {
                    setPreferMainInTable(false);
                    setContext('table');
                  }}
                />
              ) : null}
              {isCodeBlockActive ? (
                <TextButton
                  label="码"
                  onPressIn={keepFocus}
                  onPress={() => {
                    setPreferMainInCode(false);
                    setContext('code');
                  }}
                />
              ) : null}
              {isCalloutActive ? (
                <TextButton
                  label="示"
                  onPressIn={keepFocus}
                  onPress={() => {
                    setPreferMainInCallout(false);
                    setContext('callout');
                  }}
                />
              ) : null}
              {isMathActive ? (
                <TextButton
                  label="公"
                  onPressIn={() => {
                    captureMathRange();
                    capturedMathRange.current = true;
                    editor.focus();
                  }}
                  onPress={openMathBar}
                />
              ) : null}
            </>
          ) : null}

          {context === 'heading' ? (
            <>
              <IconButton
                source={Images.close}
                onPressIn={keepFocus}
                onPress={() => setContext('main')}
              />
              <TextButton
                label="正"
                active={!headingLevel}
                disabled={lockTitle}
                onPressIn={keepFocus}
                onPress={() => run(unsetHeading, 'heading')}
              />
              <TextButton
                label="H2"
                active={headingLevel === 2}
                disabled={lockTitle}
                onPressIn={keepFocus}
                onPress={() => run(() => umean.toggleHeading(2), 'heading')}
              />
              <TextButton
                label="H3"
                active={headingLevel === 3}
                disabled={lockTitle}
                onPressIn={keepFocus}
                onPress={() => run(() => umean.toggleHeading(3), 'heading')}
              />
            </>
          ) : null}

          {context === 'table' ? (
            <>
              <IconButton
                source={Images.close}
                onPressIn={keepFocus}
                onPress={() => {
                  setPreferMainInTable(true);
                  setContext('main');
                }}
              />
              <TextButton
                label="左"
                active={isCellAlignLeft}
                onPressIn={keepFocus}
                onPress={() => run(() => umean.setCellAlign('left'), 'table')}
              />
              <TextButton
                label="中"
                active={cellAlign === 'center'}
                onPressIn={keepFocus}
                onPress={() => run(() => umean.setCellAlign('center'), 'table')}
              />
              <TextButton
                label="右"
                active={cellAlign === 'right'}
                onPressIn={keepFocus}
                onPress={() => run(() => umean.setCellAlign('right'), 'table')}
              />
              <TextButton
                label="加行"
                onPressIn={keepFocus}
                onPress={() => run(() => umean.addRowAfter(), 'table')}
              />
              <TextButton
                label="加列"
                onPressIn={keepFocus}
                onPress={() => run(() => umean.addColumnAfter(), 'table')}
              />
              <TextButton
                label="删行"
                onPressIn={keepFocus}
                onPress={() => run(() => umean.deleteRow(), 'table')}
              />
              <TextButton
                label="删列"
                onPressIn={keepFocus}
                onPress={() => run(() => umean.deleteColumn(), 'table')}
              />
              <TextButton
                label="删表"
                danger
                onPressIn={keepFocus}
                onPress={() => run(() => umean.deleteTable())}
              />
            </>
          ) : null}

          {context === 'code' ? (
            <>
              <IconButton
                source={Images.close}
                onPressIn={keepFocus}
                onPress={() => {
                  setPreferMainInCode(true);
                  setContext('main');
                }}
              />
              {isMermaidActive ? (
                <>
                  <TextButton
                    label="图"
                    active={isMermaidPreview}
                    onPressIn={keepFocus}
                    onPress={() =>
                      run(() => umean.setMermaidPreview(true), 'code')
                    }
                  />
                  <TextButton
                    label="码"
                    active={!isMermaidPreview}
                    onPressIn={keepFocus}
                    onPress={() =>
                      run(() => umean.setMermaidPreview(false), 'code')
                    }
                  />
                </>
              ) : null}
              <TextButton
                label="纯"
                active={!codeBlockLanguage}
                onPressIn={keepFocus}
                onPress={() =>
                  run(() => umean.setCodeBlockLanguage(null), 'code')
                }
              />
              {codeBlockLanguages.map((item) => (
                <TextButton
                  key={item.id}
                  label={CODE_LANG_SHORT[item.id] ?? item.label}
                  active={codeBlockLanguage === item.id}
                  onPressIn={keepFocus}
                  onPress={() =>
                    run(() => umean.setCodeBlockLanguage(item.id), 'code')
                  }
                />
              ))}
            </>
          ) : null}

          {context === 'callout' ? (
            <>
              <IconButton
                source={Images.close}
                onPressIn={keepFocus}
                onPress={() => {
                  setPreferMainInCallout(true);
                  setContext('main');
                }}
              />
              {calloutTypes.map((item) => (
                <TextButton
                  key={item.id}
                  label={CALLOUT_SHORT[item.id] ?? item.label}
                  active={calloutType === item.id}
                  onPressIn={keepFocus}
                  onPress={() =>
                    run(
                      () =>
                        umean.updateCalloutType(
                          item.id as 'info' | 'tip' | 'warning' | 'danger',
                        ),
                      'callout',
                    )
                  }
                />
              ))}
              <TextButton
                label="解"
                onPressIn={keepFocus}
                onPress={() => run(() => umean.unsetCallout())}
              />
            </>
          ) : null}

          {context === 'insert' ? (
            <>
              <IconButton
                source={Images.close}
                onPressIn={keepFocus}
                onPress={() => setContext('main')}
              />
              <IconButton
                source={Images.link}
                active={isLinkActive}
                onPressIn={() => {
                  captureLinkRange();
                  capturedLinkRange.current = true;
                  editor.focus();
                }}
                onPress={openLinkBar}
              />
              <IconButton
                source={Images.bulletList}
                active={!!editorState.isBulletListActive}
                onPressIn={keepFocus}
                onPress={() => run(() => umean.toggleBulletList())}
              />
              <IconButton
                source={Images.orderedList}
                active={!!editorState.isOrderedListActive}
                onPressIn={keepFocus}
                onPress={() => run(() => umean.toggleOrderedList())}
              />
              <IconButton
                source={Images.checkList}
                active={!!editorState.isTaskListActive}
                onPressIn={keepFocus}
                onPress={() => run(() => umean.toggleTaskList())}
              />
              <IconButton
                source={Images.quote}
                active={!!editorState.isBlockquoteActive}
                onPressIn={keepFocus}
                onPress={() => run(() => umean.toggleBlockquote())}
              />
              <TextButton
                label="示"
                active={isCalloutActive}
                onPressIn={keepFocus}
                onPress={() => {
                  if (isCalloutActive) {
                    setPreferMainInCallout(false);
                    setContext('callout');
                    return;
                  }
                  setPreferMainInCallout(false);
                  run(() => umean.insertCallout('info'), 'callout');
                }}
              />
              <TextButton
                label="行"
                active={isInlineMathActive}
                onPressIn={() => {
                  captureMathRange();
                  capturedMathRange.current = true;
                  editor.focus();
                }}
                onPress={() => openMathBar('inline')}
              />
              <TextButton
                label="块"
                active={isBlockMathActive}
                onPressIn={() => {
                  captureMathRange();
                  capturedMathRange.current = true;
                  editor.focus();
                }}
                onPress={() => openMathBar('block')}
              />
              <TextButton
                label="流"
                active={isMermaidActive}
                onPressIn={keepFocus}
                onPress={() => {
                  if (isMermaidActive) {
                    setPreferMainInCode(false);
                    setContext('code');
                    return;
                  }
                  setPreferMainInCode(false);
                  run(() => umean.insertMermaid(), 'code');
                }}
              />
              <IconButton
                source={Images.code}
                active={isCodeBlockActive}
                onPressIn={keepFocus}
                onPress={() => {
                  if (isCodeBlockActive) {
                    run(() => umean.toggleCodeBlock(), 'main');
                    return;
                  }
                  setPreferMainInCode(false);
                  run(() => umean.toggleCodeBlock(), 'code');
                }}
              />
              <Pressable
                accessibilityLabel="分割线"
                onPressIn={keepFocus}
                onPress={() => run(() => umean.setHorizontalRule())}
                style={styles.textHit}
              >
                <Text style={styles.textBtn}>线</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="表格"
                onPressIn={keepFocus}
                onPress={() => {
                  setPreferMainInTable(false);
                  run(() => umean.insertTable(), 'table');
                }}
                style={styles.textHit}
              >
                <Text style={styles.textBtn}>表</Text>
              </Pressable>
            </>
          ) : null}
      </ScrollView>
      )}
    </View>
  );
}

function IconButton({
  source,
  active = false,
  disabled = false,
  onPress,
  onPressIn,
}: {
  source: ImageSourcePropType;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
  onPressIn?: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPressIn={onPressIn}
      onPress={onPress}
      style={[styles.iconHit, active ? styles.iconHitActive : undefined]}
    >
      <Image
        source={source}
        resizeMode="contain"
        style={[styles.icon, disabled ? styles.iconDisabled : undefined]}
      />
    </Pressable>
  );
}

function TextButton({
  label,
  danger = false,
  active = false,
  disabled = false,
  onPress,
  onPressIn,
}: {
  label: string;
  danger?: boolean;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
  onPressIn?: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled}
      onPressIn={onPressIn}
      onPress={onPress}
      style={[styles.textHit, active ? styles.textHitActive : undefined]}
    >
      <Text
        style={[
          styles.textBtn,
          danger ? styles.textBtnDanger : undefined,
          disabled ? styles.textBtnDisabled : undefined,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
    minWidth: '100%',
    height: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DEE0E3',
    backgroundColor: '#fff',
  },
  mathColumn: {
    flex: 1,
    paddingBottom: 6,
  },
  mathChrome: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingRight: 8,
  },
  mathSpacer: {
    flex: 1,
  },
  mathMultiline: {
    marginHorizontal: 8,
    minHeight: 56,
    maxHeight: 64,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    fontSize: 16,
    lineHeight: 22,
    color: '#1a1a1a',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  barContent: {
    alignItems: 'center',
    paddingHorizontal: 4,
    minHeight: 44,
  },
  hidden: {
    display: 'none',
  },
  linkScroll: {
    flex: 1,
  },
  linkRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    minHeight: 44,
  },
  linkInput: {
    flex: 1,
    height: 36,
    marginHorizontal: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    fontSize: 16,
    color: '#1a1a1a',
  },
  iconHit: {
    paddingHorizontal: 8,
    height: 36,
    justifyContent: 'center',
    borderRadius: 4,
  },
  iconHitActive: {
    backgroundColor: '#E5E5E5',
  },
  icon: {
    height: 28,
    width: 28,
    tintColor: '#898989',
  },
  iconDisabled: {
    opacity: 0.3,
  },
  plusHit: {
    marginLeft: 8,
    paddingHorizontal: 12,
    height: 36,
    justifyContent: 'center',
  },
  plus: {
    fontSize: 22,
    lineHeight: 28,
    color: '#898989',
  },
  textHit: {
    paddingHorizontal: 10,
    height: 36,
    justifyContent: 'center',
    borderRadius: 4,
  },
  textHitActive: {
    backgroundColor: '#E5E5E5',
  },
  textBtn: {
    fontSize: 16,
    color: '#898989',
  },
  textBtnDanger: {
    color: '#dc2626',
  },
  textBtnDisabled: {
    opacity: 0.3,
  },
});
