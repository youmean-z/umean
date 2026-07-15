/**
 * 浮动菜单相对视口定位：下方不够时翻到上方，并钳制在视口内。
 * Slash / 代码块语言下拉等共用。
 */
export function computeFloatingMenuPosition(options: {
  anchor: { top: number; bottom: number; left: number };
  menu: { width: number; height: number };
  viewport: { width: number; height: number };
  gap?: number;
  margin?: number;
}): { top: number; left: number; preferAbove: boolean } {
  const gap = options.gap ?? 6;
  const margin = options.margin ?? 8;
  const { anchor, menu, viewport } = options;

  const spaceBelow = viewport.height - anchor.bottom - gap - margin;
  const spaceAbove = anchor.top - gap - margin;
  const preferAbove =
    menu.height > 0 &&
    spaceBelow < menu.height &&
    spaceAbove > spaceBelow;

  let top = preferAbove
    ? anchor.top - menu.height - gap
    : anchor.bottom + gap;

  top = Math.max(
    margin,
    Math.min(top, viewport.height - menu.height - margin),
  );

  let left = anchor.left;
  left = Math.max(
    margin,
    Math.min(left, viewport.width - menu.width - margin),
  );

  return { top, left, preferAbove };
}

/** 将已渲染菜单按 anchor 元素（或矩形）固定到 viewport。 */
export function positionFloatingMenu(
  root: HTMLElement,
  anchor: { top: number; bottom: number; left: number } | DOMRect,
): void {
  root.style.position = 'fixed';
  root.style.zIndex = '1000';
  root.style.visibility = 'hidden';
  root.style.left = '0';
  root.style.top = '0';

  const { top, left } = computeFloatingMenuPosition({
    anchor: {
      top: anchor.top,
      bottom: anchor.bottom,
      left: anchor.left,
    },
    menu: { width: root.offsetWidth, height: root.offsetHeight },
    viewport: { width: window.innerWidth, height: window.innerHeight },
  });

  root.style.left = `${Math.round(left)}px`;
  root.style.top = `${Math.round(top)}px`;
  root.style.visibility = 'visible';
}
