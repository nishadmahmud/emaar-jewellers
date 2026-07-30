'use client';

import React, { useState } from 'react';
import QuickPaymentListPage from './list/page';
import PaymentCategoriesPage from './categories/page';

export default function QuickPaymentMainHub() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div>
      {activeTab === 'list' ? (
        <QuickPaymentListPage />
      ) : (
        <PaymentCategoriesPage />
      )}
    </div>
  );
}
