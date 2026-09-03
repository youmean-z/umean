import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  View,
  type KeyboardEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RichText, useEditorBridge, type EditorBridge } from '@10play/tentap-editor';

import { createTenTapBridges } from '../../src/tentap/createTenTapBridges';
import { editorHtml } from '../../tentap/editor-web/build/editorHtml';
import { FormatToolbar } from './FormatToolbar';

const TOOLBAR_HEIGHT = 44;
/** 光标与工具栏之间再留一段，避免贴在栏/键盘上 */
const CARET_GAP = 48;

const initialContent = `
  <h1>无标题笔记</h1>
  <p>点这里开始写。键盘上方可以加粗、改标题、拍照或选图；点 + 插入链接、列表、提示块、公式、流程图、分割线、表格和代码块。</p>
`;

type EditorWithScroll = EditorBridge & {
  updateScrollThresholdAndMargin?: (bottom: number) => void;
};

function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const animateIos = (event: KeyboardEvent) => {
      if (Platform.OS !== 'ios') {
        return;
      }
      LayoutAnimation.configureNext({
        duration: event.duration || 250,
        update: { type: LayoutAnimation.Types.keyboard },
      });
    };

    const show = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      animateIos(event);
      setHeight(Math.max(0, Math.round(event.endCoordinates.height)));
    });
    const hide = Keyboard.addListener(hideEvent, (event: KeyboardEvent) => {
      animateIos(event);
      setHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}

function syncWebViewCaretInset(
  editor: EditorWithScroll,
  visibleHeight: number,
  keyboardUp: boolean,
) {
  const cssH = Math.round(visibleHeight);
  const gap = keyboardUp ? CARET_GAP : 0;
  editor.webviewRef.current?.injectJavaScript(`
    (function () {
      var keyboardUp = ${keyboardUp ? 'true' : 'false'};
      var cssH = ${cssH};
      var gap = ${gap};
      var html = document.documentElement;
      var body = document.body;
      var root = document.getElementById('root');
      var scroller = document.querySelector('#root > div');
      var pm = document.querySelector('.ProseMirror');

      function clampScroll(el) {
        if (!el) return;
        if (el.scrollHeight <= el.clientHeight + 2) {
          el.scrollTop = 0;
        } else {
          var max = Math.max(0, el.scrollHeight - el.clientHeight);
          if (el.scrollTop > max) el.scrollTop = max;
        }
      }

      if (!keyboardUp) {
        html.style.height = '';
        body.style.height = '';
        if (root) root.style.height = '';
        if (scroller) {
          scroller.style.height = '';
          scroller.style.boxSizing = '';
          scroller.style.paddingBottom = '';
        }
        if (pm) pm.style.paddingBottom = '';
        clampScroll(scroller);
        return;
      }

      if (cssH > 0) {
        var px = cssH + 'px';
        html.style.height = px;
        body.style.height = px;
        if (root) root.style.height = px;
        if (scroller) {
          scroller.style.height = px;
          scroller.style.boxSizing = 'border-box';
          scroller.style.paddingBottom = gap + 'px';
        }
      }
    })();
    true;
  `);
  editor.updateScrollThresholdAndMargin?.(gap);
}

function EditorScreen() {
  const keyboardHeight = useKeyboardHeight();
  const [editorHeight, setEditorHeight] = useState(0);
  const [barHeight, setBarHeight] = useState(TOOLBAR_HEIGHT);
  const bridgeExtensions = useMemo(
    () => createTenTapBridges({ headingPolicy: { mode: 'document' } }),
    [],
  );

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: false,
    customSource: editorHtml,
    bridgeExtensions,
    initialContent,
  });

  const onEditorLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    setEditorHeight((prev) => (prev === next ? prev : next));
  }, []);

  const keyboardUp = keyboardHeight > 0;

  useEffect(() => {
    const apply = () =>
      syncWebViewCaretInset(editor as EditorWithScroll, editorHeight, keyboardUp);
    apply();
    const t1 = setTimeout(apply, 50);
    const t2 = setTimeout(apply, 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [editor, editorHeight, keyboardUp]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>笔记</Text>
      </View>
      <View style={styles.editorColumn}>
        <View
          style={[
            styles.editor,
            keyboardHeight > 0
              ? { paddingBottom: keyboardHeight + Math.max(barHeight, TOOLBAR_HEIGHT) }
              : null,
          ]}
        >
          <View style={styles.editorFill} onLayout={onEditorLayout}>
            <RichText editor={editor} />
          </View>
        </View>
        <FormatToolbar
          editor={editor}
          keyboardHeight={keyboardHeight}
          headingPolicyMode="document"
          onBarHeightChange={setBarHeight}
        />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <EditorScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f7f7f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  editorColumn: {
    flex: 1,
  },
  editor: {
    flex: 1,
    backgroundColor: '#fff',
  },
  editorFill: {
    flex: 1,
  },
});
