import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Card from './pages/Card'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/card/:slug" element={<Card />} />
    </Routes>
  )
}

export default App
