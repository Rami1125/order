import React, { useState } from 'react';
import { LogisticsProduct } from '../types';
import { Package, Plus, Edit3, Trash2, Save, X, Search, Check, RefreshCw, Sparkles, FileText, Image as ImageIcon } from 'lucide-react';

interface CatalogManagerProps {
  products: LogisticsProduct[];
  onUpdateProducts: (products: LogisticsProduct[]) => void;
  hidePricing?: boolean;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({
  products,
  onUpdateProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Editing state
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LogisticsProduct>>({});

  // New product modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState<Partial<LogisticsProduct>>({
    code: '',
    name: '',
    category: 'חומרי מליאה ובלות',
    unit: 'בלה',
    description: '',
    applicationGuide: '',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400',
  });

  const [savingMsg, setSavingMsg] = useState('');

  // Extract unique categories
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.includes(searchTerm) || p.code.includes(searchTerm) || p.description.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Start Editing
  const handleStartEdit = (p: LogisticsProduct) => {
    setEditingProdId(p.id);
    setEditForm({ ...p });
  };

  // Save Editing
  const handleSaveEdit = async () => {
    if (!editingProdId || !editForm.name) return;

    const updatedProd: LogisticsProduct = {
      id: editingProdId,
      code: editForm.code || 'PRD-000',
      name: editForm.name || 'מוצר חדש',
      category: (editForm.category as any) || 'חומרי מליאה ובלות',
      unit: (editForm.unit as any) || 'בלה',
      description: editForm.description || '',
      applicationGuide: editForm.applicationGuide || '',
      imageUrl: editForm.imageUrl || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400',
      inStock: editForm.inStock ?? true,
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProd),
      });

      const data = await res.json();
      if (data.success && data.products) {
        onUpdateProducts(data.products);
      } else {
        onUpdateProducts(products.map((p) => (p.id === editingProdId ? updatedProd : p)));
      }

      setEditingProdId(null);
      setSavingMsg('המוצר עודכן בהצלחה במילון הלוגיסטי ובשרת!');
      setTimeout(() => setSavingMsg(''), 2500);
    } catch {
      alert('שגיאה בעדכון המוצר');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (prodId: string, name: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המוצר "${name}" מהקטלוג?`)) return;

    try {
      const res = await fetch(`/api/products/${prodId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success && data.products) {
        onUpdateProducts(data.products);
      } else {
        onUpdateProducts(products.filter((p) => p.id !== prodId));
      }

      setSavingMsg('המוצר נמחק בהצלחה מהקטלוג!');
      setTimeout(() => setSavingMsg(''), 2500);
    } catch {
      alert('שגיאה במחיקת המוצר');
    }
  };

  // Create Product
  const handleCreateProduct = async () => {
    if (!newForm.name || !newForm.code) {
      alert('נא למלא שם מוצר וקוד מוצר');
      return;
    }

    const newProd: LogisticsProduct = {
      id: `prod_${Date.now()}`,
      code: newForm.code,
      name: newForm.name,
      category: (newForm.category as any) || 'חומרי מליאה ובלות',
      unit: (newForm.unit as any) || 'בלה',
      description: newForm.description || '',
      applicationGuide: newForm.applicationGuide || '',
      imageUrl: newForm.imageUrl || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400',
      inStock: true,
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd),
      });

      const data = await res.json();
      if (data.success && data.products) {
        onUpdateProducts(data.products);
      } else {
        onUpdateProducts([newProd, ...products]);
      }

      setShowAddModal(false);
      setNewForm({
        code: '',
        name: '',
        category: 'חומרי מליאה ובלות',
        unit: 'בלה',
        description: '',
        applicationGuide: '',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400',
      });

      setSavingMsg('מוצר חדש נוצר והתווסף למילון הלוגיסטי!');
      setTimeout(() => setSavingMsg(''), 2500);
    } catch {
      alert('שגיאה ביצירת מוצר חדש');
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>מילון לוגיסטי - ניהול קטלוג ומפרטים טכניים בזמן אמת</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            עריכה, הוספה ומחיקה דינאמית של מוצרים, קטגוריות והוראות יישום במערכת
          </p>
        </div>

        {savingMsg && (
          <span className="bg-green-100 text-green-800 border border-green-300 text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 animate-bounce">
            <Check className="w-4 h-4 text-green-700" />
            {savingMsg}
          </span>
        )}

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>הוסף מוצר חדש לקטלוג</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-2.5 right-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש לפי קוד, שם מוצר או תיאור..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 font-medium focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-hidden"
        >
          <option value="all">כל הקטגוריות ({products.length})</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-xs text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-bold">
              <th className="p-3">קוד מוצר (A-B)</th>
              <th className="p-3">שם מוצר (C)</th>
              <th className="p-3">קטגוריה (D)</th>
              <th className="p-3">יחידה (E)</th>
              <th className="p-3">תמונת_מוצר (עמודה F)</th>
              <th className="p-3">הנחיות יישום ומפרט (עמודה G)</th>
              <th className="p-3 text-center">פעולות עריכה</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
            {filteredProducts.map((p) => {
              const isEditing = editingProdId === p.id;

              return (
                <React.Fragment key={p.id}>
                  <tr className={isEditing ? 'bg-blue-50/80 font-bold' : 'hover:bg-slate-50 transition-colors'}>
                    <td className="p-3 font-mono font-extrabold text-slate-700">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.code ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                          className="bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs w-24 font-mono font-bold"
                        />
                      ) : (
                        p.code
                      )}
                    </td>

                    <td className="p-3 font-bold text-slate-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs w-full font-bold"
                        />
                      ) : (
                        <span>{p.name}</span>
                      )}
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.category ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs w-28"
                        />
                      ) : (
                        <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md font-semibold">
                          {p.category}
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.unit ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                          className="bg-white border border-blue-400 rounded-lg px-2 py-1 text-xs w-16"
                        />
                      ) : (
                        p.unit
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {p.imageUrl ? (
                          <>
                            <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" />
                            <a href={p.imageUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 underline font-mono truncate max-w-[120px]" title={p.imageUrl}>
                              תמונה
                            </a>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">אין תמונה</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-slate-600 max-w-xs">
                      <p className="line-clamp-2 text-[11px] font-medium">{p.applicationGuide || p.description}</p>
                    </td>

                    <td className="p-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold p-1.5 rounded-lg text-xs cursor-pointer shadow-2xs"
                            title="שמור מוצר"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingProdId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold p-1.5 rounded-lg text-xs cursor-pointer"
                            title="ביטול"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStartEdit(p)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold p-1.5 rounded-lg text-xs cursor-pointer"
                            title="ערוך מוצר"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold p-1.5 rounded-lg text-xs cursor-pointer"
                            title="מחק מוצר"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Expandable row for Description and Application Guide edit when active */}
                  {isEditing && (
                    <tr className="bg-blue-50/40">
                      <td colSpan={7} className="p-3 border-t border-blue-200 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">תיאור מוצר:</label>
                            <textarea
                              value={editForm.description ?? ''}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              rows={2}
                              className="w-full bg-white border border-blue-300 rounded-lg p-2 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">הנחיות יישום בשטח:</label>
                            <textarea
                              value={editForm.applicationGuide ?? ''}
                              onChange={(e) => setEditForm({ ...editForm, applicationGuide: e.target.value })}
                              rows={2}
                              className="w-full bg-white border border-blue-300 rounded-lg p-2 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-0.5">קישור לתמונה (URL):</label>
                            <input
                              type="text"
                              value={editForm.imageUrl ?? ''}
                              onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                              className="w-full bg-white border border-blue-300 rounded-lg p-2 text-xs font-mono"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* NEW PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl dir-rtl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>הוספת מוצר חדש למילון הלוגיסטי</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">קוד מוצר (מק"ט):</label>
                  <input
                    type="text"
                    value={newForm.code}
                    onChange={(e) => setNewForm({ ...newForm, code: e.target.value })}
                    placeholder="לדוגמה: PRD-305"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">שם מוצר מלא:</label>
                  <input
                    type="text"
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    placeholder="לדוגמה: טיח תרמי חוץ 100"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">קטגוריה:</label>
                  <input
                    type="text"
                    value={newForm.category}
                    onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">יחידת מידה:</label>
                  <input
                    type="text"
                    value={newForm.unit}
                    onChange={(e) => setNewForm({ ...newForm, unit: e.target.value })}
                    placeholder="בלה / שק / דלי / יחידה"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">תיאור מוצר:</label>
                <textarea
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  rows={2}
                  placeholder="תיאור מפורט למכירות וללקוחות..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">הנחיות יישום בשטח:</label>
                <textarea
                  value={newForm.applicationGuide}
                  onChange={(e) => setNewForm({ ...newForm, applicationGuide: e.target.value })}
                  rows={2}
                  placeholder="הוראות תערובת, הכנת תשתית ויישום..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">תמונה (URL):</label>
                <input
                  type="text"
                  value={newForm.imageUrl}
                  onChange={(e) => setNewForm({ ...newForm, imageUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleCreateProduct}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
              >
                צור מוצר חדש
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
