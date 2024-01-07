import React from "react";

export default function Tooltip({
  referenceElementRef,
  handleTogglePopover,
  isOpen,
  Popper,
  message,
}) {
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        tabIndex="0"
        className="w-6 h-6 text-gray-300 ml-2 inline-block rounded bg-danger transition duration-150 ease-in-out hover:text-gray-500 focus:outline-none focus:ring-0"
        role="button"
        ref={referenceElementRef}
        onClick={handleTogglePopover}
      >
        <path
          fillRule="evenodd"
          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
          clipRule="evenodd"
        />
      </svg>
      {isOpen && (
        <Popper
          placement="right"
          referenceElement={referenceElementRef.current}
        >
          {({ ref, style, placement, arrowProps }) => (
            <div
              ref={ref}
              style={style}
              className="popover bg-gray-200 text-black text-sm rounded-md p-2"
              data-placement={placement}
            >
              {message}
              <div ref={arrowProps.ref} style={arrowProps.style} />
            </div>
          )}
        </Popper>
      )}
    </>
  );
}
