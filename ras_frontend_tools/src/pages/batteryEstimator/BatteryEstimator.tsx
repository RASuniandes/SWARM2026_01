import { useState, useMemo } from "react";

export default function LipoEstimator() {
  const [voltage, setVoltage] = useState<number>(11.1); // 3S default
  const [capacity, setCapacity] = useState<number>(2200); // mAh
  const [cRating, setCRating] = useState<number>(25);
  const [currentDraw, setCurrentDraw] = useState<number>(15); // A

  const results = useMemo(() => {
    const capacityAh = capacity / 1000;
    const energyWh = voltage * capacityAh;
    const maxContinuousCurrent = capacityAh * cRating;
    const runtimeHours = currentDraw > 0 ? capacityAh / currentDraw : 0;
    const runtimeMinutes = runtimeHours * 60;
    const powerDraw = voltage * currentDraw;
    const isOverdraw = currentDraw > maxContinuousCurrent;

    return {
      energyWh: energyWh.toFixed(2),
      maxContinuousCurrent: maxContinuousCurrent.toFixed(2),
      runtimeMinutes: runtimeMinutes.toFixed(1),
      powerDraw: powerDraw.toFixed(2),
      isOverdraw,
    };
  }, [voltage, capacity, cRating, currentDraw]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-8">

        {/* Encabezado */}
        <div>
          <h1 className="text-2xl font-semibold text-amber-400">
            Estimador de Batería LiPo
          </h1>
          <p className="text-sm text-slate-400">
            Tiempo de Ejecución • Seguridad de Descarga • Análisis de Energía
          </p>
        </div>

        {/* Entradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Input label="Voltaje de Batería (V)" value={voltage} setValue={setVoltage} step={0.1} />
          <Input label="Capacidad (mAh)" value={capacity} setValue={setCapacity} step={100} />
          <Input label="Clasificación C" value={cRating} setValue={setCRating} step={1} />
          <Input label="Corriente (A)" value={currentDraw} setValue={setCurrentDraw} step={0.5} />

        </div>

        {/* Resultados */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-xl p-6 space-y-4">

          <h2 className="text-lg font-semibold text-amber-400">
            Rendimiento de Batería
          </h2>

          <Result label="Tiempo Estimado" value={`${results.runtimeMinutes} min`} />
          <Result label="Capacidad Energética" value={`${results.energyWh} Wh`} />
          <Result label="Consumo de Potencia" value={`${results.powerDraw} W`} />
          <Result label="Corriente Continua Máxima" value={`${results.maxContinuousCurrent} A`} />

          {results.isOverdraw && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
              ⚠️ ¡El consumo de corriente excede la clasificación de descarga continua segura!
            </div>
          )}

        </div>

        {/* Información de Ingeniería */}
        <div className="text-xs text-slate-500 space-y-1">
          <p>Energía (Wh) = Voltaje × Capacidad (Ah)</p>
          <p>Corriente Máxima = Capacidad (Ah) × Clasificación C</p>
          <p>Tiempo de Ejecución = Capacidad (Ah) ÷ Corriente</p>
        </div>

      </div>
    </div>
  );
}

function Input({
  label,
  value,
  setValue,
  step,
}: {
  label: string;
  value: number;
  setValue: (v: number) => void;
  step: number;
}) {
  return (
    <div>
      <label className="text-sm text-slate-400 block mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-amber-400 font-medium">{value}</span>
    </div>
  );
}