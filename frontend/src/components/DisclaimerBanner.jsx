import { BookOpen } from "lucide-react";

export const DisclaimerBanner = () => {
  return (
    <div className="disclaimer-banner fixed bottom-20 left-0 right-0 max-w-[430px] mx-auto z-30 flex items-center justify-center gap-2" data-testid="disclaimer-banner">
      <BookOpen className="w-3 h-3" />
      <span>Educational use only — always verify with current Australian guidelines</span>
    </div>
  );
};

export default DisclaimerBanner;
