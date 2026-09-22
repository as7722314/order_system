import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { adminApi } from "../api";
import { Button, Card, Empty, ErrorNotice, Field, FormModal, Page, ToggleField, ui } from "../components/ui";
import type { Category } from "../types";
import { errorMessage } from "../utils";

const emptyForm = (): Partial<Category> => ({ name: "", sortOrder: 0, isActive: true });
export function CategoriesScreen() {
  const [items, setItems] = useState<Category[]>([]); const [form, setForm] = useState<Partial<Category>>(emptyForm()); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setItems(await adminApi.listCategories()); } catch (reason) { setError(errorMessage(reason, "讀取分類失敗")); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const edit = (item?: Category) => { setForm(item ? { ...item } : emptyForm()); setError(""); setOpen(true); };
  const save = async () => { if (!form.name?.trim()) { setError("請輸入分類名稱"); return; } setLoading(true); try { await adminApi.saveCategory({ ...form, name: form.name.trim(), sortOrder: Number(form.sortOrder || 0) }); setOpen(false); await load(); } catch (reason) { setError(errorMessage(reason, "儲存分類失敗")); setLoading(false); } };
  return <Page title="分類" subtitle="管理顧客端商品分類與顯示順序" refreshing={loading} onRefresh={() => void load()} action={<Button label="新增分類" onPress={() => edit()} />}><ErrorNotice message={error} />{items.length ? <View style={styles.grid}>{items.map((item) => <Card key={item.id} style={styles.item}><View style={ui.spread}><View><Text style={ui.strong}>{item.name}</Text><Text style={ui.muted}>排序 {item.sortOrder} · {item.isActive ? "啟用" : "停用"}</Text></View><Button label="編輯" variant="secondary" small onPress={() => edit(item)} /></View></Card>)}</View> : <Empty text="目前沒有分類" />}
    <FormModal visible={open} title={form.id ? "編輯分類" : "新增分類"} onClose={() => setOpen(false)}><View style={ui.row}><Field label="名稱" value={form.name || ""} onChangeText={(name) => setForm({ ...form, name })} /><Field label="排序" keyboardType="number-pad" value={String(form.sortOrder ?? 0)} onChangeText={(value) => setForm({ ...form, sortOrder: Number(value) || 0 })} /></View><ToggleField label="啟用" value={form.isActive ?? true} onValueChange={(isActive) => setForm({ ...form, isActive })} /><ErrorNotice message={error} /><View style={ui.actions}><Button label="取消" variant="secondary" onPress={() => setOpen(false)} /><Button label="儲存" loading={loading} onPress={() => void save()} /></View></FormModal>
  </Page>;
}
const styles = StyleSheet.create({ grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, item: { minWidth: 280, flexGrow: 1 } });
