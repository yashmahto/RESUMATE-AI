// pages/404.js
"use client";
// pages/404.js
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import "./globals.css"
export default function Custom404() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 z-1 ">
      <div
        className={`transition-opacity duration-1000 ${show ? 'opacity-100' : 'opacity-0'}`}
      >
        <h1 className="text-4xl md:text-6xl font-serif italic mb-4">
          Page not found
        </h1>
        <p className="text-center text-lg italic text-gray-400">
          “Looks like this page went on a coffee break ☕️.”
        </p>
        <Link href="/" className="mt-6 inline-block px-5 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-all duration-300">
       Take me Home!
        </Link>
         
      </div>
      <div className="absolute top-4 left-4 text-xs uppercase tracking-widest">
        Adopt
      </div>
      <div className="absolute top-4 right-4 text-xs">
        Wednesday • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
