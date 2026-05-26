export type ResolvedElement = {
  element: Element;
};

export type GetStyleInfo = (resolved: ResolvedElement) => {
  className: string;
  styles: Record<string, string> | null;
};

export function initDesignMode(getStyleInfo: GetStyleInfo) {
  let selected: Element | null = null;

  const postSelection = (element: Element) => {
    const info = getStyleInfo({ element });
    window.parent.postMessage(
      {
        type: 'sandbox:design-mode:selection',
        className: info.className,
        styles: info.styles,
      },
      '*'
    );
  };

  const select = (element: Element) => {
    selected = element;
    postSelection(element);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('message', (event) => {
      if (event.data?.type !== 'sandbox:design-mode:select') return;
      const renderId = event.data.renderId;
      if (typeof renderId !== 'string') return;
      const element = document.querySelector(`[renderId="${renderId}"]`);
      if (element) select(element);
    });
  }

  return () => {
    if (selected?.isConnected) {
      postSelection(selected);
    }
  };
}
