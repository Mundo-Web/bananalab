import { useState, cloneElement, isValidElement } from "react";
import PropTypes from "prop-types";

const Tooltip = ({
    children,
    content,
    position = "top",
    delay = 300,
    className = "",
    disabled = false,
    interactive = false,
    maxWidth = 200,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState(null);

    const handleShow = () => {
        if (disabled) return;
        const id = setTimeout(() => setIsVisible(true), delay);
        setTimeoutId(id);
    };

    const handleHide = () => {
        clearTimeout(timeoutId);
        setIsVisible(false);
    };

    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
        "top-start": "bottom-full left-0 mb-2",
        "top-end": "bottom-full right-0 mb-2",
        "bottom-start": "top-full left-0 mt-2",
        "bottom-end": "top-full right-0 mt-2",
    };

    const arrowClasses = {
        top: "top-full -translate-x-1/2 left-1/2 border-t-black",
        bottom: "bottom-full -translate-x-1/2 left-1/2 border-b-black",
        left: "left-full -translate-y-1/2 top-1/2 border-l-black",
        right: "right-full -translate-y-1/2 top-1/2 border-r-black",
        "top-start": "top-full left-3 border-t-black",
        "top-end": "top-full right-3 border-t-black",
        "bottom-start": "bottom-full left-3 border-b-black",
        "bottom-end": "bottom-full right-3 border-b-black",
    };

    return (
        <div className={`relative inline-block ${className}`}>
            {isValidElement(children) &&
                cloneElement(children, {
                    onMouseEnter: handleShow,
                    onMouseLeave: handleHide,
                    onFocus: handleShow,
                    onBlur: handleHide,
                    "aria-describedby": `tooltip-${children.props.id || ""}`,
                })}

            {isVisible && (
                <div
                    role="tooltip"
                    className={`absolute z-50 px-3 py-2 text-sm rounded-md shadow-lg bg-black text-white transition-opacity duration-200 ${
                        positionClasses[position]
                    } ${
                        interactive
                            ? "pointer-events-auto"
                            : "pointer-events-none"
                    }`}
                    style={{ maxWidth: `${maxWidth}px` }}
                    onMouseEnter={interactive ? handleShow : undefined}
                    onMouseLeave={interactive ? handleHide : undefined}
                >
                    <div
                        className={`absolute w-2 h-2 border-4 transform ${arrowClasses[position]}`}
                        style={{
                            clipPath: "polygon(0 0, 100% 0, 100% 100%)",
                            borderColor: "transparent",
                        }}
                    />
                    <div className="relative z-10 break-words">{content}</div>
                </div>
            )}
        </div>
    );
};

Tooltip.propTypes = {
    children: PropTypes.element.isRequired,
    content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    position: PropTypes.oneOf([
        "top",
        "bottom",
        "left",
        "right",
        "top-start",
        "top-end",
        "bottom-start",
        "bottom-end",
    ]),
    delay: PropTypes.number,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    interactive: PropTypes.bool,
    maxWidth: PropTypes.number,
};

export default Tooltip;
