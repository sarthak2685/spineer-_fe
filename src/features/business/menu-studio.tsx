import { FormEvent, useEffect, useState } from 'react';
import { api, asset } from '../../api/client';
import { Button, Field, Form, Modal, PageTitle, RowMenu, Select, Table } from '../../components/ui';
import { catalogCopy } from '../../lib/catalog';
import { toastOk } from '../../lib/toast';

type Priced = { name: string; price: string };
type PriceMode = 'single' | 'half' | 'custom';

const emptyRow = (): Priced => ({ name: '', price: '' });

function rowsFrom(list: { optionname?: string; addonname?: string; price?: string | number }[] | undefined, kind: 'option' | 'addon') {
  return (list || []).map((row) => ({ name: String(kind === 'option' ? row.optionname : row.addonname || ''), price: String(row.price ?? '') }));
}

export function MenuStudio() {
  const [tick, setTick] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [kind, setKind] = useState('');
  const copy = catalogCopy(kind);

  function load() {
    api<any[]>('/business/menu/categories').then(setCategories);
    api<any[]>('/business/menu/items').then(setItems);
    api<any>('/business/profile').then((profile) => setKind(profile?.typename || profile?.businesstype || '')).catch(() => undefined);
  }
  useEffect(load, [tick]);

  function openCategory(row?: any) {
    setEditingCategory(row || null);
    setCategoryOpen(true);
  }
  const [itemTab, setItemTab] = useState<'one' | 'bulk'>('one');
  function openItem(row?: any, tab: 'one' | 'bulk' = 'one') {
    setEditingItem(row || null);
    setItemTab(row ? 'one' : tab);
    setItemOpen(true);
  }

  return (
    <>
      <PageTitle
        title={copy.pageTitle}
        text={copy.pageText}
        actions={(
          <div className="flex gap-2">
            <Button kind="ghost" onClick={() => openCategory()}>{copy.addCategory}</Button>
            <Button onClick={() => openItem()}>{copy.addItem}</Button>
          </div>
        )}
      />
      <div className="space-y-6">
        <Table
          variant="card"
          title={copy.categoriesTitle}
          empty={copy.emptyCategories}
          rows={categories}
          columns={[
            { key: 'categoryname', label: 'Category', render: (row) => <button type="button" className="font-semibold text-orange-600" onClick={() => openCategory(row)}>{row.categoryname}</button> },
            { key: 'items', label: 'Items', render: (row) => items.filter((item) => item.categoryid === row.categoryid).length },
            { key: 'actions', label: '', render: (row) => <RowMenu items={[{ label: 'Edit', onClick: () => openCategory(row) }, { label: 'Delete', danger: true, onClick: () => api(`/business/menu/categories/${row.categoryid}/delete`, { method: 'POST' }).then(() => { toastOk('Category removed.'); setTick((value) => value + 1); }) }]} /> },
          ]}
        />
        <Table
          variant="card"
          title={copy.itemsTitle}
          empty={copy.emptyItems}
          rows={items}
          toolbar={<button type="button" className="text-sm font-semibold text-stone-500" onClick={() => openItem(undefined, 'bulk')}>Bulk upload</button>}
          columns={[
            { key: 'itemname', label: 'Item', render: (row) => (
              <button type="button" className="flex items-center gap-2 text-left font-semibold text-orange-600" onClick={() => openItem(row)}>
                {row.imagepath ? <img alt="" src={asset(row.imagepath)} className="h-9 w-9 rounded-lg object-cover" /> : null}
                <span>{row.itemname}</span>
              </button>
            ) },
            { key: 'category', label: 'Category', render: (row) => categories.find((category) => category.categoryid === row.categoryid)?.categoryname || '—' },
            { key: 'price', label: 'Price', render: (row) => row.options?.length ? `From ₹${Number(row.price).toFixed(0)}` : `₹${Number(row.price).toFixed(0)}` },
            { key: 'extras', label: 'Type', render: (row) => [row.options?.length ? `${row.options.length} choices` : '', row.addons?.length ? `${row.addons.length} extras` : ''].filter(Boolean).join(' · ') || 'One price' },
            { key: 'actions', label: '', render: (row) => <RowMenu items={[{ label: 'Edit', onClick: () => openItem(row) }, { label: 'Delete', danger: true, onClick: () => api(`/business/menu/items/${row.itemid}/delete`, { method: 'POST' }).then(() => { toastOk('Item removed.'); setTick((value) => value + 1); }) }]} /> },
          ]}
        />
      </div>
      {categoryOpen && <CategoryModal copy={copy} editing={editingCategory} onClose={() => setCategoryOpen(false)} onSaved={() => { setCategoryOpen(false); setTick((value) => value + 1); }} />}
      {itemOpen && <ItemModal copy={copy} categories={categories} editing={editingItem} initialTab={itemTab} onClose={() => setItemOpen(false)} onSaved={() => { setItemOpen(false); setTick((value) => value + 1); }} />}
    </>
  );
}

export function CategoriesPage() { return <MenuStudio />; }
export function ItemsPage() { return <MenuStudio />; }

function CategoryModal({ copy, editing, onClose, onSaved }: { copy: ReturnType<typeof catalogCopy>; editing: any; onClose: () => void; onSaved: () => void }) {
  return (
    <Modal title={editing ? `Edit ${copy.categoriesTitle.toLowerCase()}` : copy.addCategory} text={copy.categoryHelp} onClose={onClose}>
      <Form onSubmit={(event) => {
        event.preventDefault();
        const body = Object.fromEntries(new FormData(event.currentTarget).entries());
        return api('/business/menu/categories', { method: 'POST', body: JSON.stringify(body) }).then(() => { toastOk(editing ? 'Category updated.' : 'Category added.'); onSaved(); });
      }} className="space-y-3">
        {editing && <input type="hidden" name="id" value={editing.categoryid} />}
        <Field label="Name" name="categoryName" defaultValue={editing?.categoryname} required />
        <Button type="submit" className="w-full">{editing ? 'Save category' : 'Add category'}</Button>
      </Form>
    </Modal>
  );
}

function ItemModal({ copy, categories, editing, initialTab = 'one', onClose, onSaved }: { copy: ReturnType<typeof catalogCopy>; categories: any[]; editing: any; initialTab?: 'one' | 'bulk'; onClose: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<'one' | 'bulk'>(editing ? 'one' : initialTab);
  const existing = rowsFrom(editing?.options, 'option');
  const half = existing.find((row) => /^half$/i.test(row.name));
  const full = existing.find((row) => /^full$/i.test(row.name));
  const halfPair = Boolean(copy.food && half && full && existing.length === 2);
  const customStart = existing.length > 0 && !halfPair;
  const [mode, setMode] = useState<PriceMode>(halfPair ? 'half' : customStart ? 'custom' : 'single');
  const [choices, setChoices] = useState<Priced[]>(customStart ? existing : [emptyRow()]);
  const [addons, setAddons] = useState<Priced[]>(rowsFrom(editing?.addons, 'addon').length ? rowsFrom(editing?.addons, 'addon') : []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const halfPrice = String(form.get('halfPrice') || '');
    const fullPrice = String(form.get('fullPrice') || '');
    let options: Priced[] = [];
    if (mode === 'half') options = [{ name: 'Half', price: halfPrice }, { name: 'Full', price: fullPrice }];
    if (mode === 'custom') options = choices.filter((row) => row.name.trim() && Number(row.price) > 0);
    if (mode === 'single') form.set('price', String(form.get('price') || ''));
    else form.set('price', options[0]?.price || '0');
    form.set('options', JSON.stringify(options.map((row) => ({ name: row.name.trim(), price: Number(row.price) }))));
    form.set('addons', JSON.stringify(addons.filter((row) => row.name.trim()).map((row) => ({ name: row.name.trim(), price: Number(row.price) || 0 }))));
    await api('/business/menu/items', { method: 'POST', body: form });
    toastOk(editing ? `${copy.editItem} saved.` : `${copy.addItem} saved.`);
    onSaved();
  }

  return (
    <Modal wide title={editing ? copy.editItem : copy.addItem} text={tab === 'bulk' ? 'Upload a CSV. Columns: Category, Item, Price, Description. New categories are created from the file.' : copy.itemHelp} onClose={onClose}>
      {!editing && (
        <div className="mb-4 grid grid-cols-2 rounded-xl bg-stone-100 p-1">
          <button type="button" className={`h-10 rounded-lg text-sm font-semibold ${tab === 'one' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500'}`} onClick={() => setTab('one')}>Add one</button>
          <button type="button" className={`h-10 rounded-lg text-sm font-semibold ${tab === 'bulk' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500'}`} onClick={() => setTab('bulk')}>Bulk upload</button>
        </div>
      )}
      {tab === 'bulk' && !editing ? <BulkUpload onSaved={onSaved} /> : (
      <Form onSubmit={save} className="space-y-3">
        {editing && <input type="hidden" name="id" value={editing.itemid} />}
        <Field label="Name" name="itemName" defaultValue={editing?.itemname} required />
        <Select label="Category" name="categoryId" defaultValue={editing?.categoryid} required>
          <option value="">Select</option>
          {categories.map((category) => <option key={category.categoryid} value={category.categoryid}>{category.categoryname}</option>)}
        </Select>
        <label className="block text-sm"><span className="mb-1.5 block font-medium text-stone-500">Description</span><textarea name="description" defaultValue={editing?.description || ''} rows={2} className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" /></label>
        <label className="block text-sm"><span className="mb-1.5 block font-medium text-stone-500">Photo</span><input className="block w-full text-sm" type="file" name="image" accept="image/png,image/jpeg,image/webp" /></label>
        <div>
          <p className="mb-1.5 text-sm font-medium text-stone-500">Price type</p>
          <div className={`grid gap-2 ${copy.food ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {(copy.food ? ([['single', 'One price'], ['half', 'Half / full'], ['custom', 'Options']] as const) : ([['single', 'One price'], ['custom', 'Choices']] as const)).map(([value, label]) => (
              <button key={value} type="button" className={`rounded-xl border px-2 py-2 text-xs font-semibold ${mode === value ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-stone-200 text-stone-500'}`} onClick={() => setMode(value)}>{label}</button>
            ))}
          </div>
        </div>
        {mode === 'single' && <Field label="Price" name="price" defaultValue={editing?.price} required />}
        {mode === 'half' && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Half price" name="halfPrice" defaultValue={half?.price} required />
            <Field label="Full price" name="fullPrice" defaultValue={full?.price || editing?.price} required />
          </div>
        )}
        {mode === 'custom' && (
          <div className="space-y-2">
            {choices.map((row, index) => (
              <div key={index} className="grid grid-cols-[1fr_7rem_auto] gap-2">
                <input value={row.name} onChange={(event) => setChoices((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder={copy.optionPlaceholder} className="h-11 rounded-xl border border-stone-200 px-3 text-sm" />
                <input value={row.price} onChange={(event) => setChoices((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item))} placeholder="Price" inputMode="decimal" className="h-11 rounded-xl border border-stone-200 px-3 text-sm" />
                <button type="button" className="text-sm text-stone-400" onClick={() => setChoices((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
              </div>
            ))}
            <button type="button" className="text-sm font-semibold text-orange-600" onClick={() => setChoices((current) => [...current, emptyRow()])}>Add option</button>
          </div>
        )}
        <div className="rounded-2xl bg-stone-50 p-3">
          <p className="text-sm font-semibold text-stone-700">{copy.addonTitle}</p>
          <p className="mt-1 text-xs text-stone-500">{copy.addonHelp}</p>
          <div className="mt-2 space-y-2">
            {addons.map((row, index) => (
              <div key={index} className="grid grid-cols-[1fr_7rem_auto] gap-2">
                <input value={row.name} onChange={(event) => setAddons((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder={copy.addonPlaceholder} className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm" />
                <input value={row.price} onChange={(event) => setAddons((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: event.target.value } : item))} placeholder="+20" inputMode="decimal" className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm" />
                <button type="button" className="text-sm text-stone-400" onClick={() => setAddons((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
              </div>
            ))}
            <button type="button" className="text-sm font-semibold text-orange-600" onClick={() => setAddons((current) => [...current, emptyRow()])}>Add an extra</button>
          </div>
        </div>
        <Button type="submit" className="w-full">{editing ? 'Save item' : 'Add to menu'}</Button>
      </Form>
      )}
    </Modal>
  );
}

function BulkUpload({ onSaved }: { onSaved: () => void }) {
  function sampleCsv() {
    const csv = 'Category,Item,Price,Description\nStarters,Paneer Tikka,220,Char-grilled cottage cheese\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'menu-sample.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Form className="space-y-3" onSubmit={async (event) => {
      event.preventDefault();
      const body = new FormData(event.currentTarget);
      const result = await api<{ created: number; categoriesCreated: number }>('/business/menu/items/import', { method: 'POST', body });
      toastOk(`Added ${result.created} items${result.categoriesCreated ? ` and ${result.categoriesCreated} categories` : ''}.`);
      onSaved();
    }}>
      <input className="block w-full rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-6 text-sm" type="file" name="file" accept=".csv,text/csv,.txt" required />
      <div className="flex gap-2">
        <Button type="submit">Upload</Button>
        <Button type="button" kind="ghost" onClick={sampleCsv}>Sample file</Button>
      </div>
    </Form>
  );
}
