"use client"

import { useState } from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal"

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [apiKey, setApiKey] = useState("sk-hc-v1-")

  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(24,24,37)] font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-[rgb(24,24,37)] sm:items-start">
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
