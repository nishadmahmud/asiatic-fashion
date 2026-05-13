"use client";

import { useEffect, useMemo, useState } from "react";

function inchesToCm(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return (num * 2.54).toFixed(1);
}

function formatCell(value, unit) {
  if (value === null || value === undefined || value === "") return "-";
  if (unit === "cm") return inchesToCm(value);
  return String(value);
}

const MEASURE_GUIDE = [
  { part: "Chest", instruction: "Measure around the fullest part of your chest, keeping the tape level." },
  { part: "Waist", instruction: "Measure around your natural waistline without pulling the tape too tight." },
  { part: "Hip", instruction: "Measure around the fullest part of your hips while standing straight." },
  { part: "Length", instruction: "Measure from shoulder point down to the desired garment length." },
];

export default function SizeChartModal({ isOpen, onClose, product }) {
  const [activeTab, setActiveTab] = useState("chart");
  const [unit, setUnit] = useState("in");

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const chartValues = Array.isArray(product?.size_chart_category?.size_chart_values)
    ? product.size_chart_category.size_chart_values
    : [];

  const { columns, rows } = useMemo(() => {
    const potentialKeys = [
      { key: "chest", label: "Chest" },
      { key: "waist", label: "Waist" },
      { key: "hip", label: "Hip" },
      { key: "length", label: "Length" },
      { key: "shoulder", label: "Shoulder" },
      { key: "inseam", label: "Inseam" },
      { key: "foot_length", label: "Foot Length" },
      { key: "bust", label: "Bust" },
    ];

    const activeKeys = potentialKeys.filter(({ key }) =>
      chartValues.some((row) => row?.[key] !== null && row?.[key] !== undefined && row?.[key] !== "")
    );

    const header = ["Size", ...activeKeys.map((k) => `${k.label} (${unit})`)];
    const tableRows = chartValues.map((row) => ({
      label: row?.size_label || row?.size || "-",
      values: activeKeys.map((k) => formatCell(row?.[k.key], unit)),
    }));

    return { columns: header, rows: tableRows };
  }, [chartValues, unit]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[110] bg-black/40" onClick={onClose} />
      <div className="fixed top-0 right-0 z-[111] h-full w-full max-w-[520px] bg-white shadow-2xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#1A1A1A]">
              Size Chart{product?.size_chart_category?.name ? ` - ${product.size_chart_category.name}` : ""}
            </h2>
            <button type="button" onClick={onClose} className="p-2 text-[#1A1A1A] hover:opacity-70" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="flex border-b border-[#E5E5E5]">
            <button
              type="button"
              onClick={() => setActiveTab("chart")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest ${
                activeTab === "chart" ? "border-b border-[#1A1A1A] text-[#1A1A1A]" : "text-[#6B6B6B]"
              }`}
            >
              Size Chart
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("measure")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest ${
                activeTab === "measure" ? "border-b border-[#1A1A1A] text-[#1A1A1A]" : "text-[#6B6B6B]"
              }`}
            >
              How to Measure
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {activeTab === "chart" ? (
              <>
                <div className="mb-4 flex justify-end">
                  <div className="inline-flex rounded-full border border-[#E5E5E5] p-1">
                    <button
                      type="button"
                      onClick={() => setUnit("in")}
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${unit === "in" ? "bg-[#1A1A1A] text-white" : "text-[#6B6B6B]"}`}
                    >
                      in
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit("cm")}
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${unit === "cm" ? "bg-[#1A1A1A] text-white" : "text-[#6B6B6B]"}`}
                    >
                      cm
                    </button>
                  </div>
                </div>

                {rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[420px] border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E5E5E5]">
                          {columns.map((col) => (
                            <th key={col} className="px-2 py-2 text-left font-bold text-[#1A1A1A]">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => (
                          <tr key={`${row.label}-${idx}`} className="border-b border-[#F0F0F0]">
                            <td className="px-2 py-2 font-medium text-[#1A1A1A]">{row.label}</td>
                            {row.values.map((value, cIdx) => (
                              <td key={`${row.label}-${cIdx}`} className="px-2 py-2 text-[#6B6B6B]">
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-[#6B6B6B]">No size chart available for this product.</p>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {MEASURE_GUIDE.map((item, idx) => (
                  <div key={item.part} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-[10px] font-bold text-white">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#1A1A1A]">{item.part}</p>
                      <p className="text-xs text-[#6B6B6B]">{item.instruction}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
