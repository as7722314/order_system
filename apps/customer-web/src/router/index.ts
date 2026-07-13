import { createRouter, createWebHistory } from "vue-router";
import CartView from "../views/CartView.vue";
import HomeView from "../views/HomeView.vue";
import MyOrdersView from "../views/MyOrdersView.vue";
import OrderDoneView from "../views/OrderDoneView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: HomeView },
    { path: "/cart", component: CartView },
    { path: "/done/:orderNumber", component: OrderDoneView },
    { path: "/orders", component: MyOrdersView },
    { path: "/lookup", redirect: "/orders" }
  ]
});

