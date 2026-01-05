"use client";
import { useEffect, useState, useMemo } from "react";
import { ComponentStatus } from "@prisma/client";
import CarScheme from "@/components/CarScheme";
import type { ComponentStateInfo } from "@/app/api/cars/[carId]/component-states/route";
import ComponentDetailsModal from "./ComponentDetailsModal";
import {
  statusClasses,
  fallbackClasses,
  getComponentStatusName,
} from "@/lib/helpers";

const dataSlugDetails: Record<string, { name: string; components: string[] }> =
  {
    zone_engine: {
      name: "Двигатель",
      components: [
        "engine_oil",
        "oil_filter",
        "air_filter",
        "fuel_filter",
        "spark_plugs",
        "timing_belt",
        "timing_chain",
        "coolant",
        "battery",
      ],
    },
    zone_chassis: {
      name: "Тормоза и подвеска",
      components: [
        "brake_pads_front",
        "brake_pads_rear",
        "brake_discs_front",
        "brake_discs_rear",
        "brake_fluid",
      ],
    },
    "zone-wheels": {
      // Используем кавычки для ключа с дефисом
      name: "Колеса и шины",
      components: ["tires_summer", "tires_winter", "tire_fitting"],
    },
    "zone-salon": {
      name: "Салон",
      components: ["cabin_filter"],
    },
    headlights: {
      name: "Оптика",
      components: ["headlights"],
    },
  };

const colorMap: Record<string, string> = {
  "fill-emerald-500": "#10b981",
  "fill-yellow-400": "#facc15",
  "fill-red-600": "#dc2626",
  "fill-gray-400": "#9ca3af",
};

type CarMapProps = {
  carId: string;
  historyVersion: string; // Принимаем "сигнал"
};

export default function InteractiveCarMap({ carId, historyVersion }: CarMapProps) {
  const [states, setStates] = useState<ComponentStateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<{ name: string; components: ComponentStateInfo[] } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/cars/${carId}/component-states`).then(res => res.json())
      .then((data: ComponentStateInfo[]) => setStates(data))
      .catch(console.error).finally(() => setIsLoading(false));
  }, [carId, historyVersion]); // РЕАГИРУЕМ НА "СИГНАЛ"

  const handlePartClick = (event: React.MouseEvent<SVGElement>) => {
    let target: EventTarget | null = event.target;
    while (target instanceof Element && target.tagName.toLowerCase() !== 'svg') {
      if (target.hasAttribute('data-slug')) {
        const dataSlug = target.getAttribute('data-slug')!;
        const zoneDetails = dataSlugDetails[dataSlug];
        if (zoneDetails) {
          const foundStates = states.filter(s => zoneDetails.components.includes(s.slug));
          setSelectedZone({ name: zoneDetails.name, components: foundStates });
        }
        return;
      }
      target = target.parentElement;
    }
  };


  const svgStyle = useMemo(() => {
    const style: React.CSSProperties & { [key: string]: string | number } = {
      "--default-fill": "#d1d5db",
    };

    Object.entries(dataSlugDetails).forEach(([dataSlug, details]) => {
      const componentSlugsInZone = details.components;
      const statusesInZone = states
        .filter((s) => componentSlugsInZone.includes(s.slug))
        .map((s) => s.status);

      let finalStatus: ComponentStatus | "UNKNOWN" = "OK";
      if (statusesInZone.includes("CRITICAL")) finalStatus = "CRITICAL";
      else if (statusesInZone.includes("ATTENTION")) finalStatus = "ATTENTION";
      else if (statusesInZone.length === 0) finalStatus = "UNKNOWN";

      const colorClass =
        statusClasses[finalStatus]?.fill || fallbackClasses.fill;
      style[`--fill-${dataSlug}`] = colorMap[colorClass];
    });

    return style;
  }, [states]);

  if (isLoading)
    return <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg" />;

  return (
    <>
      <div className="mt-8 p-4 border rounded-lg bg-white shadow-md">
        <h2 className="text-2xl font-bold mb-4">
          Интерактивная карта состояния
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <CarScheme
              onClick={handlePartClick}
              style={svgStyle}
              width="100%"
              height="auto"
              className="car-scheme"
            />
          </div>
          <div className="md:col-span-1">
            <h3 className="font-semibold mb-2">Легенда</h3>
            {states.length > 0 ? (
              <ul className="space-y-2">
                {states.map((state) => {
                  const classes =
                    statusClasses[state.status] || fallbackClasses;
                  return (
                    <li
                      key={state.slug}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                      onClick={() => {
                        const zone = Object.values(dataSlugDetails).find((d) =>
                          d.components.includes(state.slug)
                        );
                        setSelectedZone({
                          name: zone?.name || "Деталь",
                          components: [state],
                        });
                      }}
                    >
                      <div className={`w-4 h-4 rounded-full ${classes.fill}`} />
                      <span>{state.name}:</span>
                      <span className={`font-bold ${classes.text}`}>
                        {getComponentStatusName(state.status)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500">Нет данных о состоянии узлов.</p>
            )}
          </div>
        </div>
      </div>
      <ComponentDetailsModal
        zoneInfo={selectedZone}
        onClose={() => setSelectedZone(null)}
      />
    </>
  );
}
