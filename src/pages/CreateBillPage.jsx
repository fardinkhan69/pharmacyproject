import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatTaka } from '../utils/medicineUtils';
import { Search, Plus, Trash2, Receipt, AlertCircle, ShoppingBag } from 'lucide-react';

export default function CreateBillPage() {
  const [allMedicines, setAllMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadAvailableMedicines();
  }, []);

  const loadAvailableMedicines = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('is_active', true)
      .gt('quantity', 0)
      .gte('expiry_date', today)
      .order('name');

    if (!error) setAllMedicines(data || []);
  };

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const q = search.toLowerCase();
    const selectedIds = new Set(selectedItems.map((i) => i.medicine_id));
    const results = allMedicines.filter(
      (m) =>
        !selectedIds.has(m.id) &&
        (m.name.toLowerCase().includes(q) || m.generic_name.toLowerCase().includes(q))
    );
    setSearchResults(results.slice(0, 8));
  }, [search, allMedicines, selectedItems]);

  const addMedicine = (medicine) => {
    setSelectedItems((prev) => [
      ...prev,
      {
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        unit_price: medicine.selling_price,
        available_stock: medicine.quantity,
        quantity: 1,
        line_total: medicine.selling_price,
      },
    ]);
    setSearch('');
    setSearchResults([]);
  };

  const updateQuantity = (medicine_id, rawValue) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.medicine_id !== medicine_id) return item;
        const qty = parseInt(rawValue, 10);
        const validQty = isNaN(qty) || qty < 1 ? 1 : Math.min(qty, item.available_stock);
        return {
          ...item,
          quantity: isNaN(qty) ? rawValue : validQty,
          line_total: (isNaN(qty) ? 0 : validQty) * item.unit_price,
        };
      })
    );
  };

  const removeItem = (medicine_id) => {
    setSelectedItems((prev) => prev.filter((i) => i.medicine_id !== medicine_id));
  };

  const grandTotal = selectedItems.reduce((sum, i) => sum + (i.line_total || 0), 0);

  const hasValidItems = selectedItems.length > 0 && selectedItems.every((i) => {
    const qty = parseInt(i.quantity, 10);
    return !isNaN(qty) && qty >= 1 && qty <= i.available_stock;
  });

  const handleGenerate = async () => {
    if (!hasValidItems) return;
    setError('');
    setSubmitting(true);

    const items = selectedItems.map((i) => ({
      medicine_id: i.medicine_id,
      quantity: parseInt(i.quantity, 10),
    }));

    const { data, error } = await supabase.rpc('create_bill', { items });

    if (error) {
      setError(error.message || 'Failed to generate bill. Please try again.');
      setSubmitting(false);
      return;
    }

    navigate(`/bills/${data}`);
  };

  return (
    <div className="page">
      {error && (
        <div className="alert alert-error" id="bill-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Bill Builder Card */}
      <div className="bill-builder-card">
        {/* Search & Add Bar */}
        <div>
          <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
            Find & Add Medicine to Bill
          </label>
          <div style={{ position: 'relative' }}>
            <div className="search-input-wrapper" style={{ maxWidth: '100%' }}>
              <span className="search-input-icon">
                <Search size={16} />
              </span>
              <input
                id="bill-medicine-search"
                type="text"
                className="search-input"
                placeholder="Type product name or generic formula (e.g. Paracetamol)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="search-dropdown-menu" id="medicine-search-results">
                {searchResults.map((med) => (
                  <div
                    key={med.id}
                    className="search-dropdown-item"
                    onClick={() => addMedicine(med)}
                    id={`search-result-${med.id}`}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                        {med.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {med.generic_name} • Category: {med.category}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--brand-pine)' }}>
                        {formatTaka(med.selling_price)}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Stock: {med.quantity}
                      </span>
                      <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Items Table */}
        <div className="table-container" style={{ border: '1px solid var(--border-subtle)', boxShadow: 'none' }}>
          {selectedItems.length === 0 ? (
            <div className="empty-state-box" style={{ padding: '36px 20px' }}>
              <ShoppingBag size={36} color="var(--text-muted)" strokeWidth={1.5} />
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                No items added yet. Search and select medicines above.
              </p>
            </div>
          ) : (
            <table className="data-table" id="bill-items-table">
              <thead>
                <tr>
                  <th>Product Item</th>
                  <th>Unit Price</th>
                  <th>Available</th>
                  <th style={{ width: '130px' }}>Qty Sold</th>
                  <th>Line Total</th>
                  <th style={{ textAlign: 'right' }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item) => {
                  const qty = parseInt(item.quantity, 10);
                  const qtyError = item.quantity !== '' && (!isNaN(qty) ? (qty < 1 || qty > item.available_stock) : true);
                  return (
                    <tr key={item.medicine_id}>
                      <td style={{ fontWeight: 600 }}>{item.medicine_name}</td>
                      <td>{formatTaka(item.unit_price)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{item.available_stock} Units</td>
                      <td>
                        <input
                          id={`qty-${item.medicine_id}`}
                          type="number"
                          min="1"
                          max={item.available_stock}
                          step="1"
                          className={`form-input ${qtyError ? 'input-error' : ''}`}
                          style={{ width: '90px', padding: '6px 10px', textAlign: 'center', borderRadius: 'var(--radius-full)' }}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.medicine_id, e.target.value)}
                        />
                        {qtyError && (
                          <div className="field-error" style={{ marginTop: '2px' }}>
                            {parseInt(item.quantity, 10) < 1 ? 'Min 1' : `Max ${item.available_stock}`}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--brand-pine)' }}>
                        {formatTaka(item.line_total)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-action-icon danger"
                          onClick={() => removeItem(item.medicine_id)}
                          id={`remove-item-${item.medicine_id}`}
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Grand Total & Final Generate Button */}
        <div className="bill-total-banner">
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Calculated Bill Total ({selectedItems.length} items)
            </span>
            <div className="bill-total-amount" id="bill-grand-total">
              {formatTaka(grandTotal)}
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            id="generate-bill-btn"
            onClick={handleGenerate}
            disabled={!hasValidItems || submitting}
          >
            <Receipt size={17} strokeWidth={2.2} />
            <span>{submitting ? 'Generating Invoice...' : 'Generate Customer Bill'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
