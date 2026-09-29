// Focus helpers shared by the pointer and keyboard handlers.

export function isTyping() {
  const a = document.activeElement;
  return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable);
}

// Leave any text field so board shortcuts work again.
export function blurActive() {
  if (isTyping()) document.activeElement.blur();
}
