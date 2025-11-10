import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  BoltIcon,
  CheckCircleIcon,
  EnvelopeOpenIcon,
  ShieldCheckIcon,
  SparklesIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import demoData from './data/demo';

axios.defaults.withCredentials = true;

const policyTemplates = [
  {
    id: 'no-refund',
    name: 'No Refunds',
    description: 'Ironclad policy for premium access. Includes legal disclaimer copy.',
    badge: 'Maximum protection',
    accent: 'from-purple-500/40 to-purple-900/60',
    legal: 'All sales are final. Access is delivered instantly and is not eligible for refunds.'
  },
  {
    id: 'seven-day',
    name: '7-Day Guarantee',
    description: 'Friendly safety net. Refunds are auto-approved within 7 days of purchase.',
    badge: 'Best seller',
    accent: 'from-emerald-500/40 to-emerald-900/60',
    legal: 'Members are eligible for a full refund within 7 days of purchase. After 7 days, access is considered consumed.'
  },
  {
    id: 'custom',
    name: 'Custom Rule',
    description: 'Choose your own timeframe and extra requirements.',
    badge: 'Flexible',
    accent: 'from-sky-500/40 to-indigo-900/60',
    legal: 'Custom policy. Provide requirements below so RefundGuard can automate decisions.'
  }
];

const baseEmailCopy = {
  approved:
    'Refund processed – here’s your money back! We just triggered your refund and revoked access so you are all set. You should see funds in 3-5 days.',
  denied:
    'Per policy, refunds after the guarantee window aren’t available. Here’s how to get maximum value from what you already unlocked...'
};

const PolicyCard = ({
  template,
  isSelected,
  onSelect,
  customControls,
  disabled
}) => (
  <button
    type="button"
    onClick={() => onSelect(template)}
    disabled={disabled}
    className={clsx(
      'relative w-full rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-left transition-all',
      'hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-glow hover:shadow-brand',
      isSelected && 'ring-2 ring-brand shadow-glow',
      disabled && 'opacity-70 cursor-not-allowed'
    )}
  >
    <div
      className={clsx(
        'absolute inset-0 rounded-3xl opacity-70 blur-xl transition-opacity',
        `bg-gradient-to-br ${template.accent}`,
        isSelected ? 'opacity-100' : 'opacity-40'
      )}
    />
    <div className="relative space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            {template.badge}
          </p>
          <h3 className="mt-3 text-xl font-semibold text-white">{template.name}</h3>
        </div>
        {isSelected && <CheckCircleIcon className="h-7 w-7 text-emerald-300" />}
      </div>
      <p className="text-sm text-slate-300">{template.description}</p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
        <p className="font-semibold uppercase tracking-wide text-emerald-200">Policy copy</p>
        <p className="mt-2 leading-relaxed">{template.legal}</p>
      </div>
      {template.id === 'custom' && customControls}
    </div>
  </button>
);

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    approved: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40',
    denied: 'bg-rose-500/20 text-rose-200 border border-rose-500/40',
    refunded: 'bg-emerald-500/30 text-emerald-100 border border-emerald-500/40',
    processed: 'bg-emerald-500/25 text-emerald-100 border border-emerald-400/40'
  };
  const labels = {
    pending: 'Pending review',
    approved: 'Auto-approved',
    denied: 'Auto-denied',
    refunded: 'Refunded',
    processed: 'Refund processed'
  };

  const key = styles[status] ? status : 'pending';
  const label = labels[status] ?? labels[key] ?? status;

  return (
    <span className={clsx('rounded-full px-3 py-1 text-xs font-medium capitalize', styles[key])}>
      {label}
    </span>
  );
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const normalizeRequests = (requests = []) =>
  requests.map((request) => {
    const purchaseDateRaw =
      request.purchaseDate ||
      request.purchase_date ||
      request.recordedAt ||
      request.createdAt ||
      request.purchaseDate;
    const parsedPurchaseDate = purchaseDateRaw ? new Date(purchaseDateRaw) : null;
    const purchaseTimestamp =
      parsedPurchaseDate && !Number.isNaN(parsedPurchaseDate.getTime())
        ? parsedPurchaseDate.getTime()
        : null;
    const normalizedPrice = request.price ?? request.amount ?? 0;
    const computedDays =
      request.daysSincePurchase ??
      (purchaseTimestamp !== null
        ? Math.max(0, Math.floor((Date.now() - purchaseTimestamp) / DAY_IN_MS))
        : 0);
    const generatedId =
      request.id ||
      request.whopRequestId ||
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2));

    return {
      ...request,
      id: generatedId,
      price: normalizedPrice,
      productName: request.productName || request.product || request.product_name || 'Whop Product',
      purchaseDate:
        purchaseTimestamp !== null ? new Date(purchaseTimestamp).toISOString() : purchaseDateRaw,
      daysSincePurchase: computedDays
    };
  });

function App() {
  const [connected, setConnected] = useState(false);
  const [policySynced, setPolicySynced] = useState(false);
  const [isHydratingPolicy, setIsHydratingPolicy] = useState(false);
  const [autoDisabledDemo, setAutoDisabledDemo] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(policyTemplates[1]);
  const [customPolicy, setCustomPolicy] = useState({
    days: 14,
    condition: 'Screenshots of lack of access or feature issue'
  });
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [activeProductId, setActiveProductId] = useState(demoData.products[0].id);
  const [refundRequests, setRefundRequests] = useState(normalizeRequests(demoData.requests));
  const [protectedTotal, setProtectedTotal] = useState(732);
  const [allowSync, setAllowSync] = useState(false);

  const savePolicy = useCallback(
    async (policyId, overrides = {}) => {
      if (!connected || !policySynced || isHydratingPolicy) {
        return;
      }
      const customDaysValue =
        overrides.customDays ?? customPolicy.days ?? '';
      const normalizedDays =
        customDaysValue === '' ? null : Number(customDaysValue);
      try {
        await axios.post('/api/policy', {
          policyId,
          customDays: Number.isNaN(normalizedDays) ? null : normalizedDays,
          customCondition: overrides.customCondition ?? customPolicy.condition
        });
      } catch (error) {
        console.error(error);
        toast.error('Could not save policy. Please retry.');
      }
    },
    [connected, policySynced, isHydratingPolicy, customPolicy]
  );

  const applyPolicyFromBackend = useCallback((policy) => {
    if (!policy?.policyId) {
      setAllowSync(true);
      return;
    }
    setIsHydratingPolicy(true);
    setAllowSync(false);

    const template =
      policyTemplates.find((candidate) => candidate.id === policy.policyId) || policyTemplates[1];
    setSelectedPolicy(template);

    if (policy.policyId === 'custom') {
      setCustomPolicy({
        days: policy.customDays ?? 14,
        condition: policy.customCondition ?? 'Screenshots of lack of access or feature issue'
      });
    }

    setTimeout(() => {
      setIsHydratingPolicy(false);
      setAllowSync(true);
    }, 0);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadSession() {
      try {
        console.log('[App] Loading session from /api/session...');
        const { data } = await axios.get('/api/session');
        console.log('[App] Session response:', data);
        if (ignore) return;
        if (data?.connected) {
          setConnected(true);
          setAutoDisabledDemo(false);
          applyPolicyFromBackend(data.policy);
        } else {
          setAllowSync(true);
        }
      } catch (error) {
        if (!ignore) {
          console.error('[App] Session load error:', error);
          setAllowSync(true);
        }
      } finally {
        if (!ignore) {
          console.log('[App] Session loading complete, enabling UI');
          setPolicySynced(true);
          setIsLoadingSession(false);
        }
      }
    }
    loadSession();
    return () => {
      ignore = true;
    };
  }, [applyPolicyFromBackend]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event?.data?.type === 'REFUND_GUARD_AUTH_SUCCESS') {
        setConnected(true);
        setAutoDisabledDemo(false);
        applyPolicyFromBackend(event.data.policy);
        setPolicySynced(true);
        setIsLoadingSession(false);
        toast.success('Whop store connected — products synced.');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [applyPolicyFromBackend]);

  useEffect(() => {
    if (!allowSync || selectedPolicy.id !== 'custom') {
      return;
    }
    const timeout = setTimeout(() => {
      savePolicy('custom', {
        customDays: customPolicy.days,
        customCondition: customPolicy.condition
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [allowSync, selectedPolicy.id, customPolicy, savePolicy]);

  useEffect(() => {
    if (demoMode) {
      return;
    }
    const saved = enrichedRequests
      .filter((request) => request.status === 'denied' || request.decision === 'denied')
      .reduce((sum, request) => sum + Number(request.price ?? request.amount ?? 0), 0);
    setProtectedTotal(saved);
  }, [demoMode, refundRequests, selectedPolicy.id, customPolicy.days]);

  useEffect(() => {
    if (!connected || autoDisabledDemo) {
      return;
    }
    if (demoMode) {
      setDemoMode(false);
    }
    setAutoDisabledDemo(true);
  }, [connected, demoMode, autoDisabledDemo]);

  useEffect(() => {
    if (demoMode) {
      setProtectedTotal(732);
    }
  }, [demoMode]);

  const activeProduct = useMemo(
    () => demoData.products.find((product) => product.id === activeProductId),
    [activeProductId]
  );

  const enrichedRequests = useMemo(
    () =>
      refundRequests.map((req) => {
        const status = req.status ?? 'pending';
        let decision = status;
        
        if (status === 'pending') {
          if (selectedPolicy.id === 'no-refund') {
            decision = 'denied';
          } else if (selectedPolicy.id === 'seven-day') {
            decision = req.daysSincePurchase <= 7 ? 'approved' : 'denied';
          } else {
            const threshold = Number(customPolicy.days) || 0;
            decision = req.daysSincePurchase <= threshold ? 'approved' : 'denied';
          }
        }
        
        return {
          ...req,
          status,
          decision
        };
      }),
    [refundRequests, selectedPolicy.id, customPolicy.days]
  );

  const handleConnectWhop = async () => {
    try {
      console.log('[handleConnectWhop] Starting OAuth flow...');
      const { data } = await axios.get('/api/test-auth');
      console.log('[handleConnectWhop] Login response:', data);
      if (!data?.url) {
        console.error('[handleConnectWhop] No URL in response');
        toast.error('Could not start Whop OAuth. Check your credentials.');
        return;
      }
      console.log('[handleConnectWhop] Opening popup with URL:', data.url);
      const authWindow = window.open(
        data.url,
        'refundguard-whop-oauth',
        'width=480,height=640,noopener'
      );
      if (!authWindow) {
        console.error('[handleConnectWhop] Popup was blocked');
        toast.error('Please allow pop-ups to connect your Whop store.');
      } else {
        console.log('[handleConnectWhop] Popup opened successfully');
      }
    } catch (error) {
      console.error('[handleConnectWhop] Error:', error);
      toast.error('Failed to connect to Whop. Verify API settings and retry.');
    }
  };

  const handlePolicySelect = (template) => {
    setSelectedPolicy(template);
    if (allowSync) {
      savePolicy(template.id, {
        customDays: template.id === 'custom' ? customPolicy.days : undefined,
        customCondition: template.id === 'custom' ? customPolicy.condition : undefined
      });
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadRequests() {
      if (demoMode || !connected) {
        setRefundRequests(normalizeRequests(demoData.requests));
        return;
      }
      try {
        const { data } = await axios.get('/api/refund-requests');
        if (!ignore) {
          setRefundRequests(normalizeRequests(data?.data ?? []));
        }
      } catch (error) {
        console.error(error);
        toast.error('Could not load live refund queue. Staying in demo mode.');
        setDemoMode(true);
      }
    }
    loadRequests();
    return () => {
      ignore = true;
    };
  }, [demoMode, connected]);

  const handleProcessRefund = async (requestId) => {
    const target = enrichedRequests.find((request) => request.id === requestId);
    if (!target) {
      return;
    }

    const amountValue = target.price ?? target.amount ?? 0;

    if (!demoMode) {
      try {
        await axios.post('/api/process-refund', {
          purchaseId: target.purchaseId,
          amount: amountValue,
          memberId: target.memberId,
          productId: target.productId,
          memberName: target.memberName,
          memberEmail: target.memberEmail,
          productName: target.productName,
          purchaseDate: target.purchaseDate,
          daysSincePurchase: target.daysSincePurchase,
          note: `Automated via RefundGuard policy ${selectedPolicy.name}`
        });
      } catch (error) {
        console.error(error);
        toast.error('Whop refund failed. Check your credentials.');
        return;
      }
    }

    setRefundRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'refunded',
              decision: 'refunded',
              resolvedAt: new Date().toISOString()
            }
          : req
      )
    );
    toast.success('Refund queued — Whop will release funds shortly.');
  };

  const handleSendDenial = async (requestId) => {
    const target = enrichedRequests.find((request) => request.id === requestId);
    if (!target) {
      return;
    }

    const amountValue = target.price ?? target.amount ?? 0;

    if (!demoMode) {
      try {
        await axios.post('/api/send-denial', {
          windowLabel:
            selectedPolicy.id === 'no-refund'
              ? 'purchase'
              : `${selectedPolicy.id === 'seven-day' ? 7 : customPolicy.days} days`,
          purchaseId: target.purchaseId,
          purchaseDate: target.purchaseDate,
          daysSincePurchase: target.daysSincePurchase,
          amount: amountValue,
          currency: 'USD',
          memberName: target.memberName,
          memberEmail: target.memberEmail,
          productName: target.productName
        });
      } catch (error) {
        console.error(error);
        toast.error('Could not send denial email. Please retry.');
        return;
      }
    }

    setRefundRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: 'denied', resolvedAt: new Date().toISOString() } : req
      )
    );
    if (demoMode && target) {
      setProtectedTotal((value) => value + target.price);
    }
    toast(
      (t) => (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">Denial template sent</p>
          <p className="text-xs text-slate-200">{baseEmailCopy.denied}</p>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="mt-2 rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
          >
            Close
          </button>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const processedCount = useMemo(
    () => enrichedRequests.filter((request) => request.status === 'refunded').length,
    [enrichedRequests]
  );

  return (
    <main className="gradient-bg min-h-screen bg-slate-950 pb-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pt-10 lg:px-12">
        <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-brand/10 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand-light">
                <ShieldCheckIcon className="h-4 w-4" />
                Made for Whop creators
              </div>
              <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">RefundGuard</h1>
              <p className="mt-3 max-w-xl text-lg text-slate-300">
                Automate your refund policy, keep dissatisfied members happy, and protect your revenue
                from manual leakages.
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="rounded-2xl border border-white/5 bg-white/10 px-6 py-4 text-right shadow-lg">
                <p className="text-xs uppercase tracking-wide text-slate-200">Revenue protected</p>
                <p className="text-3xl font-bold text-brand-light">{formatCurrency(protectedTotal)}</p>
                <p className="text-xs text-slate-400">This month</p>
              </div>
              <button
                type="button"
                onClick={() => setDemoMode((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-brand-light hover:text-white"
              >
                <SparklesIcon className="h-4 w-4 text-brand-light" />
                {demoMode ? 'Viewing demo mode' : 'Enable demo mode'}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
              <BoltIcon className="h-4 w-4 text-brand-light" />
              Go live in under 5 minutes
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
              <PlayCircleIcon className="h-4 w-4 text-brand-light" />
              Demo installs with pre-filled data
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
              <EnvelopeOpenIcon className="h-4 w-4 text-brand-light" />
              Built-in email responses
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-3">
          <article className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">1. Connect Whop & choose policy</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Instant sync pulls your products and applies your refund automation immediately.
                  </p>
                </div>
                <span
                  className={clsx(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    connected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-white'
                  )}
                >
                  {connected ? 'Connected' : 'Awaiting connect'}
                </span>
              </div>
              <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/20">
                    <ShieldCheckIcon className="h-6 w-6 text-brand-light" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Connected product</p>
                    <p className="text-base font-semibold text-white">
                      {activeProduct?.name ?? 'No product selected'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={activeProductId}
                    onChange={(event) => setActiveProductId(event.target.value)}
                    disabled={!connected || isLoadingSession}
                    className="rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm text-white focus:border-brand-light focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {demoData.products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleConnectWhop}
                    disabled={isLoadingSession}
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShieldCheckIcon className="h-5 w-5" />
                    {connected ? 'Reconnect store' : 'Connect Whop'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {policyTemplates.map((template) => (
                <PolicyCard
                  key={template.id}
                  template={template}
                  disabled={!connected}
                  isSelected={selectedPolicy.id === template.id}
                  onSelect={handlePolicySelect}
                  customControls={
                    <div className="mt-4 space-y-3">
                      <label className="block text-xs uppercase tracking-wide text-slate-300">
                        Refund window (days)
                        <input
                          type="number"
                          min={0}
                          value={customPolicy.days}
                          onChange={(event) =>
                            setCustomPolicy((prev) => ({
                              ...prev,
                              days: event.target.value
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-brand-light focus:outline-none"
                          placeholder="e.g. 14"
                        />
                      </label>
                      <label className="block text-xs uppercase tracking-wide text-slate-300">
                        Extra requirements
                        <textarea
                          rows={3}
                          value={customPolicy.condition}
                          onChange={(event) =>
                            setCustomPolicy((prev) => ({
                              ...prev,
                              condition: event.target.value
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-brand-light focus:outline-none"
                          placeholder="Proof of unsuccessful usage, Loom showing issue, etc."
                        />
                      </label>
                    </div>
                  }
                />
              ))}
            </div>

            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-sm text-emerald-100">
              <p className="font-semibold uppercase tracking-wide text-emerald-200">What happens next?</p>
              <ul className="mt-3 space-y-2 text-emerald-100">
                <li>• RefundGuard decides every incoming request in real-time.</li>
                <li>• Approved refunds run automatically via Whop API.</li>
                <li>• Denials trigger a templated email with your custom copy.</li>
              </ul>
            </div>
          </article>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
              <h3 className="text-lg font-semibold text-white">Policy summary</h3>
              <p className="mt-1 text-sm text-slate-300">Preview the messaging that ships to members.</p>
              <dl className="mt-5 space-y-3 text-sm text-slate-200">
                <div className="flex justify-between">
                  <dt>Selected policy</dt>
                  <dd className="font-semibold text-white">{selectedPolicy.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Refund window</dt>
                  <dd>
                    {selectedPolicy.id === 'no-refund'
                      ? 'Not available'
                      : selectedPolicy.id === 'seven-day'
                      ? '7 days'
                      : `${customPolicy.days || 0} days`}
                  </dd>
                </div>
                {selectedPolicy.id === 'custom' && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">Extra conditions</dt>
                    <dd className="mt-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
                      {customPolicy.condition}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Denial email</dt>
                  <dd className="mt-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
                    {baseEmailCopy.denied}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Approval email</dt>
                  <dd className="mt-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
                    {baseEmailCopy.approved}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="rounded-3xl border border-white/5 bg-white/10 p-6 text-sm text-slate-100 shadow-lg shadow-brand/20">
              <p className="text-xs uppercase tracking-wide text-emerald-200">Demo mode</p>
              <h3 className="mt-2 text-xl font-semibold text-white">See it in action</h3>
              <p className="mt-2 text-slate-200">
                We loaded live-looking refund requests so you can feel the automation before installing.
              </p>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('refund-dashboard')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="mt-4 w-full rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30"
              >
                Jump to dashboard
              </button>
            </div>
          </aside>
        </section>

        <section
          id="refund-dashboard"
          className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-inner shadow-black/20"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">2. Smart refund dashboard</h2>
              <p className="mt-1 text-sm text-slate-300">
                Every request runs through your policy the second it arrives. Approve or deny with one tap.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-200">Processed refunds</p>
                <p className="text-xl font-semibold text-white">{processedCount}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRefundRequests(normalizeRequests(demoData.requests));
                  setProtectedTotal(732);
                }}
                className="rounded-full border border-slate-700/60 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-brand-light hover:text-white"
              >
                Reset demo queue
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-white/5">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Days since purchase</th>
                  <th className="px-6 py-4">Decision</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {enrichedRequests.map((request) => (
                  <tr key={request.id} className="bg-slate-900/60 hover:bg-slate-900/90">
                    <td className="px-6 py-5">
                      <div className="flex flex-col text-sm text-white">
                        <span className="font-semibold">{request.memberName}</span>
                        <span className="text-xs text-slate-400">
                          Purchased {new Date(request.purchaseDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-200">{request.productName}</td>
                    <td className="px-6 py-5 text-sm text-slate-200">{request.daysSincePurchase} days</td>
                    <td className="px-6 py-5">
                      <StatusBadge status={request.decision} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => handleProcessRefund(request.id)}
                          disabled={request.decision === 'denied' || request.status === 'refunded'}
                          className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Process refund
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendDenial(request.id)}
                          disabled={request.decision === 'approved' || request.status === 'denied'}
                          className="rounded-full border border-rose-500/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-200 hover:border-rose-300 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Send denial template
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="flex flex-col items-center gap-3 rounded-3xl border border-white/5 bg-white/5 p-6 text-center text-sm text-slate-200">
          <p>
            Ready to lock in your policy? RefundGuard installs on Whop in one click and keeps your revenue
            safe 24/7.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark">
              Launch on Whop
            </button>
            <button className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 hover:border-white/40 hover:text-white">
              View changelog
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Need a human? Email support and we’ll configure it for you in under 24 hours.
          </p>
        </footer>
      </div>
    </main>
  );
}

export default App;

