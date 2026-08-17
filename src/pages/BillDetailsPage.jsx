import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatTaka, formatDate } from '../utils/medicineUtils';
import { Printer, ArrowLeft, AlertCircle, FileCheck } from 'lucide-react';

export default function BillDetailsPage() {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBill();
  }, [id]);

  const loadBill = async () => {
    setLoading(true);
    setError('');

    const [billRes, itemsRes] = await Promise.all([
      supabase.from('bills').select('*').eq('id', id).single(),
      supabase.from('bill_items').select('*').eq('bill_id', id).order('id'),
    ]);

    if (billRes.error) {
      setError('Bill invoice not found.');
    } else {
      setBill(billRes.data);
      setItems(itemsRes.data || []);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state-box">
          <div className="spinner-circle" />
          <p>Loading invoice details…</p>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="page">
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error || 'Bill not found.'}</span>
        </div>
        <div>
          <Link to="/bills" className="btn btn-secondary">
            <ArrowLeft size={15} /> Back to Bill History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page" id="bill-details-page">
      {/* Top Action Bar */}
      <div className="page-header no-print">
        <Link to="/bills" className="btn btn-secondary" id="back-to-history-btn">
          <ArrowLeft size={15} /> Back to History
        </Link>
        <button className="btn btn-primary" onClick={handlePrint} id="print-bill-btn">
          <Printer size={15} strokeWidth={2.2} /> Print Receipt
        </button>
      </div>

      {/* Clean Receipt Layout */}
      <div className="bill-receipt-paper" id="bill-receipt">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div className="logo-badge" style={{ width: '28px', height: '28px', fontSize: '15px' }}>P</div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand-pine)' }}>PharmaCare</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Pharmacy Management & Retail Billing
          </div>
        </div>

        <div className="receipt-meta-grid">
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Invoice Number
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-pine)' }}>
              {bill.bill_number}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Issue Date
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatDate(bill.created_at)}
            </div>
          </div>
        </div>

        <table className="data-table" id="bill-items-receipt-table" style={{ marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={{ background: '#F8FAF9' }}>Item Description</th>
              <th style={{ background: '#F8FAF9', textAlign: 'center' }}>Qty</th>
              <th style={{ background: '#F8FAF9', textAlign: 'right' }}>Rate</th>
              <th style={{ background: '#F8FAF9', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>{item.medicine_name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatTaka(item.unit_price)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatTaka(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '2px solid var(--brand-pine)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Total Items Billed: {items.length}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total Payable
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-pine)' }} id="receipt-total">
              {formatTaka(bill.total_amount)}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '16px', borderTop: '1px dashed var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
          <p>Thank you for choosing PharmaCare!</p>
        </div>
      </div>
    </div>
  );
}
