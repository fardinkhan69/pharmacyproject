import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MedicineModal from '../components/MedicineModal';
import { getMedicineStatus, getStatusClass, formatTaka, formatDate } from '../utils/medicineUtils';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  PackageOpen
} from 'lucide-react';

const STATUS_FILTERS = {
  all: 'All Products',
  available: 'Available Stock',
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
  expired: 'Expired',
};

export default function MedicinesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMedicine, setEditMedicine] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const requestedStatus = searchParams.get('status') || 'all';
  const statusFilter = STATUS_FILTERS[requestedStatus] ? requestedStatus : 'all';

  // Open add modal if redirected from dashboard quick action
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setEditMedicine(null);
      setModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const requestedSearch = searchParams.get('search');
    if (requestedSearch !== null) setSearch(requestedSearch);
  }, [searchParams]);

  const loadMedicines = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      setError('Failed to load medicines. Please refresh.');
      console.error(error);
    } else {
      setMedicines(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const filtered = medicines.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch = (
      m.name.toLowerCase().includes(q) ||
      m.generic_name.toLowerCase().includes(q)
    );
    const medicineStatus = getMedicineStatus(m);
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'available' && (medicineStatus === 'In Stock' || medicineStatus === 'Low Stock'))
      || (statusFilter === 'in-stock' && medicineStatus === 'In Stock')
      || (statusFilter === 'low-stock' && medicineStatus === 'Low Stock')
      || (statusFilter === 'out-of-stock' && medicineStatus === 'Out of Stock')
      || (statusFilter === 'expired' && medicineStatus === 'Expired');

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (event) => {
    const nextStatus = event.target.value;
    setSearchParams(nextStatus === 'all' ? {} : { status: nextStatus });
  };

  const handleSave = async (payload) => {
    if (editMedicine) {
      const { error } = await supabase
        .from('medicines')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editMedicine.id);

      if (error) {
        alert('Failed to update medicine: ' + error.message);
        return;
      }
      showToast('Medicine updated successfully.');
    } else {
      const { error } = await supabase
        .from('medicines')
        .insert([{ ...payload, is_active: true }]);

      if (error) {
        alert('Failed to add medicine: ' + error.message);
        return;
      }
      showToast('Medicine added successfully.');
    }

    setModalOpen(false);
    setEditMedicine(null);
    await loadMedicines();
  };

  const handleEdit = (medicine) => {
    setEditMedicine(medicine);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from('medicines')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', deleteTarget.id);

    setDeleting(false);
    setDeleteTarget(null);

    if (error) {
      alert('Failed to remove medicine: ' + error.message);
      return;
    }
    showToast('Medicine removed successfully.');
    await loadMedicines();
  };

  return (
    <div className="page">
      {/* Toast Notification */}
      {toast && (
        <div className="toast" id="medicines-toast">
          <CheckCircle2 size={16} color="var(--brand-lime)" />
          <span>{toast}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal modal-sm" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2 className="modal-title">Confirm Deactivation</h2>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                Are you sure you want to remove <strong>{deleteTarget.name}</strong>?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                This item will be deactivated and hidden from product lists and future bills.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                id="delete-cancel-btn"
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                id="delete-confirm-btn"
              >
                {deleting ? 'Removing…' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medicine Add/Edit Modal */}
      {modalOpen && (
        <MedicineModal
          medicine={editMedicine}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditMedicine(null); }}
        />
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Product List Table Card */}
      <div className="table-container">
        {/* Table Toolbar */}
        <div className="table-toolbar">
          <div className="inventory-filters">
            <div className="search-input-wrapper">
              <span className="search-input-icon">
                <Search size={16} />
              </span>
              <input
                id="medicine-search"
                type="text"
                className="search-input"
                placeholder="Search product name or generic formula…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              id="medicine-status-filter"
              className="status-filter-select"
              aria-label="Filter medicines by stock status"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              {Object.entries(STATUS_FILTERS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => { setEditMedicine(null); setModalOpen(true); }}
            id="add-medicine-btn"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add New Product</span>
          </button>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="empty-state-box">
            <div className="spinner-circle" />
            <p>Loading medicines catalog…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state-box">
            <PackageOpen size={40} strokeWidth={1.5} color="var(--text-muted)" />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {search || statusFilter !== 'all' ? 'No matching products found' : 'No medicines in inventory'}
            </h3>
            <p style={{ fontSize: '12.5px' }}>
              {search || statusFilter !== 'all'
                ? `No products match the ${STATUS_FILTERS[statusFilter].toLowerCase()} filter.`
                : 'Start by adding your first pharmacy product.'}
            </p>
            {!search && statusFilter === 'all' && (
              <button
                className="btn btn-primary"
                onClick={() => { setEditMedicine(null); setModalOpen(true); }}
                style={{ marginTop: '8px' }}
              >
                <Plus size={16} /> Add First Product
              </button>
            )}
          </div>
        ) : (
          <table className="data-table" id="medicines-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Generic Formula</th>
                <th>Category</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((med) => {
                const status = getMedicineStatus(med);
                return (
                  <tr key={med.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{med.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{med.generic_name}</td>
                    <td>
                      <span className="category-tag">{med.category}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatTaka(med.selling_price)}</td>
                    <td>{med.quantity} Units</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(med.expiry_date)}</td>
                    <td>
                      <span className={getStatusClass(status)}>{status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          className="btn-action-icon"
                          onClick={() => handleEdit(med)}
                          title="Edit"
                          id={`edit-btn-${med.id}`}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="btn-action-icon danger"
                          onClick={() => setDeleteTarget(med)}
                          title="Delete"
                          id={`delete-btn-${med.id}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && filtered.length > 0 && (
          <div className="table-footer">
            <span>
              Showing {filtered.length} of {medicines.length} products
              {statusFilter !== 'all' ? ` · ${STATUS_FILTERS[statusFilter]}` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
