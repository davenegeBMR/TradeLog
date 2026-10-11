import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  X,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../utils/usePWAInstall';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQr, setShowQr] = useState(false);

  // Determine the current direct URL (not iframe)
  const appUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isIframe = typeof window !== 'undefined' ? window.self !== window.top : false;

  useEffect(() => {
    if (appUrl) {
      QRCode.toDataURL(appUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Error generating QR code', err));
    }
  }, [appUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Get TradeLog on Android
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Install as a real standalone app on your mobile device
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status: Already Installed */}
        {isInstalled ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              TradeLog is Already Installed!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You are currently running the installed native standalone app. It operates offline with real alarms and full data persistence.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-3 text-xs">
            {/* If viewing in an iframe / preview container */}
            {isIframe && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl space-y-2">
                <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs font-semibold leading-snug">
                    You are viewing the app inside the AI Studio preview window.
                  </div>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Web browsers block direct app downloads from embedded preview frames. To install the app onto your phone, you must open this URL directly in Chrome.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Direct Browser Tab</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Direct One-Click Install Button if Chrome triggered the prompt */}
            {isInstallable && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm transition-transform active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Tap Here to Download & Install Now</span>
              </button>
            )}

            {/* Step-by-Step Instructions for Android Chrome */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="font-bold text-slate-900 dark:text-white block text-xs">
                How to Download on Your Android Phone:
              </span>

              <div className="space-y-3 text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    Open <strong>Chrome</strong> on your Android phone and load the app link:
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={appUrl}
                        className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono truncate select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-[11px] font-bold flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    Tap the <strong>three dots (⋮)</strong> menu in the upper-right corner of Chrome.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    Tap <strong>"Install app"</strong> (or <strong>"Add to Home screen"</strong>), then tap <strong>"Install"</strong>.
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Section for scanning directly from desktop */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-center bg-white dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Scan QR Code with Android Camera</span>
                </div>
                <span className="text-slate-400 text-xs font-normal">
                  {showQr ? 'Hide QR' : 'Show QR'}
                </span>
              </button>

              {showQr && qrDataUrl && (
                <div className="mt-3 flex flex-col items-center">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Point your Android camera at this code to open and install TradeLog:
                  </p>
                  <img
                    src={qrDataUrl}
                    alt="Scan to open on Android"
                    className="w-48 h-48 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-1 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Native APK note */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                When installed through Chrome, Android packages TradeLog as a genuine <strong>WebAPK</strong> registered with Android's Package Manager. It sits in your Android launcher alongside your other apps and works completely offline.
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCopy}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Link Copied!' : 'Copy App Link'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
