import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home    from './pages/Home'
import Signup  from './pages/Signup'
import Login   from './pages/Login'
import Test    from "./pages/Test";
import Test2   from "./pages/Test2";
import NoMatch from "./pages/404";

function App() {

  return (
    <BrowserRouter>
      <div style={{ textAlign: "center" }}>
        <Header />
          <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/test" element={<Test />} />
          <Route path="/test2" element={<Test2 />} />

          <Route path="*" element={<NoMatch />} />        {/* 404 page*/}
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
