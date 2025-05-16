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

export default function Sources({ sources }) {
  // Procesar las fuentes para obtener solo nombres de documentos únicos
  // Se utiliza React.useMemo para optimizar y recalcular solo si 'sources' cambia.
  const uniqueDocumentNames = React.useMemo(() => {
    if (!sources || sources.length === 0) {
      return [];
    }
    // 1. Extraer todos los nombres de documento del array 'sources' original.
    const allDocumentNames = sources.map(source => source.document);
    // 2. Usar un Set para obtener los nombres únicos y luego convertirlo de nuevo a un array.
    // 3. Opcionalmente, ordenar los nombres de documentos únicos.
    return Array.from(new Set(allDocumentNames)).sort();
  }, [sources]);

  // Si no hay documentos únicos después del procesamiento, podrías decidir no renderizar nada.
  // if (uniqueDocumentNames.length === 0) {
  //   return null; 
  // }

  return (
    <Disclosure>
      {({ open }) => (
        /* Contenedor principal del componente Sources */
        <div className="w-fit max-w-full rounded-md bg-brand-primary-100 p-0"> 
          <Disclosure.Button className="
            flex w-full items-center rounded-md bg-brand-primary-100/50 p-2 text-left text-xs font-medium text-brand-primary-900
            focus:outline-none focus-visible:ring focus-visible:ring-brand-primary-900
          ">
            <IconChevronRight
              className={`mr-1 h-4 w-4 transform ${open ? "rotate-90" : ""} text-brand-primary-900`}
            />
            Fuentes:
            {/* El contador ahora muestra la cantidad de documentos ÚNICOS */}
            <div className="ml-1 inline-flex items-center justify-center rounded-full bg-brand-primary-900 px-2 text-xs text-brand-text-light">
              {uniqueDocumentNames.length} 
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
            <Disclosure.Panel className="p-3 pr-4 text-xs text-brand-text-primary">
              {uniqueDocumentNames.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {uniqueDocumentNames.map((docName) => {
                    const s3Url = `https://wais-jurisprudencia-tucuman.s3.us-east-1.amazonaws.com/${docName}.pdf`;
                    return (
                      <li key={docName} className="flex items-center">
                        <IconFileText className="mr-1 h-4 w-4 text-brand-primary-900" />
                        <span className="truncate font-mono text-brand-primary-900" title={docName}>
                          {docName}
                        </span>
                        <a
                          href={s3Url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-brand-primary-900 underline hover:text-brand-primary-700"
                        >
                          Ver PDF
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