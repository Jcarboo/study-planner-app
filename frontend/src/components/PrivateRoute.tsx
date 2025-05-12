import React, {JSX, ReactNode} from 'react';
import { Navigate } from 'react-router-dom';

type PrivateRouteProps = {
  isLoggedIn: boolean;
  children: ReactNode;
};

export default function PrivateRoute({ isLoggedIn, children }: PrivateRouteProps): JSX.Element {
  return isLoggedIn ? <>{children}</> : <Navigate to="/" />;
}