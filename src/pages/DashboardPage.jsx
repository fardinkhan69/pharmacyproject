import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatDate, formatTaka } from '../utils/medicineUtils';
import { 
  Package,
  AlertTriangle,
  Receipt,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Eye,
  Copy,
  Pill,
  PlusCircle,
  FileText,
  X,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const TOP_MEDICINE_STYLES = [
  { colorClass: 'orange', iconColor: '#EA580C' },
  { colorClass: 'dark-pine', iconColor: '#0C2520' },
  { colorClass: 'lime', iconColor: '#65A30D' },
];

const startOfLocalDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const startOfWeek = (date) => {
  const result = startOfLocalDay(date);
  const daysSinceMonday = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - daysSinceMonday);
  return result;
};

const withChartMetadata = (buckets) => {
  const maxValue = Math.max(...buckets.map((bucket) => bucket.value), 0);

  return buckets.map((bucket, index) => {
    const previousValue = index > 0 ? buckets[index - 1].value : 0;
    const change = previousValue === 0
      ? (bucket.value > 0 ? 100 : 0)
      : Math.round(((bucket.value - previousValue) / previousValue) * 100);

    return {
      ...bucket,
      growth: `${change > 0 ? '+' : ''}${change}%`,
      trend: change < 0 ? 'down' : 'up',
      height: maxValue > 0
        ? Math.max((bucket.value / maxValue) * 92, bucket.value > 0 ? 8 : 0)
        : 0,
    };
  });
};

const buildSalesSeries = (bills, timeframe, now = new Date()) => {
  let buckets;
  let getBucketIndex;
  let isInRange;

  if (timeframe === 'This Week') {
    const rangeStart = startOfWeek(now);
    const rangeEnd = addDays(rangeStart, 7);
    buckets = Array.from({ length: 7 }, (_, index) => ({
      label: addDays(rangeStart, index).toLocaleDateString('en-GB', { weekday: 'short' }),
      value: 0,
    }));
    isInRange = (date) => date >= rangeStart && date < rangeEnd;
    getBucketIndex = (date) => Math.floor((startOfLocalDay(date) - rangeStart) / 86400000);
  } else if (timeframe === 'This Year') {
    const year = now.getFullYear();
    buckets = Array.from({ length: 12 }, (_, index) => ({
      label: new Date(year, index, 1).toLocaleDateString('en-GB', { month: 'short' }),
      value: 0,
    }));
    isInRange = (date) => date.getFullYear() === year;
    getBucketIndex = (date) => date.getMonth();
  } else {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const bucketCount = Math.ceil(daysInMonth / 7);
    buckets = Array.from({ length: bucketCount }, (_, index) => {
      const firstDay = index * 7 + 1;
      const lastDay = Math.min(firstDay + 6, daysInMonth);
      return {
        label: `${String(firstDay).padStart(2, '0')}–${String(lastDay).padStart(2, '0')}`,
        value: 0,
      };
    });
    isInRange = (date) => date.getFullYear() === year && date.getMonth() === month;
    getBucketIndex = (date) => Math.floor((date.getDate() - 1) / 7);
  }

  bills.forEach((bill) => {
    const createdAt = new Date(bill.created_at);
    if (Number.isNaN(createdAt.getTime()) || !isInRange(createdAt)) return;

    const bucketIndex = getBucketIndex(createdAt);
    if (buckets[bucketIndex]) {
      buckets[bucketIndex].value += Number(bill.total_amount || 0);
    }
  });

  return withChartMetadata(buckets);
};

const buildTopMedicines = (items, timeframe, now = new Date()) => {
  let rangeStart = null;
  let rangeEnd = null;

  if (timeframe === 'This Month') {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else if (timeframe === 'Last Month') {
    rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    rangeEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const aggregated = new Map();

  items.forEach((item) => {
    const createdAt = new Date(item.bills?.created_at);
    if (Number.isNaN(createdAt.getTime())) return;
    if (rangeStart && (createdAt < rangeStart || createdAt >= rangeEnd)) return;

    const key = item.medicine_id || item.medicine_name;
    const current = aggregated.get(key) || {
      id: key,
      name: item.medicine_name,
      quantity: 0,
      revenueValue: 0,
    };
    current.quantity += Number(item.quantity || 0);
    current.revenueValue += Number(item.line_total || 0);
    aggregated.set(key, current);
  });

  const topItems = [...aggregated.values()]
    .sort((a, b) => b.revenueValue - a.revenueValue)
    .slice(0, 3);
  const maxRevenue = Math.max(...topItems.map((item) => item.revenueValue), 0);

  return topItems.map((item, index) => ({
    ...item,
    generic: `${item.quantity.toLocaleString()} ${item.quantity === 1 ? 'unit' : 'units'} sold`,
    revenue: formatTaka(item.revenueValue),
    height: maxRevenue > 0 ? 38 + (item.revenueValue / maxRevenue) * 52 : 38,
    ...TOP_MEDICINE_STYLES[index],
  }));
};

const getAxisTicks = (values) => {
  const maxValue = Math.max(...values, 0);
  if (maxValue === 0) return [100, 80, 60, 40, 20, 0];

  const roughStep = maxValue / 5;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const step = Math.ceil(roughStep / magnitude) * magnitude;
  const axisMax = step * 5;
  return Array.from({ length: 6 }, (_, index) => axisMax - step * index);
};

const formatCompactTaka = (amount) => `৳${new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(amount)}`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Live operational stats from Supabase
  const [stats, setStats] = useState({
    totalMedicines: 0,
    lowStock: 0,
    totalBills: 0,
  });

  const [timeframe, setTimeframe] = useState('This Month');
  const [topMedicineTimeframe, setTopMedicineTimeframe] = useState('This Month');
  const [activeBarIndex, setActiveBarIndex] = useState(0);
  const [latestOrders, setLatestOrders] = useState([]);
  const [salesBills, setSalesBills] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [efficiencyModalOpen, setEfficiencyModalOpen] = useState(false);

  const salesData = useMemo(
    () => buildSalesSeries(salesBills, timeframe),
    [salesBills, timeframe],
  );
  const topMedicines = useMemo(
    () => buildTopMedicines(billItems, topMedicineTimeframe),
    [billItems, topMedicineTimeframe],
  );
  const salesAxisTicks = useMemo(
    () => getAxisTicks(salesData.map((item) => item.value)),
    [salesData],
  );
  const topMedicineAxisTicks = useMemo(
    () => getAxisTicks(topMedicines.map((item) => item.revenueValue)),
    [topMedicines],
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const lastSalesIndex = salesData.reduce(
      (latestIndex, item, index) => (item.value > 0 ? index : latestIndex),
      salesData.length - 1,
    );
    setActiveBarIndex(Math.max(lastSalesIndex, 0));
  }, [salesData]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const today = new Date();
      const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('-');
      const currentYearStart = new Date(today.getFullYear(), 0, 1);
      const currentWeekStart = startOfWeek(today);
      const analyticsStart = currentWeekStart < currentYearStart
        ? currentWeekStart
        : currentYearStart;

      // Parallel, batched reads avoid per-order and per-medicine round trips.
      const [
        medicinesRes,
        lowStockRes,
        billsCountRes,
        salesBillsRes,
        latestBillsRes,
        billItemsRes,
      ] = await Promise.all([
        supabase
          .from('medicines')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .gt('quantity', 0)
          .gte('expiry_date', todayString),
        supabase
          .from('medicines')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .lte('quantity', 5)
          .gt('quantity', 0)
          .gte('expiry_date', todayString),
        supabase.from('bills').select('id', { count: 'exact', head: true }),
        supabase
          .from('bills')
          .select('id, total_amount, created_at')
          .gte('created_at', analyticsStart.toISOString())
          .order('created_at', { ascending: true }),
        supabase
          .from('bills')
          .select('id, bill_number, total_amount, created_at, bill_items(medicine_name, quantity)')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('bill_items')
          .select('medicine_id, medicine_name, line_total, quantity, bills(created_at)'),
      ]);

      const dashboardError = medicinesRes.error
        || lowStockRes.error
        || billsCountRes.error
        || salesBillsRes.error
        || latestBillsRes.error
        || billItemsRes.error;
      if (dashboardError) throw dashboardError;

      setStats({
        totalMedicines: medicinesRes.count ?? 0,
        lowStock: lowStockRes.count ?? 0,
        totalBills: billsCountRes.count ?? 0,
      });
      setSalesBills(salesBillsRes.data || []);
      setBillItems(billItemsRes.data || []);
      setLatestOrders((latestBillsRes.data || []).map((bill) => {
        const lineItems = bill.bill_items || [];
        const visibleItems = lineItems
          .slice(0, 2)
          .map((item) => `${item.medicine_name} ×${item.quantity}`);
        const remainingCount = Math.max(lineItems.length - visibleItems.length, 0);

        return {
          id: bill.id,
          orderId: bill.bill_number,
          medicineName: visibleItems.length > 0
            ? `${visibleItems.join(', ')}${remainingCount > 0 ? ` +${remainingCount} more` : ''}`
            : 'No line items',
          totalAmount: Number(bill.total_amount || 0),
          createdAt: bill.created_at,
        };
      }));
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleBarClick = (idx) => {
    setActiveBarIndex(idx);
  };

  const handleTimeframeChange = (newVal) => setTimeframe(newVal);

  return (
    <div className="page" id="dashboard-page">
      {error && <div className="alert alert-error">{error}</div>}

      {/* Live operational overview */}
      <section className="overview-top-grid">
        <Link
          to="/medicines?status=available"
          className="stat-card stat-card-featured stat-card-link"
          id="stat-total-medicines"
          aria-label="View all products currently in stock"
        >
          <div className="stat-card-header">
            <div className="stat-icon-box lime">
              <Package size={20} strokeWidth={2.4} />
            </div>
            <span className="stat-trend-pill positive">Live Inventory</span>
          </div>
          <div>
            <div className="stat-label">Total Products in Stock</div>
            <div className="stat-value" style={{ marginTop: '4px' }}>
              {loading ? '...' : stats.totalMedicines.toLocaleString()}
            </div>
            <div className="stat-period-caption">Available and not expired</div>
          </div>
        </Link>

        <Link
          to="/medicines?status=low-stock"
          className="stat-card stat-card-link"
          id="stat-low-stock"
          aria-label="View low stock items"
        >
          <div className="stat-card-header">
            <div className="stat-icon-box amber">
              <AlertTriangle size={20} />
            </div>
            <span className="stat-trend-pill warning">Threshold ≤ 5</span>
          </div>
          <div>
            <div className="stat-label">Low Stock Items</div>
            <div className="stat-value" style={{ marginTop: '4px' }}>
              {loading ? '...' : stats.lowStock.toLocaleString()}
            </div>
            <div className="stat-period-caption">Available and not expired</div>
          </div>
        </Link>

        <Link
          to="/bills"
          className="stat-card stat-card-link"
          id="stat-total-bills"
          aria-label="View all customer bills"
        >
          <div className="stat-card-header">
            <div className="stat-icon-box emerald">
              <Receipt size={20} />
            </div>
            <span className="stat-trend-pill positive">Generated Invoices</span>
          </div>
          <div>
            <div className="stat-label">Total Customer Bills</div>
            <div className="stat-value" style={{ marginTop: '4px' }}>
              {loading ? '...' : stats.totalBills.toLocaleString()}
            </div>
            <div className="stat-period-caption">Complete billing history</div>
          </div>
        </Link>

        {/* Card 4: Pharmacist Efficiency Promo Card */}
        <div 
          className="efficiency-promo-card"
          id="card-efficiency-banner"
          style={{ backgroundImage: `url(/pharmacist-banner.jpg)` }}
        >
          <div className="efficiency-promo-overlay" />
          <div className="efficiency-promo-content">
            <div className="efficiency-promo-title">
              Discover How to Maximize Your Pharmacy's Efficiency
            </div>
            <button 
              className="efficiency-promo-btn"
              onClick={() => setEfficiencyModalOpen(true)}
              id="learn-efficiency-btn"
            >
              <span>Learn more</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </section>

      {/* Middle Section: Visual Analytics & Graph Row */}
      <section className="dashboard-analytics-grid">
        {/* Left Chart: Sales Analytics (Capsule Bar Graph) */}
        <div className="analytics-card" id="sales-analytics-card">
          <div className="analytics-card-header">
            <div className="analytics-card-title">Sales Analytics</div>
            <div className="analytics-card-actions">
              <select 
                className="chart-filter-select"
                value={timeframe}
                onChange={(e) => handleTimeframeChange(e.target.value)}
                id="sales-timeframe-select"
              >
                <option value="This Month">This Month</option>
                <option value="This Week">This Week</option>
                <option value="This Year">This Year</option>
              </select>
              <button 
                className="chart-nav-btn" 
                onClick={() => setActiveBarIndex(prev => Math.max(0, prev - 1))}
                aria-label="Previous sales period"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                className="chart-nav-btn" 
                onClick={() => setActiveBarIndex(prev => Math.min(salesData.length - 1, prev + 1))}
                aria-label="Next sales period"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Pill-shaped Bar Visualization */}
          <div className="sales-chart-wrapper">
            {/* Y-Axis scale */}
            <div className="chart-y-axis">
              {salesAxisTicks.map((tick) => (
                <span key={tick}>{formatCompactTaka(tick)}</span>
              ))}
            </div>

            {/* Bars container */}
            <div className="sales-bars-container">
              {salesData.map((item, idx) => {
                const isSelected = activeBarIndex === idx;
                return (
                  <div
                    key={item.label}
                    className={`sales-capsule-col ${isSelected ? 'active' : ''}`}
                    onClick={() => handleBarClick(idx)}
                    onMouseEnter={() => handleBarClick(idx)}
                    title={`${item.label}: ${formatTaka(item.value)} (${item.growth})`}
                  >
                    {/* Floating Tooltip Bubble on selected bar */}
                    {isSelected && (
                      <div className="chart-tooltip-badge">
                        <span className="tooltip-val">{formatTaka(item.value)}</span>
                        <span className={`tooltip-badge-pill ${item.trend === 'down' ? 'negative' : ''}`}>
                          {item.trend === 'down' ? <TrendingDown size={9} /> : <TrendingUp size={9} />}
                          {item.growth}
                        </span>
                      </div>
                    )}

                    {/* Capsule Outer Track */}
                    <div className="capsule-track">
                      {/* Inner Filled Bar */}
                      <div
                        className={`capsule-bar ${isSelected ? 'highlighted' : ''}`}
                        style={{ height: `${item.height}%` }}
                      />
                    </div>

                    {/* X-Axis day label */}
                    <span className="capsule-day-label">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Chart: Top Selling Medicine */}
        <div className="analytics-card" id="top-selling-card">
          <div className="analytics-card-header">
            <div className="analytics-card-title">Top Selling Medicine</div>
            <div className="analytics-card-actions">
              <select
                className="chart-filter-select"
                value={topMedicineTimeframe}
                onChange={(event) => setTopMedicineTimeframe(event.target.value)}
                id="top-medicine-filter"
              >
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
                <option value="All Time">All Time</option>
              </select>
            </div>
          </div>

          {/* Top Selling Medicine Capsule Columns */}
          <div className="top-selling-chart-wrapper">
            {/* Y-Axis */}
            <div className="chart-y-axis">
              {topMedicineAxisTicks.map((tick) => (
                <span key={tick}>{formatCompactTaka(tick)}</span>
              ))}
            </div>

            {/* 3 Medicine Vertical Capsules */}
            <div className="medicine-bars-container">
              {topMedicines.length === 0 ? (
                <div className="chart-empty-state">No medicine sales in this period.</div>
              ) : topMedicines.map((med) => (
                <div 
                  key={med.id} 
                  className="medicine-bar-column"
                  onClick={() => navigate(`/medicines?search=${encodeURIComponent(med.name)}`)}
                  title={`${med.name} (${med.generic}) - Total Sales: ${med.revenue}`}
                >
                  {/* Capsule container */}
                  <div 
                    className={`medicine-capsule-bar ${med.colorClass}`}
                    style={{ height: `${med.height}%` }}
                  >
                    {/* Vertical rotated text inside capsule */}
                    <div className="capsule-vertical-title">
                      {med.name}
                    </div>

                    {/* Medicine Pill circular icon badge at bottom */}
                    <div className="medicine-icon-badge">
                      <Pill size={14} color={med.iconColor} strokeWidth={2.4} />
                    </div>
                  </div>

                  {/* Revenue price tag at bottom */}
                  <div className="medicine-revenue-caption">
                    {med.revenue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: Latest Orders Table */}
      <section className="latest-orders-card" id="latest-orders-section">
        <div className="analytics-card-header">
          <div className="analytics-card-title">Latest Orders</div>
          <Link to="/bills" className="btn btn-ghost" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-pine)' }}>
            View All
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" id="latest-orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Medicines</th>
                <th>Date</th>
                <th>Total</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {latestOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="dashboard-table-empty">
                    No customer bills have been generated yet.
                  </td>
                </tr>
              ) : latestOrders.map((ord) => (
                <tr key={ord.id}>
                  <td style={{ fontWeight: 700, color: 'var(--brand-pine)' }}>
                    {ord.orderId}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {ord.medicineName}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(ord.createdAt)}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatTaka(ord.totalAmount)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        className="btn-action-icon"
                        title="View Order"
                        onClick={() => navigate(`/bills/${ord.id}`)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn-action-icon"
                        title="Copy bill number"
                        onClick={() => {
                          navigator.clipboard?.writeText?.(ord.orderId);
                          alert(`Copied ${ord.orderId} to clipboard`);
                        }}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Action Bar at bottom */}
      <section className="quick-actions-bar">
        <div
          className="quick-action-card"
          id="quick-add-medicine-btn"
          onClick={() => navigate('/medicines?action=add')}
        >
          <div className="quick-action-icon">
            <PlusCircle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="quick-action-title">Add New Medicine</div>
            <div className="quick-action-desc">Add product name, generic formula, quantity, price and expiry</div>
          </div>
        </div>

        <div
          className="quick-action-card"
          id="quick-create-bill-btn"
          onClick={() => navigate('/bills/new')}
        >
          <div className="quick-action-icon">
            <FileText size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="quick-action-title">Generate Customer Bill</div>
            <div className="quick-action-desc">Search products, auto-calculate line totals and deduct inventory</div>
          </div>
        </div>
      </section>

      {/* Efficiency Modal Dialog */}
      {efficiencyModalOpen && (
        <div className="modal-overlay" onClick={() => setEfficiencyModalOpen(false)}>
          <div
            className="modal efficiency-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="efficiency-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="stat-icon-box lime" style={{ width: '36px', height: '36px' }}>
                  <Sparkles size={18} />
                </div>
                <h3 className="modal-title" id="efficiency-modal-title">Pharmacy Efficiency Playbook</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setEfficiencyModalOpen(false)}
                aria-label="Close pharmacy efficiency playbook"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              <p>Maximize your pharmacy's operational throughput with these data-driven best practices:</p>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="var(--brand-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Fast-Moving Drug Replenishment:</strong>
                  <div>Prioritize stock of high-demand medications (e.g. Paracetamol, Omeprazole) with automated reorder alerts.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="var(--brand-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Zero-Wait Checkout:</strong>
                  <div>Use the <strong>Create Bill</strong> POS page to instantly scan products and print itemized customer receipts.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="var(--brand-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Batch Expiry Tracking:</strong>
                  <div>Audit inventory monthly using the automated expiry alert filters to eliminate expired loss.</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setEfficiencyModalOpen(false)}>
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
