import React from 'react';

const TailwindTest: React.FC = () => {
  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-medium text-black">Tailwind CSS Test</h2>
        <p className="text-slate-500">Testing various Tailwind classes</p>
      </div>
      
      <div className="space-y-3">
        {/* Color Test */}
        <div className="grid grid-cols-5 gap-2">
          <div className="h-8 bg-red-500 rounded"></div>
          <div className="h-8 bg-blue-500 rounded"></div>
          <div className="h-8 bg-green-500 rounded"></div>
          <div className="h-8 bg-yellow-500 rounded"></div>
          <div className="h-8 bg-purple-500 rounded"></div>
        </div>
        
        {/* Button Test */}
        <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
          Hover me!
        </button>
        
        {/* Responsive Test */}
        <div className="bg-gray-100 p-4 rounded">
          <p className="text-sm md:text-base lg:text-lg">
            This text changes size on different screens
          </p>
        </div>
        
        {/* Flexbox Test */}
        <div className="flex items-center justify-between bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-3 rounded">
          <span>Flexbox</span>
          <span className="bg-white text-blue-500 px-2 py-1 rounded text-sm">Working!</span>
        </div>
      </div>
    </div>
  );
};

export default TailwindTest;
