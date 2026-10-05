import "bootstrap/dist/css/bootstrap.min.css";
// Load Bootstrap plugins and their data APIs (modal dismiss, collapse, dropdown, etc.).
import "bootstrap";
import "./assets/scss/main.scss";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// Register routing before mounting the root component into index.html’s #app element.
createApp(App).use(router).mount("#app");
