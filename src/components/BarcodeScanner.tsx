import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertTriangle, Search, Sparkles } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (productName: string, details?: string) => void;
  onClose: () => void;
}

// Brazilian test barcodes for demonstration and rapid testing
const DEMO_BARCODES = [
  { code: '7891000053508', name: 'Chocolate Nestlé Classic 90g', brand: 'Nestlé' },
  { code: '7891024136072', name: 'Leite Condensado Moça 395g', brand: 'Nestlé' },
  { code: '7891010031107', name: 'Nescafé Original Solúvel 100g', brand: 'Nestlé' },
  { code: '7894900011517', name: 'Refrigerante Coca-Cola 2L', brand: 'Coca-Cola' },
  { code: '7891080410109', name: 'Sabonete Dove Original 90g', brand: 'Dove' },
];

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start real camera stream
  const startCamera = async () => {
    setError(null);
    setCameraActive(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Câmera indisponível ou permissão negada:', err);
      setError('Não foi possível acessar a câmera do dispositivo. Mas você pode digitar o código ou usar os produtos de teste abaixo!');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Query Open Food Facts API
  const handleFetchProduct = async (barcode: string) => {
    if (!barcode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const trimmedCode = barcode.trim();
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${trimmedCode}.json`);
      if (!response.ok) {
        throw new Error('Produto não encontrado na rede.');
      }
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const prod = data.product;
        // Construct detailed name
        const name = prod.product_name_pt || prod.product_name || 'Produto Não Nomeado';
        const brand = prod.brands || '';
        const qty = prod.quantity ? ` (${prod.quantity})` : '';
        const finalName = brand ? `${name} - ${brand}${qty}` : `${name}${qty}`;
        const details = `Localizado via Open Food Facts. Categoria: ${prod.categories_tags?.[0]?.replace('en:', '') || 'Geral'}`;
        
        onScanSuccess(finalName, details);
      } else {
        // Fallback or custom check for our mock codes if the API fails or doesn't have it
        const demoMatch = DEMO_BARCODES.find(d => d.code === trimmedCode);
        if (demoMatch) {
          onScanSuccess(demoMatch.name, `Demonstração: ${demoMatch.brand}`);
        } else {
          setError(`Código de barras ${trimmedCode} não foi encontrado na base de dados Open Food Facts. Tente digitar outro código!`);
        }
      }
    } catch (err) {
      console.error(err);
      // Fallback to demo barcodes if offline/blocked
      const demoMatch = DEMO_BARCODES.find(d => d.code === barcode);
      if (demoMatch) {
        onScanSuccess(demoMatch.name, `Demonstração (offline): ${demoMatch.brand}`);
      } else {
        setError('Ocorreu um erro ao conectar-se à API Open Food Facts. Verifique sua conexão de rede.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="barcode-scanner-container" class="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div id="barcode-scanner-card" class="bg-white dark:bg-[#2C243B] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div class="px-6 py-4 border-b border-[#FAF8F5]/10 flex justify-between items-center bg-[#A8DF8E] dark:bg-[#433D50] text-gray-800 dark:text-white">
          <div class="flex items-center gap-2">
            <Camera class="w-6 h-6 animate-pulse" />
            <h3 class="font-display font-semibold text-lg">Escanear Produto</h3>
          </div>
          <button 
            id="close-scanner-btn"
            onClick={onClose} 
            class="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Camera Viewport / Placeholder */}
          <div class="relative w-full aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center border-4 border-[#A8DF8E] dark:border-[#433D50] shadow-inner">
            {cameraActive ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  class="w-full h-full object-cover" 
                />
                {/* Scanner Overlay Laser */}
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <div class="w-4/5 h-2/3 border-2 border-[#A8DF8E] border-dashed rounded-lg relative">
                    <div class="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-500"></div>
                    <div class="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-500"></div>
                    <div class="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-500"></div>
                    <div class="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-500"></div>
                    
                    {/* Laser line animation */}
                    <div class="w-full h-1 bg-red-500 opacity-80 absolute top-1/2 left-0 shadow-lg shadow-red-500 animate-bounce"></div>
                  </div>
                  <span class="absolute bottom-2 text-xs bg-black/60 text-white px-2 py-1 rounded-full font-mono">
                    Câmera Ativa
                  </span>
                </div>
              </>
            ) : (
              <div class="text-center p-4 text-gray-400">
                <AlertTriangle class="w-10 h-10 mx-auto text-amber-500 mb-2" />
                <p class="text-sm">Fluxo de câmera em tempo real indisponível ou permissão negada.</p>
                <button 
                  onClick={startCamera} 
                  class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[#A8DF8E] text-gray-800 text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
                >
                  <RefreshCw class="w-3 h-3" /> Tentar Câmera Novamente
                </button>
              </div>
            )}
          </div>

          {/* Real-time Open Food Facts manual barcode entry */}
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Digitar Código de Barras Real (EAN-13)
            </label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <input
                  id="barcode-input"
                  type="text"
                  placeholder="Ex: 7891000053508"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                  class="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-[#342B46] text-gray-800 dark:text-gray-100 rounded-xl text-sm font-mono border border-transparent focus:border-[#A8DF8E] transition-all"
                />
                <Search class="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
              <button
                id="search-barcode-btn"
                onClick={() => handleFetchProduct(manualCode)}
                disabled={loading || !manualCode}
                class="px-4 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center gap-1 shrink-0 shadow-md"
              >
                {loading ? <RefreshCw class="w-4 h-4 animate-spin" /> : 'Buscar'}
              </button>
            </div>
            <p class="text-[10px] text-gray-400 dark:text-gray-500">
              Conexão em tempo real com o banco de dados livre <span class="underline">Open Food Facts</span>.
            </p>
          </div>

          {error && (
            <div class="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 p-3.5 rounded-xl text-xs flex gap-2 border border-red-200 dark:border-red-900/50">
              <AlertTriangle class="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Test Barcode Quick-Simulators */}
          <div class="space-y-2 pt-2 border-t border-gray-100 dark:border-[#3a2f50]">
            <span class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles class="w-3.5 h-3.5 text-amber-500" /> Simulador de Escaneamento Rápido
            </span>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Clique em um produto real brasileiro de teste abaixo para simular o escaneamento por câmera instantaneamente:
            </p>
            
            <div id="demo-barcodes-list" class="grid grid-cols-1 gap-2">
              {DEMO_BARCODES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    setManualCode(item.code);
                    handleFetchProduct(item.code);
                  }}
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#342B46] hover:bg-[#A8DF8E]/20 dark:hover:bg-[#A8DF8E]/10 rounded-xl text-left transition-all border border-gray-100 dark:border-transparent group"
                >
                  <div>
                    <div class="text-xs font-semibold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {item.name}
                    </div>
                    <div class="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                      Código: {item.code} • {item.brand}
                    </div>
                  </div>
                  <span class="text-[10px] bg-[#A8DF8E] dark:bg-emerald-800/30 text-[#3A4D39] dark:text-emerald-300 px-2 py-1 rounded-full font-semibold">
                    Simular
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div class="bg-gray-50 dark:bg-[#342B46]/50 px-6 py-4 flex justify-between items-center border-t border-gray-100 dark:border-[#FAF8F5]/5">
          <p class="text-xs text-gray-400 dark:text-gray-500">
            Dica: Aproxime a embalagem com código de barras da câmera.
          </p>
          <button 
            id="close-scanner-secondary-btn"
            onClick={onClose} 
            class="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
