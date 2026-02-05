import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Lock, CreditCard } from 'lucide-react';

const Billing: React.FC = () => {
  const { user } = useAuth();

  // Strict restriction: Only SUPERADMIN can see billing details.
  if (user?.role !== UserRole.SUPERADMIN) {
      return (
          <div className="flex flex-col items-center justify-center h-[600px] text-center p-6">
              <div className="bg-gray-100 p-6 rounded-full mb-6">
                  <Lock className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Restricted Access</h2>
              <p className="text-gray-500 mt-2 max-w-md">
                  Billing and subscription management is restricted to the Account Owner (Superadmin). 
              </p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
       <div>
         <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Billing & Subscription</h2>
         <p className="text-gray-500 mt-1">Manage your plan and payment methods.</p>
      </div>

      <div className="bg-white p-8 rounded-[32px] shadow-sm max-w-2xl">
          <div className="flex items-center justify-between mb-8">
              <div>
                  <h3 className="text-xl font-bold text-gray-900">Current Plan</h3>
                  <p className="text-gray-500">Pro Business Plan</p>
              </div>
              <span className="px-4 py-2 bg-green-100 text-green-700 font-bold rounded-full text-sm">Active</span>
          </div>

          <div className="border-t border-gray-100 pt-8 flex items-center justify-between">
              <div className="flex items-center">
                  <CreditCard className="w-8 h-8 text-gray-400 mr-4" />
                  <div>
                      <p className="font-bold text-gray-900">Visa ending in 4242</p>
                      <p className="text-sm text-gray-400">Expires 12/28</p>
                  </div>
              </div>
              <button className="text-[#007AFF] font-bold text-sm">Update</button>
          </div>
      </div>
    </div>
  );
};

export default Billing;