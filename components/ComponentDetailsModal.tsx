"use client";
import { useState, useEffect, useRef } from 'react';
import type { ComponentStateInfo } from '@/app/api/cars/[carId]/component-states/route';
import { getComponentStatusName, statusClasses, fallbackClasses } from '@/lib/helpers';


type ComponentDetailsModalProps = {
  zoneInfo: {
    name: string;
    components: ComponentStateInfo[];
  } | null;
  onClose: () => void;
};

export default function ComponentDetailsModal({ zoneInfo, onClose }: ComponentDetailsModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (zoneInfo) { requestAnimationFrame(() => setIsVisible(true)); } 
    else { setIsVisible(false); }
  }, [zoneInfo]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => { onClose(); }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) handleClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, handleClose]);

  if (!zoneInfo) return null;

/*   const zoneName = zoneInfo[0]?.name.startsWith('Зона') 
    ? zoneInfo[0].name 
    : zoneInfo[0]?.slug.replace(/[-_]/g, ' '); */

  return (
    <div className={`fixed inset-0 bg-black flex justify-center items-start z-50 p-4 pt-10 overflow-y-auto transition-opacity duration-200 ease-in-out ${isVisible ? 'bg-opacity-50 opacity-100' : 'bg-opacity-0 opacity-0'}`}>
      <div ref={modalRef} className={`bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative my-8 transition-all duration-200 ease-in-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <button onClick={handleClose} className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-800 z-10">&times;</button>
        <div className="pr-6">
          <h2 className="text-2xl font-bold mb-4 capitalize">Состояние зоны {zoneInfo.name}</h2>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {zoneInfo.components.map(component => {
              // ИСПОЛЬЗУЕМ `statusClasses` ДЛЯ ПОЛУЧЕНИЯ ЦВЕТА
              const classes = statusClasses[component.status] || fallbackClasses;
              return (
                <div key={component.slug} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 ${classes.fill}`} />
                    <div>
                      <h3 className="font-semibold text-gray-800">{component.name}</h3>
                      {/* ИСПОЛЬЗУЕМ ФУНКЦИЮ-ПЕРЕВОДЧИК И `classes` */}
                      <p className={`font-bold text-sm ${classes.text}`}>{getComponentStatusName(component.status)}</p>
                    </div>
                  </div>
                  {component.notes && (
                    <p className="mt-2 text-sm text-gray-600 pl-8 border-l-2 border-gray-200 ml-2.5">
                      {component.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end mt-6 pt-4 border-t">
          <button onClick={handleClose} className="btn-primary px-6 py-2 w-auto">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}