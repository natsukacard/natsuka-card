'use client';

import React from 'react';
import CheckIcon from './CheckIcon';

const ComparisonTable = () => {
  const features = [
    {
      category: 'Core Features',
      items: [
        { name: 'Number of Binders', free: '5', pro: '20' },
        { name: 'Custom Url Link', free: false, pro: true },
        { name: 'Webhooks', free: true, pro: true },
        { name: 'Templates', free: true, pro: true },
      ],
    },
    {
      category: 'Support',
      items: [
        { name: 'Community Support', free: true, pro: true },
        { name: 'Priority Email Support', free: false, pro: true },
        { name: 'Dedicated Onboarding', free: false, pro: false },
      ],
    },
    {
      category: 'Advanced',
      items: [
        { name: 'Dedicated IP Address', free: false, pro: true },
        { name: 'Role-based access control', free: false, pro: true },
        { name: 'Audit Logs', free: false, pro: true },
      ],
    },
  ];

  const renderCheck = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckIcon className="mx-auto text-green-500" />
      ) : (
        <span className="mx-auto text-lg text-gray-500">-</span>
      );
    }
    return <span className="text-sm text-gray-500">{value}</span>;
  };

  return (
    <div className="mt-24">
      <h2 className="mb-12 text-center text-3xl font-extrabold sm:text-4xl">
        pick the right plan for you
      </h2>
      <div className="overflow-x-auto">
        <div className="mx-auto max-w-4xl min-w-full lg:w-full lg:min-w-0">
          <table className="w-full table-fixed text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="w-1/2 p-4 text-lg font-semibold">Features</th>
                <th className="w-1/4 p-4 text-center text-lg font-semibold">
                  Free
                </th>
                <th className="w-1/4 p-4 text-center text-lg font-semibold">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {/* FIX: Replaced invalid nested <tbody> with React.Fragment to prevent hydration errors. */}
              {features.map((category) => (
                <React.Fragment key={category.category}>
                  <tr className="bg-gray-200">
                    <td colSpan={3} className="p-4 text-lg font-semibold">
                      {category.category}
                    </td>
                  </tr>
                  {category.items.map((item) => (
                    <tr key={item.name} className="border-b border-gray-800">
                      <td className="p-4">{item.name}</td>
                      <td className="p-4 text-center">
                        {renderCheck(item.free)}
                      </td>
                      <td className="p-4 text-center">
                        {renderCheck(item.pro)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
