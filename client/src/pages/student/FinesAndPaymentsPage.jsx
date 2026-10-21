import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { 
  CreditCard, ShieldCheck, CheckCircle2, AlertCircle, FileText, 
  ExternalLink, ArrowRight, Printer, Sparkles, Lock, DollarSign 
} from 'lucide-react';

export function FinesAndPaymentsPage() {
  const [fines, setFines] = useState([]);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cashfree Sandbox Payment State
  const [activePaymentFine, setActivePaymentFine] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchFines();
  }, []);

  async function fetchFines() {
    setLoading(true);
    try {
      const res = await api.get('/fines/my-fines');
      if (res.success) {
        setFines(res.fines || []);
        setTotalUnpaid(res.total_unpaid || 0);
        setTotalPaid(res.total_paid || 0);
      }
    } catch (err) {
      console.error('Failed to load fines:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInitiatePayment(fine) {
    setActivePaymentFine(fine);
    setPaymentProcessing(true);
    setActionError(null);

    try {
      const res = await api.post('/payments/create-order', { fineId: fine.id });
      if (res.success) {
        setPaymentSession(res);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to initiate Cashfree payment.');
      setActivePaymentFine(null);
    } finally {
      setPaymentProcessing(false);
    }
  }

  async function handleVerifySandboxPayment() {
    if (!activePaymentFine || !paymentSession) return;
    setPaymentProcessing(true);
    setActionError(null);

    try {
      const res = await api.post('/payments/verify', {
        orderId: paymentSession.orderId,
        paymentId: `CF_PAY_VERIFIED_${Date.now()}`,
        paymentMethod: 'UPI (Sandbox)',
        fineId: activePaymentFine.id
      });

      if (res.success) {
        setPaymentSuccessReceipt(res.receipt);
        setPaymentSession(null);
        setActivePaymentFine(null);
        await fetchFines();
      }
    } catch (err) {
      setActionError(err.message || 'Payment verification failed.');
    } finally {
      setPaymentProcessing(false);
    }
  }

  async function handleViewReceipt(fineId) {
    try {
      const res = await api.get(`/payments/receipt/${fineId}`);
      if (res.success && res.receipt) {
        setSelectedReceipt(res.receipt);
      }
    } catch (err) {
      console.error('Failed to load receipt:', err);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fines & Online Payments</h2>
        <p className="text-xs text-slate-500 mt-1">
          Automated overdue fine tracking (₹1/day) and secure Cashfree Sandbox payment gateway
        </p>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">Current Outstanding Fine</span>
            <div className="text-3xl font-black text-rose-600 mt-1">₹{totalUnpaid}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Rate: ₹1 per day per overdue book</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">Total Fines Settled</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">₹{totalPaid}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Verified online transactions</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">Payment Gateway</span>
            <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Cashfree Sandbox
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Instant verification & receipt</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Unpaid Fines Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Unpaid Overdue Fines</h3>
            <p className="text-xs text-slate-500">Select any overdue transaction to pay via Cashfree online</p>
          </div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
            {fines.filter(f => f.status === 'UNPAID').length} Pending Payment
          </span>
        </div>

        {fines.filter(f => f.status === 'UNPAID').length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No outstanding fines!</p>
            <p className="text-xs text-slate-400">All your library returns and renewals are clear.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {fines.filter(f => f.status === 'UNPAID').map(fine => (
              <div key={fine.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{fine.book_title}</h4>
                    <StatusBadge status={fine.status} className="text-[10px]" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reason: <strong>{fine.reason}</strong> (Overdue by {fine.overdue_days} days @ ₹1/day)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Fine Record ID: <span className="font-mono">{fine.id}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-lg font-black text-rose-600">₹{fine.fine_amount}</div>
                    <span className="text-[10px] text-slate-400">Total Payable</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInitiatePayment(fine)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay with Cashfree
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paid Fines & Receipt History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Payment & Receipt History</h3>
            <p className="text-xs text-slate-500">Verified transaction receipts and audit trail</p>
          </div>
        </div>

        {fines.filter(f => f.status === 'PAID').length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No past payment records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Book Title</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3">Payment Timestamp</th>
                  <th className="py-2.5 px-3">Transaction Status</th>
                  <th className="py-2.5 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.filter(f => f.status === 'PAID').map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{item.book_title}</td>
                    <td className="py-3 px-3 font-bold text-emerald-700">₹{item.fine_amount}</td>
                    <td className="py-3 px-3 text-slate-600">{item.payment_method || 'UPI (Sandbox)'}</td>
                    <td className="py-3 px-3 text-slate-500">{new Date(item.paid_at || item.created_at).toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status="PAID" className="text-[10px]" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleViewReceipt(item.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cashfree Sandbox Checkout Modal */}
      {paymentSession && (
        <Modal 
          isOpen={true} 
          onClose={() => setPaymentSession(null)} 
          title="Cashfree Sandbox Online Fine Checkout" 
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Total Fine Due</span>
                <div className="text-3xl font-black text-white mt-0.5">
                  ₹{paymentSession.amount}.00
                </div>
                <span className="text-[11px] text-sky-300 font-mono">Order ID: {paymentSession.orderId}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                  SANDBOX TEST
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Book Title:</span>
                <span className="font-bold text-slate-800">{activePaymentFine?.book_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Overdue Days:</span>
                <span className="font-semibold text-slate-700">{activePaymentFine?.overdue_days} days (@ ₹1/day)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Account:</span>
                <span className="font-medium text-slate-700">{paymentSession.orderPayload?.customer_details?.customer_name}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={paymentProcessing}
                onClick={handleVerifySandboxPayment}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {paymentProcessing ? 'Verifying with Cashfree...' : 'Simulate Successful Sandbox Payment (₹' + paymentSession.amount + ')'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Success Receipt Modal */}
      {paymentSuccessReceipt && (
        <Modal
          isOpen={true}
          onClose={() => setPaymentSuccessReceipt(null)}
          title="Payment Receipt (Cashfree Verified)"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-900">Fine Payment Cleared!</h4>
              <p className="text-xs text-slate-500 mt-0.5">Your library account is in good standing.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-bold text-slate-900">{paymentSuccessReceipt.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment ID:</span>
                <span className="text-slate-700">{paymentSuccessReceipt.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-700">₹{paymentSuccessReceipt.amount}.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Book Title:</span>
                <span className="text-slate-800">{paymentSuccessReceipt.bookTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-600">{new Date(paymentSuccessReceipt.paidAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setPaymentSuccessReceipt(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Stored Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReceipt(null)}
          title="Official Library Fine Payment Receipt"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Receipt Number:</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.studentName} ({selectedReceipt.institutionalId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Book Title:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.bookTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Overdue Days:</span>
                <span>{selectedReceipt.overdueDays} days (@ ₹1/day)</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700 text-sm pt-1 border-t border-slate-200">
                <span>Amount Paid:</span>
                <span>₹{selectedReceipt.amount}.00</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Payment Gateway:</span>
                <span>Cashfree Sandbox (ID: {selectedReceipt.paymentId})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}
