import React from 'react';
import { ProductProvider } from './context/ProductContext';
import Header from './components/Header';
import MainLayout from './components/MainLayout';

function App() {
  return (
    <ProductProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <MainLayout />
        <footer className="bg-white py-4 border-t border-gray-200">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Amazon-Yahoo Price Comparison Tool
          </div>
        </footer>
      </div>
    </ProductProvider>
  );
}

export default App;