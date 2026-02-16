import React, { useState, useRef, useEffect } from 'react';
import { FaEllipsisV } from 'react-icons/fa';

interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  isDestructive?: boolean;
  disabled?: boolean;
}

interface DropdownMenuProps {
  icon?: React.ElementType; // Icon component like FaEllipsisV
  items: DropdownMenuItem[];
  disabled?: boolean;
  className?: string; // Additional classes for the button
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ icon: Icon = FaEllipsisV, items, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`flex h-8 w-8 items-center justify-center rounded-full text-[#a0a0a0] transition-colors hover:bg-[#2a2a2a] hover:text-white ${className || ''}`}
      >
        <Icon size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-xl bg-[#1e2228] ring-1 ring-[#2a2a2a] focus:outline-none z-10"> {/* Shadow and ring updated */}
          <div className="py-1 px-2"> {/* Added px-2 */}
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  console.log("Dropdown item clicked:", item.label); // Debug log
                  item.onClick();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
                className={`block w-full text-left rounded-md px-4 py-2 text-sm transition-colors duration-100 ${ /* Added rounded-md and transition-colors duration-100 */
                  item.isDestructive ? 'text-[#ef4444] hover:bg-red-900/20' : 'text-gray-300 hover:bg-[#2a2a2a]' /* Updated destructive styling */
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;