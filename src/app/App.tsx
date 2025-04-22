import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router';
import Page from './pages/demo/page';
import Home from './pages/Home/Home';
import GeneradorFormularios from './pages/GeneradorFormularios/GeneradorFormularios';
import DemoStepper from './pages/DemoStepper/DemoStepper';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/demo' element={<Page />} />
          <Route path='/demoStepper' element={<DemoStepper />} />
          <Route path='/generadorFormularios' element={<GeneradorFormularios />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
