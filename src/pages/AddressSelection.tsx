import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAddressStore, type Address } from '../stores/addressStore';
import { useAuthStore } from '../stores/authStore';

export default function AddressSelection() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedAddress, setSelectedAddress } = useAddressStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      setAddresses(data as Address[]);
      
      // If there's a default address and none is currently selected, select it
      if (data && data.length > 0 && !selectedAddress) {
        const defaultAddr = data.find(a => a.is_default) || data[0];
        setSelectedAddress(defaultAddr as Address);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/add-address?id=${id}`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to delete this address?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setAddresses(prev => prev.filter(a => a.id !== id));
      if (selectedAddress?.id === id) {
        setSelectedAddress(null);
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
      alert('Failed to delete address. Please try again.');
    }
  };

  const handleConfirm = () => {
    if (selectedAddress) {
      navigate('/home'); 
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col p-6 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-syne font-bold text-accent">Where should we send our expert?</h1>
          <p className="text-text-secondary mt-1">Select a service address</p>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : addresses.length > 0 ? (
          addresses.map((address) => (
            <div 
              key={address.id}
              onClick={() => setSelectedAddress(address)}
              className={`card cursor-pointer transition-all border-2 ${
                selectedAddress?.id === address.id 
                  ? 'border-primary shadow-md bg-primary-light/30' 
                  : 'border-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                    {address.label}
                  </span>
                  {selectedAddress?.id === address.id && (
                    <span className="text-primary">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => handleEdit(address.id, e)}
                    className="text-gray-400 hover:text-primary transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button 
                    onClick={(e) => handleDelete(address.id, e)}
                    className="text-gray-400 hover:text-error transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <p className="font-sans font-medium text-text-primary">
                {address.flat_number}, {address.building_name && `${address.building_name}, `}
                {address.street}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {address.city} - {address.pincode}
              </p>
              {address.latitude && address.longitude && (
                <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium bg-primary-light w-max px-2 py-1 rounded">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Based on coordinates
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 px-4">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-primary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <h3 className="text-lg font-syne font-bold text-accent mb-2">No addresses saved</h3>
            <p className="text-text-secondary text-sm">Add a new address to discover services in your area.</p>
          </div>
        )}

        <button 
          onClick={() => navigate('/add-address')}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-syne font-bold flex items-center justify-center gap-2 hover:bg-white hover:border-gray-400 hover:text-gray-700 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Add New Address
        </button>
      </div>

      {addresses.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <button 
            onClick={handleConfirm}
            disabled={!selectedAddress}
            className={`w-full btn-primary ${!selectedAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Confirm Address
          </button>
        </div>
      )}
    </div>
  );
}
