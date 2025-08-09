// Simple App.tsx without external components
function App() {
  const handleClick = () => {
    alert("Button working! 🎉")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Frontend Setup Test 🚀
          </h1>
          <p className="text-gray-600 text-lg">
            Testing Tailwind CSS and Basic Styling
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Card 1 - Manual styling */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              🔘 Button Test
            </h3>
            <p className="text-gray-600 mb-4">Testing click functionality</p>
            
            <button 
              onClick={handleClick}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Click Me!
            </button>
          </div>

          {/* Card 2 - Styling test */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              🎨 Tailwind Test
            </h3>
            <p className="text-gray-600 mb-4">Colors and layouts</p>
            
            <div className="space-y-3">
              <div className="h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded"></div>
              <div className="flex gap-2">
                <div className="flex-1 h-4 bg-blue-200 rounded"></div>
                <div className="flex-1 h-4 bg-green-200 rounded"></div>
                <div className="flex-1 h-4 bg-yellow-200 rounded"></div>
              </div>
            </div>
          </div>

          {/* Card 3 - Animation test */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              ⚡ Animation Test
            </h3>
            <p className="text-gray-600 mb-4">Hover and spin effects</p>
            
            <div className="text-center">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
              <p className="text-sm text-gray-500">Spinning animation</p>
            </div>
          </div>

        </div>

        {/* Status */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 font-medium">
              Basic setup working ✅
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
