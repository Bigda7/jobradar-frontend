(() => {
  const storageKey = 'jobradar-theme';
  let storedTheme;

  try {
    storedTheme = localStorage.getItem(storageKey);
  } catch {
    storedTheme = null;
  }
  const theme =
    storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  const themeColor = document.querySelector('meta[name="theme-color"]');
  themeColor?.setAttribute('content', theme === 'dark' ? '#101112' : '#edf1f3');
})();
