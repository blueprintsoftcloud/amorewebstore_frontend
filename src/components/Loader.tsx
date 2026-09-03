import React from "react";
import { PulseLoader } from "react-spinners";

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      {/* Pulse Loader */}
      <PulseLoader color="#000000" />

      {/* Message */}
      <p className="mt-4 text-gray-600 text-sm font-medium"></p>
    </div>
  );
};

export default Loader;

