'use client';

import Image from 'next/image';

export default function CustomerPurchasedProducts({ partyWiseProduct }) {
    const products = partyWiseProduct?.data?.data || [];

    return (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-semibold text-lg text-neutral-900">Most Purchased Products</h3>
                <span className="text-sm text-neutral-500 font-medium bg-neutral-100 px-3 py-1 rounded-full">{products.length} Products</span>
            </div>
            <div className="p-6 bg-neutral-50/30">
                {products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map((item, idx) => (
                            <div key={idx} className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                <div className="aspect-square relative w-full bg-neutral-50 rounded-lg flex items-center justify-center mb-4 overflow-hidden border border-neutral-100 p-2">
                                    {item?.product_info?.image_path ? (
                                        <Image
                                            src={item.product_info.image_path}
                                            alt={item?.product_info?.name || 'Product'}
                                            fill
                                            className="object-contain"
                                        />
                                    ) : (
                                        <div className="text-neutral-300 font-medium">No Image</div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-neutral-900 line-clamp-2" title={item?.product_info?.name}>
                                        {item?.product_info?.name || 'Unknown Product'}
                                    </h4>
                                    <div className="flex justify-between items-end mt-2">
                                        <div className="text-xs text-neutral-500">#{item?.product_info?.barcode || 'N/A'}</div>
                                        <div className="font-semibold text-neutral-900">{item?.product_info?.retails_price || 0} AED</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-neutral-400">
                        <p>No products purchased yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
