import React from 'react';

/**
 * Official vector logos for YouTube, EasyPaisa, JazzCash, and Bank Transfer
 */

export function YouTubeLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        fill="#FF0000"
      />
      <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
    </svg>
  );
}

export function EasyPaisaLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-white shadow-xs overflow-hidden border border-black/[0.06] p-1 shrink-0 ${className}`}>
      <img
        src="/logos/easypaisa_e.png"
        alt="EasyPaisa"
        className="w-full h-full object-contain"
      />
    </span>
  );
}

export function JazzCashLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-white shadow-xs overflow-hidden border border-black/[0.06] p-1 shrink-0 ${className}`}>
      <img
        src="/logos/jazzcash_emblem.png"
        alt="JazzCash"
        className="w-full h-full object-contain"
      />
    </span>
  );
}

export function BankLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21h18v-2H3v2zm9-19L2 7v3h20V7L12 2zm-7 9v7h3v-7H5zm6 0v7h3v-7h-3zm6 0v7h3v-7h-3z" fill="#12544F" />
    </svg>
  );
}
