import React from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export const SubscriptionPlans = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans Setup</h1>
        <p className="text-sm text-gray-500">Recurring billing interval and subscription plan tiers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Monthly Tier</span>
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Starter SaaS</h3>
            <p className="text-3xl font-black text-gray-900 mt-2">$299<span className="text-sm text-gray-500 font-normal">/mo</span></p>
            <ul className="mt-4 space-y-2 text-xs text-gray-600">
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Standard Product Catalog</li>
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> 5 Sales Rep Licenses</li>
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Automated Risk Calculation</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-blue-600 p-6 shadow-md flex flex-col justify-between relative">
          <span className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            Popular
          </span>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Quarterly Tier</span>
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Growth Partner</h3>
            <p className="text-3xl font-black text-gray-900 mt-2">$799<span className="text-sm text-gray-500 font-normal">/qtr</span></p>
            <ul className="mt-4 space-y-2 text-xs text-gray-600">
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> All Starter Features</li>
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Multi-Warehouse Stock Splitting</li>
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Manager Approval Workflows</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Yearly Tier</span>
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Enterprise Scale</h3>
            <p className="text-3xl font-black text-gray-900 mt-2">$2,499<span className="text-sm text-gray-500 font-normal">/yr</span></p>
            <ul className="mt-4 space-y-2 text-xs text-gray-600">
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Unlimited Users & Products</li>
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Direct Customer Negotiation Portal</li>
              <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Full System Audit Trail Logging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
