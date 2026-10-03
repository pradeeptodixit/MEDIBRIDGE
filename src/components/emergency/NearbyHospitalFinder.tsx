import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  Search,
  ExternalLink,
  Share2,
  Check,
  RotateCw,
  AlertCircle,
  Building2,
  Activity,
  Compass,
} from 'lucide-react';
import {
  NearbyHospital,
  UserLocation,
  reverseGeocode,
  findNearbyHospitals,
  searchHospitalsByCity,
} from '../../services/hospitalService';

interface NearbyHospitalFinderProps {
  lang: 'en' | 'hi';
}

type FilterType = 'all' | 'emergency' | 'government' | 'private';

export const NearbyHospitalFinder: React.FC<NearbyHospitalFinderProps> = ({ lang }) => {
  const [status, setStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingCity, setIsSearchingCity] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const t = {
    title: lang === 'hi' ? 'नजदीकी अस्पताल एवं आपातकालीन केंद्र' : 'Nearby Hospitals & Emergency Care',
    subtitle:
      lang === 'hi'
        ? 'अपने स्थान की अनुमति दें ताकि नजदीकी अस्पताल, PHC और 24x7 आपातकालीन सुविधाएं मिल सकें।'
        : 'Share your location to find public hospitals, PHCs, and emergency care facilities nearest to you.',
    btnFind: lang === 'hi' ? '📍 मेरे नजदीकी अस्पताल खोजें' : '📍 Find Hospitals Near Me',
    btnLocating: lang === 'hi' ? 'स्थान प्राप्त किया जा रहा है...' : 'Detecting GPS Location...',
    detectedAt: lang === 'hi' ? 'वर्तमान स्थान:' : 'Detected Location:',
    privacyNote:
      lang === 'hi'
        ? '🔒 गोपनीयता: आपका स्थान केवल अस्पताल खोजने के लिए उपयोग होता है, कोई डेटा सुरक्षित नहीं किया जाता।'
        : '🔒 Privacy First: Your location is processed entirely on your device to query nearby facilities. No personal data is stored.',
    filterAll: lang === 'hi' ? 'सभी सुविधाएं' : 'All Facilities',
    filterEmergency: lang === 'hi' ? '🚨 24x7 आपातकाल' : '🚨 24/7 Emergency',
    filterGovt: lang === 'hi' ? '🏥 सरकारी / PHC' : '🏥 Govt / PHC',
    filterPrivate: lang === 'hi' ? '🩺 निजी अस्पताल' : '🩺 Private Hospitals',
    callBtn: lang === 'hi' ? 'कॉल करें' : 'Call',
    directionsBtn: lang === 'hi' ? 'दिशा-निर्देश' : 'Directions',
    mapsBtn: lang === 'hi' ? 'मैप देखें' : 'View on Map',
    copiedText: lang === 'hi' ? 'कॉपी हुआ' : 'Copied',
    shareBtn: lang === 'hi' ? 'शेयर' : 'Share',
    travelEst: lang === 'hi' ? 'लगभग' : 'Est.',
    mins: lang === 'hi' ? 'मिनट' : 'mins',
    kmAway: lang === 'hi' ? 'किमी दूर' : 'km away',
    open24x7: lang === 'hi' ? '24/7 खुला है' : '24/7 Open',
    traumaSupport: lang === 'hi' ? 'ट्रॉमा सुविधा' : 'Trauma Support',
    noFacilitiesFound: lang === 'hi' ? 'इस श्रेणी में कोई सुविधा नहीं मिली।' : 'No facilities found in this category.',
    searchPlaceholder:
      lang === 'hi'
        ? 'अस्पताल का नाम (उदा. Manipal, Apollo) या शहर/पिन कोड...'
        : 'Hospital name (e.g. Manipal, Apollo, Fortis) or city/PIN...',
    searchBtn: lang === 'hi' ? 'खोजें' : 'Search',
    permissionDenied:
      lang === 'hi'
        ? 'स्थान की अनुमति अस्वीकृत की गई। आप नीचे अपना शहर, पिन कोड या अस्पताल का नाम लिखकर खोज सकते हैं।'
        : 'Location permission was denied. You can search manually by typing your hospital name, city, or PIN code below.',
    retryBtn: lang === 'hi' ? 'पुनः प्रयास करें' : 'Try Again',
    openInGmaps: lang === 'hi' ? '🗺️ Google Maps पर सभी अस्पताल देखें' : '🗺️ View All on Google Maps',
    openEmergencyGmaps: lang === 'hi' ? '🚨 24/7 इमरजेंसी रूम देखें' : '🚨 24/7 ER on Google Maps',
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage(
        lang === 'hi'
          ? 'आपके ब्राउज़र में जियोलोकेशन समर्थित नहीं है।'
          : 'Geolocation is not supported by your browser.'
      );
      return;
    }

    setStatus('locating');
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          // Parallel reverse geocode and hospital fetching
          const [userLoc, nearbyList] = await Promise.all([
            reverseGeocode(lat, lng),
            findNearbyHospitals(lat, lng),
          ]);

          setLocation(userLoc);
          setHospitals(nearbyList);
          setStatus('success');
        } catch (error) {
          console.error('Error fetching hospital details:', error);
          setStatus('error');
          setErrorMessage(
            lang === 'hi'
              ? 'अस्पतालों की सूची लोड करने में समस्या हुई। कृपया पुनः प्रयास करें।'
              : 'Failed to load hospitals. Please try again.'
          );
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setStatus('error');
        if (err.code === 1) {
          setErrorMessage(t.permissionDenied);
        } else {
          setErrorMessage(
            lang === 'hi'
              ? 'जीपीएस स्थान प्राप्त करने में समय समाप्त हो गया। कृपया दोबारा कोशिश करें या अस्पताल/शहर का नाम लिखें।'
              : 'GPS location request timed out. Please try again or search manually by hospital name / city / PIN code.'
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingCity(true);
    setStatus('locating');
    setErrorMessage('');

    try {
      const result = await searchHospitalsByCity(
        searchQuery.trim(),
        location?.latitude,
        location?.longitude
      );
      if (result) {
        setLocation(result.location);
        setHospitals(result.hospitals);
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(
          lang === 'hi'
            ? `"${searchQuery}" के लिए कोई परिणाम नहीं मिला। कृपया मान्य अस्पताल नाम, शहर या पिन कोड दर्ज करें।`
            : `Could not find results for "${searchQuery}". Please enter a valid hospital name, city, or PIN code.`
        );
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(
        lang === 'hi'
          ? 'स्थान खोजते समय त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'Error searching for location. Please try again.'
      );
    } finally {
      setIsSearchingCity(false);
    }
  };

  const handleShareHospital = (hospital: NearbyHospital) => {
    const text = `${hospital.name}\n${hospital.address}\nPhone: ${hospital.phone || '108'}\nDirections: ${hospital.directionsUrl}`;
    if (navigator.share) {
      navigator.share({
        title: hospital.name,
        text,
        url: hospital.directionsUrl,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(hospital.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const filteredHospitals = hospitals.filter((h) => {
    if (filter === 'emergency') return h.is24x7 || h.type === 'emergency';
    if (filter === 'government') return h.type === 'government';
    if (filter === 'private') return h.type === 'private' || h.type === 'clinic';
    return true;
  });

  // Google Maps Universal URLs
  const gmapsSearchAllUrl = location
    ? `https://www.google.com/maps/search/hospitals+near+me/@${location.latitude},${location.longitude},14z`
    : 'https://www.google.com/maps/search/hospitals+near+me';

  const gmapsSearchEmergencyUrl = location
    ? `https://www.google.com/maps/search/24+hour+emergency+hospital+near+me/@${location.latitude},${location.longitude},14z`
    : 'https://www.google.com/maps/search/emergency+hospital+near+me';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass-dark rounded-2xl p-5 border border-white/20 shadow-xl overflow-hidden"
      id="nearby-hospital-finder"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
            <Building2 className="text-teal-300" size={22} />
          </div>
          <div>
            <h2 className="font-bold text-base sm:text-lg leading-tight text-white flex items-center gap-2">
              {t.title}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/30 font-sans font-medium">
                Location detected
              </span>
            </h2>
            <p className="text-xs text-red-200 mt-0.5">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Permission / Action Banner */}
      {status === 'idle' && (
        <div className="bg-white/10 border border-white/15 rounded-xl p-4 my-3 text-center space-y-3">
          <motion.button
            onClick={handleGetLocation}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black text-sm sm:text-base rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            id="grant-location-btn"
          >
            <Navigation size={18} className="animate-pulse" />
            {t.btnFind}
          </motion.button>

          {/* Manual search fallback */}
          <div className="relative pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
              <span className="h-px bg-white/20 flex-1" />
              <span>{lang === 'hi' ? 'या अस्पताल / शहर / पिन कोड से खोजें' : 'or search by hospital / city / PIN code'}</span>
              <span className="h-px bg-white/20 flex-1" />
            </div>
            <form onSubmit={handleCitySearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-base sm:text-xs placeholder:text-slate-400 focus:outline-none focus:border-teal-400"
              />
              <button
                type="submit"
                disabled={isSearchingCity || !searchQuery.trim()}
                className="px-3.5 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Search size={14} />
                {t.searchBtn}
              </button>
            </form>
          </div>

          <p className="text-[11px] text-slate-300/80 leading-relaxed text-left flex items-start gap-1.5 mt-2">
            <span>{t.privacyNote}</span>
          </p>
        </div>
      )}

      {/* Loading state with Radar animation */}
      {status === 'locating' && (
        <div className="py-8 px-4 text-center space-y-3">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-teal-400/20 animate-ping" />
            <span className="absolute inset-2 rounded-full bg-teal-400/40 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center z-10 shadow-lg">
              <MapPin size={18} className="text-white" />
            </div>
          </div>
          <p className="font-bold text-sm text-teal-200">{t.btnLocating}</p>
          <p className="text-xs text-slate-300">
            {lang === 'hi'
              ? 'निकटतम अस्पताल और स्वास्थ्य केंद्र खोजे जा रहे हैं...'
              : 'Searching nearby public hospitals & health centers...'}
          </p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-4 my-3 space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-white">{lang === 'hi' ? 'स्थान त्रुटि' : 'Location Error'}</p>
              <p>{errorMessage}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleGetLocation}
              className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCw size={14} />
              {t.retryBtn}
            </button>
          </div>

          {/* Fallback search form */}
          <form onSubmit={handleCitySearch} className="flex gap-2 pt-2 border-t border-white/10">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-base sm:text-xs placeholder:text-slate-400 focus:outline-none focus:border-teal-400"
            />
            <button
              type="submit"
              disabled={isSearchingCity || !searchQuery.trim()}
              className="px-3.5 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Search size={14} />
              {t.searchBtn}
            </button>
          </form>
        </div>
      )}

      {/* Success state — Location Info & Hospital List */}
      {status === 'success' && (
        <div className="space-y-4">
          {/* Location details bar */}
          {location && (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-teal-950/40 border border-teal-500/30 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <MapPin size={15} className="text-teal-400 shrink-0" />
                <div className="truncate">
                  <span className="text-slate-300 mr-1">{t.detectedAt}</span>
                  <span className="font-bold text-white">{location.displayName}</span>
                </div>
              </div>
              <button
                onClick={handleGetLocation}
                title={lang === 'hi' ? 'स्थान रीफ्रेश करें' : 'Refresh location'}
                className="p-1.5 text-teal-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all shrink-0 cursor-pointer"
              >
                <RotateCw size={13} />
              </button>
            </div>
          )}

          {/* Quick Launch Buttons to Google Maps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={gmapsSearchAllUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-teal-600/40 hover:bg-teal-600/60 border border-teal-400/40 text-teal-200 text-xs font-bold transition-all"
            >
              <Compass size={14} />
              <span>{t.openInGmaps}</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>
            <a
              href={gmapsSearchEmergencyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-600/40 hover:bg-red-600/60 border border-red-400/40 text-red-200 text-xs font-bold transition-all"
            >
              <Activity size={14} />
              <span>{t.openEmergencyGmaps}</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all' as FilterType, label: t.filterAll, count: hospitals.length },
              {
                id: 'emergency' as FilterType,
                label: t.filterEmergency,
                count: hospitals.filter((h) => h.is24x7 || h.type === 'emergency').length,
              },
              {
                id: 'government' as FilterType,
                label: t.filterGovt,
                count: hospitals.filter((h) => h.type === 'government').length,
              },
              {
                id: 'private' as FilterType,
                label: t.filterPrivate,
                count: hospitals.filter((h) => h.type === 'private' || h.type === 'clinic').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  filter === tab.id
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    filter === tab.id ? 'bg-teal-700 text-white' : 'bg-black/30 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Hospital Cards List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {filteredHospitals.length > 0 ? (
                filteredHospitals.map((hospital, index) => (
                  <motion.div
                    key={hospital.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="p-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all space-y-2.5"
                  >
                    {/* Top Row: Name, Category badge, Distance */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              hospital.type === 'government'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                : hospital.type === 'emergency'
                                ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                            }`}
                          >
                            {lang === 'hi' ? hospital.typeLabelHi : hospital.typeLabel}
                          </span>

                          {hospital.is24x7 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                              <Clock size={10} />
                              {t.open24x7}
                            </span>
                          )}

                          {hospital.hasTraumaCare && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1">
                              <Activity size={10} />
                              {t.traumaSupport}
                            </span>
                          )}
                        </div>

                        <h3 className="font-black text-sm sm:text-base text-white leading-snug">
                          {lang === 'hi' && hospital.nameHi ? hospital.nameHi : hospital.name}
                        </h3>
                      </div>

                      {/* Distance Badge */}
                      <div className="text-right shrink-0">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/30 border border-teal-400/40 text-teal-200 text-xs font-black">
                          <Navigation size={12} className="rotate-45" />
                          <span>{hospital.distanceKm} {t.kmAway}</span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5">
                          {t.travelEst} ~{hospital.travelTimeMins} {t.mins}
                        </p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{hospital.address}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/10 flex-wrap">
                      {hospital.phone && (
                        <a
                          href={`tel:${hospital.phone}`}
                          className="flex-1 min-w-[90px] py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          id={`call-hospital-${hospital.id}`}
                        >
                          <Phone size={13} />
                          <span>{t.callBtn} ({hospital.phone})</span>
                        </a>
                      )}

                      <a
                        href={hospital.directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[100px] py-2 px-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        id={`directions-hospital-${hospital.id}`}
                      >
                        <Navigation size={13} />
                        <span>{t.directionsBtn}</span>
                        <ExternalLink size={11} className="opacity-70" />
                      </a>

                      <button
                        onClick={() => handleShareHospital(hospital)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
                        title={t.shareBtn}
                        aria-label={`Share ${hospital.name}`}
                      >
                        {copiedId === hospital.id ? (
                          <Check size={14} className="text-green-400" />
                        ) : (
                          <Share2 size={14} />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-300 text-xs bg-white/5 rounded-xl border border-white/10">
                  <Building2 size={24} className="mx-auto text-slate-400 mb-2 opacity-50" />
                  <p>{t.noFacilitiesFound}</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Search other hospital or location */}
          <div className="pt-2 border-t border-white/10">
            <form onSubmit={handleCitySearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-teal-400"
              />
              <button
                type="submit"
                disabled={isSearchingCity || !searchQuery.trim()}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Search size={12} />
                {t.searchBtn}
              </button>
            </form>
            <p className="text-[10px] text-slate-300 mt-2 text-center">
              ℹ️ {lang === 'hi' 
                ? 'सुविधा स्थान सार्वजनिक ओपन डेटा से प्राप्त हैं। आपातकालीन बेड/डॉक्टर उपलब्धता की पुष्टि फोन द्वारा करें।' 
                : 'Facility locations sourced from public mapping directories. Real-time bed & doctor availability requires direct phone confirmation.'}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
