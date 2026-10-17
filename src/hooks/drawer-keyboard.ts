type DrawerEscapeEvent = Pick<
  KeyboardEvent,
  'key' | 'target' | 'defaultPrevented' | 'preventDefault'
>;

export function handleDrawerEscape(
  event: DrawerEscapeEvent,
  panel: EventTarget,
  onClose: () => void,
): void {
  if (event.key !== 'Escape' || event.defaultPrevented) {
    return;
  }

  const target = event.target;
  const containingDialog =
    target instanceof Element ? target.closest('[role="dialog"]') : null;

  if (containingDialog && containingDialog !== panel) {
    return;
  }

  event.preventDefault();
  onClose();
}
