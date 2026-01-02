import { createRoute, Link } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

function HomePage() {
  const games = [
    {
      id: 'classic',
      name: 'Classic Snake',
      description: 'The traditional snake game',
      available: true,
    },
    {
      id: 'adder',
      name: 'Adder Snake',
      description: 'Eat eggs to grow or shrink - manage your length!',
      available: true,
    },
    // More games will be added here
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-5xl font-bold text-center mb-4">Snake Game Variants</h1>
      <p className="text-center text-gray-400 mb-12">
        Choose your favorite snake game variant
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {games.map((game) => (
          <div
            key={game.id}
            className="bg-gray-800 rounded-lg p-8 hover:bg-gray-700 transition-colors min-h-[250px] flex flex-col justify-between"
          >
            <h2 className="text-2xl font-bold mb-2">{game.name}</h2>
            <p className="text-gray-400 mb-4">{game.description}</p>
            {game.available ? (
              <Link
                to={`/${game.id}`}
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Play Now
              </Link>
            ) : (
              <span className="inline-block bg-gray-600 text-gray-400 font-bold py-2 px-4 rounded cursor-not-allowed">
                Coming Soon
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
