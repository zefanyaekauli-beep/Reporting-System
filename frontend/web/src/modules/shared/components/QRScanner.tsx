// frontend/web/src/modules/shared/components/QRScanner.tsx

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { theme } from "./theme";
import { useTranslation } from "../../../i18n/useTranslation";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onScanError, onClose }: QRScannerProps) {
  const { t } = useTranslation();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scannerId = "qr-scanner";
    const html5QrCode = new Html5Qrcode(scannerId);

    const startScanning = async () => {
      try {
        setScanning(true);
        setError(null);
        
        await html5QrCode.start(
          { facingMode: "environment" }, // Use back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            onScanSuccess(decodedText);
            stopScanning();
          },
          (errorMessage) => {
            // Ignore scanning errors (they're frequent)
          }
        );
        
        scannerRef.current = html5QrCode;
      } catch (err: any) {
        setError(err.message || "Failed to start camera");
        setScanning(false);
        if (onScanError) {
          onScanError(err.message);
        }
      }
    };

    startScanning();

    return () => {
      stopScanning();
    };
  }, []);

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.9)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "white",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h3
          style={{
            margin: "0 0 16px",
            color: theme.colors.text,
            textAlign: "center",
          }}
        >
          {t("security.scanQR")}
        </h3>

        {error ? (
          <div
            style={{
              padding: "20px",
              background: "#fee2e2",
              color: "#dc2626",
              borderRadius: "8px",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        ) : (
          <div
            id="qr-scanner"
            style={{
              width: "100%",
              minHeight: "300px",
              background: "#000",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          />
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: "12px",
              background: theme.colors.backgroundSecondary,
              color: theme.colors.text,
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {t("common.close")}
        </button>
        </div>
      </div>
    </div>
  );
}

