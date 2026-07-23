import { Users, TrendingUp, TrendingDown, Store, Wallet, Gem } from 'lucide-react';

export default function DashboardPage() {
  // Mock data for the UI
  const stats = [
    { name: 'Total Customers', value: '1,248', icon: Users, change: '+12%', positive: true },
    { name: 'Total Sell', value: '৳ 4,52,000', icon: TrendingUp, change: '+8.2%', positive: true },
    { name: 'Total Purchase', value: '৳ 2,15,000', icon: TrendingDown, change: '-2.4%', positive: false },
    { name: 'Total Vendors', value: '42', icon: Store, change: '+1', positive: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium tracking-wide">Overview</h2>
        <p className="text-sm text-neutral-400 mt-1">Your business performance at a glance.</p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-neutral-400 font-medium mb-2">Account Balance</h3>
            <div className="text-4xl font-light mb-1">৳ 12,45,000</div>
            <div className="text-sm text-neutral-500">~ $11,350 USD | ~ 41,700 AED</div>
          </div>
        </div>

        <div className="bg-white text-black p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Gem size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-neutral-500 font-medium mb-2">Total Gold Inventory</h3>
            <div className="text-4xl font-light mb-1">100.00 <span className="text-2xl">Vori</span></div>
            <div className="text-sm text-neutral-500">Available for sale across all branches</div>
          </div>
        </div>
      </div>

      {/* Secondary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-black border border-neutral-800 p-5 rounded-xl hover:border-neutral-700 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-neutral-900 rounded-lg">
                  <Icon size={20} className="text-white" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.positive ? 'bg-white/10 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <div className="text-2xl font-medium mb-1">{stat.value}</div>
                <div className="text-sm text-neutral-400">{stat.name}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Transactions placeholder */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900 border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4 font-medium text-neutral-400">Transaction ID</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Type</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Amount (Gold)</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Value Paid</th>
                <th className="px-6 py-4 font-medium text-neutral-400">Date</th>
                <th className="px-6 py-4 font-medium text-neutral-400 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              <tr className="hover:bg-neutral-900/50 transition-colors">
                <td className="px-6 py-4 font-mono text-neutral-300">#TRX-0982</td>
                <td className="px-6 py-4"><span className="inline-block px-2 py-1 bg-white text-black text-xs rounded font-medium">Sell</span></td>
                <td className="px-6 py-4">50 Vori</td>
                <td className="px-6 py-4">৳ 2,25,000</td>
                <td className="px-6 py-4 text-neutral-400">Today, 10:42 AM</td>
                <td className="px-6 py-4 text-right"><span className="text-white">Completed</span></td>
              </tr>
              <tr className="hover:bg-neutral-900/50 transition-colors">
                <td className="px-6 py-4 font-mono text-neutral-300">#TRX-0981</td>
                <td className="px-6 py-4"><span className="inline-block px-2 py-1 bg-neutral-800 text-neutral-300 text-xs rounded font-medium">Purchase</span></td>
                <td className="px-6 py-4">20 Vori</td>
                <td className="px-6 py-4">$ 2,270</td>
                <td className="px-6 py-4 text-neutral-400">Yesterday, 4:15 PM</td>
                <td className="px-6 py-4 text-right"><span className="text-white">Completed</span></td>
              </tr>
              <tr className="hover:bg-neutral-900/50 transition-colors">
                <td className="px-6 py-4 font-mono text-neutral-300">#TRX-0980</td>
                <td className="px-6 py-4"><span className="inline-block px-2 py-1 bg-white text-black text-xs rounded font-medium">Sell</span></td>
                <td className="px-6 py-4">5 Vori</td>
                <td className="px-6 py-4">AED 2,100</td>
                <td className="px-6 py-4 text-neutral-400">Yesterday, 1:20 PM</td>
                <td className="px-6 py-4 text-right"><span className="text-white">Completed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
