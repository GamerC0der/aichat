"use client"

import { useState } from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal"

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [apiKey, setApiKey] = useState("sk-hc-v1-")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen bg-[rgb(24,24,37)] font-sans dark:bg-black">
      <aside className={`fixed left-0 top-0 h-full w-64 bg-gray-800 transform transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setIsSidebarOpen(false)} className="p-4 text-white hover:text-gray-300">
          <img src="/favicon.ico" alt="Close" className="w-12 h-12" />
        </button>
      </aside>
      <button onClick={() => setIsSidebarOpen(true)} className={`fixed top-4 left-4 z-10 p-2 bg-gray-700 text-white rounded hover:bg-gray-600 ${isSidebarOpen ? 'hidden' : ''}`}>
        <img src="/favicon.ico" alt="Menu" className="w-12 h-12" />
      </button>
      <main className="flex-1 min-h-screen flex flex-col items-center justify-between py-32 px-16 bg-[rgb(24,24,37)] sm:items-start">
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader>
          <h2 className="text-lg font-semibold">Set API Key</h2>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.startsWith("sk-hc-v1-")) {
                    setApiKey(value);
                  } else {
                    setApiKey("sk-hc-v1-" + value.replace(/^sk-hc-v1-/, ""));
                  }
                }}
                placeholder="Enter the rest of your API key"
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-2">
                P.S: You can obtain the key at ai.hackclub.com
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          {apiKey.length > 8 && (
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
