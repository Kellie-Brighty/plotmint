import { useState, useEffect } from "react";
import type { ReactNode } from "react";
// import { useLocation } from "react-router-dom";
import { useAuth } from "../../utils/AuthContext";
import JoinPlotMintModal from "./JoinPlotMintModal";

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { currentUser } = useAuth();
  // const location = useLocation();
  const [showModal, setShowModal] = useState(false);

  // Show the modal if user is not authenticated
  useEffect(() => {
    if (!currentUser) {
      setShowModal(true);
    }
  }, [currentUser]);

  if (currentUser) {
    return <>{children}</>;
  }

  // If not logged in, show the auth modal
  return (
    <>
      {children /* Still render the route content behind the modal */}
      <JoinPlotMintModal
        isOpen={showModal}
        onClose={() => {
          // If they try to close without auth, redirect to home
          setShowModal(false);
          if (!currentUser) {
            window.location.href = "/";
          }
        }}
      />
    </>
  );
};

export default PrivateRoute;
