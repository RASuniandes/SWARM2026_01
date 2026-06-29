import { useState, useMemo } from "react";

type Unit = "mil" | "mm";
type LayerType = "external" | "internal";

export default function PcbWidthCalculator() {
  const [current, setCurrent] = useState<number>(2);
  const [tempRise, setTempRise] = useState<number>(10);
  const [thickness, setThickness] = useState<number>(1); // oz
  const [unit, setUnit] = useState<Unit>("mil");
  const [layerType, setLayerType] = useState<LayerType>("external");

  // IPC-2221 constants
  const constants = {
    external: { k: 0.048, b: 0.44, c: 0.725 },
    internal: { k: 0.024, b: 0.44, c: 0.725 },
  };

  const result = useMemo(() => {
    const { k, b, c } = constants[layerType];

    const widthMil =
      current /
      (k * Math.pow(tempRise, b) * Math.pow(thickness, c));

    const widthMm = widthMil * 0.0254;

    const areaMil2 = widthMil * (thickness * 1.378); // 1oz ≈ 1.378 mil thickness

    return {
      widthMil: parseFloat(widthMil.toFixed(3)),
      widthMm: parseFloat(widthMm.toFixed(3)),
      areaMil2: parseFloat(areaMil2.toFixed(3)),
    };
  }, [current, tempRise, thickness, layerType]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">

        <div>
          <h1 className="text-2xl font-semibold text-white">
            Calculadora de Ancho de Traza PCB
          </h1>
          <p className="text-sm text-slate-400">
            Basado en estándar IPC-2221
          </p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <InputField
            label="Corriente (A)"
            value={current}
            setValue={setCurrent}
            step={0.1}
          />

          <InputField
            label="Aumento de Temperatura (°C)"
            value={tempRise}
            setValue={setTempRise}
            step={1}
          />

          <InputField
            label="Espesor de Cobre (oz)"
            value={thickness}
            setValue={setThickness}
            step={0.1}
          />

          <div>
            <label className="text-sm text-slate-400 block mb-1">
              Tipo de Capa
            </label>
            <select
              value={layerType}
              onChange={(e) =>
                setLayerType(e.target.value as LayerType)
              }
              className="w-full bg-slate-800 border border-amber-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="external">Capa Externa</option>
              <option value="internal">Capa Interna</option>
            </select>
          </div>
        </div>

        {/* Unit Switch */}
        <div className="flex gap-3">
          <button
            onClick={() => setUnit("mil")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              unit === "mil"
                ? "bg-amber-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-amber-500"
            }`}
          >
            mil
          </button>

          <button
            onClick={() => setUnit("mm")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              unit === "mm"
                ? "bg-amber-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-amber-500"
            }`}
          >
            mm
          </button>
        </div>

        {/* Result Card */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold text-white">
            Ancho de Traza Requerido
          </h2>

          <div className="text-3xl font-bold text-amber-400">
            {unit === "mil"
              ? `${result.widthMil} mil`
              : `${result.widthMm} mm`}
          </div>

          <div className="text-sm text-slate-400">
            Área transversal: {result.areaMil2} mil²
          </div>

          <div className="text-xs text-slate-500">
            Corriente: {current}A • ΔT: {tempRise}°C • Espesor: {thickness}oz • {layerType}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  setValue,
  step,
}: {
  label: string;
  value: number;
  setValue: (val: number) => void;
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
        onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
        step={step}
        className="w-full bg-slate-800 border border-amber-500/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
    </div>
  );
}