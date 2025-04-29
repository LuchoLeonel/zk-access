import React from "react";

export const Footer = () => {
  return (
    <footer className="bg-gray-900 backdrop-blur-sm border-t py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} ZK-Access. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
  