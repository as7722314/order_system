<template>
  <div class="admin-chart-canvas"><canvas ref="canvas" role="img" :aria-label="label">{{ label }}</canvas></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController, Filler, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip, type ChartData, type ChartOptions } from "chart.js";

Chart.register(ArcElement, BarController, BarElement, CategoryScale, DoughnutController, Filler, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip);
const props = defineProps<{ type: "line" | "bar" | "doughnut"; data: ChartData; options: ChartOptions; label: string }>();
const canvas = ref<HTMLCanvasElement>();
let chart: Chart | undefined;

function render(): void {
  if (!canvas.value) return;
  const data = structuredClone({ labels: [...(props.data.labels ?? [])], datasets: props.data.datasets.map((dataset) => ({ ...dataset, data: [...dataset.data] })) });
  if (chart) {
    chart.data = data;
    chart.options = props.options;
    chart.update(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "none" : undefined);
  } else {
    chart = new Chart(canvas.value, { type: props.type, data, options: props.options });
  }
}

onMounted(render);
watch(() => [props.data, props.options], render, { deep: true });
onBeforeUnmount(() => chart?.destroy());
</script>
