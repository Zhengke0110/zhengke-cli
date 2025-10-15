import { useState } from 'react'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      Hello React Ts Template {count}
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
    </>
  )
}

export default App
