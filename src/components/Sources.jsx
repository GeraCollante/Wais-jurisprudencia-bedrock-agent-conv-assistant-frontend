import React from "react";
import PropTypes from "prop-types";
import { Disclosure, Transition } from "@headlessui/react";
import {
  IconChevronRight,
  IconFileText,
  IconScale,
  IconExternalLink,
} from "@tabler/icons-react";

Sources.propTypes = {
  sources: PropTypes.array.isRequired,
};

// Formatear nombre para mostrar en la card
const formatDocumentName = (source) => {
  if (source.tipo === 'jurisprudencia') {
    // Mostrar caratula si existe, sino "Registro XXXX"
    if (source.content && source.content.trim()) {
      return source.content;
    }
    return `Registro ${source.document || 'N/A'}`;
  }

  if (source.tipo === 'ley') {
    // Para leyes: document ya viene como "Art. X - Nombre Ley"
    return source.document || 'Normativa';
  }

  return source.document || source.id || 'Documento';
};

// Subtitulo: tribunal · fecha (solo para jurisprudencia)
const formatSubtitle = (source) => {
  if (source.tipo !== 'jurisprudencia') return null;
  const parts = [];
  if (source.tribunal && source.tribunal !== 'N/A' && source.tribunal !== 'None') {
    parts.push(source.tribunal);
  }
  if (source.fecha && source.fecha !== 'N/A' && source.fecha !== 'None') {
    parts.push(source.fecha);
  }
  if (source.expediente && source.expediente !== 'N/A' && source.expediente !== 'None') {
    parts.push(`Exp. ${source.expediente}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
};

export default function Sources({ sources }) {
  const processedSources = React.useMemo(() => {
    if (!sources || sources.length === 0) {
      return [];
    }
    // Agrupar por documento unico
    const sourceMap = new Map();
    sources.forEach(source => {
      const key = source.url || source.document || source.id || 'unknown';
      if (!sourceMap.has(key)) {
        sourceMap.set(key, source);
      }
    });
    return Array.from(sourceMap.values());
  }, [sources]);

  return (
    <Disclosure>
      {({ open }) => (
        <div className="w-fit max-w-full overflow-hidden rounded-md bg-brand-primary-100 p-0">
          <Disclosure.Button className="
            flex w-full items-center rounded-md bg-brand-primary-100/50 p-2 text-left text-xs font-medium text-brand-primary-900 font-sans
            focus:outline-none focus-visible:ring focus-visible:ring-brand-primary-900
          ">
            <IconChevronRight
              className={`mr-1 h-4 w-4 transform ${open ? "rotate-90" : ""} text-brand-primary-900`}
            />
            Fuentes:
            <div className="ml-1 inline-flex items-center justify-center rounded-full bg-brand-primary-900 px-2 text-xs text-brand-text-light">
              {processedSources.length}
            </div>
          </Disclosure.Button>
          <Transition
            enter="transition duration-200 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-150 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="p-3 pr-4 text-xs md:text-xs text-brand-text-primary">
              {processedSources.length > 0 ? (
                <ul className="mt-2 space-y-3 md:space-y-2">
                  {processedSources.map((source, index) => {
                    const linkUrl = source.url || null;
                    const docName = formatDocumentName(source);
                    const subtitle = formatSubtitle(source);
                    const isJuris = source.tipo === 'jurisprudencia';
                    const isLey = source.tipo === 'ley';

                    const CardContent = (
                      <div className="flex w-full items-start justify-between gap-3">
                        <div className="flex flex-1 items-start gap-3 min-w-0">
                          {isJuris ? (
                            <IconScale className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                          ) : (
                            <IconFileText className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-brand-primary-900 text-sm" title={docName}>
                              {docName}
                            </p>
                            {subtitle && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {subtitle}
                              </p>
                            )}
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2">
                              {source.tipo && (
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  isJuris
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {source.tipo.toUpperCase()}
                                </span>
                              )}
                              {linkUrl && (
                                <span className="text-xs text-blue-600 flex items-center gap-0.5">
                                  <IconExternalLink className="h-3 w-3" />
                                  Ver fallo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                    return (
                      <li key={source.url || source.document || index}>
                        {linkUrl ? (
                          <a
                            href={linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              block p-3 rounded-lg border bg-white shadow-sm transition-all duration-150
                              hover:bg-brand-primary-50 hover:border-brand-primary-300
                            "
                          >
                            {CardContent}
                          </a>
                        ) : (
                          <div className="block p-3 rounded-lg border bg-white shadow-sm">
                            {CardContent}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-brand-text-muted">No hay fuentes referenciadas.</p>
              )}
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
}
