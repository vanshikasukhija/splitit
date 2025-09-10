import React from 'react'

const AuthLayout = ({children}) => {
  return (
    <div className='flex justify-center pt-40'>{children}</div>
  )
}

export default AuthLayout



// This layout will affect all the routes in the auth folder