import React from "react"; // Asegúrate de importar React para usar React.useMemo
import PropTypes from "prop-types";
import { Disclosure, Transition } from "@headlessui/react";
import {
  IconChevronRight,
  IconFileText,
  // IconArrowRight, // Ya no es necesario si no mostramos la página
} from "@tabler/icons-react";

Sources.propTypes = {
  sources: PropTypes.array.isRequired, // Espera un array de objetos { document: '...', page: '...' }
};

// Función para extraer y formatear el nombre del archivo desde la URL
const formatDocumentName = (source, index = 0) => {
  if (!source.pdf_url) {
    // Fallback: aplicar espacios y title case al document o id
    const text = source.document || source.id || "Documento";
    if (text.startsWith('chunk_')) {
      return `Documento ${index + 1}`;
    }
    return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  // Extraer nombre del archivo de la URL
  const urlParts = source.pdf_url.split('/');
  const fileName = urlParts[urlParts.length - 1];
  const nameWithoutExt = fileName.replace('.pdf', '');
  
  if (source.tipo === 'jurisprudencia') {
    // Para jurisprudencia: "00037042-05" → "Registro 00037042-05"
    return `Registro ${nameWithoutExt}`;
  } else if (source.tipo === 'ley') {
    // Para leyes: "codigo_penal_nacional" → "Código Penal Nacional"
    return nameWithoutExt
      .split('_')
      .map(word => {
        // Title case: primera letra mayúscula, resto minúscula
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
  
  // Para casos no mapeables: aplicar espacios y title case
  return nameWithoutExt
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export default function Sources({ sources }) {
  // Procesar las fuentes para agrupar por PDF único
  // Se utiliza React.useMemo para optimizar y recalcular solo si 'sources' cambia.
  const processedSources = React.useMemo(() => {
    if (!sources || sources.length === 0) {
      return [];
    }
    // Agrupar por PDF único, conservando el chunk con mayor score
    const sourceMap = new Map();
    sources.forEach(source => {
      const key = source.pdf_url || source.document || source.id || 'unknown';
      
      if (!sourceMap.has(key)) {
        sourceMap.set(key, source);
      } else {
        // Si ya existe, conservar el que tenga mayor score
        const existing = sourceMap.get(key);
        const existingScore = parseFloat(existing.score || 0);
        const currentScore = parseFloat(source.score || 0);
        
        if (currentScore > existingScore) {
          sourceMap.set(key, source);
        }
      }
    });
    
    // Convertir a array y ordenar por score
    return Array.from(sourceMap.values()).sort((a, b) => {
      const scoreA = parseFloat(a.score || 0);
      const scoreB = parseFloat(b.score || 0);
      return scoreB - scoreA; // Orden descendente por score
    });
  }, [sources]);

  // Si no hay documentos únicos después del procesamiento, podrías decidir no renderizar nada.
  // if (uniqueDocumentNames.length === 0) {
  //   return null; 
  // }

  return (
    <Disclosure>
      {({ open }) => (
        /* Contenedor principal del componente Sources */
        <div className="w-fit max-w-full overflow-hidden rounded-md bg-brand-primary-100 p-0"> 
          <Disclosure.Button className="
            flex w-full items-center rounded-md bg-brand-primary-100/50 p-2 text-left text-xs font-medium text-brand-primary-900 font-sans
            focus:outline-none focus-visible:ring focus-visible:ring-brand-primary-900
          ">
            <IconChevronRight
              className={`mr-1 h-4 w-4 transform ${open ? "rotate-90" : ""} text-brand-primary-900`}
            />
            Fuentes:
            {/* El contador ahora muestra la cantidad de PDFs disponibles */}
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
            {/* Panel desplegable con la lista de fuentes */}
            <Disclosure.Panel className="p-3 pr-4 text-xs md:text-xs text-brand-text-primary">
              {processedSources.length > 0 ? (
                <ul className="mt-2 space-y-3 md:space-y-2">
                  {processedSources.map((source, index) => {
                    // Usar pdf_url si está disponible, sino construir URL como antes
                    const pdfUrl = source.pdf_url || `https://wais-jurisprudencia-tucuman.s3.us-east-1.amazonaws.com/${source.document}.pdf`;
                    
                    // Generar nombre formateado desde la URL
                    const docName = formatDocumentName(source, index);
                    const score = source.score ? `${(parseFloat(source.score) * 100).toFixed(1)}%` : '';
                    
                    // Extraer ID del archivo para mostrar como subtítulo (solo si no es chunk)
                    const fileId = source.pdf_url ? 
                      source.pdf_url.split('/').pop().replace('.pdf', '') : 
                      (source.id && !source.id.startsWith('chunk_') ? source.id : '');
                    
                    // Filtrar tribunal y materia para no mostrar N/A, "None" o "penal"
                    const shouldShowTribunal = source.tribunal && source.tribunal !== 'N/A' && source.tribunal !== 'None';
                    const shouldShowMateria = source.materia && source.materia !== 'N/A' && source.materia !== 'None' && source.materia.toLowerCase() !== 'penal';
                    
                    return (
                      <li key={source.pdf_url || source.id || docName}>
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                            block p-3 rounded-lg border bg-white shadow-sm transition-all duration-150
                            hover:bg-brand-primary-50 hover:border-brand-primary-300
                          "
                        >
                          <div className="flex w-full items-start justify-between gap-3">
                            {/* --- Columna Izquierda: Icono e Información --- */}
                            <div className="flex flex-1 items-start gap-3 min-w-0">
                              <IconFileText className="h-5 w-5 text-brand-primary-900 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                {/* Título Principal */}
                                <p className="font-semibold text-brand-primary-900 text-sm truncate" title={docName}>
                                  {docName}
                                </p>
                                {/* Subtítulo con el nombre del archivo */}
                                {fileId && (
                                  <p className="text-xs text-gray-500 font-mono truncate mt-0.5">
                                    {fileId}.pdf
                                  </p>
                                )}
                                {/* Contenedor de Tags y Score */}
                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2">
                                  {source.tipo && (
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                      source.tipo === 'jurisprudencia' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {source.tipo.toUpperCase()}
                                    </span>
                                  )}
                                  {score && (
                                    <span className="text-xs font-medium text-gray-700">
                                      {score}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                // Opcional: Mostrar un mensaje si no hay fuentes únicas después del procesamiento
                <p className="text-brand-text-muted">No hay fuentes referenciadas.</p>
              )}
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
}