import { useEffect, useRef, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import { adminApi } from "../api";
import type { DashboardCharts as ChartData, MonthlyReport, OrderStatus } from "../types";
import { colors } from "../theme";
import { errorMessage, money, shiftMonth, statusLabels } from "../utils";
import { Button, Card, Chip, Empty, ErrorNotice, FormModal, ui } from "./ui";

const palette = ["#b85d30", "#728568", "#c69d50", "#6d94a4", "#ab7d81", "#9e8e75", "#877a9d", "#87a693", "#d69972"];
const statusColors: Record<OrderStatus, string> = { PENDING: "#c99740", CONFIRMED: "#ab8861", PREPARING: "#b85d30", READY: "#6d94a4", COMPLETED: "#728568", CANCELLED: "#b7aaa0" };
const shortDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8))}`;
const compact = (value: string) => Number(value) >= 10000 ? `${Number((Number(value) / 10000).toFixed(1))}萬` : Number(value).toLocaleString("zh-TW");
const maxValue = (values: number[]) => { const maximum = Math.max(0, ...values); if (!maximum) return 100; const unit = 10 ** Math.floor(Math.log10(maximum)); return Math.ceil(maximum / unit) * unit; };

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: (width: number) => ReactNode }) {
  const [width, setWidth] = useState(0);
  return <Card style={styles.card}><Text style={ui.sectionTitle}>{title}</Text>{subtitle ? <Text style={ui.muted}>{subtitle}</Text> : null}<View style={styles.surface} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>{width > 0 ? children(width) : <Text style={ui.muted}>正在準備圖表…</Text>}</View></Card>;
}
function Tooltip({ date, label, value }: { date: string; label: string; value: number }) { return <View style={styles.tooltip}><Text style={styles.tipText}>{date}</Text><Text style={styles.tipText}>{label} {money(value)}</Text></View>; }
function Legend({ entries, currency = false }: { entries: { label: string; value: number; color: string }[]; currency?: boolean }) {
  const total = entries.reduce((sum, item) => sum + item.value, 0);
  return <View style={styles.legend}>{entries.map((item) => <View key={item.label} style={ui.spread}><View style={ui.row}><View style={[styles.dot, { backgroundColor: item.color }]} /><Text style={ui.muted}>{item.label}</Text></View><Text style={ui.body}>{currency ? money(item.value) : `${item.value} 筆`} · {total ? (item.value / total * 100).toFixed(1) : 0}%</Text></View>)}</View>;
}
function Donut({ entries, width, currency = false }: { entries: { label: string; value: number; color: string }[]; width: number; currency?: boolean }) {
  const total = entries.reduce((sum, item) => sum + item.value, 0);
  return <><View style={styles.donut}>{total ? <PieChart donut radius={Math.min(105, width / 2 - 18)} innerRadius={Math.min(68, width / 3 - 18)} innerCircleColor={colors.surface} focusOnPress showTooltip tooltipDuration={2500} data={entries.filter((item) => item.value > 0).map((item) => ({ value: item.value, color: item.color, tooltipText: `${item.label} ${currency ? money(item.value) : `${item.value} 筆`}` }))} centerLabelComponent={() => <View style={styles.center}><Text style={ui.strong}>{currency ? total.toLocaleString("zh-TW") : total}</Text><Text style={ui.muted}>{currency ? "成本合計 NT$" : "今日訂單"}</Text></View>} /> : <Empty text={currency ? "這個月尚無成本紀錄" : "今天尚無訂單"} />}</View><Legend entries={entries} currency={currency} /></>;
}

export function DashboardCharts({ date, revision }: { date: string; revision: number }) {
  const [overview, setOverview] = useState<ChartData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [overviewError, setOverviewError] = useState("");
  const [monthError, setMonthError] = useState("");
  const [days, setDays] = useState(7);
  const [month, setMonth] = useState(date.slice(0, 7));
  const [monthPicker, setMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(Number(date.slice(0, 4)));
  const [trendDetails, setTrendDetails] = useState(false);
  const [monthDetails, setMonthDetails] = useState(false);
  const overviewRequest = useRef(0), monthRequest = useRef(0);
  const loadOverview = async () => {
    const request = ++overviewRequest.current; setOverviewError("");
    try { const data = await adminApi.dashboardCharts(date); if (request === overviewRequest.current) setOverview(data); }
    catch (reason) { if (request === overviewRequest.current) { setOverview(null); setOverviewError(errorMessage(reason, "營運圖表讀取失敗")); } }
  };
  const loadMonth = async () => {
    const request = ++monthRequest.current; setMonthly((current) => current?.month === month ? current : null); setMonthError("");
    try { const data = await adminApi.monthlyReport(month); if (request === monthRequest.current) setMonthly(data); }
    catch (reason) { if (request === monthRequest.current) { setMonthly(null); setMonthError(errorMessage(reason, "每月圖表讀取失敗")); } }
  };
  useEffect(() => { setOverview((current) => current?.date === date ? current : null); void loadOverview(); return () => { overviewRequest.current++; }; }, [date, revision]);
  useEffect(() => { void loadMonth(); return () => { monthRequest.current++; }; }, [month, revision]);
  const points = overview?.daily.slice(-days) ?? [];
  const trendTotal = points.reduce((sum, item) => sum + item.revenue, 0);
  const statuses = (Object.keys(statusLabels) as OrderStatus[]).map((status) => ({ label: statusLabels[status], value: overview?.orderStatuses.find((item) => item.status === status)?.count ?? 0, color: statusColors[status] }));
  const categories = monthly?.expenseCategories?.map((item, index) => ({ label: item.category, value: item.amount, color: palette[index % palette.length]! })) ?? [];
  const moveMonth = (offset: number) => { const next = shiftMonth(month, offset); if (next) setMonth(next); };
  const lineData = points.map((item, index) => ({ value: item.revenue, dataPointLabelShiftX: index < (days === 30 ? 4 : 2) ? 85 : index >= points.length - (days === 30 ? 4 : 2) ? -70 : 0, label: days === 7 || index % 5 === 0 || index === points.length - 1 ? shortDate(item.date) : "", labelComponent: () => <Text style={[styles.axis, { width: 42, alignSelf: "center", textAlign: "center" }]}>{days === 7 || index % 5 === 0 || index === points.length - 1 ? shortDate(item.date) : ""}</Text>, dataPointLabelComponent: () => <Tooltip date={item.date} label="營業額" value={item.revenue} /> }));
  const bars = monthly?.daily.flatMap((item, index) => [
    { value: item.revenue, frontColor: palette[0], label: index % 5 === 0 ? shortDate(item.date) : "", spacing: 2, date: item.date, series: "營業額" },
    { value: item.expense, frontColor: palette[1], spacing: 9, date: item.date, series: "成本" }
  ]) ?? [];
  return <View style={ui.gap}>
    <Text style={ui.sectionTitle}>營運趨勢</Text><ErrorNotice message={overviewError} />{overviewError ? <Button label="重新載入營運圖表" variant="secondary" onPress={() => void loadOverview()} /> : null}
    <View style={styles.grid}>
      <ChartCard title="營業額趨勢" subtitle="依已完成訂單的完成時間統計">{(width) => <View style={ui.gap}><View style={ui.row}>{[7, 30].map((value) => <Chip key={value} label={`近 ${value} 天`} selected={days === value} onPress={() => setDays(value)} />)}</View>{overview ? <><Text style={styles.amount}>{money(trendTotal)}</Text><Text style={ui.muted}>{points[0]?.date} — {points.at(-1)?.date}</Text><LineChart key={days} data={lineData} width={Math.max(180, width - 60)} height={190} spacing={Math.max(18, (width - 90) / Math.max(1, points.length - 1))} initialSpacing={12} endSpacing={20} maxValue={maxValue(points.map((item) => item.revenue))} noOfSections={4} color={colors.accent} dataPointsColor={colors.accent} areaChart startFillColor={colors.accent} startOpacity={.15} endOpacity={0} rulesColor={colors.border} yAxisColor={colors.border} xAxisColor={colors.border} xAxisLabelTextStyle={styles.axis} yAxisTextStyle={styles.axis} formatYLabel={compact} focusEnabled showDataPointLabelOnFocus showStripOnFocus dataPointLabelWidth={170} />{!trendTotal ? <Text style={ui.muted}>此區間尚無已完成訂單。</Text> : null}<Button label={trendDetails ? "收合每日數據" : "查看每日數據"} variant="ghost" small onPress={() => setTrendDetails(!trendDetails)} />{trendDetails ? points.map((item) => <View key={item.date} style={ui.spread}><Text style={ui.muted}>{item.date}</Text><Text style={ui.body}>{money(item.revenue)}</Text></View>) : null}</> : <Empty text={overviewError ? "圖表暫時無法載入" : "正在整理營業趨勢…"} />}</View>}</ChartCard>
      <ChartCard title="今日訂單狀態" subtitle={`${date} 建立的訂單；已排除已刪除訂單`}>{(width) => overview ? <Donut entries={statuses} width={width} /> : <Empty text={overviewError ? "圖表暫時無法載入" : "正在整理訂單狀態…"} />}</ChartCard>
    </View>
    <View style={ui.spread}><Text style={ui.sectionTitle}>每月營業額與成本</Text><View style={ui.row}><Button label="上個月" small variant="secondary" onPress={() => moveMonth(-1)} /><Button label={month} small variant="secondary" onPress={() => { setPickerYear(Number(month.slice(0, 4))); setMonthPicker(true); }} /><Button label="下個月" small variant="secondary" disabled={month >= date.slice(0, 7)} onPress={() => moveMonth(1)} /></View></View>
    <ErrorNotice message={monthError} />{monthError ? <Button label="重新載入每月圖表" variant="secondary" onPress={() => void loadMonth()} /> : null}
    <View style={styles.grid}>
      <ChartCard title="營業額與成本比較" subtitle={`${month} · 成本為成本管理登錄的金額合計`}>{(width) => monthly ? <View style={ui.gap}><View style={ui.spread}><View><Text style={ui.muted}>營業額合計</Text><Text style={ui.strong}>{money(monthly.totalRevenue)}</Text></View><View><Text style={ui.muted}>成本合計</Text><Text style={ui.strong}>{money(monthly.totalExpense)}</Text></View></View><BarChart data={bars} labelWidth={42} width={Math.max(180, width - 60)} height={190} barWidth={9} initialSpacing={12} maxValue={maxValue(monthly.daily.flatMap((item) => [item.revenue, item.expense]))} noOfSections={4} rulesColor={colors.border} yAxisColor={colors.border} xAxisColor={colors.border} xAxisLabelTextStyle={styles.axis} yAxisTextStyle={styles.axis} formatYLabel={compact} autoCenterTooltip renderTooltip={(item: { value: number; date: string; series: string }) => <Tooltip date={item.date} label={item.series} value={item.value} />} /><View style={ui.row}><Text style={{ color: palette[0] }}>● 營業額</Text><Text style={{ color: palette[1] }}>● 成本</Text></View><Button label={monthDetails ? "收合每月數據" : "查看每月數據"} variant="ghost" small onPress={() => setMonthDetails(!monthDetails)} />{monthDetails ? monthly.daily.map((item) => <View key={item.date} style={styles.detail}><Text style={ui.muted}>{item.date}</Text><Text style={ui.body}>營業額 {money(item.revenue)} · 成本 {money(item.expense)}</Text></View>) : null}</View> : <Empty text={monthError ? "圖表暫時無法載入" : "正在整理每月紀錄…"} />}</ChartCard>
      <ChartCard title="成本分類" subtitle={`${month} 已登錄成本的分布`}>{(width) => monthly ? Array.isArray(monthly.expenseCategories) ? <Donut entries={categories} width={width} currency /> : <Empty text="成本分類暫時無法載入，請重新整理。" /> : <Empty text={monthError ? "圖表暫時無法載入" : "正在整理成本分類…"} />}</ChartCard>
    </View><Text style={ui.muted}>點選圖表查看數值，長圖可左右滑動。</Text>
    <FormModal visible={monthPicker} title="選擇圖表月份" onClose={() => setMonthPicker(false)}><View style={ui.spread}><Button label="上一年" variant="secondary" disabled={pickerYear <= 1900} onPress={() => setPickerYear(pickerYear - 1)} /><Text style={ui.strong}>{pickerYear} 年</Text><Button label="下一年" variant="secondary" disabled={pickerYear >= Number(date.slice(0, 4))} onPress={() => setPickerYear(pickerYear + 1)} /></View><View style={ui.row}>{Array.from({ length: 12 }, (_, index) => { const value = `${pickerYear}-${String(index + 1).padStart(2, "0")}`; return <Chip key={value} label={`${index + 1} 月`} selected={month === value} onPress={value > date.slice(0, 7) ? undefined : () => { setMonth(value); setMonthPicker(false); }} />; })}</View></FormModal>
  </View>;
}

const styles = StyleSheet.create({ grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 }, card: { flexBasis: "48%", flexGrow: 1, flexShrink: 1, minWidth: 280 }, surface: { width: "100%" }, amount: { color: colors.text, fontSize: 27, fontWeight: "800" }, donut: { alignItems: "center", paddingVertical: 20 }, center: { alignItems: "center", gap: 4 }, legend: { gap: 10, marginTop: 14, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 }, dot: { width: 8, height: 8, borderRadius: 4 }, axis: { color: colors.textMuted, fontSize: 10 }, tooltip: { padding: 10, borderRadius: 10, backgroundColor: "#49382b", minWidth: 150 }, tipText: { color: "white", fontSize: 12 }, detail: { gap: 4, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border } });
