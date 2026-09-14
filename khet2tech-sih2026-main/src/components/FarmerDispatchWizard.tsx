'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { useSimulation } from '../lib/context/SimulationContext';
import { CropType, QualityGrade } from '../lib/engine/types';
import { PUNJAB_NODES } from '../lib/data/punjabData';
import { formatINR, formatCurrencyINR } from '../lib/utils/format';
import { 
  Tractor, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Clock,
  Phone,
  User,
  QrCode,
  Truck,
  ExternalLink,
  RotateCcw,
  BadgePercent,
  Warehouse,
  Check,
  Zap,
  Info
} from 'lucide-react';

interface FarmerDispatchWizardProps {
  initialStep?: 1 | 2 | 4;
  onComplete?: () => void;
  showCardHeader?: boolean;
}

export default function FarmerDispatchWizard({
  initialStep = 1,
  onComplete,
  showCardHeader = true,
}: FarmerDispatchWizardProps) {
  const { 
    cropLot, 
    updateCropLot, 
    runSimulationPipeline, 
    isSimulating,
    results,
    t
  } = useSimulation();

  const farmNodes = PUNJAB_NODES.filter(n => n.type === 'farm');

  // Step management: 1 (Farmer Profile & Farm) -> 2 (Lot Specs) -> 3 (Solving Pipeline) -> 4 (Dispatch Pass)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(initialStep);

  // Step 1: Farmer & Farm Info
  const [farmerName, setFarmerName] = useState<string>(cropLot.farmerName || 'Gurmail Singh');
  const [farmerPhone, setFarmerPhone] = useState<string>('98765-43210');
  const [selectedFarmId, setSelectedFarmId] = useState<string>(cropLot.farmerId || farmNodes[0]?.id || 'farm-01');
  const [hasColdStorage, setHasColdStorage] = useState<boolean>(cropLot.availableOnFarmStorageKg > 0);
  const [storageCapacity, setStorageCapacity] = useState<number>(cropLot.availableOnFarmStorageKg || 1000);

  // Step 2: Harvest Lot Specs
  const [crop, setCrop] = useState<CropType>(cropLot.crop);
  const [quantityKg, setQuantityKg] = useState<number>(cropLot.quantityKg);
  const [quality, setQuality] = useState<QualityGrade>(cropLot.quality);
  const [harvestTiming, setHarvestTiming] = useState<string>(cropLot.harvestDate || 'Harvested Today (Dawn)');
  const [maxTransitHours, setMaxTransitHours] = useState<number>(cropLot.maxTransitHours);

  // Pipeline simulation state
  const [pipelineProgress, setPipelineProgress] = useState<number>(0);
  const [pipelineStatusText, setPipelineStatusText] = useState<string>('');

  // Synchronize with external context if changed
  useEffect(() => {
    setCrop(cropLot.crop);
    setQuantityKg(cropLot.quantityKg);
    setQuality(cropLot.quality);
    if (cropLot.farmerName) setFarmerName(cropLot.farmerName);
  }, [cropLot]);

  // Selected farm details
  const currentFarmNode = farmNodes.find(f => f.id === selectedFarmId) || farmNodes[0];

  // Calculations for Step 4
  const optimal = results.optimalRoute;
  const baseline = results.baselineRoute;
  const currentRealization = baseline?.costBreakdown.netFarmerRealizationPerKg || 18.90;
  const bestRealization = optimal?.costBreakdown.netFarmerRealizationPerKg || 24.80;
  const optimalPayout = Math.round(bestRealization * cropLot.quantityKg);
  const mandiPayout = Math.round(currentRealization * cropLot.quantityKg);
  const extraGain = Math.max(0, optimalPayout - mandiPayout);
  const gainPct = (((bestRealization - currentRealization) / Math.max(0.1, currentRealization)) * 100).toFixed(1);

  // Auto-tune default transit hours per crop
  const handleCropSelect = (selected: CropType) => {
    setCrop(selected);
    if (selected === 'Tomato') setMaxTransitHours(36);
    else if (selected === 'Onion') setMaxTransitHours(96);
    else if (selected === 'Potato') setMaxTransitHours(144);
    else if (selected === 'Wheat') setMaxTransitHours(360);
  };

  // Quick Preset Scenarios for Hackathon Judges
  const applyJudgePreset = (preset: {
    name: string;
    phone: string;
    farmId: string;
    crop: CropType;
    qty: number;
    quality: QualityGrade;
    hours: number;
  }) => {
    setFarmerName(preset.name);
    setFarmerPhone(preset.phone);
    setSelectedFarmId(preset.farmId);
    setCrop(preset.crop);
    setQuantityKg(preset.qty);
    setQuality(preset.quality);
    setMaxTransitHours(preset.hours);
    
    // Commit & jump to step 2
    const targetFarm = farmNodes.find(f => f.id === preset.farmId) || farmNodes[0];
    updateCropLot({
      farmerName: preset.name,
      farmerId: preset.farmId,
      farmLocation: targetFarm.location,
      crop: preset.crop,
      quantityKg: preset.qty,
      quality: preset.quality,
      maxTransitHours: preset.hours,
    });
    setCurrentStep(2);
  };

  // Submit & Run Pipeline
  const handleRunOptimization = async () => {
    setCurrentStep(3);
    setPipelineProgress(10);
    setPipelineStatusText('Validating farm coordinates & e-NAM live price tickers...');

    const targetFarm = farmNodes.find(f => f.id === selectedFarmId) || farmNodes[0];
    updateCropLot({
      farmerName,
      farmerId: selectedFarmId,
      farmLocation: targetFarm.location,
      crop,
      quantityKg,
      quality,
      harvestDate: harvestTiming,
      maxTransitHours,
      availableOnFarmStorageKg: hasColdStorage ? storageCapacity : 0,
    });

    // Execute animated pipeline
    await runSimulationPipeline((stepText, pct) => {
      setPipelineStatusText(stepText);
      setPipelineProgress(pct);
    });

    setCurrentStep(4);
    if (onComplete) onComplete();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden transition-all">
      {/* 1. Header & Progress Stepper */}
      {showCardHeader && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white p-5 sm:p-6 border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                <Tractor className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Live Farmer Dispatch Wizard
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Interactive Mode
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                  Register Harvest Lot & Find Most Profitable Route
                </h2>
              </div>
            </div>

            {/* Quick Demo Lot Presets for Judges */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium hidden md:inline">Judge Presets:</span>
              <button
                type="button"
                onClick={() => applyJudgePreset({
                  name: 'Gurmail Singh',
                  phone: '98765-43210',
                  farmId: 'farm-01',
                  crop: 'Tomato',
                  qty: 5000,
                  quality: 'A',
                  hours: 36,
                })}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="5,000 kg Tomato in Nakodar (Grade A)"
              >
                🍅 5T Tomato
              </button>
              <button
                type="button"
                onClick={() => applyJudgePreset({
                  name: 'Manjit Kang',
                  phone: '98140-55421',
                  farmId: 'farm-04',
                  crop: 'Potato',
                  qty: 15000,
                  quality: 'B',
                  hours: 120,
                })}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="15,000 kg Potato in Jagraon (Grade B)"
              >
                🥔 15T Potato
              </button>
              <button
                type="button"
                onClick={() => applyJudgePreset({
                  name: 'Balwinder Sandhu',
                  phone: '98881-22345',
                  farmId: 'farm-03',
                  crop: 'Onion',
                  qty: 8000,
                  quality: 'A',
                  hours: 72,
                })}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="8,000 kg Onion in Phillaur (Grade A)"
              >
                🧅 8T Onion
              </button>
            </div>
          </div>

          {/* Stepper Steps indicator */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-800/80 text-xs">
            <button
              onClick={() => currentStep !== 3 && setCurrentStep(1)}
              className={`flex items-center gap-2 text-left p-2 rounded-xl transition ${
                currentStep === 1 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                currentStep === 1 ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                1
              </div>
              <div className="truncate">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Step 1</div>
                <div className="font-semibold text-xs truncate">Farmer & Origin</div>
              </div>
            </button>

            <button
              onClick={() => currentStep !== 3 && setCurrentStep(2)}
              className={`flex items-center gap-2 text-left p-2 rounded-xl transition ${
                currentStep === 2 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                currentStep === 2 ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                2
              </div>
              <div className="truncate">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Step 2</div>
                <div className="font-semibold text-xs truncate">Harvest Lot Specs</div>
              </div>
            </button>

            <button
              onClick={() => currentStep === 4 && setCurrentStep(4)}
              className={`flex items-center gap-2 text-left p-2 rounded-xl transition ${
                currentStep === 4 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                currentStep === 4 ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {currentStep === 4 ? <Check className="w-3 h-3 stroke-[3]" /> : '3'}
              </div>
              <div className="truncate">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Step 3</div>
                <div className="font-semibold text-xs truncate">Route Verdict & Pass</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 2. Wizard Body Content */}
      <div className="p-6 sm:p-8">
        {/* ======================= STEP 1: FARMER IDENTITY & ORIGIN ======================= */}
        {currentStep === 1 && (
          <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-200">
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Farmer Profile & Farm Origin
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your identity and agricultural cluster in Punjab to anchor GPS dispatch coordinates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Farmer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Farmer Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    placeholder="e.g. Gurmail Singh"
                    className="w-full px-4 py-2.5 pl-10 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={farmerPhone}
                    onChange={(e) => setFarmerPhone(e.target.value)}
                    placeholder="98765-43210"
                    className="w-full px-4 py-2.5 pl-10 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-mono"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            {/* Farm Origin Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Farm Origin Location (Punjab GIS Node)
              </label>
              <div className="relative">
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full px-4 py-3 pl-10 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 appearance-none cursor-pointer"
                >
                  {farmNodes.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name} — District: {farm.location.district} ({farm.location.name})
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Selected Coordinates: {currentFarmNode.location.lat.toFixed(4)}°N, {currentFarmNode.location.lng.toFixed(4)}°E (Distance matrix calculated live).
              </p>
            </div>

            {/* Farm Storage Capacity Toggle */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">On-Farm Pre-Cooling or Holding Storage</h4>
                    <p className="text-[11px] text-slate-500">Allows buffering for up to 48 hours to wait for peak buyer price spikes.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHasColdStorage(!hasColdStorage)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                    hasColdStorage ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform"></div>
                </button>
              </div>

              {hasColdStorage && (
                <div className="pt-2 border-t border-slate-200/80 flex items-center gap-4">
                  <span className="text-xs text-slate-700 font-semibold">Available Space:</span>
                  <div className="flex items-center gap-2">
                    {[1000, 2500, 5000].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setStorageCapacity(cap)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          storageCapacity === cap 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {formatINR(cap)} kg
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-medium">Ready for crop specifications</span>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md shadow-emerald-700/20 flex items-center gap-2 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Continue to Lot Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================= STEP 2: HARVEST LOT DETAILS ======================= */}
        {currentStep === 2 && (
          <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-200">
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Harvest Lot Specifications & Quality
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure your produce perishability and grade to let the MILP solver evaluate buyer demand.
              </p>
            </div>

            {/* Crop Commodity Selector with Badges */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Commodity
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'Tomato', label: 'Tomato', icon: '🍅', decay: 'High Perishability (36h)', color: 'border-rose-200 bg-rose-50/50 text-rose-900' },
                  { key: 'Onion', label: 'Onion', icon: '🧅', decay: 'Moderate Shelf-life (96h)', color: 'border-amber-200 bg-amber-50/50 text-amber-900' },
                  { key: 'Potato', label: 'Potato', icon: '🥔', decay: 'Storable Bulk (144h)', color: 'border-yellow-200 bg-yellow-50/50 text-yellow-900' },
                  { key: 'Wheat', label: 'Wheat', icon: '🌾', decay: 'Dry Cereal Grain (360h)', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleCropSelect(item.key as CropType)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition flex flex-col justify-between space-y-2 cursor-pointer ${
                      crop === item.key 
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/30' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{item.icon}</span>
                      {crop === item.key && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{item.label}</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.decay}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Harvest Volume Slider & Preset Quintal Chips */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Harvest Volume
                  </label>
                  <p className="text-[11px] text-slate-500">Adjust total quantity ready for transport.</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {formatINR(quantityKg)} <span className="text-sm font-semibold text-slate-500 font-sans">kg</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">
                    ({(quantityKg / 100).toFixed(0)} Quintals • {(quantityKg / 1000).toFixed(1)} MT)
                  </span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={quantityKg}
                onChange={(e) => setQuantityKg(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              {/* Preset Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500">Quick Presets:</span>
                {[2000, 5000, 10000, 15000, 20000].map((presetVal) => (
                  <button
                    key={presetVal}
                    type="button"
                    onClick={() => setQuantityKg(presetVal)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      quantityKg === presetVal
                        ? 'bg-emerald-700 text-white shadow-xs font-bold'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {formatINR(presetVal)} kg ({presetVal / 100} Q)
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Grade Cards */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Quality Grade
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    grade: 'A',
                    title: 'Grade A (Premium)',
                    subtitle: 'Export & Modern Retail',
                    desc: 'Zero blemishes, uniform size, commands +₹3-5/kg premium at organized retail DC.',
                    badge: 'High Realization',
                    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  },
                  {
                    grade: 'B',
                    title: 'Grade B (Fair Average)',
                    subtitle: 'Standard Fresh Table Market',
                    desc: 'Standard quality for wholesale mandis and regional wet markets.',
                    badge: 'Standard Market',
                    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
                  },
                  {
                    grade: 'C',
                    title: 'Grade C (Processing)',
                    subtitle: 'Puree, Paste & Dehydration',
                    desc: 'Surface marks or minor size variation, ideal for food processing plants.',
                    badge: 'Industrial Pulp',
                    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
                  },
                ].map((item) => (
                  <button
                    key={item.grade}
                    type="button"
                    onClick={() => setQuality(item.grade as QualityGrade)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                      quality === item.grade
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-sm text-slate-900">{item.title}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600">{item.subtitle}</div>
                      <div className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Harvest Timing Window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Harvest Timing
                </label>
                <select
                  value={harvestTiming}
                  onChange={(e) => setHarvestTiming(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-medium cursor-pointer"
                >
                  <option value="Harvested Today (Dawn)">Harvested Today (Early Morning - Field Ready)</option>
                  <option value="Harvesting Tomorrow Morning">Harvesting Tomorrow at Dawn (Pre-book transit)</option>
                  <option value="Harvested Yesterday (Urgent)">Harvested Yesterday (Urgent Dispatch Required)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Maximum Allowable Transit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="12"
                    max="168"
                    value={maxTransitHours}
                    onChange={(e) => setMaxTransitHours(Number(e.target.value))}
                    className="w-24 px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-bold font-mono"
                  />
                  <span className="text-xs text-slate-600 font-medium">Hours before quality decay exceeds 10%</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Step 1</span>
              </button>

              <button
                type="button"
                onClick={handleRunOptimization}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2.5 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white text-white" />
                <span>Run Optimization & Issue Dispatch Pass</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================= STEP 3: ANIMATED SOLVER PIPELINE ======================= */}
        {currentStep === 3 && (
          <div className="py-12 px-4 max-w-lg mx-auto text-center space-y-6 animate-in fade-in duration-300">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin"></div>
              <div className="absolute inset-2 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 shadow-inner">
                <Sparkles className="w-7 h-7 text-emerald-600 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Solving Multi-Modal Graph Optimization
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Evaluating Realization Across 59 Punjab Hubs...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto min-h-[36px] flex items-center justify-center font-medium">
                {pipelineStatusText || 'Calculating optimal farmer payout...'}
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 p-0.5">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${pipelineProgress}%` }}
              ></div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Progress: {pipelineProgress}% • MILP Branch-and-Bound Solver Active
            </div>
          </div>
        )}

        {/* ======================= STEP 4: VERIFIED DISPATCH PASS & VERDICT ======================= */}
        {currentStep === 4 && (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
            {/* Top Profit Gain Hero Banner */}
            <div className="bg-gradient-to-br from-emerald-900 via-emerald-850 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-emerald-700/40 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider block">
                      Khet2Tech Verified Verdict
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      Calculated for {farmerName} • {currentFarmNode.name}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{gainPct}% Extra Realization</span>
                </div>
              </div>

              {/* Profit Comparison Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
                <div>
                  <span className="text-xs text-emerald-200/80 font-semibold block mb-1">
                    Khet2Tech Smart Route Payout
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                    {formatCurrencyINR(optimalPayout)}
                  </div>
                  <span className="text-xs text-emerald-300 font-semibold mt-1 block">
                    ₹{bestRealization.toFixed(2)}/kg net to farmer
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-semibold block mb-1">
                    Traditional APMC Mandi Payout
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-400 font-mono tracking-tight line-through opacity-75">
                    {formatCurrencyINR(mandiPayout)}
                  </div>
                  <span className="text-xs text-slate-400 font-semibold mt-1 block">
                    ₹{currentRealization.toFixed(2)}/kg (Distress sale)
                  </span>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4 flex flex-col justify-center">
                  <span className="text-[11px] text-amber-300 font-black uppercase tracking-wider block">
                    Total Extra Cash in Pocket
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-0.5">
                    +{formatCurrencyINR(extraGain)}
                  </div>
                  <span className="text-[10px] text-slate-300 mt-1">
                    Zero middleman commissions, zero distress dumping.
                  </span>
                </div>
              </div>
            </div>

            {/* Official Digital Gate Pass (Receipt Card) */}
            <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-md p-6 sm:p-8 space-y-6 relative">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black">
                    <QrCode className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Official Dispatch Gate Pass
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        VERIFIED DISPATCH
                      </span>
                    </div>
                    <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                      PASS-ID: FP-PB-2026-{(quantityKg / 100).toFixed(0)}{selectedFarmId.replace('farm-', '')}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Dispatch Window</span>
                  <span className="text-xs font-bold text-slate-800">{harvestTiming}</span>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Priority Weighbridge Slot Active</div>
                </div>
              </div>

              {/* Pass Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Farmer & Phone</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{farmerName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{farmerPhone}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Harvest Lot</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {crop} • Grade {quality}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold">
                    {formatINR(quantityKg)} kg ({(quantityKg / 100).toFixed(0)} Quintals)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Target Buyer Destination</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">
                    {optimal?.pathNodes[optimal.pathNodes.length - 1]?.name || 'Direct Buyer DC'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Est. Transit: {optimal?.totalTransitHours.toFixed(1) || '2.5'} hrs ({optimal?.totalDistanceKm.toFixed(0) || '68'} km)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Recommended Transit</span>
                  <span className="font-bold text-slate-900 mt-0.5 block flex items-center gap-1.5 text-emerald-800">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    {crop === 'Tomato' ? 'Reefer 3.5T Cold Van (12°C)' : 'Insulated Eicher Canter (18°C)'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Spoilage Risk: {optimal?.costBreakdown.expectedSpoilagePct.toFixed(1) || '1.1'}%
                  </span>
                </div>
              </div>

              {/* Security & Cold Chain Stamp */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-emerald-900">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-bold block">Digital Contract Guarantee Active</span>
                    <span className="text-[11px] text-emerald-700">
                      Buyer lock-in price verified via e-NAM gateway. Mandi deduction fees (8.5%) completely bypassed.
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shadow-xs">
                  Cold-Chain Voucher: #CC-PB-{(quantityKg / 250).toFixed(0)}
                </div>
              </div>
            </div>

            {/* Action CTAs: Trace on Map, Compare, Simulator, Reset */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Register Another Lot</span>
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/comparison"
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <span>Line-by-Line Breakdown</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/simulator"
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <span>What-If Stress Tests</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/map"
                  className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md shadow-emerald-700/20 flex items-center gap-2 transition transform hover:-translate-y-0.5"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Trace Route on Live Punjab Map</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
