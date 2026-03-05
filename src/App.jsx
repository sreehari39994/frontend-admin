import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard.jsx'
import AdminSidebar from './components/AdminSidebar.jsx'
import Candidates from './pages/Candidates.jsx'
import Counting from './pages/Counting.jsx'
import VotingStatus from './pages/VotingStatus.jsx'
import AdminFaceSettings from './pages/AdminFaceSettings.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
function App() {
  

  return (
    <BrowserRouter>
      <Routes>
      <Route path='/' element={<Login/>}/>
     <Route path='/d'element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/> 
     <Route path='/c'element={<ProtectedRoute><Candidates/></ProtectedRoute>}/>
     <Route path='/u'element={<ProtectedRoute><Counting/></ProtectedRoute>}/>
     <Route path='/s'element={<ProtectedRoute><VotingStatus/></ProtectedRoute>}/>
     <Route path='/f'element={<ProtectedRoute><AdminFaceSettings/></ProtectedRoute>}/>
         </Routes>
    </BrowserRouter>
     
    
  )
}

export default App
