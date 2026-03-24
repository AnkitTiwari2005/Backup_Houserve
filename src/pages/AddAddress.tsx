import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

// Fix for leaflet default marker icon issue (Audit Fix #2.10)
// Using a standard SVG data-URI to avoid external CDN dependencies
const MARKER_ICON_SVG = `data:image/svg+xml;base64,${btoa(`
  <svg width="25" height="41" viewBox="0 0 25 41" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 0C5.596 0 0 5.596 0 12.5C0 21.875 12.5 41 12.5 41C12.5 41 25 21.875 25 12.5C25 5.596 19.404 0 12.5 0ZM12.5 17C10.015 17 8 14.985 8 12.5C8 10.015 10.015 8 12.5 8C14.985 8 17 10.015 17 12.5C17 14.985 14.985 17 12.5 17Z" fill="#F3732A"/>
  </svg>
`)}`;

const defaultIcon = L.icon({
  iconUrl: MARKER_ICON_SVG,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', // Shadow is less critical but I'll keep it for now or remove if needed
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

const DELHINCR_CITIES = ['Delhi', 'Noida', 'Gurugram', 'Faridabad', 'Ghaziabad', 'Greater Noida'];

const addressSchema = z.object({
  flat_number: z.string().min(1, 'Flat/House Number is required'),
  building_name: z.string().optional(),
  street: z.string().min(1, 'Street/Area is required'),
  landmark: z.string().optional(),
  city: z.string().refine(val => DELHINCR_CITIES.includes(val), {
    message: 'Houserve currently serves Delhi NCR only'
  }),
  pincode: z.string().length(6, 'Pincode must be exactly 6 digits').regex(/^\d+$/, 'Must be numbers only'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^\d+$/, 'Numbers only'),
  label: z.enum(['Home', 'Work', 'Other']),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

type AddressFormData = z.infer<typeof addressSchema>;

// Map Event Component for Draggable Pin
function MapPin({ position, setPosition, setAddressDetails }: any) {
  const map = useMapEvents({
    dragend: async () => {
      const center = map.getCenter();
      setPosition([center.lat, center.lng]);
      reverseGeocode(center.lat, center.lng, setAddressDetails);
    }
  });

  return (
    <Marker 
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
          map.flyTo(pos, map.getZoom());
          reverseGeocode(pos.lat, pos.lng, setAddressDetails);
        },
      }}
    />
  );
}

// OpenStreetMap Nominatim reverse geocoding
const reverseGeocode = async (lat: number, lng: number, callback: (data: any) => void) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
    const data = await response.json();
    if (data && data.address) {
      callback(data.address);
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
};

export default function AddAddress() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [position, setPosition] = useState<[number, number] | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'Home'
    }
  });

  useEffect(() => {
    if (editId) {
      fetchAddress(editId);
    }
  }, [editId]);

  const fetchAddress = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        reset({
          flat_number: data.flat_number,
          building_name: data.building_name || '',
          street: data.street,
          landmark: data.landmark || '',
          city: data.city,
          pincode: data.pincode,
          phone: data.phone || '',
          label: data.label,
          latitude: data.latitude,
          longitude: data.longitude
        });
        if (data.latitude && data.longitude) {
          setPosition([data.latitude, data.longitude]);
        }
      }
    } catch (err: any) {
      setError('Failed to load address for editing');
    } finally {
      setLoading(false);
    }
  };

  const label = watch('label');

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    setError('');
    
    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== 'granted') {
          const request = await Geolocation.requestPermissions();
          if (request.location !== 'granted') {
            throw new Error('Houserve needs your location to show nearby technicians and auto-fill your address. Please enable in Settings.');
          }
        }
      }

      const coordinates = await Geolocation.getCurrentPosition();
      const lat = coordinates.coords.latitude;
      const lng = coordinates.coords.longitude;
      
      setPosition([lat, lng]);
      setValue('latitude', lat);
      setValue('longitude', lng);

      // Reverse geocode
      reverseGeocode(lat, lng, (addressObj) => {
        if (addressObj.road || addressObj.suburb) {
          setValue('street', [addressObj.road, addressObj.suburb].filter(Boolean).join(', '));
        }
        
        const city = addressObj.city || addressObj.town || addressObj.state_district;
        if (city) {
          // Normalize city to match Delhi NCR dropdown constraints if possible
          const normalized = DELHINCR_CITIES.find(c => city.toLowerCase().includes(c.toLowerCase()));
          if (normalized) setValue('city', normalized);
        }
        
        if (addressObj.postcode) {
          setValue('pincode', addressObj.postcode);
        }
      });
    } catch (err: any) {
      setError(err.message || 'Could not get your location. Please ensure location services are enabled.');
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = async (data: AddressFormData) => {
    setLoading(true);
    setError('');

    try {
      const fullAddress = `${data.flat_number}, ${data.building_name ? data.building_name + ', ' : ''}${data.street}, ${data.city} - ${data.pincode}`;
      
      const payload = {
        user_id: user.id,
        label: data.label,
        flat_number: data.flat_number,
        building_name: data.building_name,
        street: data.street,
        landmark: data.landmark,
        city: data.city,
        pincode: data.pincode,
        phone: data.phone,
        latitude: data.latitude,
        longitude: data.longitude,
        full_address: fullAddress,
      };

      const result = editId
        ? await supabase
          .from('user_addresses')
          .update(payload)
          .eq('id', editId)
          .select()
        : await supabase
          .from('user_addresses')
          .insert({ ...payload, is_default: false })
          .select();

      if (result.error) throw result.error;

      // UPDATE STORE (Audit Fix #4.2)
      const { useAddressStore } = await import('../stores/addressStore');
      const store = useAddressStore.getState();
      
      const savedAddress = {
        id: editId || (result.data as any)?.[0]?.id,
        ...payload
      };

      if (editId && store.selectedAddress?.id === editId) {
        store.setSelectedAddress(savedAddress as any);
      } else if (!editId && !store.selectedAddress) {
        // If it was the first address added, select it
        store.setSelectedAddress(savedAddress as any);
      }
      
      navigate('/address-selection');
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col pb-24">
      <div className="bg-surface p-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 border border-border rounded-full hover:bg-gray-50 transition-colors">
          <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <h1 className="text-xl font-syne font-bold text-accent">{editId ? 'Edit Address' : 'Add New Address'}</h1>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-error/10 text-error p-4 rounded-xl text-sm leading-relaxed shadow-sm">
            {error}
          </div>
        )}

        <button 
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="w-full bg-primary-light text-primary py-4 px-4 rounded-xl font-syne font-bold flex items-center justify-center gap-3 active:bg-orange-200 transition-colors"
        >
          {locating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          )}
          {locating ? 'Locating...' : 'Use My Current Location'}
        </button>

        {position && (
          <div className="rounded-xl overflow-hidden shadow-sm h-[220px] w-full z-0 relative isolate border border-border">
            <MapContainer 
              center={position} 
              zoom={16} 
              scrollWheelZoom={false} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapPin 
                position={position} 
                setPosition={(pos: any) => {
                  setPosition(pos);
                  setValue('latitude', pos[0]);
                  setValue('longitude', pos[1]);
                }} 
                setAddressDetails={(addressObj: any) => {
                  if (addressObj.road || addressObj.suburb) {
                    setValue('street', [addressObj.road, addressObj.suburb].filter(Boolean).join(', '));
                  }
                  const city = addressObj.city || addressObj.town || addressObj.state_district;
                  if (city) {
                    const normalized = DELHINCR_CITIES.find(c => city.toLowerCase().includes(c.toLowerCase()));
                    if (normalized) setValue('city', normalized);
                  }
                  if (addressObj.postcode) {
                    setValue('pincode', addressObj.postcode);
                  }
                }}
              />
            </MapContainer>
            <div className="absolute top-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg text-xs font-medium text-text-primary z-[1000] shadow-md border border-gray-200">
              Drag pin to fine-tune your location
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Address Type
            </label>
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue('label', type as 'Home' | 'Work' | 'Other')}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    label === type 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-white text-gray-500 border-border hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Contact Phone *
            </label>
            <input
              type="text"
              placeholder="10-digit mobile number *"
              maxLength={10}
              inputMode="numeric"
              className={`input-field ${errors.phone ? 'border-error ring-1 ring-error' : ''}`}
              {...register('phone')}
            />
            {errors.phone && <p className="text-error text-xs mt-1 ml-1">{errors.phone.message}</p>}
          </div>

          <div className="pt-2 border-t border-border"></div>

          <div>
            <input
              type="text"
              placeholder="Flat / House Number *"
              className={`input-field ${errors.flat_number ? 'border-error ring-1 ring-error' : ''}`}
              {...register('flat_number')}
            />
            {errors.flat_number && <p className="text-error text-xs mt-1 ml-1">{errors.flat_number.message}</p>}
          </div>

          <div>
            <input
              type="text"
              placeholder="Floor / Building Name (Optional)"
              className="input-field"
              {...register('building_name')}
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Street / Area *"
              className={`input-field ${errors.street ? 'border-error ring-1 ring-error' : ''}`}
              {...register('street')}
            />
            {errors.street && <p className="text-error text-xs mt-1 ml-1">{errors.street.message}</p>}
          </div>

          <div>
            <input
              type="text"
              placeholder="Landmark (Optional)"
              className="input-field"
              {...register('landmark')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <select
                className={`input-field appearance-none bg-white ${errors.city ? 'border-error ring-1 ring-error' : ''}`}
                {...register('city')}
                defaultValue=""
              >
                <option value="" disabled>Select City *</option>
                {DELHINCR_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.city ? (
                <p className="text-error text-xs mt-1 ml-1">{errors.city.message}</p>
              ) : (
                <p className="text-primary text-xs mt-1 ml-1 font-medium">Delhi NCR Only</p>
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="Pincode *"
                maxLength={6}
                inputMode="numeric"
                className={`input-field ${errors.pincode ? 'border-error ring-1 ring-error' : ''}`}
                {...register('pincode')}
              />
              {errors.pincode && <p className="text-error text-xs mt-1 ml-1">{errors.pincode.message}</p>}
            </div>
          </div>
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-20">
        <button 
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          className="w-full btn-primary"
        >
          {loading ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </div>
  );
}
