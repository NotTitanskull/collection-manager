import { createRouter, createWebHashHistory } from "vue-router";
import CollectionView from "../views/CollectionView.vue";
import TradeView from "../views/TradeView.vue";
import BindersView from "../views/BindersView.vue";

const router = createRouter({
  // Hash routes work on static hosting without server-side URL rewrites.
  history: createWebHashHistory(import.meta.env.BASE_URL),
  linkActiveClass: "is-active",
  routes: [
    { path: "/", redirect: "/collection" },
    { path: "/collection", component: CollectionView },
    { path: "/trade", component: TradeView },
    { path: "/binders", component: BindersView },
  ],
});

export default router;
