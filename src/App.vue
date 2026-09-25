<template>
  <div class="app-layout">
    <header class="site-header border-bottom bg-white">
      <div class="container header-content">
        <RouterLink class="site-brand" to="/collection">MTG Collection</RouterLink>

        <nav class="desktop-nav d-none d-md-flex" aria-label="Main navigation">
          <RouterLink class="site-nav-link" to="/collection">Collection</RouterLink>
          <RouterLink class="site-nav-link" to="/trade">Trade</RouterLink>
          <RouterLink class="site-nav-link" to="/binders">Binders</RouterLink>
        </nav>
      </div>
    </header>

    <main class="container py-4">
      <RouterView />
    </main>

    <footer class="container py-3 border-top">
      <small>MTG Collection Manager</small>
    </footer>

    <nav class="mobile-nav d-md-none" aria-label="Main navigation">
      <RouterLink class="site-nav-link" to="/collection">Collection</RouterLink>
      <RouterLink class="site-nav-link" to="/trade">Trade</RouterLink>
      <RouterLink class="site-nav-link" to="/binders">Binders</RouterLink>
    </nav>
  </div>
</template>
