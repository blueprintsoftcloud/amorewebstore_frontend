import React, { useEffect, useState, useRef } from "react";
import { MapPinIcon, BuildingStorefrontIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { CheckCircle, AlertTriangle, Loader2, Trash2, Search, X, Check } from "lucide-react";
import { PulseLoader } from "react-spinners";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useStaffPermissions } from "../context/StaffPermissionContext";
import api from "../utils/api";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface ShippingConfig {
  sameStatePerKmRate: number;
  sameStateFreeKmThreshold: number;
  noLocationFlatRate: number;
  stateRates: Record<string, number>;
  /** Per-district/city override nested under the state it belongs to — wins over that
   * state's flat stateRates value when the customer's city matches (case-insensitive). */
  districtRates: Record<string, Record<string, number>>;
}

interface WarehouseSettings {
  lat: number;
  lng: number;
  name: string;
}

const INDIAN_STATES_AND_UTS = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

/** Invisible component that listens for map clicks */
function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Component to smoothly update the map view center without unmounting */
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

/** Searchable state/UT picker — shared by both the Per-State and Per-District
 * shipping forms below so they present one consistent input instead of a fancy
 * dropdown in one place and a plain native <select> in the other. */
function StateSearchSelect({
  value,
  onChange,
  excludeValues = [],
  placeholder = "-- Select State --",
}: {
  value: string;
  onChange: (state: string) => void;
  /** States to hide from the option list — e.g. ones already configured elsewhere. */
  excludeValues?: string[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const options = INDIAN_STATES_AND_UTS.filter((st) => {
    if (excludeValues.includes(st)) return false;
    if (!query) return true;
    return st.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setQuery("");
        }}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white shadow-sm hover:bg-slate-50/50 focus:border-black focus:ring-1 focus:ring-black focus:outline-none transition-all duration-200 flex items-center justify-between text-slate-700"
      >
        <span className={value ? "font-semibold text-slate-900" : "text-slate-500"}>
          {value || placeholder}
        </span>
        <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 flex flex-col z-[999] overflow-hidden transition-all duration-200 origin-top">
          <div className="p-2 border-b border-slate-100 bg-white sticky top-0 z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search state..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-slate-50/50"
                onClick={(e) => e.stopPropagation()}
              />
              {query && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuery("");
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto max-h-48 py-1 custom-dropdown-scroll">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
                {query ? "No states match search" : "All states configured"}
              </div>
            ) : (
              options.map((st) => {
                const isSelected = value === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      onChange(st);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between group/item ${
                      isSelected
                        ? "bg-slate-100 font-semibold text-slate-900"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>{st}</span>
                    {isSelected ? (
                      <Check className="h-3.5 w-3.5 text-black" />
                    ) : (
                      <span className="opacity-0 group-hover/item:opacity-100 transition-opacity text-slate-400 text-xs font-normal">
                        Select
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WarehouseSettings() {
  const { user } = useAuth();
  const { hasPermission } = useStaffPermissions();
  // Nav/route access to this page (see StaffDashboard.tsx's buildNav) is granted by
  // EITHER SETTINGS_VIEW or SETTINGS_EDIT — a staff member with only SETTINGS_EDIT (no
  // VIEW) could reach this page while both GET requests below (warehouse + shipping
  // config, both SETTINGS_VIEW-gated on the backend) silently failed with an empty
  // catch block, leaving the form stuck on hardcoded defaults with zero explanation.
  // canEdit was previously hardcoded `true` ("both admin and super admin can edit forms
  // in frontend") — a leftover from before staff access to this page existed at all, so
  // it never actually reflected whether the logged-in staff member had SETTINGS_EDIT.
  const isStaff = user.role === "STAFF";
  const canView = !isStaff || hasPermission("SETTINGS_VIEW");
  const canEdit = !isStaff || hasPermission("SETTINGS_EDIT");

  const [settings, setSettings] = useState<WarehouseSettings>({ lat: 9.9312, lng: 76.2673, name: "Main Warehouse" });
  const [form, setForm] = useState<WarehouseSettings>({ lat: 9.9312, lng: 76.2673, name: "Main Warehouse" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shipping config state
  const DEFAULT_SHIPPING: ShippingConfig = {
    sameStatePerKmRate: 5,
    sameStateFreeKmThreshold: 10,
    noLocationFlatRate: 50,
    stateRates: { Kerala: 50 },
    districtRates: {},
  };
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(DEFAULT_SHIPPING);
  const [shippingForm, setShippingForm] = useState<ShippingConfig>(DEFAULT_SHIPPING);
  const [selectedState, setSelectedState] = useState("");
  const [stateBaseRate, setStateBaseRate] = useState("");
  const [districtStateFilter, setDistrictStateFilter] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [districtRate, setDistrictRate] = useState("");
  const [shippingSaving, setShippingSaving] = useState(false);
  const [shippingSuccess, setShippingSuccess] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const shippingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    api.get("/settings/warehouse")
      .then((res) => {
        setSettings(res.data);
        setForm(res.data);
      })
      .catch(() => { setError("Failed to load warehouse settings"); })
      .finally(() => setLoading(false));
    // Load shipping config
    api.get("/settings/shipping-config")
      .then((res) => {
        const loaded: ShippingConfig = { ...res.data, districtRates: res.data.districtRates ?? {} };
        setShippingConfig(loaded);
        setShippingForm(loaded);
      })
      .catch(() => { setShippingError("Failed to load shipping config"); });
  }, [canView]);

  const handleMapPick = (lat: number, lng: number) => {
    if (!canEdit) return;
    setForm((f) => ({ ...f, lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) }));
  };

  const handleSave = async () => {
    if (!canEdit) {
      setError("You don't have permission to edit warehouse settings — ask an admin to grant it.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await api.put("/settings/warehouse", form);
      setSettings({ lat: res.data.lat, lng: res.data.lng, name: res.data.name });
      setSuccess(true);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleShippingSave = async () => {
    if (!canEdit) {
      setShippingError("You don't have permission to edit shipping config — ask an admin to grant it.");
      return;
    }
    setShippingSaving(true);
    setShippingError(null);
    setShippingSuccess(false);
    try {
      await api.put("/settings/shipping-config", shippingForm);
      setShippingConfig(shippingForm);
      setShippingSuccess(true);
      if (shippingTimer.current) clearTimeout(shippingTimer.current);
      shippingTimer.current = setTimeout(() => setShippingSuccess(false), 3000);
    } catch (err: any) {
      setShippingError(err.response?.data?.message ?? "Failed to save shipping config");
    } finally {
      setShippingSaving(false);
    }
  };

  const parseNum = (val: string, fallback: number) => {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  const parseCoord = (val: string, fallback: number) => {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  const mapCenter: [number, number] = [form.lat, form.lng];



  /** Automatically triggers a layout sync when map coordinates initialize or shift */
  function MapResizeTrigger() {
    const map = useMapEvents({});

    useEffect(() => {
      setTimeout(() => {
        map.invalidateSize();
      }, 250); // Small timeout to ensure the DOM layout rendering paint has completed
    }, [map]);

    return null;
  }

  return (
    <div className="px-8 pt-8 pb-80 w-full bg-slate-50/50 min-h-screen">
      <style>{`
        .leaflet-container {
          cursor: pointer !important;
        }
        .custom-dropdown-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-dropdown-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-dropdown-scroll::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
        }
        .custom-dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
      {/* Premium Dashboard Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 mb-6 border-b border-gray-200">
        <div>

          <h1 className="text-3xl font-black tracking-tight text-gray-950 flex items-center gap-2.5">
            {/* <BuildingStorefrontIcon className="w-8 h-8 text-emerald-600" strokeWidth={2.2} /> */}
            Warehouse Location
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Set the warehouse geo-coordinates used to dynamically calculate customer shipping charges and determine baseline per-kilometer fulfillment distribution rates.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative flex items-center justify-center w-0 h-0 pl-1.5">
            <PulseLoader color="#000000" />
          </div>
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400 font-mono mt-12 select-none">
            Loading warehouse settings...
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Form ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">


              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Warehouse Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  disabled={!canEdit}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border-gray-200 px-4 py-2.5 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="e.g. Kochi Warehouse"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.lat}
                    disabled={!canEdit}
                    onChange={(e) => setForm((f) => ({ ...f, lat: parseCoord(e.target.value, f.lat) }))}
                    className="w-full rounded-xl border-gray-200 px-4 py-2.5 text-sm font-mono shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.lng}
                    disabled={!canEdit}
                    onChange={(e) => setForm((f) => ({ ...f, lng: parseCoord(e.target.value, f.lng) }))}
                    className="w-full rounded-xl border-gray-200 px-4 py-2.5 text-sm font-mono shadow-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              </div>

              {canEdit && (
                <p className="text-xs text-gray-400">
                  Tip: click the map to pin the exact warehouse location.
                </p>
              )}

              {/* Current saved value */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 flex items-start gap-2">
                <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>
                  Current saved: <strong className="font-mono text-gray-700">{settings.lat}, {settings.lng}</strong> — {settings.name}
                </span>
              </div>

              {/* Feedback */}
              {success && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                  <CheckCircle className="w-4 h-4" />
                  Warehouse location saved successfully!
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {canEdit && (
                 <button
                   onClick={handleSave}
                   disabled={saving || JSON.stringify(settings) === JSON.stringify(form)}
                   className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                 >
                   {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPinIcon className="w-4 h-4" />}
                   {saving ? "Saving…" : "Save Warehouse Location"}
                 </button>
              )}
            </div>

            {/* ── Map ── */}
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ minHeight: 380, isolation: "isolate" }}>

              <MapContainer
                center={mapCenter}
                zoom={12}
                style={{ height: "100%", minHeight: 380, width: "100%", cursor: canEdit ? "pointer" : "default" }}
                key={`${settings.lat}-${settings.lng}`}
              >
                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[form.lat, form.lng]} icon={customIcon} />
                {canEdit && <MapClickHandler onPick={handleMapPick} />}
                <MapRecenter center={mapCenter} />

                {/* Add this single line here */}
                <MapResizeTrigger />
              </MapContainer>
              {canEdit && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-600 shadow font-medium pointer-events-none z-[1000]">
                  Click anywhere on the map to move the pin
                </div>
              )}
            </div>
          </div>

          {/* ── Shipping Rates Configuration ── */}
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Shipping Rates Configuration</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure how shipping is calculated for different regions. If not set, defaults apply.
                </p>
              </div>
            </div>

            {!canEdit ? (
              <p className="text-sm text-gray-400 italic">Shipping rates are read-only while Warehouse Settings is disabled.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Per-State Base Rates */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MapPinIcon className="w-4 h-4 text-slate-400" />
                      <h3 className="text-sm font-bold text-gray-900">Per-State Base Rates</h3>
                      <span className="ml-auto text-[11px] font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                        {Object.keys(shippingForm.stateRates || {}).length}
                      </span>
                    </div>

                    {/* Add state rate form */}
                    <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 mb-4 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Select State
                        </label>
                        <StateSearchSelect
                          value={selectedState}
                          onChange={setSelectedState}
                          excludeValues={Object.keys(shippingForm.stateRates || {})}
                        />
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Base Rate (₹)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={stateBaseRate}
                            onChange={(e) => setStateBaseRate(e.target.value)}
                            placeholder="e.g. 50"
                            className="w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm font-mono shadow-sm focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-white transition-all duration-200"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!selectedState) {
                              toast.error("Please select a state.");
                              return;
                            }
                            const rate = parseFloat(stateBaseRate);
                            if (isNaN(rate) || rate < 0) {
                              toast.error("Please enter a valid base rate.");
                              return;
                            }
                            setShippingForm((f) => ({
                              ...f,
                              stateRates: {
                                ...(f.stateRates || {}),
                                [selectedState]: rate,
                              },
                            }));
                            setSelectedState("");
                            setStateBaseRate("");
                          }}
                          className="shrink-0 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-sm font-semibold transition shadow-sm hover:shadow"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Configured state rates list */}
                    {Object.keys(shippingForm.stateRates || {}).length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-xs text-slate-400 italic">No states configured yet. Select a state and rate above to add one.</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 overflow-hidden max-h-[360px] overflow-y-auto custom-dropdown-scroll">
                        <div className="divide-y divide-slate-100">
                          {Object.entries(shippingForm.stateRates || {}).map(([st, rate]) => (
                            <div
                              key={st}
                              className="group flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-slate-50/70 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                  <MapPinIcon className="w-4 h-4 text-slate-500" />
                                </div>
                                <span className="text-sm font-semibold text-slate-800 truncate" title={st}>{st}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm font-bold text-slate-900 font-mono">₹{rate}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShippingForm((f) => {
                                      const next = { ...f.stateRates };
                                      delete next[st];
                                      return { ...f, stateRates: next };
                                    });
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-150"
                                  title={`Delete ${st}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Per-District/City Overrides */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BuildingStorefrontIcon className="w-4 h-4 text-slate-400" />
                      <h3 className="text-sm font-bold text-gray-900">Per-District / City Overrides</h3>
                      <span className="ml-auto text-[11px] font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                        {Object.values(shippingForm.districtRates || {}).reduce((n, m) => n + Object.keys(m).length, 0)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      Optional — set a more specific rate for a district or city within a state. When a customer's
                      address city matches, this wins over that state's base rate.
                    </p>

                    <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 mb-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            State
                          </label>
                          <StateSearchSelect value={districtStateFilter} onChange={setDistrictStateFilter} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            District / City
                          </label>
                          <input
                            type="text"
                            autoComplete="off"
                            value={districtName}
                            onChange={(e) => setDistrictName(e.target.value)}
                            placeholder="e.g. Ernakulam"
                            className="w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm shadow-sm focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-white transition-all duration-200"
                          />
                        </div>
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Rate (₹)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={districtRate}
                            onChange={(e) => setDistrictRate(e.target.value)}
                            placeholder="e.g. 40"
                            className="w-full rounded-xl border-slate-200 px-4 py-2.5 text-sm font-mono shadow-sm focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-white transition-all duration-200"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!districtStateFilter) {
                              toast.error("Please select a state.");
                              return;
                            }
                            const name = districtName.trim();
                            if (!name) {
                              toast.error("Please enter a district or city name.");
                              return;
                            }
                            const rate = parseFloat(districtRate);
                            if (isNaN(rate) || rate < 0) {
                              toast.error("Please enter a valid rate.");
                              return;
                            }
                            setShippingForm((f) => ({
                              ...f,
                              districtRates: {
                                ...(f.districtRates || {}),
                                [districtStateFilter]: {
                                  ...((f.districtRates || {})[districtStateFilter] || {}),
                                  [name]: rate,
                                },
                              },
                            }));
                            setDistrictName("");
                            setDistrictRate("");
                          }}
                          className="shrink-0 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-sm font-semibold transition shadow-sm hover:shadow"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Configured district rates, grouped by state */}
                    {Object.keys(shippingForm.districtRates || {}).length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-xs text-slate-400 italic">No district overrides configured yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-dropdown-scroll">
                        {Object.entries(shippingForm.districtRates || {}).map(([st, districts]) => (
                          Object.keys(districts).length === 0 ? null : (
                            <div key={st} className="rounded-2xl border border-slate-200 overflow-hidden">
                              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5">
                                <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{st}</span>
                              </div>
                              <div className="divide-y divide-slate-100">
                                {Object.entries(districts).map(([dist, rate]) => (
                                  <div
                                    key={dist}
                                    className="group flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-slate-50/70 transition-colors"
                                  >
                                    <span className="text-sm font-semibold text-slate-800 truncate" title={dist}>{dist}</span>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="text-sm font-bold text-slate-900 font-mono">₹{rate}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShippingForm((f) => {
                                            const nextState = { ...(f.districtRates?.[st] || {}) };
                                            delete nextState[dist];
                                            const nextDistrictRates = { ...(f.districtRates || {}) };
                                            if (Object.keys(nextState).length === 0) {
                                              delete nextDistrictRates[st];
                                            } else {
                                              nextDistrictRates[st] = nextState;
                                            }
                                            return { ...f, districtRates: nextDistrictRates };
                                          });
                                        }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-150"
                                        title={`Delete ${dist}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live preview */}
                <div className="mt-6 bg-blue-50/60 border border-blue-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2.5">Current effective rates</p>
                  {Object.keys(shippingForm.stateRates || {}).length === 0 &&
                  Object.values(shippingForm.districtRates || {}).every((m) => Object.keys(m).length === 0) ? (
                    <p className="text-xs text-blue-700">No custom rates configured yet — defaults apply.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(shippingForm.stateRates || {}).map(([st, val]) => (
                        <span
                          key={st}
                          className="inline-flex items-center gap-1 bg-white border border-blue-200 rounded-full px-2.5 py-1 text-[11px] font-medium text-blue-800"
                        >
                          {st} <span className="font-mono font-bold">₹{val}</span>
                        </span>
                      ))}
                      {Object.entries(shippingForm.districtRates || {}).flatMap(([st, districts]) =>
                        Object.entries(districts).map(([dist, val]) => (
                          <span
                            key={`${st}-${dist}`}
                            className="inline-flex items-center gap-1 bg-white border border-blue-200 rounded-full px-2.5 py-1 text-[11px] font-medium text-blue-800"
                          >
                            {dist}, {st} <span className="font-mono font-bold">₹{val}</span>
                          </span>
                        )),
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-blue-600 mt-2.5">No international shipping.</p>
                </div>

                {shippingSuccess && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                    <CheckCircle className="w-4 h-4" />
                    Shipping rates saved successfully!
                  </div>
                )}
                {shippingError && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    <AlertTriangle className="w-4 h-4" />
                    {shippingError}
                  </div>
                )}

                 <button
                   onClick={handleShippingSave}
                   disabled={shippingSaving || JSON.stringify(shippingConfig) === JSON.stringify(shippingForm)}
                   className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                 >
                   {shippingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                   {shippingSaving ? "Saving…" : "Save Shipping Rates"}
                 </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
