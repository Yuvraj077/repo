'use client';

import React from 'react';
import FarmerDispatchWizard from '../../components/FarmerDispatchWizard';
import { Tractor, Sparkles, ShieldCheck, Database, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CreateCropLotPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tractor className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Kisan Harvest Lot Registration & Gate Pass
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official Smart India Hackathon 2026 Portal (SIH26033) — Enter harvest details to compute optimal route and lock in buyer pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/map"
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>View Punjab GIS Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Interactive Farmer Dispatch Wizard */}
      <FarmerDispatchWizard initialStep={1} showCardHeader={true} />

      {/* Bottom Technical Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Agmarknet & e-NAM Verified</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Market pricing is updated daily at 06:00 AM IST directly matching e-NAM Punjab APMC spot data and institutional buyer contracts.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Arrhenius Perishability Engine</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Calculates real-time biological quality loss over ambient temperature curves to prevent distress sales at congested mandis.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>MILP Optimization Solver</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Mixed-Integer Linear Programming algorithm solves all 59 nodes across Punjab to find highest net realization for each farmer.
          </p>
        </div>
      </div>
    </div>
  );
}
