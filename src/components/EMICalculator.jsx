
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Calculator, IndianRupee, Calendar } from 'lucide-react';

const PLOT_SIZES = [50, 55, 60, 80, 100, 120, 150, 200, 250];
const RATE_PER_SQYD = 7525;
const BOOKING_PERCENT = 0.05; // 5%

const EMICalculator = ({ initialSize = 50, initialTenure = 60 }) => {
  const [size, setSize] = useState(initialSize);
  const [tenure, setTenure] = useState(initialTenure);
  const [interestRate, setInterestRate] = useState(0);
  const [result, setResult] = useState({ total: 0, booking: 0, emi: 0 });

  useEffect(() => {
    setSize(initialSize);
  }, [initialSize]);

  useEffect(() => {
    setTenure(initialTenure);
  }, [initialTenure]);

  const calculate = () => {
    const totalAmount = size * RATE_PER_SQYD;
    const bookingAmount = totalAmount * BOOKING_PERCENT;
    const loanAmount = totalAmount - bookingAmount;
    
    let emi = 0;
    if (interestRate === 0 || interestRate === '0') {
      emi = loanAmount / tenure;
    } else {
      const r = interestRate / 12 / 100;
      emi = (loanAmount * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1);
    }

    setResult({
      total: totalAmount,
      booking: bookingAmount,
      emi: Math.round(emi),
      loan: loanAmount
    });
  };

  useEffect(() => {
    calculate();
  }, [size, tenure, interestRate]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-[#1E88E5] p-6 text-center text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">आपके बजट के अनुसार प्लॉट्स</h2>
        <p className="text-blue-100 font-medium bg-blue-600/30 inline-block px-4 py-1 rounded-full text-sm">
          Current Rate: ₹{RATE_PER_SQYD} per Sq. Yard
        </p>
      </div>

      <div className="p-6 md:p-8 grid lg:grid-cols-2 gap-10">
        {/* Controls */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-gray-600 font-medium">Select Plot Size (Sq. Yards)</Label>
            <div className="grid grid-cols-3 gap-2">
              {PLOT_SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                    size === s 
                      ? 'bg-[#1E88E5] text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-gray-600 font-medium">Payment Tenure (Months)</Label>
            <Select value={String(tenure)} onValueChange={(v) => setTenure(Number(v))}>
              <SelectTrigger className="w-full h-12 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Select Tenure" />
              </SelectTrigger>
              <SelectContent>
                {[12, 24, 36, 48, 60].map(m => (
                  <SelectItem key={m} value={String(m)}>{m} Months ({m/12} Years)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-gray-600 font-medium">Interest Rate (0% for Promo)</Label>
              <span className="text-[#1E88E5] font-bold">{interestRate}%</span>
            </div>
            <Slider
              defaultValue={[0]}
              max={15}
              step={0.5}
              value={[interestRate]}
              onValueChange={(vals) => setInterestRate(vals[0])}
              className="w-full"
            />
          </div>

          <Button onClick={calculate} className="w-full bg-[#FFC107] hover:bg-[#ffcd38] text-[#0F3A5F] font-bold h-12 text-lg">
            <Calculator className="mr-2 h-5 w-5" /> Calculate EMI
          </Button>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-[#0F3A5F] text-white border-none shadow-lg">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-2">Monthly EMI</p>
              <div className="text-4xl md:text-5xl font-bold text-[#FFC107] mb-2">
                ₹{result.emi.toLocaleString()}
              </div>
              <p className="text-sm opacity-80">for {tenure} months</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Price</p>
              <p className="text-lg font-bold text-gray-800">₹{result.total.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Booking (5%)</p>
              <p className="text-lg font-bold text-gray-800">₹{result.booking.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
             <p className="text-sm text-[#1E88E5]">
               Pay <span className="font-bold">₹{result.booking.toLocaleString()}</span> to book now, and rest in <span className="font-bold">{tenure} easy installments</span>.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EMICalculator;
