import PropTypes from "prop-types";
import { Disclosure, Transition } from "@headlessui/react";
import {
  IconChevronRight,
  IconFileText,
  IconArrowRight,
} from "@tabler/icons-react";

Sources.propTypes = {
  sources: PropTypes.array.isRequired,
};

export default function Sources({ sources }) {
  return (
    <Disclosure>
      {/*eslint-disable-next-line no-unused-vars*/}
      {({ open }) => (
        <div className="w-fit max-w-full rounded-md bg-blue-50 p-0 dark:bg-blue-700 ">
          <Disclosure.Button className="flex w-full rounded-md bg-blue-100 p-2 text-left align-middle text-xs font-medium text-blue-600 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 dark:bg-blue-800 dark:text-blue-200">
            <IconChevronRight
              className={`mr-1 h-4 w-4 ${
                open ? "rotate-90 transform" : ""
              } text-blue-500 dark:text-blue-200`}
            />
            Fuentes:
            <div className="ml-1 inline-flex justify-center rounded-full bg-blue-500 px-2 text-xs text-white dark:bg-blue-400 dark:text-blue-800">
              {sources.length}
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
            <Disclosure.Panel className="p-3 pr-4 text-xs text-blue-500 dark:text-blue-300">
              <ul className="flex flex-col">
                {sources.map((source, index) => (
                  <li
                    className="truncate"
                    title={`Document: ${source.document} → p.${source.page}`}
                    key={index}
                  >
                    <IconFileText className="mr-1 inline w-4" />
                    <span className="font-mono">{source.document}</span>
                    <span className="font-medium">
                      <IconArrowRight className="inline w-4" /> p.
                    </span>{" "}
                    {source.page}
                  </li>
                ))}
              </ul>
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
}
