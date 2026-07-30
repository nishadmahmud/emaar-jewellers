'use client';

import React, { useState } from 'react';
import ExpenseListPage from './list/page';
import ExpenseCategoriesPage from './categories/page';

export default function ExpenseMainHub() {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div>
      {activeTab === 'list' ? (
        <ExpenseListPage />
      ) : (
        <ExpenseCategoriesPage />
      )}
    </div>
  );
}
