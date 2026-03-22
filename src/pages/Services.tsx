import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Service } from '../stores/cartStore';
import { useCartStore } from '../stores/cartStore';
import BottomNav from '../components/BottomNav';

const CATEGORIES = [
  'All', 'Plumbing', 'Electrical', 'AC Repair', 'Carpentry', 
  'Painting', 'Appliance Repair', 'Cleaning', 
  'Pest Control', 'Property Management', 'Facility Management'
];

export default function Services() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';
  
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { addItem, items } = useCartStore();

  useEffect(() => {
    fetchServices();
  }, []);

  // Update searchTerm if URL changes
  useEffect(() => {
    const s = searchParams.get('search') || '';
    setSearchTerm(s);
  }, [searchParams]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
        
      if (error) throw error;
      setServices(data as Service[]);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesCategory = activeCategory === 'All' || service.category === activeCategory;
    const matchesSearch = !searchTerm || 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCartQuantity = (serviceId: string) => {
    return items.find(i => i.service.id === serviceId)?.quantity || 0;
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header and Filter */}
      <div className="bg-surface sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between border-b border-border">
          <div className="flex flex-col">
            <h1 className="text-xl font-syne font-bold text-accent">
              {searchTerm ? 'Search Results' : 'Browse Services'}
            </h1>
            {searchTerm && (
              <span className="text-xs text-text-secondary mt-0.5">
                Showing results for "{searchTerm}" 
                <button 
                  onClick={() => navigate('/services', { replace: true })}
                  className="ml-2 text-primary font-bold hover:underline"
                >
                  Clear
                </button>
              </span>
            )}
          </div>
          <button className="p-2 border border-border rounded-full hover:bg-gray-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
        </div>
        
        <div className="px-6 py-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-gray-600 border border-border hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-text-secondary font-syne font-bold uppercase tracking-widest text-[10px]">Updating Catalogue...</p>
          </div>
        ) : filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <div 
              key={service.id} 
              className="card flex flex-row overflow-hidden hover:shadow-elevated transition-shadow cursor-pointer p-0"
              onClick={() => navigate(`/services/${service.id}`)}
            >
              <div className="w-1/3 bg-gray-100 relative min-h-[120px]">
                {service.image_url ? (
                  <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-primary-light">
                    🛠️
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  {service.category}
                </div>
              </div>
              <div className="w-2/3 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-syne font-bold text-lg text-accent leading-tight line-clamp-1">{service.name}</h3>
                  <div className="flex items-center gap-2 mt-1 mb-2">
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {service.duration_minutes} min
                    </span>
                  </div>
                  <p className="text-sm font-sans text-gray-500 line-clamp-2 leading-snug">{service.description}</p>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="font-mono font-bold text-primary text-lg">₹{service.price}</span>
                  
                  {getCartQuantity(service.id) > 0 ? (
                    <div className="flex items-center gap-3 bg-primary/10 rounded-full px-1 py-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate('/cart'); }}
                        className="bg-white text-primary px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                      >
                        In Cart ({getCartQuantity(service.id)})
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        addItem(service); 
                      }}
                      className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2 rounded-full transition-colors shadow-md"
                    >
                      Add +
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <h3 className="text-lg font-syne font-bold text-accent mb-2">No results found</h3>
            <p className="text-text-secondary text-sm max-w-[240px] leading-relaxed">
              {searchTerm 
                ? `We couldn't find any services matching "${searchTerm}". Try a different term or browse categories.` 
                : "It looks like our service catalogue is currently empty. Re-run the SQL seed command in Supabase."}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
