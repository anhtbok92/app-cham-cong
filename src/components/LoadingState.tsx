"use client";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Đang tải dữ liệu..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-in fade-in duration-700">
      <div className="relative">
        {/* Main Spinner */}
        <div className="w-12 h-12 rounded-full border-4 border-secondary/10 border-b-secondary animate-spin"></div>
        
        {/* Inner Pulse Effect */}
        <div className="absolute inset-0 rounded-full bg-secondary/5 animate-pulse scale-150 opacity-20"></div>
      </div>
      
      <p className="text-body-md text-on-surface-variant font-bold tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
}
