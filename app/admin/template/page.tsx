'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

export default function MaintenancePage() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Show image after 1 second
  useEffect(() => {
    if (open) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Click outside to close
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setVisible(false);
      }
    }

    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div
        ref={boxRef}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
      >
        <h1 className="text-2xl font-extrabold text-gray-800 mb-4">
          Under Maintenance
        </h1>

        <p className="text-gray-600 mb-6">
          Paghuwat sa ha 😅 <br />
          Kamatyúnon pa ang system.
        </p>

        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="px-6 py-3 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition"
          >
            👉 Click this (important)
          </button>
        )}

        {open && (
          <>
            <p className="text-sm text-gray-700 mt-4">
              🧠 Why did you click that?
            </p>

            {visible && (
              <img
                src="https://i.pinimg.com/474x/e9/3f/92/e93f92586295761de0dc6cf3537c3683.jpg?nii=t"
                alt="Creepy face"
                className="mx-auto mt-4 w-52 h-52 rounded-full shadow-2xl creepy-anim"
              />
            )}

            <p className="text-xs text-gray-400 mt-4">
              (Click outside to make it disappear 👁️)
            </p>
          </>
        )}
      </div>

      {/* Animation */}
      <style jsx>{`
        .creepy-anim {
          animation: creepyZoom 1.5s ease-out forwards;
        }

        @keyframes creepyZoom {
          from {
            transform: scale(0.7);
            opacity: 0;
          }
          to {
            transform: scale(1.05);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
