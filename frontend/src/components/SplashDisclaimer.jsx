import { useState } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export const SplashDisclaimer = ({ onAccept }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="splash-overlay" data-testid="splash-disclaimer">
      <div className="bg-white dark:bg-slate-900 rounded-3xl mx-4 max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#1B3A6B] rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1B3A6B] dark:text-white">NurseReady</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Important Disclaimer</p>
          </div>
        </div>

        <ScrollArea className="h-64 mb-4">
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-4 pr-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex gap-2 items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  NurseReady is a study and reference tool for educational purposes only.
                </p>
              </div>
            </div>

            <p>
              Information provided is <strong>not a substitute</strong> for professional clinical 
              judgment, pharmacist advice, or current Australian clinical guidelines.
            </p>

            <p>
              <strong>Always verify drug information</strong> with current MIMS Australia, your 
              facility's drug formulary, or a registered pharmacist before administering any medication.
            </p>

            <p>
              <strong>In any emergency</strong> always call <span className="font-bold text-red-600">000</span> and 
              follow your facility's emergency protocols.
            </p>

            <p>
              The creators of this app accept no liability for clinical decisions made based on 
              this content.
            </p>

            <div className="bg-[#F4F6F9] dark:bg-slate-800 rounded-xl p-4">
              <p className="font-medium text-[#1B3A6B] dark:text-[#00A99D]">
                By continuing you confirm you understand this app is for educational use only.
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-[#1B3A6B] focus:ring-[#00A99D]"
              data-testid="disclaimer-checkbox"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              I have read and understand that NurseReady is for educational purposes only and 
              is not a substitute for professional clinical guidance.
            </span>
          </label>

          <Button
            onClick={onAccept}
            disabled={!agreed}
            className="w-full h-12 bg-[#1B3A6B] hover:bg-[#152e55] text-white rounded-full font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="accept-disclaimer-btn"
          >
            I Understand & Agree
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SplashDisclaimer;
