import { createRouter, createWebHistory } from "vue-router";
import { useAdminAuthStore } from "../stores/adminAuthStore";
import DashboardView from "../views/DashboardView.vue";
import ExpensesView from "../views/ExpensesView.vue";
import FlavorsView from "../views/FlavorsView.vue";
import LoginView from "../views/LoginView.vue";
import OrdersView from "../views/OrdersView.vue";
import ProductsView from "../views/ProductsView.vue";
import ReportsView from "../views/ReportsView.vue";

export const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_ADMIN_BASE_PATH ?? "/admin/"),
  routes: [
    { path: "/login", component: LoginView },
    { path: "/", component: DashboardView },
    { path: "/products", component: ProductsView },
    { path: "/flavors", component: FlavorsView },
    { path: "/orders", component: OrdersView },
    { path: "/expenses", component: ExpensesView },
    { path: "/reports", component: ReportsView }
  ]
});

router.beforeEach((to) => {
  const auth = useAdminAuthStore();
  if (to.path !== "/login" && !auth.isLoggedIn) return "/login";
  return true;
});
