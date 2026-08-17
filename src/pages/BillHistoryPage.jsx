import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatTaka, formatDate } from '../utils/medicineUtils';
import { Plus, Eye, Receipt, AlertCircle } from 'lucide-react';

export default function BillHistoryPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Failed to load bill history. Please refresh.');
      console.error(error);
    } else {
      setBills(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="table-container">
        <div className="table-toolbar">
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              All Generated Invoices
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Complete chronological record of pharmacy customer sales
            </p>
          </div>

          <Link to="/bills/new" className="btn btn-primary" id="create-new-bill-btn">
            <Plus size={16} strokeWidth={2.5} />
            <span>Generate New Bill</span>
          </Link>
        </div>

        {loading ? (
          <div className="empty-state-box">
            <div className="spinner-circle" />
            <p>Loading invoice records…</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="empty-state-box">
            <Receipt size={40} color="var(--text-muted)" strokeWidth={1.5} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              No bills recorded yet
            </h3>
            <p style={{ fontSize: '12.5px' }}>
              Invoices generated during sales checkout will appear here.
            </p>
            <Link to="/bills/new" className="btn btn-primary" style={{ marginTop: '8px' }}>
              <Plus size={16} /> Create First Bill
            </Link>
          </div>
        ) : (
          <table className="data-table" id="bills-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Issue Date</th>
                <th>Total Payable</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td style={{ fontWeight: 700, color: 'var(--brand-pine)' }}>
                    {bill.bill_number}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(bill.created_at)}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatTaka(bill.total_amount)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      to={`/bills/${bill.id}`}
                      className="btn btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '12px', display: 'inline-flex' }}
                      id={`view-bill-${bill.id}`}
                    >
                      <Eye size={13} /> View Invoice
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && bills.length > 0 && (
          <div className="table-footer">
            <span>Showing all {bills.length} invoices</span>
          </div>
        )}
      </div>
    </div>
  );
}
