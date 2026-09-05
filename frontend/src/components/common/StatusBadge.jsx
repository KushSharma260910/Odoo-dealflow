import React from 'react';

const STATUS_MAP = {
  // Quotation Statuses
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
  SENT: 'bg-blue-100 text-blue-800 border-blue-300',
  UNDER_NEGOTIATION: 'bg-purple-100 text-purple-800 border-purple-300',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800 border-amber-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-300',
  CONFIRMED: 'bg-teal-100 text-teal-800 border-teal-300',
  EXPIRED: 'bg-gray-100 text-gray-500 border-gray-200',

  // Risk Levels
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',

  // Order / Fulfillment Statuses
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  FULFILLED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ALLOCATED: 'bg-blue-50 text-blue-700 border-blue-200',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
  BACKORDERED: 'bg-rose-50 text-rose-700 border-rose-200',
  SHIPPED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // Billing / Invoice
  UNPAID: 'bg-rose-50 text-rose-700 border-rose-200',
  PARTIALLY_PAID: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-gray-100 text-gray-600 border-gray-300',
};

export const StatusBadge = ({ status, className = '' }) => {
  const normalized = (status || '').toString().toUpperCase();
  const colorClass = STATUS_MAP[normalized] || 'bg-gray-100 text-gray-700 border-gray-300';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass} ${className}`}
    >
      {normalized.replace(/_/g, ' ')}
    </span>
  );
};
