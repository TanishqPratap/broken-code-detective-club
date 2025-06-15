
import { ReactNode } from "react";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode;
  onAuthClick: () => void;
}

const Layout = ({ children, onAuthClick }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Navbar onAuthClick={onAuthClick} />
      <main className="flex-1 ml-64">
        <div className="w-full min-h-screen px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
