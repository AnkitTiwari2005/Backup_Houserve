import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useAddressStore } from '../stores/addressStore';
import BottomNav from '../components/BottomNav';

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const { selectedAddress } = useAddressStore();
  
  const [preferredDate, setPreferredDate] = useState<string>('');
  const [preferredTime, setPreferredTime] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const subtotal = getSubtotal();
  const platformFee = 50;
  const gst = Math.round((subtotal + platformFee) * 0.18);
  const total = subtotal + platformFee + gst;

  // Generate next 7 days
  const today = new Date();
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      value: d.toISOString().split('T')[0],
      dayStr: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr: d.getDate().toString()
    };
  });

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', 
    '05:00 PM', '06:00 PM'
  ];

  const handleProceed = () => {
    if (!preferredDate || !preferredTime) {
      alert('Please select a preferred date and time slot.');
      return;
    }
    
    // Pass booking details via state
    navigate('/checkout', {
      state: {
        preferredDate,
        preferredTime,
        specialInstructions,
        subtotal,
        platformFee,
        gst,
        total
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-bg flex flex-col pt-12">
        <div className="px-6 mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-syne font-bold text-accent">Your Cart</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center -mt-20">
          <div className="text-6xl mb-6">🛒</div>
          <h2 className="text-xl font-syne font-bold text-accent mb-2">Your cart is empty</h2>
          <p className="text-text-secondary mb-8 max-w-xs">Looks like you haven't added any services yet.</p>
          <button onClick={() => navigate('/services')} className="btn-primary">Browse Services</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-[180px]">
      <div className="px-6 pt-6 pb-4 bg-surface shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <h1 className="text-xl font-syne font-bold text-accent">Your Cart</h1>
          </div>
          <div className="bg-primary-light text-primary font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm">
            {items.reduce((acc, curr) => acc + curr.quantity, 0)}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Cart Items List */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.service.id} className="card p-3 flex gap-3 relative overflow-hidden group">
              <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 hidden sm:block">
                {item.service.image_url ? (
                  <img src={item.service.image_url} alt={item.service.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🛠️</div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-syne font-bold text-accent text-sm leading-tight line-clamp-2">
                    {item.service.name}
                  </h3>
                  <button 
                    onClick={() => removeItem(item.service.id)}
                    className="text-gray-400 hover:text-error transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="font-mono font-bold text-primary">₹{item.service.price}</span>
                  
                  <div className="flex items-center gap-3 bg-gray-50 border border-border rounded-lg p-1 shadow-sm">
                    <button 
                      onClick={() => updateQuantity(item.service.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-primary disabled:text-gray-300 font-bold"
                      disabled={item.quantity <= 1}
                    >−</button>
                    <span className="font-mono font-bold w-4 text-center text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.service.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-primary font-bold"
                    >+</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Address Card */}
        <div className="card border border-border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-syne font-bold text-accent flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
              Service Address
            </h3>
            <Link to="/address-selection" className="text-sm font-medium text-primary">Change</Link>
          </div>
          {selectedAddress ? (
            <div className="text-sm text-text-secondary leading-relaxed">
              <p className="font-medium text-text-primary">
                {selectedAddress.flat_number}, {selectedAddress.building_name}
              </p>
              <p>{selectedAddress.street}</p>
              <p>{selectedAddress.city} - {selectedAddress.pincode}</p>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/address-selection')}
              className="text-sm text-primary font-medium p-2 bg-primary-light rounded border border-primary w-full"
            >
              Select an address to proceed
            </button>
          )}
        </div>

        {/* Schedule */}
        <div className="card">
          <h3 className="font-syne font-bold text-accent flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
            Preferred Schedule
          </h3>
          
          <div className="mb-4">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Preferred Date</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {dates.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setPreferredDate(d.value)}
                  className={`min-w-[60px] p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    preferredDate === d.value 
                      ? 'bg-primary text-white border-primary shadow-md' 
                      : 'bg-white text-gray-500 border-border hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${preferredDate === d.value ? 'text-primary-light' : 'text-gray-400'}`}>
                    {d.dayStr}
                  </span>
                  <span className="text-lg font-mono font-bold mt-1 leading-tight">{d.dateStr}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Preferred Time</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setPreferredTime(time)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    preferredTime === time 
                      ? 'bg-primary text-white border-primary shadow-md' 
                      : 'bg-white text-gray-600 border-border hover:bg-gray-50'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="card">
          <label className="font-syne font-bold text-accent block mb-2 cursor-pointer" htmlFor="instructions">
            Any special instructions?
          </label>
          <textarea
            id="instructions"
            placeholder="E.g., Please call before arriving..."
            className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none h-24"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
          ></textarea>
        </div>

        {/* Order Summary */}
        <div className="card pb-2">
          <h3 className="font-syne font-bold text-accent border-b border-border pb-3 mb-3">Order Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Item Total</span>
              <span className="font-mono">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Platform Fee</span>
              <span className="font-mono">₹{platformFee}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>GST (18%)</span>
              <span className="font-mono">₹{gst}</span>
            </div>
            <div className="border-t border-border pt-3 mt-1 flex justify-between items-center">
              <span className="font-syne font-bold text-accent">Total Amount</span>
              <span className="font-mono font-bold text-lg text-primary">₹{total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border shadow-[0_-8px_20px_rgba(0,0,0,0.05)] z-30 pb-safe">
        <button 
          onClick={handleProceed}
          disabled={!selectedAddress || !preferredDate || !preferredTime}
          className={`w-full btn-primary py-4 text-lg rounded-2xl shadow-lg flex justify-between items-center px-6 ${
            (!selectedAddress || !preferredDate || !preferredTime) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span>Proceed to Pay</span>
          <span className="font-mono">₹{total} <span className="text-xl ml-2">→</span></span>
        </button>
      </div>
    </div>
  );
}
