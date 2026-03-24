import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Service } from '../stores/cartStore';
import { useCartStore } from '../stores/cartStore';

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, items } = useCartStore();
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchService(id);
  }, [id]);

  const fetchService = async (serviceId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();
        
      if (error) throw error;
      setService(data as Service);
    } catch (error) {
      console.error('Error fetching service:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-syne font-bold text-accent mb-2">Service Not Found</h2>
        <button onClick={() => navigate('/services')} className="btn-primary mt-4">Back to Services</button>
      </div>
    );
  }

  const cartQuantity = items.find(i => i.service.id === service.id)?.quantity || 0;

  return (
    <div className="min-h-screen bg-bg pb-28 relative">
      <div className="h-[35vh] relative bg-primary-light">
        {service.image_url ? (
          <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center pt-8">
            <span className="text-6xl mb-4">🛠️</span>
          </div>
        )}
        
        {/* Gradient Overlay for Text Visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="inline-block bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 shadow-md">
            {service.category}
          </div>
          <h1 className="text-3xl font-syne font-extrabold text-white leading-tight drop-shadow-md">
            {service.name}
          </h1>
        </div>
      </div>

      <div className="p-6 space-y-8 bg-white -mt-4 rounded-t-3xl relative z-10 min-h-[60vh] shadow-[0_-8px_20px_rgba(0,0,0,0.05)]">
        
        <div className="flex justify-between items-center border-b border-border pb-6 mt-2">
          <div className="font-mono font-bold text-3xl text-primary">
            ₹{service.price}
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary bg-gray-50 px-3 py-1.5 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-medium text-sm">~{service.duration_minutes} mins</span>
          </div>
        </div>

        <div>
          <h3 className="font-syne font-bold text-xl text-accent mb-3">About this service</h3>
          <p className="text-text-secondary leading-relaxed">
            {service.description}
          </p>
        </div>

        {service.what_is_included && service.what_is_included.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <h3 className="font-syne font-bold text-lg text-accent mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              What's Included
            </h3>
            <ul className="space-y-3">
              {service.what_is_included.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="text-text-primary text-sm font-medium leading-tight">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-30">
        <div className="flex justify-between items-center mb-3 text-sm px-1">
          <span className="text-text-secondary font-medium">Service Total</span>
          <span className="font-mono text-lg font-bold text-accent">₹{service.price}</span>
        </div>
        
        {cartQuantity > 0 ? (
          <button 
            onClick={() => navigate('/cart')}
            className="w-full bg-accent text-white font-syne font-bold py-4 px-6 rounded-2xl transition-all shadow-lg text-lg flex justify-center items-center gap-2"
          >
            Go to Cart ({cartQuantity} added)
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        ) : (
          <button 
            onClick={() => addItem(service)}
            className="w-full btn-primary py-4 rounded-2xl shadow-lg text-lg"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
