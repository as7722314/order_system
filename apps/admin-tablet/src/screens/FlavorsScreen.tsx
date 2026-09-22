import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { adminApi } from "../api";
import { Button, Card, Empty, ErrorNotice, Field, FormModal, Page, ToggleField, ui } from "../components/ui";
import type { Flavor } from "../types";
import { errorMessage, money } from "../utils";

const fresh = (): Partial<Flavor> => ({ name: "", extraPrice: 0, sortOrder: 0, isActive: true });
export function FlavorsScreen() {
  const [items, setItems] = useState<Flavor[]>([]); const [form, setForm] = useState<Partial<Flavor>>(fresh()); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setItems(await adminApi.listFlavors()); } catch (reason) { setError(errorMessage(reason, "讀取口味失敗")); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const edit = (item?: Flavor) => { setForm(item ? { ...item } : fresh()); setError(""); setOpen(true); };
  const save = async () => { if (!form.name?.trim()) { setError("請輸入口味名稱"); return; } setLoading(true); try { await adminApi.saveFlavor({ ...form, name: form.name.trim(), extraPrice: Number(form.extraPrice || 0), sortOrder: Number(form.sortOrder || 0) }); setOpen(false); await load(); } catch (reason) { setError(errorMessage(reason, "儲存口味失敗")); setLoading(false); } };
  return <Page title="口味" subtitle="設定品項可選口味、加價與顯示順序" refreshing={loading} onRefresh={() => void load()} action={<Button label="新增口味" onPress={() => edit()} />}><ErrorNotice message={error} />{items.length ? <View style={styles.grid}>{items.map((item) => <Card key={item.id} style={styles.item}><View style={ui.spread}><View style={ui.gap}><Text style={ui.strong}>{item.name}</Text><Text style={ui.muted}>{money(item.extraPrice)} · 排序 {item.sortOrder} · {item.isActive ? "啟用" : "停用"}</Text></View><Button label="編輯" variant="secondary" small onPress={() => edit(item)} /></View></Card>)}</View> : <Empty text="目前沒有口味" />}
    <FormModal visible={open} title={form.id ? "編輯口味" : "新增口味"} onClose={() => setOpen(false)}><View style={ui.row}><Field label="名稱" value={form.name || ""} onChangeText={(name) => setForm({ ...form, name })} /><Field label="加價" keyboardType="number-pad" value={String(form.extraPrice ?? 0)} onChangeText={(value) => setForm({ ...form, extraPrice: Number(value) || 0 })} /><Field label="排序" keyboardType="number-pad" value={String(form.sortOrder ?? 0)} onChangeText={(value) => setForm({ ...form, sortOrder: Number(value) || 0 })} /></View><ToggleField label="啟用" value={form.isActive ?? true} onValueChange={(isActive) => setForm({ ...form, isActive })} /><ErrorNotice message={error} /><View style={ui.actions}><Button label="取消" variant="secondary" onPress={() => setOpen(false)} /><Button label="儲存" loading={loading} onPress={() => void save()} /></View></FormModal>
  </Page>;
}
const styles = StyleSheet.create({ grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, item: { minWidth: 300, flexGrow: 1 } });
