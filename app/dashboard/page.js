'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const CATS_INCOME = ['Client payment', 'Advance', 'Bonus', 'Retainer', 'Other income'];
const CATS_EXPENSE = ['Tools & software', 'Transport', 'Food', 'Equipment', 'Marketing', 'Personal', 'Content writer', 'Other'];
const COLORS = ['#2a78d6', '#1baf7a', '#eda100', '#e34948', '#4a3aa7', '#e87ba4', '#eb6834', '#008300'];

function fmt(n) {
  return 'Rs ' + Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [goal, setGoal] = useState(null);
  const [editGoal, setEditGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState({ name: '', target: '' });
  const [form, setForm] = useState({ type: 'income', amount: '', category: CATS_INCOME[0], note: '', date: todayISO() });
  const [filterType, setFilterType] = useState('all');
  const [saving, setSaving] = useState(false);
  const chartRef = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [tx, goals] = await Promise.all([
      fetch('/api/transactions').then(r => r.json()),
      fetch('/api/goals').then(r => r.json()),
    ]);
    setTransactions(Array.isArray(tx) ? tx : []);
    if (goals?.length) {
      setGoal(goals[0]);
      setGoalDraft({ name: goals[0].name, target: goals[0].target });
    }
  }

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;
  const saved = Math.max(0, balance);
  const goalTarget = Number(goal?.target || 0);
  const goalPct = goalTarget > 0 ? Math.min(100, Math.round((saved / goalTarget) * 100)) : 0;

  function expByCategory() {
    const map = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return map;
  }

  useEffect(() => {
    if (tab !== 'overview') return;
    const cats = expByCategory();
    const labels = Object.keys(cats);
    const data = Object.values(cats);
    if (!chartRef.current || !labels.length) return;

    function drawChart() {
      const Chart = window.Chart;
      if (!Chart) return;
      if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; }
      chartInst.current = new Chart(chartRef.current, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data, backgroundColor: COLORS.slice(0, labels.length), borderWidth: 2, borderColor: '#fff' }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmt(ctx.raw)}` } },
          },
        },
      });
    }

    if (window.Chart) {
      drawChart();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      script.onload = drawChart;
      document.head.appendChild(script);
    }
  }, [tab, transactions]);

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login'); router.refresh();
  }

  async function addTransaction(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    setSaving(true);
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    setSaving(false);
    setForm({ type: 'income', amount: '', category: CATS_INCOME[0], note: '', date: todayISO() });
    setTab('overview');
    loadAll();
  }

  async function deleteTransaction(id) {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    loadAll();
  }

  async function saveGoal() {
    await fetch('/api/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goal.id, name: goalDraft.name, target: Number(goalDraft.target) }),
    });
    setEditGoal(false);
    loadAll();
  }

  const cats = expByCategory();
  const filtered = filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType);

  return (
    <div>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1>CFT Budget</h1>
        </div>
        <button className="sec" onClick={handleLogout}>Sign out</button>
      </div>

      <div className="container">
        <div className="tabs">
          {['overview', 'add', 'history'].map(t => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}
              style={{ textTransform: 'capitalize' }}>{t === 'add' ? '+ Add' : t}</button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            <div className="metrics">
              <div className="metric">
                <p>Income</p>
                <h2 style={{ color: 'var(--green)' }}>{fmt(income)}</h2>
              </div>
              <div className="metric">
                <p>Expenses</p>
                <h2 style={{ color: 'var(--red)' }}>{fmt(expense)}</h2>
              </div>
              <div className="metric">
                <p>Balance</p>
                <h2 style={{ color: balance >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(balance)}</h2>
              </div>
            </div>

            {/* Goal */}
            {goal && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 500 }}>{goal.name}</p>
                    <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>Goal: {fmt(goalTarget)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--accent)' }}>{goalPct}%</span>
                    <button className="sec" style={{ padding: '5px 10px', fontSize: 12 }}
                      onClick={() => setEditGoal(g => !g)}>Edit goal</button>
                  </div>
                </div>
                <div className="progress-bg">
                  <div className="progress-fill" style={{ width: `${goalPct}%` }}></div>
                </div>
                <p className="muted" style={{ fontSize: 12 }}>
                  {fmt(saved)} saved · {fmt(Math.max(0, goalTarget - saved))} remaining
                </p>
                {editGoal && (
                  <div className="goal-edit">
                    <div style={{ flex: 2 }}>
                      <input value={goalDraft.name} placeholder="Goal name"
                        onChange={e => setGoalDraft(g => ({ ...g, name: e.target.value }))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input type="number" value={goalDraft.target} placeholder="Target (Rs)"
                        onChange={e => setGoalDraft(g => ({ ...g, target: e.target.value }))} />
                    </div>
                    <button onClick={saveGoal} style={{ whiteSpace: 'nowrap' }}>Save</button>
                    <button className="sec" onClick={() => setEditGoal(false)}>Cancel</button>
                  </div>
                )}
              </div>
            )}

            {/* Chart */}
            <div className="card">
              <p style={{ fontWeight: 500, marginBottom: '1rem' }}>Spending by category</p>
              {Object.keys(cats).length === 0
                ? <p className="muted" style={{ fontSize: 13 }}>No expenses yet.</p>
                : (
                  <>
                    <div style={{ position: 'relative', height: 220 }}>
                      <canvas ref={chartRef} role="img" aria-label="Donut chart of expenses by category">Expense breakdown by category.</canvas>
                    </div>
                    <div className="legend">
                      {Object.entries(cats).map(([cat, val], i) => (
                        <span key={cat} style={{ display: 'flex', alignItems: 'center' }}>
                          <span className="legend-dot" style={{ background: COLORS[i % COLORS.length] }}></span>
                          {cat} — {fmt(val)}
                        </span>
                      ))}
                    </div>
                  </>
                )}
            </div>

            {/* Recent */}
            <div className="card">
              <p style={{ fontWeight: 500, marginBottom: '0.75rem' }}>Recent transactions</p>
              {transactions.length === 0
                ? <p className="muted" style={{ fontSize: 13 }}>No transactions yet.</p>
                : transactions.slice(0, 6).map(t => (
                  <div className="tx-row" key={t.id}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{t.note || t.category}</span>
                      <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>{fmtDate(t.date)}</span>
                    </div>
                    <span style={{ fontWeight: 500, color: t.type === 'income' ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>
                      {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                    </span>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* ── ADD ── */}
        {tab === 'add' && (
          <div className="card">
            <p style={{ fontWeight: 500, fontSize: 16, marginBottom: '1rem' }}>New transaction</p>
            <form onSubmit={addTransaction}>
              <div className="form-grid">
                <div>
                  <label>Type</label>
                  <select value={form.type} onChange={e => {
                    const type = e.target.value;
                    setForm(f => ({ ...f, type, category: type === 'income' ? CATS_INCOME[0] : CATS_EXPENSE[0] }));
                  }}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label>Amount (Rs)</label>
                  <input type="number" min="1" step="1" placeholder="0" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div>
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {(form.type === 'income' ? CATS_INCOME : CATS_EXPENSE).map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Note (optional)</label>
                <input placeholder="e.g. POB advance payment" value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add transaction'}</button>
                <button type="button" className="sec" onClick={() => setTab('overview')}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ fontWeight: 500 }}>All transactions ({filtered.length})</p>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 'auto' }}>
                <option value="all">All</option>
                <option value="income">Income only</option>
                <option value="expense">Expenses only</option>
              </select>
            </div>
            {filtered.length === 0
              ? <p className="muted" style={{ fontSize: 13 }}>No transactions found.</p>
              : filtered.map(t => (
                <div className="tx-row" key={t.id}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 500 }}>{t.note || t.category}</span>
                      <span className={`badge badge-${t.type}`}>{t.type === 'income' ? 'Income' : 'Expense'}</span>
                    </div>
                    <p className="muted" style={{ fontSize: 12, margin: '2px 0 0' }}>{t.category} · {fmtDate(t.date)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 500, color: t.type === 'income' ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>
                      {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                    </span>
                    <button className="ghost" title="Delete" onClick={() => deleteTransaction(t.id)}>×</button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
