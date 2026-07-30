;(function () {
  try {
    var tema = localStorage.getItem('theme')
    if (tema !== 'light' && tema !== 'dark') {
      tema =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
    }
    document.documentElement.setAttribute('data-theme', tema)
  } catch (_error) {
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})()
