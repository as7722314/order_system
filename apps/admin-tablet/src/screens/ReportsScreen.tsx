import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { adminApi } from "../api";
import { Button, Card, Empty, ErrorNotice, Field, Page, ui } from "../components/ui";
import type { DailyReport, MonthlyReport } from "../types";
import { errorMessage, money, taipeiDate, taipeiMonth } from "../utils";

function Summary({ report, label }: { report: DailyReport | MonthlyReport; label: string }) { const rows = [{ name: label, value: "date" in report ? report.date : report.month }, { name: "完成訂單", value: `${report.orderCount} 筆` }, { name: "營業額", value: money(report.totalRevenue) }, { name: "成本", value: money(report.totalExpense) }, { name: "淨利", value: money(report.netProfit) }]; return <View style={ui.gap}>{rows.map((row) => <View key={row.name} style={ui.spread}><Text style={ui.muted}>{row.name}</Text><Text style={row.name === "淨利" ? ui.strong : ui.body}>{row.value}</Text></View>)}</View>; }
export function ReportsScreen() {
  const [date, setDate] = useState(taipeiDate()); const [month, setMonth] = useState(taipeiMonth()); const [daily, setDaily] = useState<DailyReport | null>(null); const [monthly, setMonthly] = useState<MonthlyReport | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const loadDaily = async () => { setLoading(true); setError(""); try { setDaily(await adminApi.dailyReport(date)); } catch (reason) { setError(errorMessage(reason, "讀取日結報表失敗")); } finally { setLoading(false); } };
  const loadMonthly = async () => { setLoading(true); setError(""); try { setMonthly(await adminApi.monthlyReport(month)); } catch (reason) { setError(errorMessage(reason, "讀取月結報表失敗")); } finally { setLoading(false); } };
  return <Page title="報表" subtitle="檢視營業額、成本與淨利"><ErrorNotice message={error} /><View style={styles.columns}><Card style={styles.column}><Text style={ui.sectionTitle}>日結</Text><View style={ui.row}><Field label="日期" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} /><Button label="查詢日結" loading={loading} onPress={() => void loadDaily()} /></View>{daily ? <Summary report={daily} label="日期" /> : <Empty text="選擇日期後查詢" />}</Card><Card style={styles.column}><Text style={ui.sectionTitle}>月結</Text><View style={ui.row}><Field label="月份" placeholder="YYYY-MM" value={month} onChangeText={setMonth} /><Button label="查詢月結" loading={loading} onPress={() => void loadMonthly()} /></View>{monthly ? <Summary report={monthly} label="月份" /> : <Empty text="選擇月份後查詢" />}</Card></View>
    {monthly?.daily.length ? <Card><Text style={ui.sectionTitle}>月結每日明細</Text>{monthly.daily.map((row) => <View key={row.date} style={styles.dailyRow}><Text style={ui.title}>{row.date}</Text><Text style={ui.body}>營收 {money(row.revenue)}</Text><Text style={ui.body}>成本 {money(row.expense)}</Text><Text style={ui.strong}>淨利 {money(row.netProfit)}</Text></View>)}</Card> : null}
  </Page>;
}
const styles = StyleSheet.create({ columns: { flexDirection: "row", flexWrap: "wrap", gap: 16 }, column: { minWidth: 300, flex: 1 }, dailyRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e7e5e4" } });
