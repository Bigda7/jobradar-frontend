interface CommandShortcutEvent {
  code: string;
  ctrlKey: boolean;
  key: string;
  metaKey: boolean;
}

export function isMacPlatform(userAgent: string): boolean {
  return /Macintosh|Mac OS|iPhone|iPad/i.test(userAgent);
}

export function matchesCommandPaletteShortcut(
  event: CommandShortcutEvent,
  isMac: boolean,
): boolean {
  if (isMac) {
    return event.metaKey && event.key.toLowerCase() === 'k';
  }

  return event.ctrlKey && event.code === 'Slash';
}

export function getCommandPaletteShortcutLabel(isMac: boolean): string {
  return isMac ? '⌘ K' : 'Ctrl /';
}
