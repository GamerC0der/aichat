"use client"

import { useState } from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal"

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(true)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(24,24,37)] font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-[rgb(24,24,37)] sm:items-start">
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader>
          <h2 className="text-lg font-semibold">Modal Title</h2>
        </ModalHeader>
        <ModalBody>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
