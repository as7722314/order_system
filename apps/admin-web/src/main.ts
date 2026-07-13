import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { registerAdminServiceWorker } from "./pwa";
import "./style.css";

registerAdminServiceWorker();
createApp(App).use(createPinia()).use(router).mount("#app");
