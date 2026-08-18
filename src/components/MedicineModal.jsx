import { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';

const CATEGORIES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Other'];

const EMPTY_FORM = {
  name: '',
  generic_name: '',
  category: '',
  selling_price: '',
  quantity: '',
  expiry_date: '',
};

export default function MedicineModal({ medicine, onSave, onClose }) {
  const isEdit = Boolean(medicine);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (medicine) {
      setForm({
        name: medicine.name || '',
        generic_name: medicine.generic_name || '',
        category: medicine.category || '',
        selling_price: medicine.selling_price?.toString() || '',
        quantity: medicine.quantity?.toString() || '',
        expiry_date: medicine.expiry_date || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [medicine]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required.';
    if (!form.generic_name.trim()) e.generic_name = 'Generic formula is required.';
    if (!form.category.trim()) e.category = 'Select a category.';
    const price = parseFloat(form.selling_price);
    if (form.selling_price === '' || isNaN(price)) e.selling_price = 'Selling price is required.';
    else if (price < 0) e.selling_price = 'Price cannot be negative.';
    const qty = parseInt(form.quantity, 10);
    if (form.quantity === '' || isNaN(qty)) e.quantity = 'Quantity is required.';
    else if (!Number.isInteger(Number(form.quantity))) e.quantity = 'Quantity must be an integer.';
    else if (qty < 0) e.quantity = 'Quantity cannot be negative.';
    if (!form.expiry_date) e.expiry_date = 'Expiration date is required.';
    return e;
  };

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      generic_name: form.generic_name.trim(),
      category: form.category.trim(),
      selling_price: parseFloat(form.selling_price),
      quantity: parseInt(form.quantity, 10),
      expiry_date: form.expiry_date,
    };

    await onSave(payload);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Product Details' : 'Add New Pharmacy Product'}</h2>
          <button className="modal-close-btn" onClick={onClose} id="medicine-modal-close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} id="medicine-form" noValidate>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="med-name" className="form-label">Product Name *</label>
                <input
                  id="med-name"
                  type="text"
                  className={`form-input ${errors.name ? 'input-error' : ''}`}
                  placeholder="e.g. Paracetamol 500mg"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="med-generic" className="form-label">Generic Formula *</label>
                <input
                  id="med-generic"
                  type="text"
                  className={`form-input ${errors.generic_name ? 'input-error' : ''}`}
                  placeholder="e.g. Acetaminophen"
                  value={form.generic_name}
                  onChange={(e) => handleChange('generic_name', e.target.value)}
                />
                {errors.generic_name && <span className="field-error">{errors.generic_name}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="med-category" className="form-label">Dosage Category *</label>
                <select
                  id="med-category"
                  className={`form-input ${errors.category ? 'input-error' : ''}`}
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option value="">Select Category...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <span className="field-error">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="med-price" className="form-label">Unit Price (৳) *</label>
                <input
                  id="med-price"
                  type="number"
                  min="0"
                  step="0.01"
                  className={`form-input ${errors.selling_price ? 'input-error' : ''}`}
                  placeholder="0.00"
                  value={form.selling_price}
                  onChange={(e) => handleChange('selling_price', e.target.value)}
                />
                {errors.selling_price && <span className="field-error">{errors.selling_price}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="med-quantity" className="form-label">Stock Quantity *</label>
                <input
                  id="med-quantity"
                  type="number"
                  min="0"
                  step="1"
                  className={`form-input ${errors.quantity ? 'input-error' : ''}`}
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                />
                {errors.quantity && <span className="field-error">{errors.quantity}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="med-expiry" className="form-label">Expiry Date *</label>
                <input
                  id="med-expiry"
                  type="date"
                  className={`form-input ${errors.expiry_date ? 'input-error' : ''}`}
                  value={form.expiry_date}
                  onChange={(e) => handleChange('expiry_date', e.target.value)}
                />
                {errors.expiry_date && <span className="field-error">{errors.expiry_date}</span>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} id="medicine-cancel-btn">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              id="medicine-save-btn"
              disabled={saving}
            >
              {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
