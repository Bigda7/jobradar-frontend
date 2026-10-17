import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handleDrawerEscape } from './drawer-keyboard';

class TestElement extends EventTarget {
  constructor(private readonly dialog: TestElement | null = null) {
    super();
  }

  closest(selector: string) {
    return selector === '[role="dialog"]' ? this.dialog : null;
  }
}

function keyEvent(key = 'Escape') {
  return Object.assign(new Event('keydown', { cancelable: true }), { key });
}

function dispatch(target: TestElement, event: ReturnType<typeof keyEvent>, onKey: () => void) {
  target.addEventListener('keydown', onKey, { once: true });
  target.dispatchEvent(event);
}

describe('drawer Escape ownership', () => {
  beforeEach(() => vi.stubGlobal('Element', TestElement));
  afterEach(() => vi.unstubAllGlobals());

  it('closes the drawer for an unhandled Escape', () => {
    const close = vi.fn();
    const event = keyEvent();

    handleDrawerEscape(event, new TestElement(), close);

    expect(close).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it('does not close the drawer after a popup consumes Escape', () => {
    const close = vi.fn();
    const event = keyEvent();
    event.preventDefault();

    handleDrawerEscape(event, new TestElement(), close);

    expect(close).not.toHaveBeenCalled();
  });

  it('closes on the next separate Escape after a popup has closed', () => {
    const close = vi.fn();
    const panel = new TestElement();
    const popupEscape = keyEvent();
    popupEscape.preventDefault();

    handleDrawerEscape(popupEscape, panel, close);
    expect(close).not.toHaveBeenCalled();

    handleDrawerEscape(keyEvent(), panel, close);
    expect(close).toHaveBeenCalledOnce();
  });

  it('cannot dismiss twice for the same consumed event', () => {
    const close = vi.fn();
    const panel = new TestElement();
    const event = keyEvent();

    handleDrawerEscape(event, panel, close);
    handleDrawerEscape(event, panel, close);

    expect(close).toHaveBeenCalledOnce();
  });

  it('preserves another dialog even when that dialog did not cancel Escape', () => {
    const close = vi.fn();
    const panel = new TestElement();
    const otherDialog = new TestElement();
    const target = new TestElement(otherDialog);
    const event = keyEvent();

    dispatch(target, event, () => handleDrawerEscape(event, panel, close));

    expect(close).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('closes when the target belongs to this drawer', () => {
    const close = vi.fn();
    const panel = new TestElement();
    const target = new TestElement(panel);
    const event = keyEvent();

    dispatch(target, event, () => handleDrawerEscape(event, panel, close));

    expect(close).toHaveBeenCalledOnce();
  });

  it('preserves a drawer when a portalled menu consumes Escape', () => {
    const close = vi.fn();
    const panel = new TestElement();
    const portalledMenu = new TestElement();
    const event = keyEvent();
    event.preventDefault();

    dispatch(portalledMenu, event, () => handleDrawerEscape(event, panel, close));

    expect(close).not.toHaveBeenCalled();
  });

  it.each(['Tab', 'Enter', 'ArrowDown'])('does not intercept %s', (key) => {
    const close = vi.fn();
    const event = keyEvent(key);

    handleDrawerEscape(event, new TestElement(), close);

    expect(close).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});
