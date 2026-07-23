import { Users, TrendingUp, TrendingDown, Store, Wallet, Gem } from 'lucide-react';

export default function DashboardPage() {
  // Mock data for the UI based on the user's provided Excel/PDF samples
  const stats = [
    { name: 'Total Customers', value: '1,248', icon: Users, change: '+12%', positive: true },
    { name: 'Total Sell (CDT)', value: '৳ 36,41,436.86', icon: TrendingUp, change: '+8.2%', positive: true },
    { name: 'Total Purchase (DBT)', value: '৳ 10,57,62.75', icon: TrendingDown, change: '-2.4%', positive: false },
    { name: 'Total Vendors', value: '42', icon: Store, change: '+1', positive: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium tracking-wide text-black">Overview</h2>
        <p className="text-sm text-neutral-500 mt-1">Your business performance at a glance.</p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 p-6 rounded-2xl relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wallet size={120} className="text-black" />
          </div>
          <div className="relative z-10">
            <h3 className="text-neutral-500 font-medium mb-2">Total Account Balance</h3>
            <div className="text-4xl font-light mb-1 text-black">৳ 14,70,464.00</div>
            <div className="text-sm text-neutral-400">Includes forward buys and pending credits</div>
          </div>
        </div>

        <div className="bg-black text-white p-6 rounded-2xl relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Gem size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-neutral-400 font-medium mb-2">Total Gold Stock</h3>
            <div className="text-4xl font-light mb-1">577.684 <span className="text-2xl">Tola</span></div>
            <div className="text-sm text-neutral-500">Total Unit: 3,497.684 | Chain Buy: 1,755.144</div>
          </div>
        </div>
      </div>

      {/* Secondary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white border border-neutral-200 p-5 rounded-xl hover:border-neutral-300 transition-colors shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <Icon size={20} className="text-black" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.positive ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <div className="text-xl font-medium mb-1 text-black">{stat.value}</div>
                <div className="text-sm text-neutral-500">{stat.name}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Ledgers (CDT/DBT) */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4 text-black">Recent Account Ledgers (Date: 30/4/2026)</h3>
        <div className="border border-neutral-200 rounded-xl overflow-hidden overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 font-medium text-neutral-500">NAME</th>
                <th className="px-6 py-4 font-medium text-neutral-500">QTY</th>
                <th className="px-6 py-4 font-medium text-neutral-500">UNIT</th>
                <th className="px-6 py-4 font-medium text-blue-600">CDT</th>
                <th className="px-6 py-4 font-medium text-red-600">DBT</th>
                <th className="px-6 py-4 font-medium text-neutral-500">EXP</th>
                <th className="px-6 py-4 font-medium text-blue-600">BALANCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              <tr className="hover:bg-neutral-50 transition-colors text-black">
                <td className="px-6 py-4 font-mono font-medium text-neutral-700">ABT.ic</td>
                <td className="px-6 py-4">6900</td>
                <td className="px-6 py-4">0.89</td>
                <td className="px-6 py-4 text-blue-600">7752.8090</td>
                <td className="px-6 py-4 text-red-600"></td>
                <td className="px-6 py-4 text-neutral-500"></td>
                <td className="px-6 py-4 text-blue-600"></td>
              </tr>
              <tr className="hover:bg-neutral-50 transition-colors text-black">
                <td className="px-6 py-4 font-mono font-medium text-neutral-700">ANS22</td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-blue-600"></td>
                <td className="px-6 py-4 text-red-600">424015.77</td>
                <td className="px-6 py-4 text-neutral-500"></td>
                <td className="px-6 py-4 text-blue-600"></td>
              </tr>
              <tr className="hover:bg-neutral-50 transition-colors text-black">
                <td className="px-6 py-4 font-mono font-medium text-neutral-700">BNK22</td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-blue-600">236235.929</td>
                <td className="px-6 py-4 text-red-600"></td>
                <td className="px-6 py-4 text-neutral-500"></td>
                <td className="px-6 py-4 text-blue-600"></td>
              </tr>
              <tr className="hover:bg-neutral-50 transition-colors text-black">
                <td className="px-6 py-4 font-mono font-medium text-neutral-700">BJN22</td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-blue-600"></td>
                <td className="px-6 py-4 text-red-600">526232.83</td>
                <td className="px-6 py-4 text-neutral-500">15.3</td>
                <td className="px-6 py-4 text-blue-600">20.3</td>
              </tr>
              <tr className="hover:bg-neutral-50 transition-colors text-black">
                <td className="px-6 py-4 font-mono font-medium text-neutral-700">DH</td>
                <td className="px-6 py-4">8714.562</td>
                <td className="px-6 py-4">30</td>
                <td className="px-6 py-4 text-blue-600">261436.86</td>
                <td className="px-6 py-4 text-red-600"></td>
                <td className="px-6 py-4 text-neutral-500"></td>
                <td className="px-6 py-4 text-blue-600"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Buy Logs */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4 text-black">Stock Overview (BUY & CHAIN BUY)</h3>
        <div className="border border-neutral-200 rounded-xl overflow-hidden overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 font-medium text-neutral-500">TYPE</th>
                <th className="px-6 py-4 font-medium text-neutral-500">NAME</th>
                <th className="px-6 py-4 font-medium text-neutral-500">TOLA (VORI)</th>
                <th className="px-6 py-4 font-medium text-neutral-500">UNIT</th>
                <th className="px-6 py-4 font-medium text-neutral-500">TK</th>
                <th className="px-6 py-4 font-medium text-neutral-500">AVG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              <tr className="hover:bg-neutral-50 transition-colors text-black">
                <td className="px-6 py-4"><span className="inline-block px-2 py-1 bg-black text-white text-xs rounded font-medium">BUY</span></td>
                <td className="px-6 py-4 font-mono text-neutral-700">ST</td>
                <td className="px-6 py-4 text-amber-600 font-medium">204.284</td>
                <td className="px-6 py-4 text-neutral-500">0.000</td>
                <td className="px-6 py-4">659505.36</td>
                <td className="px-6 py-4"></td>
              </tr>
              <tr className="hover:bg-neutral-50 transition-colors text-black">
                <td className="px-6 py-4"><span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded font-medium">CHAIN BUY</span></td>
                <td className="px-6 py-4 font-mono text-neutral-700">Stock</td>
                <td className="px-6 py-4 text-amber-600 font-medium">385.244</td>
                <td className="px-6 py-4 text-neutral-500">197.726</td>
                <td className="px-6 py-4">76172.755</td>
                <td className="px-6 py-4"></td>
              </tr>
              <tr className="hover:bg-neutral-50 transition-colors text-black">
                <td className="px-6 py-4"><span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded font-medium">CHAIN BUY</span></td>
                <td className="px-6 py-4 font-mono text-neutral-700">Ans22</td>
                <td className="px-6 py-4 text-amber-600 font-medium">170</td>
                <td className="px-6 py-4 text-neutral-500">197.864</td>
                <td className="px-6 py-4">33636.818</td>
                <td className="px-6 py-4"></td>
              </tr>
              <tr className="hover:bg-neutral-50 transition-colors text-black">
                <td className="px-6 py-4"><span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded font-medium">FWD BUY</span></td>
                <td className="px-6 py-4 font-mono text-neutral-700">SKNDR</td>
                <td className="px-6 py-4 text-purple-600 font-medium">500</td>
                <td className="px-6 py-4 text-purple-600 font-medium">5401</td>
                <td className="px-6 py-4 text-blue-600">2700500</td>
                <td className="px-6 py-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
